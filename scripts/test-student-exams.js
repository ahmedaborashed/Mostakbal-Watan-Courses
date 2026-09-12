// scripts/test-student-exams.js
import assert from "node:assert";
import { getExamStatusInfo, renderExamStatusBadge } from "../src/features/exams/components/exam-status-badge.component.js";
import { renderExamQuestionNavigator } from "../src/features/exams/components/exam-question-navigator.component.js";
import { renderExamProgress } from "../src/features/exams/components/exam-progress.component.js";
import { renderExamSubmitDialog, EXAM_SUBMIT_MODAL_ID } from "../src/features/exams/components/exam-submit-dialog.component.js";
import { renderExamQuestion } from "../src/features/exams/components/exam-question.component.js";
import { renderExamResult } from "../src/features/exams/components/exam-result.component.js";
import { renderStudentExamCard } from "../src/features/exams/components/exam-card.component.js";
import {
  renderStudentExamDetailsContent,
  renderPreExamConfirmationModal,
  PRE_EXAM_CONFIRM_MODAL_ID
} from "../src/features/exams/components/exam-details.component.js";
import { renderStudentExamReviewMode } from "../src/features/exams/components/student-exam-review.component.js";
import { renderExamTimer } from "../src/features/exams/components/exam-timer.component.js";

console.log("🧪 Starting Comprehensive Student Exams Unit Tests...");

// 1. Test All 6 Semantic Exam Status Badges
{
  console.log("  Testing 6 semantic status badge calculations...");
  // 1.1 Available ("متاح الآن")
  const availableExam = { id: "1", title: "Python Basics", active: true, duration: 30 };
  const statusAvail = getExamStatusInfo(availableExam);
  assert.strictEqual(statusAvail.status, "available");
  assert.strictEqual(statusAvail.label, "متاح الآن");

  // 1.2 Upcoming ("لم يبدأ")
  const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();
  const upcomingExam = { id: "2", title: "Python Intro", active: true, startDate: futureDate };
  const statusUpcoming = getExamStatusInfo(upcomingExam);
  assert.strictEqual(statusUpcoming.status, "upcoming");
  assert.strictEqual(statusUpcoming.label, "لم يبدأ");

  // 1.3 Expired ("منتهي")
  const pastDate = new Date(Date.now() - 86400000).toISOString();
  const expiredExam = { id: "3", title: "Python History", active: true, deadline: pastDate };
  const statusExpired = getExamStatusInfo(expiredExam);
  assert.strictEqual(statusExpired.status, "expired");
  assert.strictEqual(statusExpired.label, "منتهي");

  // 1.4 Submitted ("تم التسليم")
  const submittedExam = { id: "4", title: "Python Advanced", attemptStatus: "submitted" };
  const statusSub = getExamStatusInfo(submittedExam);
  assert.strictEqual(statusSub.status, "submitted");
  assert.strictEqual(statusSub.label, "تم التسليم");

  // 1.5 Pending Essay Grading ("قيد التصحيح")
  const pendingEssayExam = { id: "5", title: "Python Essay" };
  const statusPending = getExamStatusInfo(pendingEssayExam, { status: "pending_essay" });
  assert.strictEqual(statusPending.status, "pending_essay");
  assert.strictEqual(statusPending.label, "قيد التصحيح");

  // 1.6 Graded ("تم التصحيح")
  const gradedExam = { id: "6", title: "Python Final" };
  const statusGraded = getExamStatusInfo(gradedExam, { status: "graded", score: 95 });
  assert.strictEqual(statusGraded.status, "graded");
  assert.strictEqual(statusGraded.label, "تم التصحيح");

  console.log("  ✅ All 6 semantic status badges passed!");
}

