// scripts/test-student-exams.js
import assert from "node:assert";
import { getExamStatusInfo, renderExamStatusBadge } from "../src/features/exams/components/exam-status-badge.component.js";
import { renderExamQuestionNavigator } from "../src/features/exams/components/exam-question-navigator.component.js";
import { renderExamProgress } from "../src/features/exams/components/exam-progress.component.js";
import { renderExamSubmitDialog, EXAM_SUBMIT_MODAL_ID } from "../src/features/exams/components/exam-submit-dialog.component.js";
import { renderExamQuestion } from "../src/features/exams/components/exam-question.component.js";
import { renderExamResult } from "../src/features/exams/components/exam-result.component.js";
import { renderStudentExamCard } from "../src/features/exams/components/exam-card.component.js";
import { renderStudentExamDetailsContent } from "../src/features/exams/components/exam-details.component.js";
import { renderExamTimer } from "../src/features/exams/components/exam-timer.component.js";

console.log("🧪 Starting Student Exams Unit Tests...");

// 1. Test Exam Status Badge Resolution
{
  console.log("  Testing status badge calculations...");
  const availableExam = { id: "1", title: "Python Basics", active: true, duration: 30 };
  const statusAvail = getExamStatusInfo(availableExam);
  assert.strictEqual(statusAvail.status, "available", "Should resolve to 'available'");
  assert.strictEqual(statusAvail.label, "متاح");

  const submittedExam = { id: "2", title: "Python Advanced", attemptStatus: "submitted" };
  const statusSub = getExamStatusInfo(submittedExam);
  assert.strictEqual(statusSub.status, "submitted", "Should resolve to 'submitted'");
  assert.strictEqual(statusSub.label, "تم التسليم");

  const pendingEssayExam = { id: "3", title: "Python Essay" };
  const statusPending = getExamStatusInfo(pendingEssayExam, { status: "pending_essay" });
  assert.strictEqual(statusPending.status, "pending_essay", "Should resolve to 'pending_essay'");
  assert.strictEqual(statusPending.label, "قيد الانتظار للتصحيح");

  const gradedExam = { id: "4", title: "Python Final" };
  const statusGraded = getExamStatusInfo(gradedExam, { status: "graded", score: 95 });
  assert.strictEqual(statusGraded.status, "graded", "Should resolve to 'graded'");
  assert.strictEqual(statusGraded.label, "تم التصحيح");
  console.log("  ✅ Status badge calculations passed!");
}

// 2. Test Question Navigator
{
  console.log("  Testing Question Navigator...");
  const navHtml = renderExamQuestionNavigator({
    totalQuestions: 5,
    currentIndex: 2,
    answers: { 0: 1, 1: "function test() {}", 3: "" }
  });
  assert(navHtml.includes('class="question-nav-pill answered"'), "Should contain answered pill");
  assert(navHtml.includes('data-nav-question-index="2"'), "Should contain pill for index 2");
  assert(navHtml.includes('current'), "Should highlight current question");
  assert(navHtml.includes('aria-current="true"'), "Should set aria-current for current question");
  console.log("  ✅ Question Navigator passed!");
}

// 3. Test Progress Bar
{
  console.log("  Testing Progress Bar...");
  const progressHtml = renderExamProgress({ answeredCount: 3, totalQuestions: 6 });
  assert(progressHtml.includes("50%"), "Should compute 50% progress");
  assert(progressHtml.includes("3"), "Should display answered count");
  assert(progressHtml.includes("6"), "Should display total questions");
  console.log("  ✅ Progress Bar passed!");
}

// 4. Test Single Question Rendering (MCQ & Essay)
{
  console.log("  Testing Question Viewports (MCQ & Essay)...");
  // MCQ Question
  const mcqQ = {
    id: "q1",
    type: "mcq",
    question: "ما هو Python؟",
    options: ["لغة برمجة", "نظام تشغيل", "قاعدة بيانات", "متصفح"],
    degree: 2
  };
  const mcqHtml = renderExamQuestion({
    question: mcqQ,
    index: 0,
    currentAnswer: 0,
    totalQuestions: 10
  });
  assert(mcqHtml.includes("ما هو Python؟"), "Should render question text");
  assert(mcqHtml.includes("لغة برمجة"), "Should render options");
  assert(mcqHtml.includes("is-selected"), "Should highlight selected option");
  assert(mcqHtml.includes('checked'), "Should check radio for answer 0");
  assert(!mcqHtml.includes("correct"), "Must NEVER leak correct answer!");

  // Essay Question
  const essayQ = {
    id: "q2",
    type: "essay",
    question: "اشرح الفرق بين List و Tuple.",
    degree: 5
  };
  const essayHtml = renderExamQuestion({
    question: essayQ,
    index: 1,
    currentAnswer: "List mutable while Tuple immutable",
    totalQuestions: 10
  });
  assert(essayHtml.includes("اشرح الفرق بين List و Tuple."), "Should render essay prompt");
  assert(essayHtml.includes("essay-textarea"), "Should render textarea for essay");
  assert(essayHtml.includes("List mutable while Tuple immutable"), "Should persist draft essay answer");
  console.log("  ✅ Question Viewports passed!");
}

