import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { getAuthenticatedUser, requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";

// 1. Get Exam for Student (Sanitized)
const GetExamSchema = z.object({
  examId: z.string().min(1, "معرف الامتحان مطلوب")
});

export async function getExamForStudentHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { examId } = validateInput(GetExamSchema, request.data);

  const examDoc = await db.collection("exams").doc(examId).get();
  if (!examDoc.exists) {
    throw new HttpsError("not-found", "الامتحان غير موجود.");
  }

  const examData = examDoc.data()!;
  if (examData.active === false) {
    throw new HttpsError("failed-precondition", "هذا الامتحان غير متاح حالياً.");
  }

  // Check deadline
  if (examData.deadline) {
    const deadlineDate = examData.deadline.toDate ? examData.deadline.toDate() : new Date(examData.deadline);
    if (Date.now() > deadlineDate.getTime()) {
      throw new HttpsError("deadline-exceeded", "انتهى الموعد المحدد لهذا الامتحان.");
    }
  }

  // Check if student already submitted
  const resultRef = db.collection("results").doc(`${examId}_${user.uid}`);
  const existingResult = await resultRef.get();
  if (existingResult.exists) {
    throw new HttpsError("already-exists", "لقد قمت بحل هذا الامتحان مسبقاً.");
  }

  // Sanitize questions: STRIP 'correct' property from every question
  const rawQuestions = Array.isArray(examData.questions) ? examData.questions : [];
  const sanitizedQuestions = rawQuestions.map((q: any, idx: number) => {
    return {
      id: q.id || `q_${idx}`,
      type: q.type || "mcq",
      question: q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      degree: Number(q.degree || 1)
      // NOTE: 'correct' is completely omitted from the payload sent to the student!
    };
  });

  return {
    examId,
    title: examData.title || "",
    description: examData.description || "",
    duration: Number(examData.duration || 30),
    deadline: examData.deadline,
    passDegree: Number(examData.passDegree || 0),
    questions: sanitizedQuestions
  };
}

// 2. Start Exam Attempt
export async function startExamAttemptHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { examId } = validateInput(GetExamSchema, request.data);

  const examDoc = await db.collection("exams").doc(examId).get();
  if (!examDoc.exists) {
    throw new HttpsError("not-found", "الامتحان غير موجود.");
  }
  const examData = examDoc.data()!;
  const durationMinutes = Number(examData.duration || 30);

  const attemptRef = db.collection("exams").doc(examId).collection("attempts").doc(user.uid);
  const attemptSnap = await attemptRef.get();

  const now = Date.now();
  if (attemptSnap.exists) {
    const existing = attemptSnap.data()!;
    if (existing.status === "submitted") {
      throw new HttpsError("already-exists", "تم تسليم هذا الامتحان مسبقاً.");
    }
    // Return existing active attempt with remaining time
    return {
      startedAt: existing.startedAt,
      expiresAt: existing.expiresAt,
      remainingSeconds: Math.max(0, Math.floor((new Date(existing.expiresAt).getTime() - now) / 1000))
    };
  }

  const startedAt = new Date(now);
  const expiresAt = new Date(now + durationMinutes * 60 * 1000);

  await attemptRef.set({
    studentUid: user.uid,
    startedAt,
    expiresAt,
    status: "in_progress"
  });

  return {
    startedAt,
    expiresAt,
    remainingSeconds: durationMinutes * 60
  };
}

// 3. Submit Exam (Server-side Grading)
const SubmitExamSchema = z.object({
  examId: z.string().min(1, "معرف الامتحان مطلوب"),
  answers: z.array(z.union([z.number(), z.string(), z.null()]))
});

