// src/features/exams/exam.service.js
import { callApi } from "../../repositories/api.client.js";
import { db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const ExamService = {
  /**
   * Fetches authorized available exams for student (sanitized metadata, attempt status, and result).
   */
  async getAvailableExamsForStudent(studentGroup = "ALL", studentUid = "") {
    try {
      const data = await callApi("getAvailableExamsForStudent");
      if (Array.isArray(data)) return data;
      return [];
    } catch (err) {
      console.warn("Cloud function getAvailableExamsForStudent unavailable, attempting scoped fallback:", err);
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
        throw normalizeError(err);
      }
    }
  },

  /**
   * Fetches sanitized exam questions for student (correct answers stripped on server).
   */
  async getExamForStudent(examId) {
    try {
      return await callApi("getExamForStudent", { examId });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Initiates student exam attempt with server timestamp.
   */
  async startAttempt(examId) {
    try {
      return await callApi("startExamAttempt", { examId });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Submits student answers for server-side evaluation.
   */
  async submitExam(examId, answers) {
    try {
      return await callApi("submitExam", { examId, answers });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Teacher evaluation of essay question.
   */
  async gradeEssay(resultId, questionIndex, score) {
    try {
      return await callApi("gradeEssay", { resultId, questionIndex, score });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Reads student's own exam result directly from Firestore.
   */
  async getResult(examId, studentUid) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.RESULTS, `${examId}_${studentUid}`));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.warn("Could not load exam result:", err);
      return null;
    }
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
   * Teacher fetches results for a specific exam.
   */
  async getExamResults(examId) {
    try {
      const q = query(
        collection(db, COLLECTIONS.RESULTS),
        where("examId", "==", examId)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
