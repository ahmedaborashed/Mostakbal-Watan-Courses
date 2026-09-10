import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { requireRole } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";

// 1. Create Session Schema
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

// 2. Batch Record Attendance Schema
const AttendanceRecordSchema = z.object({
  studentUid: z.string().min(1),
  studentName: z.string().optional().default(""),
  studentPhone: z.string().optional().default(""),
  group: z.string().optional().default("ALL"),
  present: z.boolean()
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

  // Firestore allows up to 500 operations in a single batch
  const BATCH_SIZE = 450;
  let presentCount = 0;
  let absentCount = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const chunk = records.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    chunk.forEach(rec => {
      if (rec.present) presentCount++;
      else absentCount++;

      const recordRef = sessionRef.collection("records").doc(rec.studentUid);
      batch.set(recordRef, {
        studentUid: rec.studentUid,
        studentName: rec.studentName,
        studentPhone: rec.studentPhone,
        group: rec.group,
        present: rec.present,
        markedAt: new Date()
      }, { merge: true });
    });

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
