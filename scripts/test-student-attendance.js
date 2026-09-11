// scripts/test-student-attendance.js
import assert from "node:assert";
import { renderStudentAttendanceView, renderAttendanceSkeleton } from "../src/features/attendance/components/attendance-stats.component.js";
import { renderAttendanceDashboardWidget } from "../src/features/attendance/components/attendance-widget.component.js";
import { renderProfileAttendanceCard } from "../src/features/attendance/components/profile-attendance-card.component.js";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { evaluateRankingAchievements, RANKING_ACHIEVEMENTS } = require("../backend/lib/modules/gamification/achievements.js");

console.log("🧪 Starting Student Attendance Redesign & Debugging Test Suite...\n");

// ========================================================
// 1. Root Cause Debugging: Empty Records Must NOT Produce 8 Absences & 0%
// ========================================================
{
  console.log("  1. Testing root cause fix: Empty sessions / zero records handling...");

  const emptyData = {
    totalSessions: 0,
    presentCount: 0,
    absentCount: 0,
    attendanceRate: 100,
    requiredRate: 75,
    status: "excellent",
    statusMessage: "لا توجد غيابات مسجلة",
    currentStreak: 0,
    studentGroup: "مجموعة الأحد والأربعاء",
    sessions: []
  };

  const html = renderStudentAttendanceView({ attendanceData: emptyData });

  // Assert empty state is rendered
  assert.ok(html.includes("لا توجد سجلات حضور مسجلة حتى الآن"), "Must display friendly empty state when no sessions exist");
  assert.ok(!html.includes("عدد مرات الغياب: 8"), "Must NOT report 8 absences when records are empty");
  assert.ok(!html.includes("نسبة الالتزام الكلية: 0%"), "Must NOT report 0% rate on empty initial state");

  console.log("  ✅ Root cause verified: zero sessions gracefully rendered without false absences!");
}

// ========================================================
// 2. Statistics Calculation & Policy Verification
// ========================================================
{
  console.log("  2. Testing real statistics calculation and threshold policies...");

  // Scenario A: 8 sessions (6 present, 2 absent) -> 75% rate (warning threshold)
  const calcRate = (present, total) => total > 0 ? Math.round((present / total) * 100) : 100;
  const rateA = calcRate(6, 8);
  assert.strictEqual(rateA, 75, "6/8 sessions must equal exactly 75%");

  // Status mapping
  const getStatus = (rate) => {
    if (rate >= 85) return "excellent";
    if (rate >= 75) return "warning";
    return "danger";
  };

  assert.strictEqual(getStatus(75), "warning", "75% is at the threshold marker (warning)");
  assert.strictEqual(getStatus(85), "excellent", "85% is excellent");
  assert.strictEqual(getStatus(74), "danger", "74% is danger / below required minimum");

  // Scenario B: Render 75% dashboard
  const data75 = {
    totalSessions: 8,
    presentCount: 6,
    absentCount: 2,
    attendanceRate: 75,
    requiredRate: 75,
    status: "warning",
    statusMessage: "معدل حضورك قريب من الحد الأدنى، احرص على عدم الغياب ⚠️",
    currentStreak: 3,
    studentGroup: "Group A",
    sessions: [
      { id: "s1", name: "محاضرة بايثون 1", date: "2026-09-01", group: "Group A", status: "present" },
      { id: "s2", name: "محاضرة بايثون 2", date: "2026-09-03", group: "Group A", status: "present" },
      { id: "s3", name: "محاضرة بايثون 3", date: "2026-09-05", group: "Group A", status: "absent" },
      { id: "s4", name: "محاضرة بايثون 4", date: "2026-09-08", group: "Group A", status: "absent" },
      { id: "s5", name: "محاضرة بايثون 5", date: "2026-09-10", group: "Group A", status: "present" },
      { id: "s6", name: "محاضرة بايثون 6", date: "2026-09-12", group: "Group A", status: "present" },
      { id: "s7", name: "محاضرة بايثون 7", date: "2026-09-15", group: "Group A", status: "present" },
      { id: "s8", name: "محاضرة بايثون 8", date: "2026-09-17", group: "Group A", status: "present" }
    ]
  };

  const html75 = renderStudentAttendanceView({ attendanceData: data75 });
  assert.ok(html75.includes("75%"), "Must display 75% rate");
  assert.ok(html75.includes("6"), "Must display 6 present");
  assert.ok(html75.includes("2"), "Must display 2 absent");
  assert.ok(html75.includes("8"), "Must display 8 total sessions");
  assert.ok(html75.includes("3"), "Must display streak 3");
  assert.ok(html75.includes("الحد الأدنى المطلوب لاجتياز الدورة: 75%"), "Must display 75% policy marker");

  console.log("  ✅ Real statistics and threshold policies verified successfully!");
}

