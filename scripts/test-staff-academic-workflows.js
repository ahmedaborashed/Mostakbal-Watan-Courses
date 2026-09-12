// scripts/test-staff-academic-workflows.js
import assert from "node:assert/strict";

console.log("🧪 Starting Comprehensive Staff Academic System Test Suite...\n");

// ==========================================
// 1. LESSONS ENGAGEMENT & TRACKING
// ==========================================
console.log("1. Testing Lessons Staff Engagement Component...");
import {
  renderLessonDetailsContent,
  renderEngagementContent
} from "../src/features/lectures/components/lesson-details-modal.component.js";

const mockEngagementData = {
  totalCount: 40,
  watchedCount: 31,
  unwatchedCount: 9,
  watchPercentage: 78,
  watchedList: [
    { studentUid: "s1", studentName: "أحمد علي", studentPhone: "01011111111", watched: true, progress: 100, lastOpenedAt: "2026-09-10T10:00:00Z" },
    { studentUid: "s2", studentName: "سارة محمد", studentPhone: "01022222222", watched: true, progress: 85, lastOpenedAt: "2026-09-11T12:00:00Z" }
  ],
  unwatchedList: [
    { studentUid: "s3", studentName: "خالد إبراهيم", studentPhone: "01033333333", watched: false }
  ]
};

const engagementHtml = renderEngagementContent({ engagement: mockEngagementData, activeTab: "watched" });
assert.ok(engagementHtml.includes("31"), "Must display watched count (31)");
assert.ok(engagementHtml.includes("9"), "Must display unwatched count (9)");
assert.ok(engagementHtml.includes("40"), "Must display total students count (40)");
assert.ok(engagementHtml.includes("78%"), "Must display watched percentage (78%)");
assert.ok(engagementHtml.includes("أحمد علي"), "Must list watched student name in watched tab");
assert.ok(engagementHtml.includes('id="lessonEngagementSearchInput"'), "Must include student name search input");
assert.ok(engagementHtml.includes('data-engagement-tab="watched"'), "Must include watched tab button");
assert.ok(engagementHtml.includes('data-engagement-tab="unwatched"'), "Must include unwatched tab button");

const unwatchedTabHtml = renderEngagementContent({ engagement: mockEngagementData, activeTab: "unwatched" });
assert.ok(unwatchedTabHtml.includes("خالد إبراهيم"), "Must list unwatched student name in unwatched tab");

console.log("  ✓ Lessons engagement stats, lists, search, and tabs verified!");

// ==========================================
// 2. EXAM RESULTS, ESSAY GRADING & PRINT REPORTS
// ==========================================
console.log("\n2. Testing Exam Results, Essay Grading & Printable Reports...");
import {
  renderExamEssayGradingModal,
  renderEssayGradingContent
} from "../src/features/exams/components/exam-essay-grading-modal.component.js";
import {
  renderSingleExamPrintableReport,
  renderAllExamsSummaryPrintableReport
} from "../src/features/exams/components/exam-report.component.js";

// Test Essay Grading Modal Shell & Content
const essayModalShellHtml = renderExamEssayGradingModal();
assert.ok(essayModalShellHtml.includes("تصحيح السؤال المقالي"), "Modal header should match");
assert.ok(essayModalShellHtml.includes('id="submitEssayGradeBtn"'), "Must include submit grade button");

const essayContentHtml = renderEssayGradingContent({
  exam: { title: "امتحان منتصف الفصل - بايثون" },
  result: { studentName: "محمود حسن", studentPhone: "01099999999" },
  questionIndex: 0,
  question: { question: "اشرح الفرق بين القائمة (List) والصف (Tuple) في بايثون مع ذكر مثال.", degree: 10 },
  studentAnswer: "القائمة قابلة للتعديل mutable بينما الصف غير قابل للتعديل immutable.",
  currentScore: 8
});

assert.ok(essayContentHtml.includes("محمود حسن"), "Must display student name");
assert.ok(essayContentHtml.includes("القائمة قابلة للتعديل mutable"), "Must display student written answer");
assert.ok(essayContentHtml.includes('id="essayGradeInput"'), "Must include score input field");
console.log("  ✓ Essay grading modal shell & content verified!");

// Test Single Exam Report
const mockExam = { id: "ex1", title: "اختبار الدوال البرمجية (Functions)", totalScore: 20 };
const mockResults = [
  { studentUid: "s1", studentName: "أحمد علي", studentGroup: "A1", score: 18, totalScore: 20, percentage: 90, status: "completed" },
  { studentUid: "s2", studentName: "سارة محمد", studentGroup: "A1", score: 14, totalScore: 20, percentage: 70, status: "completed" },
  { studentUid: "s3", studentName: "خالد إبراهيم", studentGroup: "A2", score: 0, totalScore: 20, percentage: 0, status: "pending_essay" }
];

