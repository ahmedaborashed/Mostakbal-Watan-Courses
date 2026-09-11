// src/features/attendance/attendance.service.js
import { callApi } from "../../repositories/api.client.js";
import { db } from "../../core/firebase.js";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const AttendanceService = {
  /**
   * Fetches authoritative student attendance and real statistics via Cloud Function,
   * with resilient direct Firestore fallback.
   * 
   * @param {object} student - Student profile object
   * @returns {Promise<object>} Normalized attendance view model
   */
  async getStudentAttendance(student) {
    // 1. Try Authoritative Cloud Function first
    try {
      const response = await callApi("getStudentAttendance");
      if (response && typeof response.attendanceRate === "number") {
        return response;
      }
    } catch (apiErr) {
      console.warn("Backend getStudentAttendance API fallback triggered:", apiErr?.message || apiErr);
    }

    // 2. Resilient Client-Side Firestore Fallback
    try {
      const studentUid = student?.id || student?.firestoreId || "";
      const studentPhone = student?.studentPhone || student?.phone || "";
      const studentGroup = student?.studentGroup || student?.group || "ALL";

      // Fetch all sessions
      const sessionsSnap = await getDocs(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS));
      const allSessions = sessionsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      // Sort chronologically
      allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filter eligible sessions for this student's group
      const eligibleSessions = allSessions.filter((s) => {
        const sGroup = s.group || "ALL";
        if (sGroup === "ALL" || studentGroup === "ALL") return true;
        return sGroup === studentGroup;
      });

      const todayStr = new Date().toISOString().slice(0, 10);
      let presentCount = 0;
      let absentCount = 0;
      const sessionHistory = [];

      for (const session of eligibleSessions) {
        let isPresent = false;
        let hasRecord = false;
        let markedAt = null;

        // Try direct subcollection lookup by studentUid
        if (studentUid) {
          try {
            const recSnap = await getDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, session.id, COLLECTIONS.RECORDS, studentUid));
            if (recSnap.exists()) {
              hasRecord = true;
              const data = recSnap.data();
              isPresent = Boolean(data.present || data.status === "present");
              markedAt = data.markedAt;
            }
          } catch (e) {
            // Ignore subcollection access error and try phone fallback
          }
        }

        // Try phone fallback if not found
        if (!hasRecord && studentPhone) {
          try {
            const phoneSnap = await getDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, session.id, COLLECTIONS.RECORDS, studentPhone));
            if (phoneSnap.exists()) {
              hasRecord = true;
              const data = phoneSnap.data();
              isPresent = Boolean(data.present || data.status === "present");
              markedAt = data.markedAt;
            }
          } catch (e) {}
        }

        // Try legacy embedded records array in session document
        if (!hasRecord && Array.isArray(session.records)) {
          const legacyRec = session.records.find((r) =>
            r.studentId === studentUid ||
            r.uid === studentUid ||
            (studentPhone && (r.studentPhone === studentPhone || r.studentId === studentPhone))
          );
          if (legacyRec) {
            hasRecord = true;
            isPresent = Boolean(legacyRec.present || legacyRec.status === "present");
          }
        }

        const sessionDateStr = session.date || todayStr;
        const isFutureSession = sessionDateStr > todayStr;

        let status = "absent";
        if (isPresent) {
          status = "present";
          presentCount++;
        } else if (isFutureSession && !hasRecord) {
          status = "upcoming";
        } else {
          status = "absent";
          absentCount++;
        }

        sessionHistory.push({
          id: session.id,
          name: session.name || "محاضرة رسمية",
          date: sessionDateStr,
          group: session.group || "ALL",
          status,
          isPresent,
          markedAt
        });
      }

      const pastSessions = sessionHistory.filter((s) => s.status !== "upcoming");
      const totalSessions = pastSessions.length;
      const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
      const requiredRate = 75;

      let status = "excellent";
      let statusMessage = "معدل حضورك ممتاز ومستقر فوق الحد المطلوب ✅";
      if (attendanceRate >= 85) {
        status = "excellent";
        statusMessage = "معدل حضورك ممتاز ومستقر فوق الحد المطلوب ✅";
      } else if (attendanceRate >= 75) {
        status = "warning";
        statusMessage = "معدل حضورك قريب من الحد الأدنى، احرص على عدم الغياب ⚠️";
      } else {
        status = "danger";
        statusMessage = "معدل حضورك أقل من الحد الأدنى المطلوب (75%)، يرجى تعويض المحاضرات 🔴";
      }

      // Compute streak
      let currentStreak = 0;
      for (let i = pastSessions.length - 1; i >= 0; i--) {
        if (pastSessions[i].status === "present") currentStreak++;
        else break;
      }

      return {
        totalSessions,
        presentCount,
        absentCount,
        attendanceRate,
        requiredRate,
        status,
        statusMessage,
        currentStreak,
        studentGroup,
        sessions: sessionHistory.reverse()
      };
    } catch (err) {
      console.error("Firestore attendance fallback error:", err);
      throw normalizeError(err);
    }
  },

  /**
   * Creates a new session (Teacher / Admin). Supports both object and positional params.
   */
  async createSession(param1, date, group = "ALL") {
    try {
      let payload;
      if (typeof param1 === "object" && param1 !== null) {
        payload = {
          name: param1.name,
          date: param1.date,
          group: param1.group || "ALL"
        };
      } else {
        payload = { name: param1, date, group };
      }
      return await callApi("createAttendanceSession", payload);
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Batch updates student attendance records in session subcollection.
   */
  async recordBatch(sessionId, records) {
    try {
      const sanitizedRecords = (records || []).map((r) => ({
        studentUid: r.studentUid || r.studentId || r.uid,
        studentName: r.studentName || r.name || "",
        studentPhone: r.studentPhone || r.phone || "",
        group: r.group || "ALL",
        present: Boolean(r.present || r.status === "present")
      }));

      return await callApi("recordAttendanceBatch", {
        sessionId,
        records: sanitizedRecords
      });
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Backward-compatible alias for recordBatch.
   */
  async saveAttendanceBatch(sessionId, records) {
    return this.recordBatch(sessionId, records);
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
  }
};
