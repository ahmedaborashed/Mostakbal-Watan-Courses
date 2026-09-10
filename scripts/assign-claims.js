/**
 * scripts/assign-claims.js
 * 
 * Sets Custom User Claims on existing Firebase Auth accounts based on their email suffix.
 * Run with: node scripts/assign-claims.js
 */

const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

const auth = admin.auth();

async function run() {
  console.log("🚀 Starting Custom Claims Migration...");

  let nextPageToken;
  let updatedCount = 0;

  do {
    const listUsersResult = await auth.listUsers(1000, nextPageToken);
    
    for (const userRecord of listUsersResult.users) {
      const email = (userRecord.email || "").toLowerCase();
      let targetRole = null;

      if (email.endsWith("@admin.local")) {
        targetRole = "admin";
      } else if (email.endsWith("@system.local")) {
        targetRole = "teacher";
      } else if (email.endsWith("@student.local")) {
        targetRole = "student";
      }

      if (targetRole) {
        const currentClaims = userRecord.customClaims || {};
        if (currentClaims.role !== targetRole) {
          await auth.setCustomUserClaims(userRecord.uid, {
            ...currentClaims,
            role: targetRole
          });
          console.log(`Updated user ${userRecord.uid} (${email}) -> role: ${targetRole}`);
          updatedCount++;
        }
      }
    }

    nextPageToken = listUsersResult.pageToken;
  } while (nextPageToken);

  console.log(`🎉 Finished! Assigned custom claims to ${updatedCount} users.`);
}

run().catch(err => {
  console.error("Assign claims failed:", err);
  process.exit(1);
});
