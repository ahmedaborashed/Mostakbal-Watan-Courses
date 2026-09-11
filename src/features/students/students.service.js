// src/features/students/students.service.js
import { callApi } from "../../repositories/api.client.js";
import { db } from "../../core/firebase.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const StudentsService = {
  /**
   * Fetches all registered students (Teacher / Admin).
   */
  async getAllStudents() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      return snap.docs.map((d) => ({
        id: d.id,
        firestoreId: d.id,
        ...d.data()
      }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches single student record by Auth UID (O(1) lookup).
   */
  async getStudentProfile(uid) {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, uid));
      if (docSnap.exists()) {
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async getStudentByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();
    try {
      // 1. Direct O(1) lookup for legacy documents keyed by phone (complies with get rule)
      const directSnap = await getDoc(doc(db, COLLECTIONS.STUDENTS, cleanPhone));
      if (directSnap.exists()) {
        return { id: directSnap.id, firestoreId: directSnap.id, ...directSnap.data() };
      }

      // 2. Query fallback with limit(1)
      const q = query(
        collection(db, COLLECTIONS.STUDENTS),
        where("studentPhone", "==", cleanPhone),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.warn("Student phone lookup warning:", err?.message || err);
      return null;
    }
  },

  /**
   * Creates a new student via Cloud Function with auto Auth user generation.
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
      throw normalizeError(err);
    }
  },

  /**
   * Resets student password securely via Cloud Function.
   */
  async resetPassword(studentUid, newPassword) {
    try {
      return await callApi("resetStudentPassword", {
        studentUid,
        newPassword
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Deletes a student account via Cloud Function (Admin only).
   */
  async deleteStudent(studentUid) {
    try {
      return await callApi("deleteStudent", {
        studentUid
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Updates student information in Firestore.
   */
  async updateStudent(studentId, data) {
    try {
      await updateDoc(doc(db, COLLECTIONS.STUDENTS, studentId), data);
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
