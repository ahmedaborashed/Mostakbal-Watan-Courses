// src/services/attendance.service.js
import { callApi } from "../repositories/api.client.js";
import { db } from "../core/firebase.js";
import { collection, collectionGroup, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const AttendanceService = {
  /**
   * Creates a new session without embedded student arrays.
   */
  async createSession(name, date, group = "ALL") {
    return await callApi("createAttendanceSession", { name, date, group });
  },

  /**
   * Batch updates student attendance records in subcollection.
   */
  async recordBatch(sessionId, records) {
    return await callApi("recordAttendanceBatch", { sessionId, records });
  },

  /**
   * Reads student's own attendance across all sessions without loading all students.
   */
  async getStudentAttendance(studentUid) {
    try {
      const q = query(
        collectionGroup(db, "records"),
        where("studentUid", "==", studentUid)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, sessionId: d.ref.parent.parent?.id, ...d.data() }));
    } catch (err) {
      console.warn("Collection group query failed, checking fallback:", err);
      return [];
    }
  }
};
