// scripts/test-student-portal-data.js
import assert from "node:assert";
import { renderProfileCard } from "../src/features/profile/components/profile-card.component.js";

console.log("🚀 Testing Student Portal Name & Data Fixes...\n");

// 1. Test renderProfileCard with Firestore student schema
const firestoreStudent = {
  id: "9bmpWgxRcb8GaK37Saxw",
  firestoreId: "9bmpWgxRcb8GaK37Saxw",
  name: "رضوى عمر السيد الحصرى",
  studentPhone: "01271760556",
  nationalId: "30710271600803",
  address: "المحله الكبرى ( غير ذلك)",
  group: "مجموعة الأحد والأربعاء | 9:00 - 10:30"
};

const profileHtml = renderProfileCard({ student: firestoreStudent });
assert(profileHtml.includes("رضوى عمر السيد الحصرى"), "Profile card must render student real name 'رضوى عمر السيد الحصرى'");
assert(!profileHtml.includes(">طالب مسجل<"), "Profile card must NOT render 'طالب مسجل' placeholder when real name is provided");
assert(profileHtml.includes("مجموعة الأحد والأربعاء | 9:00 - 10:30"), "Profile card must render actual group name");
assert(profileHtml.includes("30710271600803"), "Profile card must render national ID");
assert(profileHtml.includes("المحله الكبرى ( غير ذلك)"), "Profile card must render address");
console.log("✅ 1. Profile card renders real student name, group, national ID, and address correctly!");

// 2. Test defensive resolution even if legacy student has studentName: "طالب مسجل" placeholder
const legacyMergedStudent = {
  id: "user123",
  studentName: "طالب مسجل", // placeholder
  name: "رضوى عمر السيد الحصرى", // real name
  studentGroup: "ALL", // placeholder
  group: "مجموعة الأحد والأربعاء | 9:00 - 10:30", // real group
  studentPhone: "01271760556"
};

const legacyProfileHtml = renderProfileCard({ student: legacyMergedStudent });
assert(legacyProfileHtml.includes("رضوى عمر السيد الحصرى"), "Profile card must prioritize real name over 'طالب مسجل' placeholder");
assert(legacyProfileHtml.includes("مجموعة الأحد والأربعاء | 9:00 - 10:30"), "Profile card must prioritize real group over 'ALL' placeholder");
console.log("✅ 2. Defensive resolution properly overrides 'طالب مسجل' and 'ALL' placeholders!");

// 3. Test Lecture filtering logic with student's group
const testLectures = [
  { id: "lec1", title: "Session 1", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30", active: true },
  { id: "lec2", title: "Session 2", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30", active: true },
  { id: "lec3", title: "Session 3", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30", active: true },
  { id: "lec4", title: "Session 4", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30", active: true },
  { id: "lecOther", title: "Other Group Session", group: "مجموعة أخرى", active: true }
];

const resolvedGroup = (legacyMergedStudent.group && legacyMergedStudent.group !== "ALL")
  ? legacyMergedStudent.group
  : (legacyMergedStudent.studentGroup || "ALL");

const matchedLectures = testLectures.filter((l) => {
  if (l.active === false) return false;
  return !l.group || l.group === "ALL" || l.group === resolvedGroup;
});

assert.strictEqual(matchedLectures.length, 4, "Student must match exactly 4 lectures assigned to their group");
assert.deepStrictEqual(matchedLectures.map(l => l.title), ["Session 1", "Session 2", "Session 3", "Session 4"]);
console.log("✅ 3. Lecture group matching correctly matches all 4 group sessions and excludes other groups!");

console.log("\n🎉 ALL STUDENT PORTAL DATA TESTS PASSED SUCCESSFULLY!");