const singleReportHtml = renderSingleExamPrintableReport({ exam: mockExam, results: mockResults });
assert.ok(singleReportHtml.includes("اختبار الدوال البرمجية"), "Report header contains exam title");
assert.ok(singleReportHtml.includes("أحمد علي") && singleReportHtml.includes("90%"), "Report contains student record");
assert.ok(singleReportHtml.includes("قيد تصحيح المقالي"), "Report handles pending essay grading");
assert.ok(singleReportHtml.includes("3"), "Report contains KPI totals");
console.log("  ✓ Single exam printable report generated and validated!");

// Test All Exams Summary Report Matrix
const mockExamsList = [
  { id: "ex1", title: "امتحان 1" },
  { id: "ex2", title: "امتحان 2" }
];
const mockMatrixRows = [
  {
    studentUid: "s1",
    studentName: "أحمد علي",
    group: "A1",
    completedExamsCount: 2,
    averagePercentage: 95,
    examsMap: {
      ex1: { score: 18, total: 20, percentage: 90 },
      ex2: { score: 20, total: 20, percentage: 100 }
    }
  }
];

const matrixReportHtml = renderAllExamsSummaryPrintableReport({ exams: mockExamsList, matrix: mockMatrixRows });
assert.ok(matrixReportHtml.includes("تقرير الأداء العام لجميع الامتحانات"), "Matrix report title verified");
assert.ok(matrixReportHtml.includes("امتحان 1") && matrixReportHtml.includes("امتحان 2"), "Matrix column headers verified");
assert.ok(matrixReportHtml.includes("95%"), "Overall student percentage verified");
console.log("  ✓ Cross-exams summary printable report matrix validated!");

// ==========================================
// 3. ASSIGNMENT EVALUATION MODAL
// ==========================================
console.log("\n3. Testing Assignment Dedicated Evaluation Modal...");
import {
  renderAssignmentEvaluationModal,
  renderAssignmentEvaluationContent
} from "../src/features/assignments/components/assignment-evaluation-modal.component.js";

// Test Modal Shell
const evalModalShellHtml = renderAssignmentEvaluationModal();
assert.ok(evalModalShellHtml.includes("تقييم تسليم الطالب"), "Modal shell title verified");
assert.ok(evalModalShellHtml.includes('id="submitAssignmentGradeBtn"'), "Submit grade button exists");

// Test Modal Inner Content
const evalContentHtml = renderAssignmentEvaluationContent({
  taskTitle: "تاسك كتابة الدوال في بايثون",
  submission: {
    studentName: "مريم أحمد",
    studentPhone: "01088888888",
    submittedAt: "2026-09-08T14:30:00Z",
    answerText: "قمت بكتابة الكود واختبار الحالات الشاذة المذكورة.",
    fileUrl: "https://example.com/solution.py",
    grade: 95,
    feedback: "عمل ممتاز وحلول نظيفة!"
  }
});

assert.ok(evalContentHtml.includes("مريم أحمد"), "Student name displayed");
assert.ok(evalContentHtml.includes("قمت بكتابة الكود واختبار الحالات"), "Student solution notes displayed");
assert.ok(evalContentHtml.includes("الملف المرفق من الطالب"), "File attachment preview label displayed");
assert.ok(evalContentHtml.includes('id="evalGradeInput"'), "Grade input exists");
assert.ok(evalContentHtml.includes('value="95"'), "Pre-filled current grade exists");
assert.ok(evalContentHtml.includes("عمل ممتاز وحلول نظيفة!"), "Pre-filled feedback exists");
console.log("  ✓ Assignment evaluation modal shell & content verified!");

// ==========================================
// 4. STUDENT AFFAIRS & HIGH ABSENCE WARNING (>=4 ABSENCES)
// ==========================================
console.log("\n4. Testing Student Affairs High Absence Warning & Student 360...");
import { renderStudentListView } from "../src/features/students/components/student-list.component.js";
import { renderStudent360Content } from "../src/features/students/components/student-detail.component.js";

const mockStudents = [
  { id: "u1", name: "علي حسن", phone: "01000000001", group: "مجموعة 1", active: true },
  { id: "u2", name: "خالد أحمد", phone: "01000000002", group: "مجموعة 1", active: true }, // will have 4 absences
  { id: "u3", name: "منار محمود", phone: "01000000003", group: "مجموعة 2", active: true } // will have 1 absence
];

