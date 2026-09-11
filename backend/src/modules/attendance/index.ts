import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { getAuthenticatedUser, requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";
import { awardCompetitionPoints } from "../gamification/ledger";
import { createNotification } from "../gamification/notifications";
import { evaluateRankingAchievements } from "../gamification/achievements";
import { StudentGamificationProfile } from "../gamification/types";

// ==========================================
// 1. CREATE SESSION
// ==========================================
const CreateSessionSchema = z.object({
  name: z.string().min(1, "اسم الجلسة مطلوب"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "تاريخ غير صالح (YYYY-MM-DD)"),
  group: z.string().optional().default("ALL")
});

export async function createAttendanceSessionHandler(request: CallableRequest) {
  requireRole(request, ["teacher", "admin"]);
  const { name, date, group } = validateInput(CreateSessionSchema, request.data);

  const sessionRef = db.collection("attendance_sessions").doc();
  const sessionData = {
    name,
    date,
    group,
    totalCount: 0,
    presentCount: 0,
    absentCount: 0,
    createdAt: new Date()
  };

  await sessionRef.set(sessionData);

  return {
    success: true,
    sessionId: sessionRef.id,
    session: sessionData
  };
}

// ==========================================
// 2. BATCH RECORD ATTENDANCE
// ==========================================
const AttendanceRecordSchema = z.object({
  studentUid: z.string().optional(),
  studentId: z.string().optional(),
  uid: z.string().optional(),
  studentName: z.string().optional().default(""),
  studentPhone: z.string().optional().default(""),
  group: z.string().optional().default("ALL"),
  present: z.boolean(),
  status: z.string().optional()
});

const RecordAttendanceBatchSchema = z.object({
  sessionId: z.string().min(1, "معرف الجلسة مطلوب"),
  records: z.array(AttendanceRecordSchema)
});

export async function recordAttendanceBatchHandler(request: CallableRequest) {
  requireRole(request, ["teacher", "admin"]);
  const { sessionId, records } = validateInput(RecordAttendanceBatchSchema, request.data);

  const sessionRef = db.collection("attendance_sessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new HttpsError("not-found", "جلسة الحضور غير موجودة.");
  }

  const sessionData = sessionSnap.data()!;
  const sessionName = sessionData.name || "محاضرة رسمية";

  const BATCH_SIZE = 450;
  let presentCount = 0;
  let absentCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const rec of chunk) {
      const canonicalUid = rec.studentUid || rec.studentId || rec.uid;
      if (!canonicalUid) continue;

      const isPresent = Boolean(rec.present || rec.status === "present");
      if (isPresent) presentCount++;
      else absentCount++;

      const recordRef = sessionRef.collection("records").doc(canonicalUid);
      batch.set(recordRef, {
        studentUid: canonicalUid,
        studentName: rec.studentName || "",
        studentPhone: rec.studentPhone || "",
        group: rec.group || sessionData.group || "ALL",
        present: isPresent,
        status: isPresent ? "present" : "absent",
        markedAt: new Date()
      }, { merge: true });

      // If student is present, award competition points (+5 points) and trigger notification
      if (isPresent) {
        awardCompetitionPoints({
          studentUid: canonicalUid,
          sourceType: "attendance",
          sourceId: sessionId,
          points: 5,
          reason: `حضور ${sessionName}`,
          notifyStudent: false
        }).catch(err => console.warn("Attendance point award warning:", err));
      }
    }

    await batch.commit();
  }

  // Update session counters
  await sessionRef.update({
    totalCount: records.length,
    presentCount,
    absentCount,
    updatedAt: new Date()
  });

  return {
    success: true,
    totalUpdated: records.length,
    presentCount,
    absentCount
  };
}

