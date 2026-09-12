// src/features/students/students.service.js
import { callApi } from "../../repositories/api.client.js";
import app, { db } from "../../core/firebase.js";
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  limit,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS, FEATURES } from "../../core/constants.js";
import { normalizeError, isCloudFunctionUnavailable } from "../../core/errors.js";

function getSecondaryAuth() {
  const secondaryAppName = "StudentCreationSecondaryApp";
  const existingApp = getApps().find((a) => a.name === secondaryAppName);
  const secApp = existingApp || initializeApp(app.options, secondaryAppName);
  return getAuth(secApp);
}

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

      // 2. Query fallback with limit(1) on studentPhone
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

      // 3. Fallback query on phone field
      const qPhone = query(
        collection(db, COLLECTIONS.STUDENTS),
        where("phone", "==", cleanPhone),
        limit(1)
      );
      const snapPhone = await getDocs(qPhone);
      if (!snapPhone.empty) {
        const docSnap = snapPhone.docs[0];
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }

      // 4. Fallback query on username field
      const qUser = query(
        collection(db, COLLECTIONS.STUDENTS),
        where("username", "==", cleanPhone),
        limit(1)
      );
      const snapUser = await getDocs(qUser);
      if (!snapUser.empty) {
        const docSnap = snapUser.docs[0];
        return { id: docSnap.id, firestoreId: docSnap.id, ...docSnap.data() };
      }

      return null;
    } catch (err) {
      console.warn("Student phone lookup warning:", err?.message || err);
      return null;
    }
  },

  /**
   * Creates a new student via Cloud Function with auto Auth user generation,
   * and provides a resilient direct secondary Auth + Firestore fallback.
   */
  async createStudent({ name, phone, nationalId, address, group }) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("createStudent", {
          name,
          phone,
          nationalId,
          address,
          group
        });
      } catch (err) {
        console.warn("Cloud function createStudent unavailable, executing direct secondary Auth fallback:", err?.message || err);
      }
    }

    try {
      const normalizedPhone = String(phone || "").trim().replace(/\s+/g, "");
      const studentEmail = `${normalizedPhone}@student.local`;
      const initialPassword = String(nationalId || "123456").trim();

      const secAuth = getSecondaryAuth();
      let newUser = null;

      try {
        const cred = await createUserWithEmailAndPassword(secAuth, studentEmail, initialPassword);
        newUser = cred.user;
      } catch (authErr) {
        if (authErr.code === "auth/email-already-in-use") {
          throw new Error(`الطالب صاحب رقم الهاتف (${normalizedPhone}) مسجل بالفعل.`);
        }
        throw authErr;
      } finally {
        try {
          await signOut(secAuth);
        } catch (_) {}
      }

      const studentUid = newUser?.uid || normalizedPhone;
      const studentPayload = {
        name: (name || "").trim(),
        studentPhone: normalizedPhone,
        phone: normalizedPhone,
        nationalId: (nationalId || "").trim(),
        address: (address || "").trim(),
        group: group || "ALL",
        active: true,
        authUid: studentUid,
        role: "student",
        createdAt: serverTimestamp()
      };

      // 1. Save to students collection keyed by Auth UID
      await setDoc(doc(db, COLLECTIONS.STUDENTS, studentUid), studentPayload, { merge: true });

      // 2. Also save phone-keyed record for backward compatibility
      if (studentUid !== normalizedPhone) {
        try {
          await setDoc(doc(db, COLLECTIONS.STUDENTS, normalizedPhone), studentPayload, { merge: true });
        } catch (_) {}
      }

      // 3. Sync to users collection
      try {
        await setDoc(doc(db, "users", studentUid), {
          name: studentPayload.name,
          phone: normalizedPhone,
          role: "student",
          group: studentPayload.group,
          createdAt: serverTimestamp()
        }, { merge: true });
      } catch (_) {}

      return {
        success: true,
        studentUid,
        message: "تم إنشاء حساب الطالب بنجاح ✅"
      };
    } catch (fallbackErr) {
      throw normalizeError(fallbackErr);
    }
  },

  /**
   * Resets student password securely via Cloud Function with direct Firestore fallback.
   */
  async resetPassword(studentUid, newPassword) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("resetStudentPassword", {
          studentUid,
          newPassword
        });
      } catch (err) {
        console.warn("Cloud function resetStudentPassword unavailable, executing direct Firestore fallback:", err?.message || err);
      }
    }

    try {
      const studentRef = doc(db, COLLECTIONS.STUDENTS, studentUid);
      const studentSnap = await getDoc(studentRef);
      const passToSet = newPassword || studentSnap.data()?.nationalId || "123456";

      await updateDoc(studentRef, {
        pass: passToSet,
        nationalId: passToSet,
        updatedAt: serverTimestamp()
      });

      return {
        success: true,
        message: "تم تعيين كلمة المرور بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
    }
  },

  /**
   * Deletes a student account via Cloud Function (Admin only) with direct Firestore fallback.
   */
  async deleteStudent(studentUid) {
    if (FEATURES.USE_CLOUD_FUNCTIONS) {
      try {
        return await callApi("deleteStudent", {
          studentUid
        });
      } catch (err) {
        console.warn("Cloud function deleteStudent unavailable, executing direct Firestore fallback:", err?.message || err);
      }
    }

    try {
      await deleteDoc(doc(db, COLLECTIONS.STUDENTS, studentUid));
      try {
        await deleteDoc(doc(db, "users", studentUid));
      } catch (_) {}

      return {
        success: true,
        message: "تم حذف الطالب بنجاح ✅"
      };
    } catch (fsErr) {
      throw normalizeError(fsErr);
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
  },

  /**
   * Calculates absence counts for all students across past attendance sessions.
   * Identifies students with >= 4 absences for the High Absence Warning.
   *
   * @returns {Promise<Map<string, { absenceCount: number, totalHeld: number, isHighAbsence: boolean }>>}
   */
  async getStudentAbsencesMap() {
    const absencesMap = new Map();
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const [sessionsSnap, studentsSnap] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.ATTENDANCE_SESSIONS)),
        getDocs(collection(db, COLLECTIONS.STUDENTS))
      ]);

      const allStudents = studentsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));

      // Initialize all students with 0 absences
      allStudents.forEach((s) => {
        absencesMap.set(s.id, {
          absenceCount: 0,
          totalHeld: 0,
          isHighAbsence: false
        });
      });

      // Filter past held sessions
      const pastSessions = sessionsSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => (s.date || todayStr) <= todayStr);

      for (const session of pastSessions) {
        // Fetch records for this session
        let sessionRecords = new Map();
        try {
          const subSnap = await getDocs(
            collection(db, COLLECTIONS.ATTENDANCE_SESSIONS, session.id, COLLECTIONS.RECORDS)
          );
          subSnap.docs.forEach((d) => {
            const data = d.data();
            const uid = data.studentUid || data.studentId || d.id;
            sessionRecords.set(uid, Boolean(data.present || data.status === "present"));
          });
        } catch (_) {}

        if (sessionRecords.size === 0 && Array.isArray(session.records)) {
          session.records.forEach((r) => {
            const uid = r.studentUid || r.studentId || r.uid;
            if (uid) {
              sessionRecords.set(uid, Boolean(r.present || r.status === "present"));
            }
          });
        }

        const sessionGroup = session.group || "ALL";

        allStudents.forEach((student) => {
          const sGroup = student.studentGroup || student.group || "ALL";
          const isEligible = sessionGroup === "ALL" || sGroup === "ALL" || sessionGroup === sGroup;
          if (!isEligible) return;

          const stats = absencesMap.get(student.id);
          if (stats) {
            stats.totalHeld++;
            const isPresent = sessionRecords.get(student.id) || (student.studentPhone && sessionRecords.get(student.studentPhone));
            if (!isPresent) {
              stats.absenceCount++;
            }
          }
        });
      }

      // Mark isHighAbsence (>= 4 absences according to Section 30)
      absencesMap.forEach((val) => {
        val.isHighAbsence = val.absenceCount >= 4;
      });

      return absencesMap;
    } catch (err) {
      console.warn("Could not calculate student absences map:", err);
      return absencesMap;
    }
  },

  /**
   * Fetches complete 360-degree academic dossier for a student.
   *
   * @param {string} studentUid
   * @returns {Promise<{
   *   student: object,
   *   exams: Array<object>,
   *   assignments: Array<object>,
   *   attendance: object,
   *   gamification: object
   * }>}
   */
  async getStudent360Data(studentUid) {
    try {
      const student = await this.getStudentProfile(studentUid);
      if (!student) throw new Error("الطالب غير موجود");

      const studentGroup = student.studentGroup || student.group || "ALL";
      const studentPhone = student.studentPhone || student.phone || "";

      // 1. Fetch Exam Results (Scoped to studentUid)
      const examsList = [];
      try {
        const examsPromise = getDocs(collection(db, COLLECTIONS.EXAMS));
        let resultsSnap;
        try {
          resultsSnap = await getDocs(query(
            collection(db, COLLECTIONS.RESULTS),
            where("studentUid", "==", studentUid)
          ));
          if (resultsSnap.empty && studentPhone) {
            const phoneSnap = await getDocs(query(
              collection(db, COLLECTIONS.RESULTS),
              where("studentPhone", "==", studentPhone)
            ));
            if (!phoneSnap.empty) resultsSnap = phoneSnap;
          }
        } catch (queryErr) {
          // Fallback if index not ready
          resultsSnap = await getDocs(collection(db, COLLECTIONS.RESULTS));
        }

        const allExamsSnap = await examsPromise;
        const examsMap = new Map();
        allExamsSnap.docs.forEach((d) => examsMap.set(d.id, { id: d.id, ...d.data() }));

        resultsSnap.docs.forEach((d) => {
          const r = d.data();
          const rUid = r.studentUid || r.studentId || (d.id.includes("_") ? d.id.split("_")[1] : "");
          const rPhone = r.studentPhone || "";
          if (rUid === studentUid || (studentPhone && rPhone === studentPhone)) {
            const examId = r.examId || (d.id.includes("_") ? d.id.split("_")[0] : "");
            const examMeta = examsMap.get(examId) || {};
            const score = Number(r.score != null ? r.score : (r.total != null ? r.total : r.mcqScore || 0));
            const total = Number(r.total != null && r.total > 0 ? r.total : (examMeta.passDegree || 100));
            const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
            const essayScores = Array.isArray(r.essayScores) ? r.essayScores : [];
            const hasPendingEssay = essayScores.some((s) => s === null || s === undefined);
            const status = hasPendingEssay ? "pending_essay" : (r.status || "graded");

            examsList.push({
              examId,
              examTitle: examMeta.title || "امتحان دراسي",
              date: r.submittedAt || r.createdAt || examMeta.startDate || null,
              score,
              total,
              percentage,
              status
            });
          }
        });
      } catch (e) {
        console.warn("Student 360 exams fetch warning:", e);
      }

      // 2. Fetch Assignments Submissions (Scoped to studentUid)
      const assignmentsList = [];
      try {
        const assignPromise = getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
        let submissionsSnap;
        try {
          submissionsSnap = await getDocs(query(
            collection(db, COLLECTIONS.SUBMISSIONS),
            where("studentUid", "==", studentUid)
          ));
          if (submissionsSnap.empty && studentPhone) {
            const phoneSnap = await getDocs(query(
              collection(db, COLLECTIONS.SUBMISSIONS),
              where("studentPhone", "==", studentPhone)
            ));
            if (!phoneSnap.empty) submissionsSnap = phoneSnap;
          }
        } catch (queryErr) {
          // Fallback if index not ready
          submissionsSnap = await getDocs(collection(db, COLLECTIONS.SUBMISSIONS));
        }

        const allAssignSnap = await assignPromise;
        const assignMap = new Map();
        allAssignSnap.docs.forEach((d) => assignMap.set(d.id, { id: d.id, ...d.data() }));

        submissionsSnap.docs.forEach((d) => {
          const sub = d.data();
          const sUid = sub.studentUid || sub.studentId || (d.id.includes("_") ? d.id.split("_")[0] : "");
          if (sUid === studentUid || (studentPhone && sub.studentPhone === studentPhone)) {
            const aId = sub.assignmentId || (d.id.includes("_") ? d.id.split("_")[1] : "");
            const aMeta = assignMap.get(aId) || {};
            assignmentsList.push({
              assignmentId: aId,
              assignmentTitle: aMeta.title || "واجب عملي",
              submittedAt: sub.submittedAt || sub.createdAt || null,
              answerText: sub.answerText || "",
              fileUrl: sub.fileUrl || "",
              grade: sub.grade != null ? Number(sub.grade) : null,
              feedback: sub.feedback || "",
              status: sub.grade != null ? "graded" : "submitted"
            });
          }
        });
      } catch (e) {
        console.warn("Student 360 assignments fetch warning:", e);
      }

      // 3. Fetch Attendance Data via AttendanceService
      let attendanceData = {
        totalSessions: 0,
        presentCount: 0,
        absentCount: 0,
        attendanceRate: 100,
        status: "excellent",
        attendedSessions: [],
        absentSessions: []
      };

      try {
        const { AttendanceService } = await import("../attendance/attendance.service.js");
        const attRes = await AttendanceService.getStudentAttendance(student);
        if (attRes) {
          const attendedSessions = (attRes.sessions || []).filter((s) => s.status === "present" || s.isPresent);
          const absentSessions = (attRes.sessions || []).filter((s) => s.status === "absent" && !s.isPresent);
          attendanceData = {
            totalSessions: attRes.totalSessions || 0,
            presentCount: attRes.presentCount || 0,
            absentCount: attRes.absentCount || 0,
            attendanceRate: attRes.attendanceRate || 100,
            status: attRes.status || "excellent",
            statusMessage: attRes.statusMessage || "",
            currentStreak: attRes.currentStreak || 0,
            attendedSessions,
            absentSessions
          };
        }
      } catch (e) {
        console.warn("Student 360 attendance fetch warning:", e);
      }

      // 4. Fetch Gamification & Python Adventure Profile
      let gamificationData = {
        xp: 0,
        level: 1,
        competitionPoints: 0,
        streak: 0,
        achievements: [],
        completedChallengesCount: 0
      };

      try {
        const [gamSnap, advSnap] = await Promise.all([
          getDoc(doc(db, "student_gamification", studentUid)),
          getDoc(doc(db, "python_adventure_progress", studentUid))
        ]);

        if (gamSnap.exists()) {
          const g = gamSnap.data();
          gamificationData.xp = Number(g.xp || 0);
          gamificationData.level = Number(g.level || 1);
          gamificationData.competitionPoints = Number(g.competitionPoints || 0);
          gamificationData.streak = Number(g.streak || 0);
          gamificationData.achievements = Array.isArray(g.achievements) ? g.achievements : [];
        }

        if (advSnap.exists()) {
          const adv = advSnap.data();
          const completedIds = Array.isArray(adv.completedChallenges) ? adv.completedChallenges : Object.keys(adv.completedChallenges || {});
          gamificationData.completedChallengesCount = completedIds.length;
          if (!gamificationData.xp && adv.xp) gamificationData.xp = Number(adv.xp);
          if (gamificationData.level === 1 && adv.level) gamificationData.level = Number(adv.level);
        }
      } catch (e) {
        console.warn("Student 360 gamification fetch warning:", e);
      }

      return {
        student,
        exams: examsList,
        assignments: assignmentsList,
        attendance: attendanceData,
        gamification: gamificationData
      };
    } catch (err) {
      throw normalizeError(err);
    }
  }
};