const mockAbsencesMap = {
  u1: 2, // Safe (2 absences)
  u2: 4, // Critical High Absence (4 absences >= 4)
  u3: 1  // Safe (1 absence)
};

const studentListHtml = renderStudentListView({
  students: mockStudents,
  canDelete: true,
  absencesMap: mockAbsencesMap
});

// Rule 30: When student has 4 or more absences -> highlight in RED: 🔴 4 غيابات
assert.ok(studentListHtml.includes("4 غيابات (إنذار غياب مرتفع)"), "Student with 4 absences must have high-absence warning");
assert.ok(studentListHtml.includes("🔴"), "Warning icon must be present");
assert.ok(studentListHtml.includes("var(--color-danger)"), "High absence student name must be highlighted in RED");
console.log("  ✓ High absence rule (>=4 in RED with warning badge) verified!");

// Test Student 360° Profile
const mock360Data = {
  student: {
    id: "u2",
    name: "خالد أحمد",
    phone: "01000000002",
    nationalId: "29901011234567",
    group: "مجموعة 1",
    active: true,
    createdAt: "2026-08-01T00:00:00Z"
  },
  exams: [
    { examId: "ex1", examTitle: "اختبار المتغيرات", score: 19, totalScore: 20, percentage: 95, status: "completed", date: "2026-08-15" }
  ],
  assignments: [
    { assignmentId: "as1", assignmentTitle: "تاسك 1", grade: 90, status: "graded", submittedAt: "2026-08-20", teacherFeedback: "ممتاز" }
  ],
  attendance: {
    totalSessions: 10,
    presentCount: 6,
    absentCount: 4,
    attendanceRate: 60,
    attendedSessions: [
      { id: "sess1", title: "المحاضرة 1", date: "2026-08-05" }
    ],
    absentSessions: [
      { id: "sess2", title: "المحاضرة 2", date: "2026-08-12" },
      { id: "sess3", title: "المحاضرة 3", date: "2026-08-19" },
      { id: "sess4", title: "المحاضرة 4", date: "2026-08-26" },
      { id: "sess5", title: "المحاضرة 5", date: "2026-09-02" }
    ]
  },
  gamification: {
    level: 7,
    xp: 1450,
    competitionPoints: 320,
    completedChallengesCount: 14,
    streak: 3,
    achievements: ["first_code", "exam_ace"]
  }
};

const student360Html = renderStudent360Content(mock360Data);
assert.ok(student360Html.includes("خالد أحمد"), "360 profile contains student name");
assert.ok(student360Html.includes("29901011234567"), "360 profile contains national ID");
assert.ok(student360Html.includes("اختبار المتغيرات"), "360 profile contains exam details");
assert.ok(student360Html.includes("تاسك 1") && student360Html.includes("90"), "360 profile contains assignment details");
assert.ok(student360Html.includes("60%"), "360 profile contains attendance rate");
assert.ok(student360Html.includes("المحاضرة 1"), "360 profile lists attended sessions");
assert.ok(student360Html.includes("المحاضرة 2"), "360 profile lists absent sessions");
assert.ok(student360Html.includes("Lv. 7"), "360 profile displays Python Adventure Level");
assert.ok(student360Html.includes("1450"), "360 profile displays XP");
assert.ok(student360Html.includes("320"), "360 profile displays Competition Points");
console.log("  ✓ Student 360° Profile 5-dimension dossier verified!");

// ==========================================
// 5. ATTENDANCE: SESSION SELECTOR & DEFAULT ABSENT
// ==========================================
console.log("\n5. Testing Attendance Session Selector & Default Absent Rule...");
import { renderAttendanceManagementView } from "../src/features/attendance/components/attendance-sheet.component.js";

const mockExistingSessions = [
  { id: "sess-old-1", title: "المحاضرة الأولى - مقدمة بايثون", sessionDate: "2026-08-01", group: "Group A" },
  { id: "sess-old-2", title: "المحاضرة الثانية - الشروط والتكرار", sessionDate: "2026-08-08", group: "Group A" }
];

// Test 5A: New Session (selectedSessionId === "NEW") -> ALL students MUST default to ABSENT (unchecked)
const newSessionSheetHtml = renderAttendanceManagementView({
  students: mockStudents,
  sessions: mockExistingSessions,
  selectedSessionId: "NEW",
  selectedSession: null,
  sessionRecords: new Map()
});