// ==========================================
// 3. GET STUDENT ATTENDANCE (Authoritative & Scoped)
// ==========================================
export async function getStudentAttendanceHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const studentUid = user.uid;

  // 1. Fetch canonical student profile
  const studentDoc = await db.collection("students").doc(studentUid).get();
  const studentData = studentDoc.exists ? studentDoc.data()! : {};
  const studentGroup = studentData.group || studentData.studentGroup || user.group || "ALL";
  const studentPhone = studentData.studentPhone || studentData.phone || user.email?.split("@")[0] || "";

  // 2. Fetch all attendance sessions, ordered chronologically
  const sessionsSnap = await db.collection("attendance_sessions").get();
  const allSessions = sessionsSnap.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as any)
  }));

  // Sort chronologically by date
  allSessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Filter eligible sessions for this student
  // A session is eligible if it is for ALL groups or matches the student's specific group
  const eligibleSessions = allSessions.filter(s => {
    const sessionGroup = s.group || "ALL";
    if (sessionGroup === "ALL" || studentGroup === "ALL") return true;
    return sessionGroup === studentGroup;
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  let presentCount = 0;
  let absentCount = 0;
  const sessionHistory = [];

  // 4. Resolve student's record for each eligible session
  for (const session of eligibleSessions) {
    let isPresent = false;
    let hasRecord = false;
    let markedAt: any = null;

    // Check subcollection by Auth UID
    const recordDoc = await db
      .collection("attendance_sessions")
      .doc(session.id)
      .collection("records")
      .doc(studentUid)
      .get();

    if (recordDoc.exists) {
      hasRecord = true;
      const rData = recordDoc.data()!;
      isPresent = Boolean(rData.present || rData.status === "present");
      markedAt = rData.markedAt;
    } else if (studentPhone) {
      // Check legacy subcollection by studentPhone fallback
      const phoneDoc = await db
        .collection("attendance_sessions")
        .doc(session.id)
        .collection("records")
        .doc(studentPhone)
        .get();

      if (phoneDoc.exists) {
        hasRecord = true;
        const rData = phoneDoc.data()!;
        isPresent = Boolean(rData.present || rData.status === "present");
        markedAt = rData.markedAt;
      }
    }

    // Check legacy embedded records array in session document if subcollection record was missing
    if (!hasRecord && Array.isArray(session.records) && session.records.length > 0) {
      const legacyRec = session.records.find((r: any) =>
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

    let status: "present" | "absent" | "upcoming" = "absent";
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
      markedAt: markedAt ? (markedAt.toDate ? markedAt.toDate().toISOString() : markedAt) : null
    });
  }

  // 5. Calculate statistics from eligible past/held sessions
  const pastSessions = sessionHistory.filter(s => s.status !== "upcoming");
  const totalSessions = pastSessions.length;

  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
  const requiredRate = 75; // Official platform benchmark

  let commitmentStatus: "excellent" | "warning" | "danger" = "excellent";
  let statusMessage = "معدل حضورك ممتاز ومستقر فوق الحد المطلوب ✅";

  if (attendanceRate >= 85) {
    commitmentStatus = "excellent";
    statusMessage = "معدل حضورك ممتاز ومستقر فوق الحد المطلوب ✅";
  } else if (attendanceRate >= 75) {
    commitmentStatus = "warning";
    statusMessage = "معدل حضورك قريب من الحد الأدنى، احرص على عدم الغياب ⚠️";
  } else {
    commitmentStatus = "danger";
    statusMessage = "معدل حضورك أقل من الحد الأدنى المطلوب (75%)، يرجى تعويض المحاضرات 🔴";
  }

  // 6. Calculate Streak (consecutive attended sessions counting backwards from most recent past session)
  let currentStreak = 0;
  for (let i = pastSessions.length - 1; i >= 0; i--) {
    if (pastSessions[i].status === "present") {
      currentStreak++;
    } else {
      break;
    }
  }

  // 7. Gamification & Ranking Achievements Check
  const gamDocRef = db.collection("student_gamification").doc(studentUid);
  const gamSnap = await gamDocRef.get();
  if (gamSnap.exists) {
    const gamData = gamSnap.data() as StudentGamificationProfile;
    const newAchievements = evaluateRankingAchievements(gamData, undefined, {
      presentCount,
      currentStreak,
      attendanceRate,
      totalSessions
    });

    if (newAchievements.length > 0) {
      const updatedList = Array.from(new Set([...(gamData.achievements || []), ...newAchievements.map(a => a.id)]));
      await gamDocRef.update({
        achievements: updatedList,
        updatedAt: new Date().toISOString()
      });

      for (const ach of newAchievements) {
        createNotification({
          recipientUid: studentUid,
          type: "achievement_unlocked",
          title: `🏆 إنجاز حضور جديد: ${ach.title}`,
          message: `تهانينا! حصلت على إنجاز "${ach.title}" لمواظبتك الأكاديمية المميزة.`,
          actionType: "ranking",
          actionId: "global"
        }).catch(err => console.warn("Attendance achievement notify warning:", err));
      }
    }
  }

  // 8. Low Attendance Warning Notification (Threshold Alert)
  if (totalSessions >= 3 && attendanceRate < 75) {
    createNotification({
      recipientUid: studentUid,
      type: "rank_down",
      title: "⚠️ تنبيه نسبة الحضور الأكاديمي",
      message: `تنبيه: نسبة حضورك الحالية هي ${attendanceRate}% وهي أقل من الحد المطلوب (75%). احرص على حضور المحاضرات القادمة لتجنب الحرمان.`,
      actionType: "ranking",
      actionId: "global"
    }).catch(err => console.warn("Low attendance notify warning:", err));
  }

  return {
    totalSessions,
    presentCount,
    absentCount,
    attendanceRate,
    requiredRate,
    status: commitmentStatus,
    statusMessage,
    currentStreak,
    studentGroup,
    sessions: sessionHistory.reverse() // Most recent first for history display
  };
}