// 2. Test Question Navigator Component
{
  console.log("  Testing Question Navigator with answered checkmarks and collapsible toggle...");
  const navHtml = renderExamQuestionNavigator({
    totalQuestions: 5,
    currentIndex: 2,
    answers: { 0: 1, 1: "function test() {}", 3: "" },
    isCollapsedOnMobile: false
  });
  assert(navHtml.includes('class="question-nav-pill answered"'), "Should contain answered pill");
  assert(navHtml.includes('data-nav-question-index="2"'), "Should contain pill for index 2");
  assert(navHtml.includes('current'), "Should highlight current question");
  assert(navHtml.includes('aria-current="true"'), "Should set aria-current for current question");
  assert(navHtml.includes("✓"), "Should render checkmark for answered question");
  assert(navHtml.includes("○"), "Should render dot for unanswered question");
  assert(navHtml.includes("btnToggleQuestionNav"), "Should contain mobile collapsible toggle button");

  // Test collapsed on mobile
  const navCollapsedHtml = renderExamQuestionNavigator({
    totalQuestions: 4,
    currentIndex: 0,
    answers: {},
    isCollapsedOnMobile: true
  });
  assert(navCollapsedHtml.includes("is-collapsed-mobile"), "Should apply is-collapsed-mobile class");
  assert(navCollapsedHtml.includes('aria-expanded="false"'), "Should mark aria-expanded as false when collapsed");

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
  assert(mcqHtml.includes("✓"), "Should render checkmark indicator in marker");
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

// 5. Test Pre-Submission Student Exam Review Mode
{
  console.log("  Testing Student Exam Review Mode...");
  const reviewQuestions = [
    { id: "q1", type: "mcq", question: "سؤال 1", options: ["خيار أ", "خيار ب"], degree: 2 },
    { id: "q2", type: "essay", question: "سؤال 2 تحريري", degree: 5 },
    { id: "q3", type: "mcq", question: "سؤال 3 غير مجاب", options: ["1", "2"], degree: 3 }
  ];
  const reviewAnswers = {
    0: 0, // answered MCQ
    1: "هذه إجابة تجريبية مقالية" // answered Essay
    // 2 is unanswered
  };

  const reviewHtml = renderStudentExamReviewMode({
    examTitle: "اختبار تجريبي للمراجعة",
    questions: reviewQuestions,
    answers: reviewAnswers,
    currentIndex: 0,
    timerHtml: '<span class="exam-timer-badge">12:34</span>'
  });

  assert(reviewHtml.includes("student-exam-review-shell"), "Should render student review shell");
  assert(reviewHtml.includes("اختبار تجريبي للمراجعة"), "Should display exam title");
  assert(reviewHtml.includes("إجمالي الأسئلة"), "Should display total questions label");
  assert(reviewHtml.includes("تمت الإجابة"), "Should display answered label");
  assert(reviewHtml.includes("غير مجاب"), "Should display unanswered label");
  assert(reviewHtml.includes("data-jump-to-question=\"0\""), "Should have jump button for question 0");
  assert(reviewHtml.includes("data-jump-to-question=\"2\""), "Should have jump button for question 2");
  assert(reviewHtml.includes("btnReturnToQuestionMode"), "Should have return button");
  assert(reviewHtml.includes("btnReviewSubmitExam"), "Should have submit button");
  assert(reviewHtml.includes("هذه إجابة تجريبية مقالية"), "Should preview essay answer snippet");

  console.log("  ✅ Student Exam Review Mode passed!");
}

// 6. Test Submit Confirmation Dialog
{
  console.log("  Testing Submit Dialog summary counts...");
  const dialogHtml = renderExamSubmitDialog({ answeredCount: 8, totalQuestions: 10 });
  assert(dialogHtml.includes("8 / 10"), "Should show answered count");
  assert(dialogHtml.includes("2"), "Should show 2 unanswered questions remaining");
  assert(dialogHtml.includes(EXAM_SUBMIT_MODAL_ID), "Should have correct modal id");
  assert(dialogHtml.includes("confirmFinalSubmitExamBtn"), "Should have confirm submit button");
  assert(dialogHtml.includes("هل أنت متأكد من تسليم الامتحان؟"), "Should display clear confirmation title");
  console.log("  ✅ Submit Dialog passed!");
}

// 7. Test Timer States
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

// 8. Test Result Screen (Finalized MCQ vs Pending Essay)
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
  assert(pendingHtml.includes("قيد التصحيح"), "Should indicate pending essay grading");
  console.log("  ✅ Exam Result Screen passed!");
}