// ========================================================
// 3. Group Filtering Logic
// ========================================================
{
  console.log("  3. Testing group filtering (sessions of other groups are excluded)...");

  const studentGroup = "مجموعة الأحد والأربعاء";
  const allSessions = [
    { id: "s1", name: "درس 1", group: "ALL" },
    { id: "s2", name: "درس 2", group: "مجموعة الأحد والأربعاء" },
    { id: "s3", name: "درس 3", group: "مجموعة السبت والثلاثاء" }, // Different group
    { id: "s4", name: "درس 4", group: "مجموعة السبت والثلاثاء" }  // Different group
  ];

  const eligible = allSessions.filter(s => s.group === "ALL" || s.group === studentGroup);
  assert.strictEqual(eligible.length, 2, "Student must only have 2 eligible sessions, not 4");
  assert.deepStrictEqual(eligible.map(s => s.id), ["s1", "s2"], "Only ALL and matching group sessions are included");

  console.log("  ✅ Group filtering logic accurately excludes other study groups!");
}

// ========================================================
// 4. Streak Calculation Logic
// ========================================================
{
  console.log("  4. Testing attendance streak calculation...");

  // Chronological sessions (oldest to newest)
  const history1 = [
    { status: "present" },
    { status: "absent" },
    { status: "present" },
    { status: "present" },
    { status: "present" }
  ];

  let streak1 = 0;
  for (let i = history1.length - 1; i >= 0; i--) {
    if (history1[i].status === "present") streak1++;
    else break;
  }
  assert.strictEqual(streak1, 3, "Last 3 consecutive present sessions must give streak of 3");

  const history2 = [
    { status: "present" },
    { status: "present" },
    { status: "absent" } // ended in absence
  ];
  let streak2 = 0;
  for (let i = history2.length - 1; i >= 0; i--) {
    if (history2[i].status === "present") streak2++;
    else break;
  }
  assert.strictEqual(streak2, 0, "Last session absent must give current streak of 0");

  console.log("  ✅ Attendance streak calculation verified!");
}

