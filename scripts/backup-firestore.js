/**
 * scripts/backup-firestore.js
 * 
 * Exports all main Firestore collections into local JSON files in scripts/backup/
 * Run with: node scripts/backup-firestore.js
 */

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const COLLECTIONS = [
  "students",
  "videos",
  "video_logs",
  "exams",
  "results",
  "assignments",
  "submissions",
  "attendance_sessions"
];

async function run() {
  const backupDir = path.join(__dirname, "backup", new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(backupDir, { recursive: true });

  console.log(`📁 Exporting Firestore data to: ${backupDir}`);

  for (const colName of COLLECTIONS) {
    console.log(`Exporting collection: ${colName}...`);
    const snap = await db.collection(colName).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const filePath = path.join(backupDir, `${colName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(docs, null, 2), "utf8");
    console.log(`✅ Saved ${docs.length} documents to ${colName}.json`);
  }

  console.log("🎉 Backup finished successfully!");
}

run().catch(err => {
  console.error("Backup failed:", err);
  process.exit(1);
});