// 5. Test Submit Confirmation Dialog
{
  console.log("  Testing Submit Dialog summary counts...");
  const dialogHtml = renderExamSubmitDialog({ answeredCount: 8, totalQuestions: 10 });
  assert(dialogHtml.includes("8 / 10"), "Should show answered count");
  assert(dialogHtml.includes("2"), "Should show 2 unanswered questions remaining");
  assert(dialogHtml.includes(EXAM_SUBMIT_MODAL_ID), "Should have correct modal id");
  assert(dialogHtml.includes("confirmFinalSubmitExamBtn"), "Should have confirm submit button");
  console.log("  ✅ Submit Dialog passed!");
}

// 6. Test Timer States
{
  console.log("  Testing Timer States...");
  const normalTimer = renderExamTimer({ seconds: 600 });
  assert(normalTimer.includes("timer-normal"), "Should be timer-normal for 10 minutes");

  const warningTimer = renderExamTimer({ seconds: 240 });
  assert(warningTimer.includes("timer-warning"), "Should be timer-warning for 4 minutes");

  const criticalTimer = renderExamTimer({ seconds: 45 });
  assert(criticalTimer.includes("timer-critical"), "Should be timer-critical for 45 seconds");
  console.log("  ✅ Timer States passed!");
}

// 7. Test Result Screen
{
  console.log("  Testing Exam Result Screen...");
  const resultGraded = {
    score: 21,
    total: 21,
    totalQuestions: 25,
    mcqScore: 14,
    essayScores: [7],
    status: "graded",
    submittedAt: new Date().toISOString()
  };
  const resultHtml = renderExamResult({
    exam: { title: "اختبار Python الشامل", passDegree: 12 },
    result: resultGraded
  });
  assert(resultHtml.includes("اختبار Python الشامل"), "Should show exam title");
  assert(resultHtml.includes("21"), "Should show total score");
  assert(resultHtml.includes("14"), "Should show MCQ score");
  assert(resultHtml.includes("7"), "Should show Essay score");
  assert(resultHtml.includes("84%"), "Should compute percentage: 21/25 = 84%");

  // Pending Essay Result
  const resultPending = {
    score: 15,
    total: 15,
    totalQuestions: 25,
    mcqScore: 15,
    essayScores: [null],
    status: "pending_essay"
  };
  const pendingHtml = renderExamResult({
    exam: { title: "اختبار Python التحريري" },
    result: resultPending
  });
  assert(pendingHtml.includes("قيد انتظار التصحيح التحريري"), "Should indicate pending essay grading");
  console.log("  ✅ Exam Result Screen passed!");
}

// 8. Test Student Exam Card & Details Content
{
  console.log("  Testing Exam Card & Details modal content...");
  const exam = {
    id: "exam_101",
    title: "اختبار البرمجة الأول",
    description: "مراجعة شاملة",
    duration: 45,
    totalQuestions: 15,
    active: true
  };
  const cardHtml = renderStudentExamCard({ exam });
  assert(cardHtml.includes("اختبار البرمجة الأول"), "Card should display title");
  assert(cardHtml.includes("45 دقيقة"), "Card should display duration");
  assert(cardHtml.includes("15"), "Card should display question count");
  assert(cardHtml.includes("data-open-exam-details"), "Card should have action to view details");

  const detailsHtml = renderStudentExamDetailsContent({ exam });
  assert(detailsHtml.includes("45 دقيقة"), "Details should show duration");
  assert(detailsHtml.includes("محاولة واحدة رسمية"), "Details should show attempt limit");
  assert(detailsHtml.includes("data-action-start-exam"), "Details should show start button");
  console.log("  ✅ Exam Card & Details content passed!");
}

console.log("\n🎉 ALL STUDENT EXAM UNIT TESTS PASSED SUCCESSFULLY!");