export async function submitExamHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { examId, answers } = validateInput(SubmitExamSchema, request.data);

  // 1. Prevent duplicate submission
  const resultDocId = `${examId}_${user.uid}`;
  const resultRef = db.collection("results").doc(resultDocId);
  const existingResult = await resultRef.get();
  if (existingResult.exists) {
    throw new HttpsError("already-exists", "تم تسجيل نتيجتك لهذا الامتحان مسبقاً.");
  }

  // 2. Fetch full exam with secret correct answers from Firestore
  const examDoc = await db.collection("exams").doc(examId).get();
  if (!examDoc.exists) {
    throw new HttpsError("not-found", "الامتحان غير موجود.");
  }
  const examData = examDoc.data()!;
  const questions = Array.isArray(examData.questions) ? examData.questions : [];

  // 3. Verify attempt expiration (30-second network latency grace)
  const attemptRef = db.collection("exams").doc(examId).collection("attempts").doc(user.uid);
  const attemptSnap = await attemptRef.get();
  if (attemptSnap.exists) {
    const attempt = attemptSnap.data()!;
    const expiresAt = attempt.expiresAt.toDate ? attempt.expiresAt.toDate().getTime() : new Date(attempt.expiresAt).getTime();
    if (Date.now() > expiresAt + 30000) {
      throw new HttpsError("deadline-exceeded", "انتهى وقت الامتحان المسموح به.");
    }
  }

  // 4. Server-side Grading
  let mcqScore = 0;
  let totalMcqPossible = 0;
  let hasEssay = false;
  const essayScores: (number | null)[] = [];

  questions.forEach((q: any, idx: number) => {
    const studentAnswer = answers[idx];
    const degree = Number(q.degree || 1);

    if (q.type === "mcq") {
      totalMcqPossible += degree;
      if (studentAnswer !== null && studentAnswer !== undefined && Number(studentAnswer) === Number(q.correct)) {
        mcqScore += degree;
      }
    } else {
      hasEssay = true;
      essayScores.push(null); // pending teacher evaluation
    }
  });

  // Get student profile for denormalized display
  const studentDoc = await db.collection("students").doc(user.uid).get();
  const studentData = studentDoc.exists ? studentDoc.data()! : {};

  // 5. Store official result
  const resultRecord = {
    examId,
    studentUid: user.uid,
    studentId: user.uid,
    studentName: studentData.name || "",
    studentPhone: studentData.studentPhone || user.email?.replace("@student.local", "") || "",
    group: studentData.group || user.group || "",
    answers,
    mcqScore,
    score: mcqScore,
    total: mcqScore,
    essayScores,
    status: hasEssay ? "pending_essay" : "graded",
    submittedAt: new Date()
  };

  await resultRef.set(resultRecord);

  // Mark attempt finalized
  await attemptRef.set({ status: "submitted", submittedAt: new Date() }, { merge: true });

  return {
    success: true,
    mcqScore,
    totalMcqPossible,
    hasEssay,
    status: resultRecord.status
  };
}

// 4. Grade Essay Questions
const GradeEssaySchema = z.object({
  resultId: z.string().min(1, "معرف النتيجة مطلوب"),
  questionIndex: z.number().int().min(0),
  score: z.number().min(0)
});

export async function gradeEssayHandler(request: CallableRequest) {
  requireRole(request, ["teacher", "admin"]);
  const { resultId, questionIndex, score } = validateInput(GradeEssaySchema, request.data);

  const resultRef = db.collection("results").doc(resultId);
  const resultSnap = await resultRef.get();
  if (!resultSnap.exists) {
    throw new HttpsError("not-found", "وثيقة النتيجة غير موجودة.");
  }

  const resultData = resultSnap.data()!;
  const currentEssayScores: (number | null)[] = Array.isArray(resultData.essayScores) ? [...resultData.essayScores] : [];
  currentEssayScores[questionIndex] = score;

  // Calculate new total
  const mcqScore = Number(resultData.mcqScore || 0);
  const essayTotal = currentEssayScores.reduce((sum: number, s) => sum + (s != null ? Number(s) : 0), 0);
  const newTotal = mcqScore + essayTotal;

  const allGraded = currentEssayScores.every(s => s !== null && s !== undefined);

  await resultRef.update({
    essayScores: currentEssayScores,
    score: newTotal,
    total: newTotal,
    status: allGraded ? "graded" : "pending_essay",
    gradedAt: new Date()
  });

  return {
    success: true,
    newTotalScore: newTotal,
    allGraded
  };
}
