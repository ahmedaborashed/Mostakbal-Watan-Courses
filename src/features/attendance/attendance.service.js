// src/features/attendance/attendance.service.js
import { callApi } from "../../repositories/api.client.js";
import { db } from "../../core/firebase.js";
import {
  collection,
  collectionGroup,
  getDocs,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS, FEATURES } from "../../core/constants.js";
import { normalizeError, isCloudFunctionUnavailable } from "../../core/errors.js";

const _studentAttendanceCache = new Map();
const ATTENDANCE_CACHE_TTL_MS = 60000;

export const AttendanceService = {
  /**
   * Clears the attendance in-memory cache.
   */
  clearCache() {
    _studentAttendanceCache.clear();
  },

  /**
   * Fetches authoritative student attendance and real statistics via Cloud Function,
   * with resilient direct Firestore fallback.
   * 
   * @param {object} student - Student profile object
   * @param {boolean} [forceRefresh=false] - Force bypass cache
   * @returns {Promise<object>} Normalized attendance view model
   */
  async getStudentAttendance(student, forceRefresh = false) {
    const studentUid = student?.id || student?.firestoreId || "";
    const studentPhone = student?.studentPhone || student?.phone || "";
    const studentGroup = student?.studentGroup || student?.group || "ALL";
    const cacheKey = `${studentUid}_${studentPhone}_${studentGroup}`;

    if (!forceRefresh && _studentAttendanceCache.has(cacheKey)) {
      const cached = _studentAttendanceCache.get(cacheKey);
      if (Date.now() - cached.timestamp < ATTENDANCE_CACHE_TTL_MS) {
        return cached.data;
      }
      _studentAttendanceCache.delete(cacheKey);
    }

    // 1. Try Authoritative Cloud Function first (if enabled)
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        const response = await callApi("getStudentAttendance");
        if (response && typeof response.attendanceRate === "number") {
          _studentAttendanceCache.set(cacheKey, { data: response, timestamp: Date.now() });
          return response;
        }
      } catch (apiErr) {
        console.warn("Backend getStudentAttendance API fallback triggered:", apiErr?.message || apiErr);
      }
    }

    // 2. Resilient Client-Side Firestore Fallback
    try {
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

      // Concurrently fetch attendance records for all eligible sessions in parallel
      const sessionHistory = await Promise.all(
        eligibleSessions.map(async (session) => {
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
          } else if (isFutureSession && !hasRecord) {
            status = "upcoming";
          } else {
            status = "absent";
          }

          return {
            id: session.id,
            name: session.name || "محاضرة رسمية",
            date: sessionDateStr,
            group: session.group || "ALL",
            status,
            isPresent,
            markedAt
          };
        })
      );

      let presentCount = 0;
      let absentCount = 0;
      for (const s of sessionHistory) {
        if (s.status === "present") presentCount++;
        else if (s.status === "absent") absentCount++;
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

      const result = {
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
      _studentAttendanceCache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.error("Firestore attendance fallback error:", err);
      throw normalizeError(err);
    }
  },

  /**
   * Creates a new session (Teacher / Admin) with resilient direct Firestore fallback.
   */
  async createSession(param1, date, group = "ALL") {
    _studentAttendanceCache.clear();
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

    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("createAttendanceSession", payload);
      } catch (apiErr) {
        console.warn("Cloud function createAttendanceSession unavailable, executing direct Firestore fallback:", apiErr?.message || apiErr);
      }
    }

    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS), {
        name: (payload.name || "").trim(),
        date: payload.date || new Date().toISOString().slice(0, 10),
        group: payload.group || "ALL",
        createdAt: serverTimestamp()
      });
      return {
        id: docRef.id,
        success: true,
        message: "تم إنشاء جلسة الحضور بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Batch updates student attendance records in session subcollection with resilient direct Firestore fallback.
   */
  async recordBatch(sessionId, records) {
    _studentAttendanceCache.clear();
    const sanitizedRecords = (records || []).map((r) => ({
      studentUid: r.studentUid || r.studentId || r.uid,
      studentName: r.studentName || r.name || "",
      studentPhone: r.studentPhone || r.phone || "",
      group: r.group || "ALL",
      present: Boolean(r.present || r.status === "present")
    }));

    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("recordAttendanceBatch", {
          sessionId,
          records: sanitizedRecords
        });
      } catch (apiErr) {
        console.warn("Cloud function recordAttendanceBatch unavailable, executing direct Firestore fallback:", apiErr?.message || apiErr);
      }
    }

    try {
      const sessionRef = doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId);
      await Promise.all(
        sanitizedRecords.map((rec) => {
          if (!rec.studentUid) return Promise.resolve();
          const recRef = doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId, COLLECTIONS.RECORDS, rec.studentUid);
          return setDoc(recRef, {
            ...rec,
            markedAt: serverTimestamp()
          }, { merge: true });
        })
      );

      await updateDoc(sessionRef, {
        records: sanitizedRecords,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        count: sanitizedRecords.length,
        message: "تم حفظ واعتماد كشف الحضور بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
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
      return snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Fetches recorded attendance map for a specific session.
   * Checks both target subcollection /records and legacy session.records array.
   *
   * @param {string} sessionId
   * @returns {Promise<Map<string, { present: boolean, status: string, markedAt: any }>>}
   */
  async getSessionRecords(sessionId) {
    const recordsMap = new Map();
    if (!sessionId) return recordsMap;

    try {
      // 1. Target Subcollection: /attendance_sessions/{id}/records
      try {
        const subSnap = await getDocs(
          collection(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId, COLLECTIONS.RECORDS)
        );
        subSnap.docs.forEach((d) => {
          const data = d.data();
          const uid = data.studentUid || data.studentId || d.id;
          recordsMap.set(uid, {
            studentUid: uid,
            studentName: data.studentName || "",
            studentPhone: data.studentPhone || "",
            group: data.group || "ALL",
            present: Boolean(data.present || data.status === "present"),
            status: data.status || (data.present ? "present" : "absent"),
            markedAt: data.markedAt || null
          });
        });
      } catch (_) {}

      // 2. Fallback to legacy embedded records if subcollection is empty
      if (recordsMap.size === 0) {
        try {
          const sessionSnap = await getDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId));
          if (sessionSnap.exists()) {
            const data = sessionSnap.data();
            if (Array.isArray(data.records)) {
              data.records.forEach((r) => {
                const uid = r.studentUid || r.studentId || r.uid;
                if (uid) {
                  recordsMap.set(uid, {
                    studentUid: uid,
                    studentName: r.studentName || r.name || "",
                    studentPhone: r.studentPhone || r.phone || "",
                    group: r.group || "ALL",
                    present: Boolean(r.present || r.status === "present"),
                    status: r.status || (r.present ? "present" : "absent"),
                    markedAt: r.markedAt || null
                  });
                }
              });
            }
          }
        } catch (_) {}
      }

      return recordsMap;
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Updates an existing session's metadata (Name, Date, Group) without recreating documents.
   */
  async updateSession(sessionId, { name, date, group = "ALL" }) {
    try {
      const updateData = {
        updatedAt: serverTimestamp()
      };
      if (name) updateData.name = name.trim();
      if (date) updateData.date = date;
      if (group) updateData.group = group;

      await updateDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId), updateData);
      return { success: true, id: sessionId };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Deletes a session.
   */
  async deleteSession(sessionId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE_SESSIONS, sessionId));
      return { success: true };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
