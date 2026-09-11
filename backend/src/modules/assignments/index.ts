import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { getAuthenticatedUser, requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";

// 1. Submit Assignment
const SubmitAssignmentSchema = z.object({
  assignmentId: z.string().min(1, "معرف الواجب مطلوب"),
  answerText: z.string().optional().default(""),
  fileUrl: z.string().optional().default("")
});

export async function submitAssignmentHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { assignmentId, answerText, fileUrl } = validateInput(SubmitAssignmentSchema, request.data);

  if (!answerText && !fileUrl) {
    throw new HttpsError("invalid-argument", "يجب كتابة إجابة أو رفع ملف للتسليم.");
  }

  const assignmentDoc = await db.collection("assignments").doc(assignmentId).get();
  if (!assignmentDoc.exists) {
    throw new HttpsError("not-found", "الواجب غير موجود.");
  }

  const assignmentData = assignmentDoc.data()!;
  if (assignmentData.deadline) {
    let deadlineTime: number;
    if (assignmentData.deadline.toDate) {
      deadlineTime = assignmentData.deadline.toDate().getTime();
    } else if (assignmentData.deadline instanceof Date) {
      deadlineTime = assignmentData.deadline.getTime();
    } else if (typeof assignmentData.deadline === "string") {
      const trimmed = assignmentData.deadline.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const eod = new Date(`${trimmed}T23:59:59.999`);
        deadlineTime = isNaN(eod.getTime()) ? new Date(trimmed).getTime() : eod.getTime();
      } else {
        deadlineTime = new Date(trimmed).getTime();
      }
    } else {
      deadlineTime = new Date(assignmentData.deadline).getTime();
    }

    if (!isNaN(deadlineTime) && Date.now() > deadlineTime) {
      throw new HttpsError("deadline-exceeded", "انتهى الموعد المحدد لتسليم هذا الواجب.");
    }
  }

  // Get student profile
  const studentDoc = await db.collection("students").doc(user.uid).get();
  const studentData = studentDoc.exists ? studentDoc.data()! : {};

  const submissionPayload = {
    assignmentId,
    studentUid: user.uid,
    studentId: user.uid,
    studentName: studentData.name || "",
    studentPhone: studentData.studentPhone || user.email?.replace("@student.local", "") || "",
    group: studentData.group || user.group || "",
    answerText,
    fileUrl,
    grade: null,
    feedback: null,
    submittedAt: new Date()
  };

  // 1. Write to subcollection (Target architecture)
  await db
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .doc(user.uid)
    .set(submissionPayload);

  // 2. Also write to legacy top-level submissions for backward compatibility
  const legacyDocId = `${user.uid}_${assignmentId}`;
  await db.collection("submissions").doc(legacyDocId).set(submissionPayload);

  return {
    success: true,
    message: "تم تسليم الواجب بنجاح"
  };
}

// 2. Grade Assignment
const GradeAssignmentSchema = z.object({
  assignmentId: z.string().min(1, "معرف الواجب مطلوب"),
  studentUid: z.string().min(1, "معرف الطالب مطلوب"),
  grade: z.number().min(0, "الدرجة يجب أن تكون موجبة"),
  feedback: z.string().optional().default("")
});

export async function gradeAssignmentHandler(request: CallableRequest) {
  const teacher = requireRole(request, ["teacher", "admin"]);
  const { assignmentId, studentUid, grade, feedback } = validateInput(GradeAssignmentSchema, request.data);

  const gradingUpdate = {
    grade,
    feedback,
    gradedBy: teacher.uid,
    gradedAt: new Date()
  };

  // Update in subcollection
  const subDocRef = db
    .collection("assignments")
    .doc(assignmentId)
    .collection("submissions")
    .doc(studentUid);

  await subDocRef.set(gradingUpdate, { merge: true });

  // Update legacy doc
  const legacyDocId = `${studentUid}_${assignmentId}`;
  const legacyRef = db.collection("submissions").doc(legacyDocId);
  const legacySnap = await legacyRef.get();
  if (legacySnap.exists) {
    await legacyRef.update(gradingUpdate);
  }

  return {
    success: true,
    message: "تم حفظ تقييم الواجب بنجاح"
  };
}