assert.ok(newSessionSheetHtml.includes('id="sessionSelector"'), "Session selector combo box exists");
assert.ok(newSessionSheetHtml.includes('[ + جلسة جديدة ]'), "Option for new session exists in combo box");
assert.ok(newSessionSheetHtml.includes("المحاضرة الأولى"), "Old sessions exist in combo box");
assert.ok(newSessionSheetHtml.includes('id="saveAttendanceBatchBtn"'), "Save attendance button exists");

// CRITICAL RULE 37 TEST: Verify no checkboxes are pre-checked for new session
const checkedCountInNewSession = (newSessionSheetHtml.match(/class="attendance-check"[^>]*checked/g) || []).length;
assert.strictEqual(checkedCountInNewSession, 0, "CRITICAL RULE 37: All students in a NEW session MUST default to ABSENT (0 checked checkboxes)");
console.log("  ✓ CRITICAL RULE 37 VERIFIED: New session defaults 100% of students to ABSENT!");

// Test 5B: Selecting Old Session (selectedSessionId === "sess-old-1") loads real records
const oldSessionRecordsMap = new Map([
  ["u1", { studentUid: "u1", status: "present" }],
  ["u2", { studentUid: "u2", status: "absent" }],
  ["u3", { studentUid: "u3", status: "present" }]
]);

const oldSessionSheetHtml = renderAttendanceManagementView({
  students: mockStudents,
  sessions: mockExistingSessions,
  selectedSessionId: "sess-old-1",
  selectedSession: mockExistingSessions[0],
  sessionRecords: oldSessionRecordsMap
});

// Student u1 and u3 should be checked (present), u2 unchecked (absent)
assert.ok(/data-student-uid="u1"[^>]*checked/.test(oldSessionSheetHtml), "Student u1 should be checked (present)");
assert.ok(!/data-student-uid="u2"[^>]*checked/.test(oldSessionSheetHtml), "Student u2 should be unchecked (absent)");
assert.ok(/data-student-uid="u3"[^>]*checked/.test(oldSessionSheetHtml), "Student u3 should be checked (present)");
console.log("  ✓ Old session records loaded accurately into sheet without duplicate session creation!");

// ==========================================
// 6. NOTIFICATIONS SYSTEM
// ==========================================
console.log("\n6. Testing In-App Notifications Modal & Bell Widget...");
import {
  renderNotificationBellButton,
  renderNotificationsModal,
  renderNotificationsList
} from "../src/features/notifications/components/notifications-modal.component.js";

// Test Bell Button
const bellWithUnreadHtml = renderNotificationBellButton(5);
assert.ok(bellWithUnreadHtml.includes('id="openNotificationsModalBtn"'), "Bell button exists");
assert.ok(bellWithUnreadHtml.includes("5"), "Unread counter displays 5");

const bellZeroHtml = renderNotificationBellButton(0);
assert.ok(!bellZeroHtml.includes("notificationsUnreadBadge"), "Unread counter badge omitted when count is 0");
console.log("  ✓ Notification bell button and dynamic counter badge verified!");

// Test Notifications List with Deep Links
const mockNotifications = [
  {
    id: "n1",
    title: "امتحان جديد متاح",
    message: "تم فتح امتحان الدوال البرمجية لمجموعتك، يرجى التقديم قبل الموعد.",
    type: "exam_available",
    link: "exams",
    read: false,
    createdAt: "2026-09-12T01:00:00Z"
  },
  {
    id: "n2",
    title: "تم تقييم التاسك",
    message: "قام المعلم بتصحيح تاسك الدوال وإضافة ملاحظاتك.",
    type: "assignment_graded",
    link: "assignments",
    read: true,
    createdAt: "2026-09-11T18:00:00Z"
  }
];

const notifListHtml = renderNotificationsList(mockNotifications);
assert.ok(notifListHtml.includes("امتحان جديد متاح"), "List contains notification title");
assert.ok(notifListHtml.includes("data-notif-deep-link=\"exams\""), "List has deep link to exams");
assert.ok(notifListHtml.includes("data-notif-deep-link=\"assignments\""), "List has deep link to assignments");
assert.ok(notifListHtml.includes("data-notif-mark-read=\"n1\""), "Unread notification has mark as read trigger");
assert.ok(notifListHtml.includes("مقروء"), "Read notification has read badge");
console.log("  ✓ Notifications list, cards, deep links, and read toggles verified!");

console.log("\n=======================================================");
console.log("🎉 ALL STAFF ACADEMIC SYSTEM WORKFLOW TESTS PASSED 100%!");
console.log("=======================================================\n");
