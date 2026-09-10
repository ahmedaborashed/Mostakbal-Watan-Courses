/**
 * scripts/migrate-attendance.js
 * 
 * Safe, idempotent migration script to transform legacy embedded `records` arrays
 * in `attendance_sessions` into subcollections `attendance_sessions/{id}/records/{studentUid}`.
 * 
 * Run with: node scripts/migrate-attendance.js
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function run() {
  console.log("🚀 Starting Attendance Sessions Migration...");
  
  const sessionsSnap = await db.collection("attendance_sessions").get();
  console.log(`Found ${sessionsSnap.size} attendance sessions.`);

  let totalSessionsProcessed = 0;
  let totalRecordsCreated = 0;

  for (const doc of sessionsSnap.docs) {
    const data = doc.data();
    const records = Array.isArray(data.records) ? data.records : [];

    if (!records.length) {
      console.log(`Session ${doc.id} (${data.name || "Unnamed"}) has 0 embedded records, skipping.`);
      continue;
    }

    console.log(`Migrating session ${doc.id} [${data.name || "Unnamed"}] - ${records.length} records...`);

    const BATCH_SIZE = 400;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const chunk = records.slice(i, i + BATCH_SIZE);
      const batch = db.batch();

      for (const rec of chunk) {
        const studentId = rec.studentId || rec.uid || rec.id || rec.studentPhone;
        if (!studentId) continue;

        const subdocRef = db
          .collection("attendance_sessions")
          .doc(doc.id)
          .collection("records")
          .doc(String(studentId));

        batch.set(subdocRef, {
          studentUid: String(studentId),
          studentName: rec.studentName || rec.name || "",
          studentPhone: rec.studentPhone || rec.phone || "",
          group: rec.group || "ALL",
          present: Boolean(rec.present),
          migratedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        totalRecordsCreated++;
      }

      await batch.commit();
    }

    totalSessionsProcessed++;
    console.log(`✅ Session ${doc.id} migrated successfully.`);
  }

  console.log(`🎉 Migration Completed! Processed ${totalSessionsProcessed} sessions, created ${totalRecordsCreated} subcollection records.`);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