// 9. Test Student Exam Card & Details Content & Pre-Exam Confirmation Modal
{
  console.log("  Testing Exam Card, Details modal, and Pre-Exam Confirmation...");
  const exam = {
    id: "exam_101",
    title: "اختبار البرمجة الأول",
    description: "مراجعة شاملة",
    duration: 45,
    totalQuestions: 15,
    active: true
  };
  // Scenario A: Available exam card (MUST have both Details and Start Exam buttons)
  const cardHtml = renderStudentExamCard({ exam });
  assert(cardHtml.includes("اختبار البرمجة الأول"), "Card should display title");
  assert(cardHtml.includes("45"), "Card should display duration number");
  assert(cardHtml.includes("دقيقة"), "Card should display duration unit");
  assert(cardHtml.includes("15"), "Card should display question count");
  assert(cardHtml.includes("data-open-exam-details"), "Card should have action to view details");
  assert(cardHtml.includes('data-start-exam="exam_101"'), "Card MUST have direct Start Exam button");
  assert(cardHtml.includes("بدء الامتحان"), "Direct start button label must be 'بدء الامتحان'");

  // Scenario B: Completed exam card with official grade
  const completedExam = {
    ...exam,
    id: "exam_102",
    result: { score: 18, total: 20 }
  };
  const completedCardHtml = renderStudentExamCard({ exam: completedExam, attempt: { status: "submitted" } });
  assert(completedCardHtml.includes("data-open-exam-details"), "Completed card should have details button");
  assert(completedCardHtml.includes('data-view-exam-result="exam_102"'), "Completed card must have View Result button");
  assert(completedCardHtml.includes("عرض النتيجة"), "View Result button label must be 'عرض النتيجة'");
  assert(completedCardHtml.includes("18 / 20"), "Card must display official score 18 / 20");

  // Scenario C: Expired exam card
  const expiredExam = {
    ...exam,
    id: "exam_103",
    endDate: new Date(Date.now() - 86400000).toISOString()
  };
  const expiredCardHtml = renderStudentExamCard({ exam: expiredExam });
  assert(expiredCardHtml.includes("data-open-exam-details"), "Expired card should have details button");
  assert(expiredCardHtml.includes("منتهي"), "Expired card must indicate expired state");

  // Scenario D: Active in-progress attempt
  const inProgressExam = {
    ...exam,
    id: "exam_104"
  };
  const inProgressCardHtml = renderStudentExamCard({ exam: inProgressExam, attempt: { status: "in_progress" } });
  assert(inProgressCardHtml.includes('data-resume-exam="exam_104"'), "Active attempt card must have resume button");
  assert(inProgressCardHtml.includes("متابعة الامتحان"), "Resume button label must be 'متابعة الامتحان'");

  const detailsHtml = renderStudentExamDetailsContent({ exam });
  assert(detailsHtml.includes("45 دقيقة"), "Details should show duration");
  assert(detailsHtml.includes("محاولة واحدة رسمية"), "Details should show attempt limit");
  assert(detailsHtml.includes("data-action-start-exam"), "Details should show start button");

  // Pre-Exam Confirmation Modal
  const preExamModalHtml = renderPreExamConfirmationModal();
  assert(preExamModalHtml.includes(PRE_EXAM_CONFIRM_MODAL_ID), "Pre-exam modal must have expected ID");
  assert(preExamModalHtml.includes("confirmStartExamOfficialBtn"), "Pre-exam modal must have confirm start button");

  console.log("  ✅ Exam Card dual-action buttons, Details & Pre-Exam Confirmation passed!");
}

console.log("\n🎉 ALL STUDENT EXAM UNIT TESTS PASSED SUCCESSFULLY!");
