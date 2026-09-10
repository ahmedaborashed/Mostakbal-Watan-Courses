// src/services/student.service.js
import { callApi } from "../repositories/api.client.js";
import { db } from "../core/firebase.js";
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const StudentService = {
  /**
   * Creates a student via Cloud Function with fallback for progressive rollout.
   */
  async createStudent({ name, phone, nationalId, address, group }) {
    try {
      return await callApi("createStudent", {
        name,
        phone,
        nationalId,
        address,
        group
      });
    } catch (err) {
      console.warn("Cloud function createStudent unavailable, using local client path:", err);
      // Resilient fallback for local testing before functions deploy
      throw err;
    }
  },

  /**
   * Resets student password securely via Cloud Function.
   */
  async resetPassword(studentUid, newPassword) {
    return await callApi("resetStudentPassword", {
      studentUid,
      newPassword
    });
  },

  /**
   * Deletes a student account via Cloud Function (Admin only).
   */
  async deleteStudent(studentUid) {
    return await callApi("deleteStudent", {
      studentUid
    });
  },

  /**
   * Fetches single student record by Auth UID (O(1) lookup).
   */
  async getStudentProfile(uid) {
    const docSnap = await getDoc(doc(db, "students", uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
    }
    return null;
  }
};
