// src/features/attendance/attendance.service.js
import { callApi } from "../../repositories/api.client.js";
import { db } from "../../core/firebase.js";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const AttendanceService = {
  /**
   * Creates a new session without embedded student arrays.
   */
  async createSession(name, date, group = "ALL") {
    try {
      return await callApi("createAttendanceSession", { name, date, group });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Batch updates student attendance records in session subcollection.
   */
  async recordBatch(sessionId, records) {
    try {
      return await callApi("recordAttendanceBatch", { sessionId, records });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches all attendance sessions (Teacher / Admin / Student).
   */
  async getAllSessions() {
    try {
      const snap = await getDocs(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Reads student's own attendance across all sessions via collectionGroup query.
   */
  async getStudentAttendance(studentUid) {
    try {
      const q = query(
        collectionGroup(db, COLLECTIONS.RECORDS),
        where("studentUid", "==", studentUid)
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({
        id: d.id,
        sessionId: d.ref.parent?.parent?.id,
        ...d.data()
      }));
    } catch (err) {
      console.warn("Collection group query failed, checking fallback:", err);
      return [];
    }
  }
};
