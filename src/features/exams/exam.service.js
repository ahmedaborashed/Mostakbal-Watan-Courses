// src/features/exams/exam.service.js
import { callApi } from "../../repositories/api.client.js";
import { db, auth } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS, FEATURES } from "../../core/constants.js";
import { normalizeError, isCloudFunctionUnavailable } from "../../core/errors.js";

export const ExamService = {
  /**
   * Fetches full academic exams history for student (available, upcoming, completed, and expired).
   * Ensures student never loses access to their exam grades or past submissions.
   */
  async getStudentExams(studentGroup = "ALL", studentUid = "") {
    const canonicalUid = auth.currentUser?.uid || studentUid || "";

    try {
      // 1. Fetch all exams
      const snap = await getDocs(collection(db, COLLECTIONS.EXAMS));
      const allExams = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2. Fetch all student results in batch (queries + O(1) lookups)
      const resultsMap = new Map();
      if (canonicalUid) {
        try {
          const q1 = query(
            collection(db, COLLECTIONS.RESULTS),
            where("studentUid", "==", canonicalUid)
          );
          const snap1 = await getDocs(q1);
          snap1.docs.forEach((d) => {
            const data = d.data();
            if (data.examId) resultsMap.set(data.examId, { id: d.id, ...data });
          });
        } catch (_) {}

        try {
          const q2 = query(
            collection(db, COLLECTIONS.RESULTS),
            where("studentId", "==", canonicalUid)
          );
          const snap2 = await getDocs(q2);
          snap2.docs.forEach((d) => {
            const data = d.data();
            if (data.examId && !resultsMap.has(data.examId)) {
              resultsMap.set(data.examId, { id: d.id, ...data });
            }
          });
        } catch (_) {}
      }

      // 3. Process each exam for this student
      const processedExams = await Promise.all(
        allExams.map(async (exam) => {
          let res = resultsMap.get(exam.id) || null;
          if (!res && canonicalUid) {
            res = await this.getResult(exam.id, canonicalUid);
          }

          // Check if student has active or previous attempt in subcollection
          let attempt = null;
          let attemptStatus = res ? "submitted" : "not_started";

          if (!res && canonicalUid) {
            try {
              const attemptRef = doc(db, COLLECTIONS.EXAMS, exam.id, COLLECTIONS.ATTEMPTS, canonicalUid);
              const attSnap = await getDoc(attemptRef);
              if (attSnap.exists()) {
                attempt = attSnap.data();
                if (attempt.status === "submitted") {
                  attemptStatus = "submitted";
                } else if (attempt.status === "in_progress") {
                  const now = Date.now();
                  const expiresAtTime = attempt.expiresAt?.toDate
                    ? attempt.expiresAt.toDate().getTime()
                    : new Date(attempt.expiresAt).getTime();
                  if (!isNaN(expiresAtTime) && now < expiresAtTime) {
                    attemptStatus = "in_progress";
                  } else {
                    attemptStatus = "expired";
                  }
                }
              }
            } catch (_) {}
          }

          const hasAccess =
            !exam.group ||
            exam.group === "ALL" ||
            exam.group === studentGroup ||
            res !== null ||
            attempt !== null;

          if (!hasAccess) return null;

          return {
            id: exam.id,
            title: exam.title || "امتحان بدون عنوان",
            description: exam.description || "",
            duration: Number(exam.duration || 30),
            group: exam.group || "ALL",
            startDate: exam.startDate || exam.startAt || null,
            deadline: exam.deadline || exam.endAt || null,
            passDegree: Number(exam.passDegree || 0),
            totalQuestions: Array.isArray(exam.questions) ? exam.questions.length : Number(exam.questionCount || 0),
            active: exam.active !== false,
            attemptStatus,
            attempt,
            result: res
          };
        })
      );

      return processedExams.filter(Boolean);
    } catch (err) {
      console.error("Failed to load student exams history:", err);
      // Fallback to getAvailableExamsForStudent if needed
      return this.getAvailableExamsForStudent(studentGroup, studentUid);
    }
  },

  /**
   * Fetches authorized available exams for student (backward compatibility).
   */
  async getAvailableExamsForStudent(studentGroup = "ALL", studentUid = "") {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        const data = await callApi("getAvailableExamsForStudent");
        if (Array.isArray(data)) return data;
      } catch (err) {
        console.warn("Cloud function getAvailableExamsForStudent unavailable, attempting scoped fallback:", err);
      }
    }

    try {
      const snap = await getDocs(collection(db, COLLECTIONS.EXAMS));
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const filtered = all.filter(
        (e) => e.active !== false && (!e.group || e.group === "ALL" || e.group === studentGroup)
      );
      return await Promise.all(
        filtered.map(async (exam) => {
          const res = studentUid ? await this.getResult(exam.id, studentUid) : null;
          return {
            id: exam.id,
            title: exam.title || "",
            description: exam.description || "",
            duration: Number(exam.duration || 30),
            group: exam.group || "ALL",
            startDate: exam.startDate || exam.startAt || null,
            deadline: exam.deadline || exam.endAt || null,
            passDegree: Number(exam.passDegree || 0),
            totalQuestions: Array.isArray(exam.questions) ? exam.questions.length : 0,
            attemptStatus: res ? "submitted" : "not_started",
            result: res
          };
        })
      );
    } catch (fallbackErr) {
      throw normalizeError(fallbackErr);
    }
  },

  /**
   * Fetches sanitized exam questions for student (correct answers stripped on server or client fallback).
   */
  async getExamForStudent(examId) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("getExamForStudent", { examId });
      } catch (err) {
        console.warn("Cloud function getExamForStudent unavailable, attempting direct Firestore fallback:", err?.message || err);
      }
    }

    try {
      const snap = await getDoc(doc(db, COLLECTIONS.EXAMS, examId));
      if (!snap.exists()) {
        throw new Error("الامتحان المطلوب غير موجود.");
      }
      const examData = snap.data();
      if (examData.active === false) {
        throw new Error("هذا الامتحان غير متاح حالياً.");
      }

      // Check deadline if present
      if (examData.deadline || examData.endAt) {
        const deadlineVal = examData.deadline || examData.endAt;
        const deadlineDate = deadlineVal.toDate ? deadlineVal.toDate() : new Date(deadlineVal);
        if (Date.now() > deadlineDate.getTime()) {
          throw new Error("انتهى الموعد المحدد لهذا الامتحان.");
        }
      }

      // Check if student already submitted result
      const user = auth.currentUser;
      const uid = user?.uid || "";
      if (uid) {
        const resSnap = await getDoc(doc(db, COLLECTIONS.RESULTS, `${examId}_${uid}`));
        if (resSnap.exists()) {
          throw new Error("لقد قمت بحل هذا الامتحان مسبقاً.");
        }
      }

      // Sanitize questions: strip 'correct' to protect quiz integrity
      const rawQuestions = Array.isArray(examData.questions) ? examData.questions : [];
      const sanitizedQuestions = rawQuestions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        type: q.type || "mcq",
        question: q.question || q.text || "",
        text: q.question || q.text || "",
        options: Array.isArray(q.options) ? q.options : (Array.isArray(q.choices) ? q.choices : []),
        choices: Array.isArray(q.options) ? q.options : (Array.isArray(q.choices) ? q.choices : []),
        degree: Number(q.degree || 1)
      }));

      return {
        examId,
        id: examId,
        title: examData.title || examData.name || "",
        description: examData.description || "",
        duration: Number(examData.duration || 30),
        deadline: examData.deadline || examData.endAt || null,
        passDegree: Number(examData.passDegree || 0),
        questions: sanitizedQuestions
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Initiates student exam attempt with server timestamp and direct Firestore fallback.
   */
  async startAttempt(examId) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("startExamAttempt", { examId });
      } catch (err) {
        console.warn("Cloud function startExamAttempt unavailable, attempting direct Firestore attempt fallback:", err?.message || err);
      }
    }

    try {
      const user = auth.currentUser;
      const uid = user?.uid || "student_guest";
      const now = Date.now();

      // Get exam duration
      let durationMinutes = 30;
      try {
        const examSnap = await getDoc(doc(db, COLLECTIONS.EXAMS, examId));
        if (examSnap.exists()) {
          durationMinutes = Number(examSnap.data()?.duration || 30);
        }
      } catch (_) {}

      // Check existing attempt in Firestore subcollection: /exams/{examId}/attempts/{uid}
      if (uid && uid !== "student_guest") {
        try {
          const attemptRef = doc(db, COLLECTIONS.EXAMS, examId, "attempts", uid);
          const attemptSnap = await getDoc(attemptRef);
          if (attemptSnap.exists()) {
            const existing = attemptSnap.data();
            if (existing.status === "submitted") {
              throw new Error("تم تسليم هذا الامتحان مسبقاً.");
            }
            const expiresAtTime = existing.expiresAt?.toDate ? existing.expiresAt.toDate().getTime() : new Date(existing.expiresAt).getTime();
            return {
              startedAt: existing.startedAt,
              expiresAt: existing.expiresAt,
              remainingSeconds: Math.max(0, Math.floor((expiresAtTime - now) / 1000))
            };
          }
        } catch (subErr) {
          if (subErr.message?.includes("تم تسليم")) throw subErr;
        }
      }

      const startedAt = new Date(now).toISOString();
      const expiresAt = new Date(now + durationMinutes * 60 * 1000).toISOString();

      // Write attempt to Firestore subcollection if authenticated
      if (uid && uid !== "student_guest") {
        try {
          const attemptRef = doc(db, COLLECTIONS.EXAMS, examId, "attempts", uid);
          await setDoc(attemptRef, {
            studentUid: uid,
            startedAt,
            expiresAt,
            status: "in_progress"
          }, { merge: true });
        } catch (writeErr) {
          console.warn("Firestore attempt write warning:", writeErr?.message || writeErr);
        }
      }

      return {
        startedAt,
        expiresAt,
        remainingSeconds: durationMinutes * 60
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Submits student answers for server-side evaluation with resilient direct Firestore fallback.
   */
  async submitExam(examId, answers, totalQuestions = null) {
    let answersArray = answers;
    if (!Array.isArray(answers)) {
      const len = totalQuestions || Math.max(...Object.keys(answers || {}).map(Number), -1) + 1;
      answersArray = Array.from({ length: Math.max(0, len) }, (_, i) => {
        const val = answers?.[i];
        if (val === undefined || val === null || val === "") return null;
        return isNaN(Number(val)) || (typeof val === "string" && val.trim().length > 2) ? val : Number(val);
      });
    }

    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("submitExam", { examId, answers: answersArray });
      } catch (err) {
        console.warn("Cloud function submitExam unavailable, attempting direct Firestore grading fallback:", err?.message || err);
      }
    }

    try {
      const user = auth.currentUser;
      const uid = user?.uid || "";
      if (!uid) throw new Error("يجب تسجيل الدخول لتسليم الامتحان.");

      // Check duplicate result
      const resultDocId = `${examId}_${uid}`;
      const resultRef = doc(db, COLLECTIONS.RESULTS, resultDocId);
      const existingRes = await getDoc(resultRef);
      if (existingRes.exists()) {
        throw new Error("تم تسجيل نتيجتك لهذا الامتحان مسبقاً.");
      }

      // Fetch full exam to evaluate correct answers
      const examSnap = await getDoc(doc(db, COLLECTIONS.EXAMS, examId));
      if (!examSnap.exists()) {
        throw new Error("الامتحان المطلوب غير موجود.");
      }
      const examData = examSnap.data();
      const questions = Array.isArray(examData.questions) ? examData.questions : [];

      let mcqScore = 0;
      let totalMcqPossible = 0;
      let hasEssay = false;
      const essayScores = [];

      questions.forEach((q, idx) => {
        const studentAnswer = answersArray[idx];
        const degree = Number(q.degree || 1);

        if (q.type === "mcq" || !q.type) {
          totalMcqPossible += degree;
          if (studentAnswer !== null && studentAnswer !== undefined && Number(studentAnswer) === Number(q.correct)) {
            mcqScore += degree;
          }
        } else {
          hasEssay = true;
          essayScores.push(null);
        }
      });

      // Fetch student profile for metadata
      let studentData = {};
      try {
        const sSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
        if (sSnap.exists()) studentData = sSnap.data();
      } catch (_) {}

      const resultRecord = {
        examId,
        studentUid: uid,
        studentId: uid,
        studentName: studentData.name || user.displayName || "طالب مسجل",
        studentPhone: studentData.studentPhone || studentData.phone || user.email?.replace("@student.local", "") || "",
        group: studentData.group || "ALL",
        answers: answersArray,
        mcqScore,
        score: mcqScore,
        total: mcqScore,
        essayScores,
        status: hasEssay ? "pending_essay" : "graded",
        submittedAt: serverTimestamp()
      };

      // Save result in Firestore
      await setDoc(resultRef, resultRecord);

      // Also save legacy format /results/{uid}_{examId}
      try {
        await setDoc(doc(db, COLLECTIONS.RESULTS, `${uid}_${examId}`), resultRecord);
      } catch (_) {}

      // Mark attempt submitted
      try {
        await setDoc(doc(db, COLLECTIONS.EXAMS, examId, "attempts", uid), {
          status: "submitted",
          submittedAt: serverTimestamp()
        }, { merge: true });
      } catch (_) {}

      return {
        success: true,
        score: mcqScore,
        total: totalMcqPossible,
        status: resultRecord.status,
        message: "تم تسليم الامتحان بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Teacher evaluation of essay question with resilient direct Firestore fallback.
   */
  async gradeEssay(resultId, questionIndex, score) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("gradeEssay", { resultId, questionIndex, score });
      } catch (err) {
        console.warn("Cloud function gradeEssay unavailable, attempting direct Firestore fallback:", err?.message || err);
      }
    }

    try {
      const resRef = doc(db, COLLECTIONS.RESULTS, resultId);
      const snap = await getDoc(resRef);
      if (!snap.exists()) throw new Error("نتيجة الامتحان غير موجودة.");

      const data = snap.data();
      const oldEssayScores = Array.isArray(data.essayScores) ? data.essayScores : [];
      const essayLength = Math.max(oldEssayScores.length, questionIndex + 1);
      const essayScores = Array.from({ length: essayLength }, (_, i) => {
        const v = oldEssayScores[i];
        return v === undefined || v === null || v === "" ? null : Number(v);
      });
      essayScores[questionIndex] = Number(score);

      const mcqScore = Number(data.score || data.mcqScore || 0);
      const essayTotal = essayScores.reduce((sum, s) => sum + (s == null ? 0 : Number(s)), 0);

      const hasUnfinishedEssay = essayScores.some((s) => s === null);
      const updateData = {
        essayScores,
        total: mcqScore + essayTotal,
        status: hasUnfinishedEssay ? "pending_essay" : "graded",
        gradedAt: serverTimestamp()
      };

      await updateDoc(resRef, updateData);
      return {
        success: true,
        total: mcqScore + essayTotal,
        message: "تم حفظ درجة المقالي بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Reads student's own exam result directly from Firestore.
   * Checks primary format /results/{examId}_{studentUid}, legacy /results/{studentUid}_{examId},
   * and canonical auth.currentUser.uid.
   */
  async getResult(examId, studentUid) {
    const candidates = new Set();
    if (studentUid) {
      candidates.add(`${examId}_${studentUid}`);
      candidates.add(`${studentUid}_${examId}`);
    }
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      candidates.add(`${examId}_${currentUid}`);
      candidates.add(`${currentUid}_${examId}`);
    }

    for (const docId of candidates) {
      try {
        const docSnap = await getDoc(doc(db, COLLECTIONS.RESULTS, docId));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
      } catch (_) {}
    }

    return null;
  },

  /**
   * Teacher / Admin / Student: Fetches all exams.
   */
  async getAllExams() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.EXAMS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches a single exam by ID.
   */
  async getExam(examId) {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.EXAMS, examId));
      if (!snap.exists()) {
        throw new Error("الامتحان المطلوب غير موجود.");
      }
      return { id: snap.id, ...snap.data() };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Alias for getExam to prevent TypeError when callers use getExamById.
   */
  async getExamById(examId) {
    return this.getExam(examId);
  },

  /**
   * Updates an existing exam.
   */
  async updateExam(examId, examData) {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAMS, examId), {
        ...examData,
        updatedAt: serverTimestamp()
      });
      return { id: examId };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher creates a new exam.
   */
  async createExam(examData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.EXAMS), {
        ...examData,
        createdAt: serverTimestamp()
      });
      return { id: docRef.id };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher toggles exam active status.
   */
  async toggleExamStatus(examId, isActive) {
    try {
      await updateDoc(doc(db, COLLECTIONS.EXAMS, examId), {
        active: isActive,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher deletes an exam.
   */
  async deleteExam(examId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.EXAMS, examId));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher fetches results for a specific exam with full normalization.
   */
  async getExamResults(examId) {
    try {
      const resultsMap = new Map();

      // 1. Direct query where examId == examId
      try {
        const q = query(
          collection(db, COLLECTIONS.RESULTS),
          where("examId", "==", examId)
        );
        const snap = await getDocs(q);
        snap.docs.forEach((d) => {
          resultsMap.set(d.id, { id: d.id, ...d.data() });
        });
      } catch (_) {}

      // 2. Fallback scan if primary query returned empty (handles legacy or prefixed doc IDs)
      if (resultsMap.size === 0) {
        try {
          const allResultsSnap = await getDocs(collection(db, COLLECTIONS.RESULTS));
          allResultsSnap.docs.forEach((d) => {
            const data = d.data();
            if (data.examId === examId || d.id.startsWith(`${examId}_`) || d.id.endsWith(`_${examId}`)) {
              resultsMap.set(d.id, { id: d.id, ...data });
            }
          });
        } catch (_) {}
      }

      // 3. Normalize each result record
      return Array.from(resultsMap.values()).map((d) => {
        const score = Number(d.score != null ? d.score : (d.total != null ? d.total : d.mcqScore || 0));
        const total = Number(d.total != null && d.total > 0 ? d.total : (d.maxDegree || 100));
        const percentage = total > 0 ? Math.min(100, Math.round((score / total) * 100)) : 0;
        const essayScores = Array.isArray(d.essayScores) ? d.essayScores : [];
        const hasPendingEssay = essayScores.some((s) => s === null || s === undefined);
        const status = hasPendingEssay ? "pending_essay" : (d.status || "graded");

        return {
          id: d.id,
          examId: d.examId || examId,
          studentUid: d.studentUid || d.studentId || (d.id.includes("_") ? d.id.split("_")[1] : ""),
          studentName: d.studentName || d.name || "طالب مسجل",
          studentPhone: d.studentPhone || d.phone || "",
          group: d.group || "ALL",
          score,
          total,
          percentage,
          mcqScore: Number(d.mcqScore || 0),
          essayScores,
          answers: Array.isArray(d.answers) ? d.answers : [],
          status,
          submittedAt: d.submittedAt || d.createdAt || null
        };
      }).sort((a, b) => b.score - a.score);
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Aggregates all exam results across all exams to produce the All-Exams Report matrix.
   *
   * @returns {Promise<{
   *   exams: Array<object>,
   *   studentsSummary: Array<{
   *     studentUid: string,
   *     studentName: string,
   *     studentPhone: string,
   *     group: string,
   *     examScores: Record<string, { score: number, total: number, percentage: number, status: string }>,
   *     averagePercentage: number,
   *     totalTaken: number
   *   }>
   * }>}
   */
  async getAllExamsResultsSummary() {
    try {
      const [exams, resultsSnap, studentsSnap] = await Promise.all([
        this.getAllExams(),
        getDocs(collection(db, COLLECTIONS.RESULTS)),
        getDocs(collection(db, COLLECTIONS.STUDENTS))
      ]);

      const studentsMap = new Map();

      // Initialize with registered students
      studentsSnap.docs.forEach((d) => {
        const sData = d.data();
        const uid = d.id;
        studentsMap.set(uid, {
          studentUid: uid,
          studentName: sData.studentName || sData.name || "طالب مسجل",
          studentPhone: sData.studentPhone || sData.phone || "",
          group: sData.studentGroup || sData.group || "ALL",
          examScores: {},
          totalScoreSum: 0,
          totalPercentageSum: 0,
          totalTaken: 0
        });
      });

      // Populate results
      resultsSnap.docs.forEach((d) => {
        const rData = d.data();
        const examId = rData.examId || (d.id.includes("_") ? d.id.split("_")[0] : "");
        const studentUid = rData.studentUid || rData.studentId || (d.id.includes("_") ? d.id.split("_")[1] : "");

        if (!studentUid || !examId) return;

        if (!studentsMap.has(studentUid)) {
          studentsMap.set(studentUid, {
            studentUid,
            studentName: rData.studentName || "طالب مسجل",
            studentPhone: rData.studentPhone || "",
            group: rData.group || "ALL",
            examScores: {},
            totalScoreSum: 0,
            totalPercentageSum: 0,
            totalTaken: 0
          });
        }

        const student = studentsMap.get(studentUid);
        const score = Number(rData.score != null ? rData.score : (rData.total != null ? rData.total : rData.mcqScore || 0));
        const total = Number(rData.total != null && rData.total > 0 ? rData.total : 100);
        const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
        const essayScores = Array.isArray(rData.essayScores) ? rData.essayScores : [];
        const hasPendingEssay = essayScores.some((s) => s === null || s === undefined);
        const status = hasPendingEssay ? "pending_essay" : (rData.status || "graded");

        student.examScores[examId] = { score, total, percentage, status };
        student.totalScoreSum += score;
        student.totalPercentageSum += percentage;
        student.totalTaken++;
      });

      const studentsSummary = Array.from(studentsMap.values()).map((s) => {
        const averagePercentage = s.totalTaken > 0 ? Math.round(s.totalPercentageSum / s.totalTaken) : 0;
        return {
          studentUid: s.studentUid,
          studentName: s.studentName,
          studentPhone: s.studentPhone,
          group: s.group,
          examScores: s.examScores,
          averagePercentage,
          totalTaken: s.totalTaken
        };
      }).sort((a, b) => b.averagePercentage - a.averagePercentage);

      return {
        exams,
        studentsSummary
      };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