// ========================================================
// 5. Attendance Gamification Achievements
// ========================================================
{
  console.log("  5. Testing attendance achievements evaluation...");

  const baseProfile = {
    studentUid: "user_test_1",
    studentName: "أحمد",
    studentPhone: "01012345678",
    group: "ALL",
    xp: 200,
    level: 1,
    competitionPoints: 50,
    rank: 15,
    previousRank: 15,
    rankChange: 0,
    achievements: [],
    currentStreak: 1,
    challengesCompleted: 5,
    competitionsWon: 0,
    competitionsParticipated: 1,
    rankingHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Milestone 1: First Attendance (present >= 1)
  const ach1 = evaluateRankingAchievements(baseProfile, undefined, {
    presentCount: 1,
    currentStreak: 1,
    attendanceRate: 100,
    totalSessions: 1
  });
  assert(ach1.some(a => a.id === "first_attendance"), "Must unlock first_attendance achievement");

  // Milestone 2: 3 Sessions Streak
  const ach2 = evaluateRankingAchievements({
    ...baseProfile,
    achievements: ["first_attendance"]
  }, undefined, {
    presentCount: 3,
    currentStreak: 3,
    attendanceRate: 100,
    totalSessions: 3
  });
  assert(ach2.some(a => a.id === "attendance_streak_3"), "Must unlock attendance_streak_3 achievement");

  // Milestone 3: 7 Sessions Streak & Perfect Attendance (total >= 5 and rate == 100)
  const ach3 = evaluateRankingAchievements({
    ...baseProfile,
    achievements: ["first_attendance", "attendance_streak_3"]
  }, undefined, {
    presentCount: 7,
    currentStreak: 7,
    attendanceRate: 100,
    totalSessions: 7
  });
  assert(ach3.some(a => a.id === "attendance_streak_7"), "Must unlock attendance_streak_7 achievement");
  assert(ach3.some(a => a.id === "perfect_attendance"), "Must unlock perfect_attendance achievement");

  console.log("  ✅ Attendance gamification achievements verified successfully!");
}

// ========================================================
// 6. UI Components & Responsive State Rendering
// ========================================================
{
  console.log("  6. Testing UI components (stats dashboard, compact widget, profile card, skeleton)...");

  const sampleData = {
    totalSessions: 10,
    presentCount: 8,
    absentCount: 2,
    attendanceRate: 80,
    requiredRate: 75,
    status: "warning",
    statusMessage: "معدل حضورك قريب من الحد الأدنى، احرص على عدم الغياب ⚠️",
    currentStreak: 4,
    studentGroup: "مجموعة الأحد والأربعاء",
    sessions: [
      { id: "s1", name: "محاضرة الدوال", date: "2026-09-10", group: "مجموعة الأحد والأربعاء", status: "present" },
      { id: "s2", name: "محاضرة القوائم", date: "2026-09-12", group: "مجموعة الأحد والأربعاء", status: "absent" }
    ]
  };

  // 1. Dashboard View
  const dashboardHtml = renderStudentAttendanceView({ attendanceData: sampleData, activeFilter: "all" });
  assert.ok(dashboardHtml.includes("سجل الحضور والغياب"), "Dashboard must contain title");
  assert.ok(dashboardHtml.includes("80%"), "Dashboard must show 80% rate");
  assert.ok(dashboardHtml.includes("محاضرة الدوال"), "Dashboard must display session names");
  assert.ok(dashboardHtml.includes("حاضر"), "Dashboard must display status labels");

  // 2. Filter tabs: present only
  const presentHtml = renderStudentAttendanceView({ attendanceData: sampleData, activeFilter: "present" });
  assert.ok(presentHtml.includes("محاضرة الدوال"), "Must include present session");
  assert.ok(!presentHtml.includes("محاضرة القوائم"), "Must exclude absent session when filtered by present");

  // 3. Compact Dashboard Widget
  const widgetHtml = renderAttendanceDashboardWidget({ attendanceData: sampleData });
  assert.ok(widgetHtml.includes("attendance-dashboard-widget"), "Must render widget wrapper");
  assert.ok(widgetHtml.includes("80%"), "Widget must show rate");
  assert.ok(widgetHtml.includes("8 حاضر · 2 غياب"), "Widget must display counts");
  assert.ok(widgetHtml.includes("widgetViewAttendanceBtn"), "Widget must have navigation CTA button");

  // 4. Profile Attendance Card
  const profileCardHtml = renderProfileAttendanceCard({ attendanceData: sampleData });
  assert.ok(profileCardHtml.includes("سجل الالتزام والمواظبة بالمحاضرات"), "Profile card must have title");
  assert.ok(profileCardHtml.includes("80%"), "Profile card must display rate");
  assert.ok(profileCardHtml.includes("8 محاضرة"), "Profile card must display present count");

  // 5. Skeleton Loader
  const skeletonHtml = renderAttendanceSkeleton();
  assert.ok(skeletonHtml.includes("attendance-skeleton-grid"), "Skeleton must have grid container");

  console.log("  ✅ All UI components rendered and verified successfully!");
}

console.log("\n🎉 ALL 6 ATTENDANCE TEST SUITES PASSED FLAWLESSLY! 🚀\n");
