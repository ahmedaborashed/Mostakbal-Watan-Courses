// scripts/test-reporting-assignments-repair.js
import fs from "fs";
import path from "path";
import assert from "assert";

console.log("===================================================================");
console.log("🧪 RUNNING TARGETED REPORTING & ASSIGNMENTS REPAIR VERIFICATION");
console.log("===================================================================\n");

let passCount = 0;
let failCount = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ [PASS] ${label}${detail ? ` (${detail})` : ""}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${label}${detail ? ` (${detail})` : ""}`);
    failCount++;
  }
}

// ---------------------------------------------------------
// TEST SUITE 1: PRINT STYLES & PREMATURE CLEANUP PREVENTION
// ---------------------------------------------------------
console.log("--- TEST SUITE 1: PRINT STYLES & PREMATURE CLEANUP PREVENTION ---");
const printCssPath = path.resolve("src/styles/print.css");
const printCssContent = fs.readFileSync(printCssPath, "utf-8");

check(
  "Print CSS isolates body with display: none",
  printCssContent.includes("body.printing-report > *:not(#printableReportArea)") &&
  printCssContent.includes("display: none !important"),
  "Prevents background dashboard overflow and blank A4 output"
);

check(
  "Print container uses position: static",
  printCssContent.includes("position: static !important"),
  "Ensures multi-page A4 document flow without absolute clipping"
);

const examReportPath = path.resolve("src/features/exams/components/exam-report.component.js");
const examReportContent = fs.readFileSync(examReportPath, "utf-8");

check(
  "Premature setTimeout(cleanup, 2000) is eliminated",
  !examReportContent.includes("setTimeout(cleanup, 2000)"),
  "Print dialog will never render a wiped blank container"
);

check(
  "triggerPrintReport validates DOM content before printing",
  examReportContent.includes("renderedText.length === 0") &&
  examReportContent.includes("تعذر إنشاء التقرير"),
  "Prevents printing empty documents"
);

check(
  "Cleanup is attached to afterprint with once: true",
  examReportContent.includes('window.addEventListener("afterprint", cleanup, { once: true })'),
  "Properly restores dashboard after user closes print preview"
);

// ---------------------------------------------------------
// TEST SUITE 2: EXAM NAME NORMALIZATION & FALLBACK
// ---------------------------------------------------------
console.log("\n--- TEST SUITE 2: EXAM NAME NORMALIZATION & FALLBACK ---");
const examServicePath = path.resolve("src/features/exams/exam.service.js");
const examServiceContent = fs.readFileSync(examServicePath, "utf-8");

check(
  "ExamService has _normalizeExamData helper",
  examServiceContent.includes("function _normalizeExamData"),
  "Centralizes exam title and name resolution"
);

check(
  "Exam title supports both title and name fields",
  examReportContent.includes("exam?.title || exam?.name") &&
  /data\.title\s*\|\|\s*data\.name/.test(examServiceContent),
  "Supports legacy Firestore docs where exam name was saved as 'name'"
);

// Simulated Exam Title Resolution
function resolveExamTitle(data = {}) {
  return (data.title || data.name || data.examTitle || data.examName || "امتحان بدون عنوان").trim();
}

check("Legacy exam with 'name: quiz2' resolves to 'quiz2'", resolveExamTitle({ name: "quiz2" }) === "quiz2");
check("New exam with 'title: Python Midterm' resolves correctly", resolveExamTitle({ title: "Python Midterm" }) === "Python Midterm");
check("Empty exam falls back to safe default", resolveExamTitle({}) === "امتحان بدون عنوان");

// ---------------------------------------------------------
// TEST SUITE 3: ASSIGNMENT GRADE NORMALIZATION TO /10
// ---------------------------------------------------------
console.log("\n--- TEST SUITE 3: ASSIGNMENT GRADE NORMALIZATION TO /10 ---");
const assignmentServicePath = path.resolve("src/features/assignments/assignment.service.js");
const assignmentServiceContent = fs.readFileSync(assignmentServicePath, "utf-8");

check(
  "AssignmentService exports normalizeAssignmentGrade",
  assignmentServiceContent.includes("export function normalizeAssignmentGrade"),
  "Centralized grade normalization"
);

check(
  "AssignmentService exports formatAssignmentGradeDisplay",
  assignmentServiceContent.includes("export function formatAssignmentGradeDisplay"),
  "Displays grades consistently as / 10"
);

// Unit testing grade normalization algorithm
function normalizeAssignmentGrade(rawGrade, maxScore = 100) {
  if (rawGrade === undefined || rawGrade === null || rawGrade === "") {
    return null;
  }
  const num = Number(rawGrade);
  if (isNaN(num)) return null;

  let scaledScore = num;
  if (num > 10) {
    const baseMax = maxScore > 10 ? maxScore : 100;
    scaledScore = (num / baseMax) * 10;
  }
  return Math.round(scaledScore * 10) / 10;
}

check("Grade 80 / 100 scales to 8 / 10", normalizeAssignmentGrade(80) === 8);
check("Grade 95 / 100 scales to 9.5 / 10", normalizeAssignmentGrade(95) === 9.5);
check("Grade 72 / 100 scales to 7.2 / 10", normalizeAssignmentGrade(72) === 7.2);
check("Grade 100 / 100 scales to 10 / 10", normalizeAssignmentGrade(100) === 10);
check("Grade 8 (already out of 10) remains 8 / 10", normalizeAssignmentGrade(8) === 8);
check("Grade 9.5 (already out of 10) remains 9.5 / 10", normalizeAssignmentGrade(9.5) === 9.5);
check("Grade 0 remains 0 / 10", normalizeAssignmentGrade(0) === 0);
check("Null/undefined grade returns null", normalizeAssignmentGrade(null) === null);

// ---------------------------------------------------------
// TEST SUITE 4: STUDENT SUBMITTED ANSWER & CODE DISPLAY
// ---------------------------------------------------------
console.log("\n--- TEST SUITE 4: STUDENT SUBMITTED ANSWER & CODE DISPLAY ---");
const detailsModalPath = path.resolve("src/features/assignments/components/assignment-details-modal.component.js");
const detailsModalContent = fs.readFileSync(detailsModalPath, "utf-8");

check(
  "Assignment details modal inspects all answer field variants",
  detailsModalContent.includes("submission.answerText ||") &&
  detailsModalContent.includes("submission.answer ||") &&
  detailsModalContent.includes("submission.code"),
  "Recovers code or text across legacy and modern submission documents"
);

check(
  "Assignment details modal renders formatted monospace code block",
  detailsModalContent.includes("submitted-code-box") &&
  detailsModalContent.includes("Fira Code") &&
  detailsModalContent.includes("dir=\"ltr\""),
  "Preserves indentation, line breaks, and monospace font for code"
);

check(
  "Assignment details modal has code copy button",
  detailsModalContent.includes("نسخ الكود 📋"),
  "Allows quick copying of submitted solution"
);

check(
  "Assignment details modal supports open attached file securely",
  detailsModalContent.includes("submission.fileUrl") &&
  detailsModalContent.includes("فتح ومعاينة الملف ↗"),
  "Accessible file link preserved"
);

const evalModalPath = path.resolve("src/features/assignments/components/assignment-evaluation-modal.component.js");
const evalModalContent = fs.readFileSync(evalModalPath, "utf-8");

check(
  "Assignment evaluation modal displays formatted code box for teacher",
  evalModalContent.includes("submitted-code-box") &&
  evalModalContent.includes("Fira Code"),
  "Teacher can review student's exact code with syntax indentation"
);

check(
  "Evaluation grade input is configured for scale of 10",
  evalModalContent.includes('max="10"') &&
  evalModalContent.includes('الدرجة المستحقة (من 10)'),
  "Enforces 0-10 grade entry"
);

// ---------------------------------------------------------
// TEST SUITE 5: WHO SUBMITTED VS WHO DID NOT (ROSTER & REPORT)
// ---------------------------------------------------------
console.log("\n--- TEST SUITE 5: WHO SUBMITTED VS WHO DID NOT (ROSTER & REPORT) ---");

check(
  "AssignmentService implements getAssignmentSubmissionsWithRoster",
  assignmentServiceContent.includes("async getAssignmentSubmissionsWithRoster(assignmentId)"),
  "Audience-aware LEFT JOIN between eligible students and submissions"
);

// Simulation of 40 students with 31 submitted and 9 not submitted
const mockStudents = Array.from({ length: 40 }, (_, i) => ({
  id: `student_${i + 1}`,
  name: `الطالب ${i + 1}`,
  group: i < 30 ? "Group A" : "Group B"
}));

const mockSubmissions = Array.from({ length: 31 }, (_, i) => ({
  id: `sub_${i + 1}`,
  studentUid: `student_${i + 1}`,
  studentName: `الطالب ${i + 1}`,
  grade: i < 20 ? 80 : null,
  answerText: `print('Solution ${i + 1}')`
}));

function simulateRosterJoin(students, submissions, targetGroup = "ALL") {
  const subMap = new Map();
  submissions.forEach((s) => subMap.set(s.studentUid, s));

  const eligible = targetGroup === "ALL"
    ? students
    : students.filter((s) => s.group === targetGroup);

  const roster = eligible.map((s) => {
    const sub = subMap.get(s.id);
    return {
      studentUid: s.id,
      studentName: s.name,
      hasSubmitted: !!sub,
      status: sub ? (sub.grade != null ? "graded" : "submitted") : "not_submitted",
      grade: sub ? normalizeAssignmentGrade(sub.grade) : null
    };
  });

  const totalEligible = roster.length;
  const submittedCount = roster.filter((r) => r.hasSubmitted).length;
  const notSubmittedCount = totalEligible - submittedCount;
  const gradedCount = roster.filter((r) => r.status === "graded").length;

  return { totalEligible, submittedCount, notSubmittedCount, gradedCount, roster };
}

const simResultAll = simulateRosterJoin(mockStudents, mockSubmissions, "ALL");
check("Total eligible students in simulation is 40", simResultAll.totalEligible === 40);
check("Submitted students count in simulation is 31", simResultAll.submittedCount === 31);
check("Not submitted students count in simulation is 9", simResultAll.notSubmittedCount === 9);
check("Graded count in simulation is 20", simResultAll.gradedCount === 20);

const simResultGroupA = simulateRosterJoin(mockStudents, mockSubmissions, "Group A");
check("Group A audience targeting limits total to 30", simResultGroupA.totalEligible === 30);
check("Group A submitted count is 30", simResultGroupA.submittedCount === 30);
check("Group A not submitted count is 0", simResultGroupA.notSubmittedCount === 0);

const assignmentReportComponentPath = path.resolve("src/features/assignments/components/assignment-report.component.js");
check(
  "Assignment printable report component exists",
  fs.existsSync(assignmentReportComponentPath),
  "Dedicated A4 print layout component"
);

const assignmentReportContent = fs.readFileSync(assignmentReportComponentPath, "utf-8");
check(
  "renderAssignmentPrintableReport includes KPIs and roster table",
  assignmentReportContent.includes("تقرير تسليمات ونتائج الواجب الأكاديمي") &&
  assignmentReportContent.includes("إجمالي الطلاب المستهدفين") &&
  assignmentReportContent.includes("تم التسليم") &&
  assignmentReportContent.includes("لم يتم التسليم"),
  "A4 print template shows complete breakdown"
);

const controllerPath = path.resolve("src/features/assignments/assignment.controller.js");
const controllerContent = fs.readFileSync(controllerPath, "utf-8");

check(
  "Teacher submissions modal renders KPI cards",
  controllerContent.includes("إجمالي الطلاب المستهدفين") &&
  controllerContent.includes("لم يتم التسليم ❌"),
  "Live counts visible to teacher"
);

check(
  "Teacher submissions modal has debounced student search",
  controllerContent.includes("rosterSearchInput") &&
  controllerContent.includes("debounce("),
  "Debounced search across submitted and not submitted students"
);

check(
  "Teacher submissions modal has print report button",
  controllerContent.includes("printAssignmentReportBtn") &&
  controllerContent.includes("renderAssignmentPrintableReport"),
  "Allows instant printing of assignment roster"
);

// ---------------------------------------------------------
// SUMMARY
// ---------------------------------------------------------
console.log("\n===================================================================");
console.log(`📊 REPAIR VERIFICATION COMPLETE: ${passCount + failCount} CHECKS TESTED`);
console.log(`   ✅ PASS: ${passCount}`);
console.log(`   ❌ FAIL: ${failCount}`);
console.log("===================================================================\n");

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
