// src/services/exam.service.js
import { callApi } from "../repositories/api.client.js";
import { db } from "../core/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const ExamService = {
  /**
   * Fetches sanitized exam for student (answers stripped on server).
   */
  async getExamForStudent(examId) {
    return await callApi("getExamForStudent", { examId });
  },

  /**
   * Initiates student exam attempt with server timestamp.
   */
  async startAttempt(examId) {
    return await callApi("startExamAttempt", { examId });
  },

  /**
   * Submits student answers for server-side evaluation.
   */
  async submitExam(examId, answers) {
    return await callApi("submitExam", { examId, answers });
  },

  /**
   * Teacher evaluation of essay question.
   */
  async gradeEssay(resultId, questionIndex, score) {
    return await callApi("gradeEssay", { resultId, questionIndex, score });
  },

  /**
   * Reads student's own exam result directly from Firestore.
   */
  async getResult(examId, studentUid) {
    const docSnap = await getDoc(doc(db, "results", `${examId}_${studentUid}`));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  }
};
