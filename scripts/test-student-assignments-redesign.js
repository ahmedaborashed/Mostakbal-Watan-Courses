// scripts/test-student-assignments-redesign.js
import assert from "node:assert";
import {
  parseDeadline,
  isDeadlinePassed,
  formatDateTime,
  getDeadlineInfo
} from "../src/shared/utils/date.utils.js";
import {
  renderStudentAssignmentCard,
  renderStudentAssignmentSkeletonGrid,
  renderTeacherAssignmentCard
} from "../src/features/assignments/components/assignment-card.component.js";
import {
  renderAssignmentDetailsContent,
  renderAssignmentDetailsModal
} from "../src/features/assignments/components/assignment-details-modal.component.js";

console.log("🧪 Starting Student Assignments Redesign & Submission Unit Tests...\n");

// ========================================================
// 1. Test Date & Deadline Handling
// ========================================================
{
  console.log("  1. Testing parseDeadline, isDeadlinePassed & getDeadlineInfo...");

  // Scenario A: Date string YYYY-MM-DD for today should NOT be expired during the day
  const now = new Date();
  const todayIso = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  const parsedToday = parseDeadline(todayIso);
  assert.ok(parsedToday instanceof Date, "parseDeadline must return a Date object for YYYY-MM-DD");
  assert.strictEqual(parsedToday.getHours(), 23, "YYYY-MM-DD must evaluate to 23:59:59.999 end of day");
  assert.strictEqual(parsedToday.getMinutes(), 59, "Minutes must be 59");
  assert.strictEqual(isDeadlinePassed(todayIso), false, "Today's date deadline must NOT be expired during the day");

  // Scenario B: Clearly expired deadline in the past
  const pastDate = "2020-01-01";
  assert.strictEqual(isDeadlinePassed(pastDate), true, "Past date must be marked as passed");
  const pastInfo = getDeadlineInfo(pastDate);
  assert.strictEqual(pastInfo.isExpired, true, "Past date info must have isExpired = true");
  assert.strictEqual(pastInfo.variant, "danger", "Expired info must have danger variant");
  assert.ok(pastInfo.text.includes("انتهى موعد التسليم"), "Must display Arabic expired notice");

  // Scenario C: Far future deadline
  const futureDate = "2030-12-31";
  assert.strictEqual(isDeadlinePassed(futureDate), false, "Future date must not be passed");
  const futureInfo = getDeadlineInfo(futureDate);
  assert.strictEqual(futureInfo.isExpired, false, "Future date must not be expired");

  // Scenario D: formatDateTime
  const testDate = new Date("2026-09-20T14:30:00");
  const formatted = formatDateTime(testDate);
  assert.ok(formatted.includes("سبتمبر") || formatted.includes("20"), "Must format month/day in Arabic locale");
  assert.ok(formatted.includes("·"), "Must contain separator between date and time");

  console.log("    ✓ Date & deadline logic verified with end-of-day tolerance.");
}

// ========================================================
// 2. Test renderStudentAssignmentCard
// ========================================================
{
  console.log("\n  2. Testing renderStudentAssignmentCard...");

  const baseTask = {
    id: "task-python-loops",
    title: "Python Loops Practice",
    description: "تطبيق عملي ومتقدم على حلقات التكرار for و while وحساب مجموع الأرقام الفردية والزوجية.",
    deadline: "2030-10-15",
    group: "ALL",
    fileUrl: "https://example.com/loops_reference.pdf"
  };

  // Scenario A: Unsubmitted task
  const htmlUnsubmitted = renderStudentAssignmentCard({ assignment: baseTask, submission: null });
  assert.ok(htmlUnsubmitted.includes("Python Loops Practice"), "Must render assignment title");
  assert.ok(htmlUnsubmitted.includes("student-assignment-title"), "Must use dominant title class");
  assert.ok(htmlUnsubmitted.includes("student-assignment-desc"), "Must use description class");
  assert.ok(htmlUnsubmitted.includes("مطلوب تسليمه"), "Must show unsubmitted status badge");
  assert.ok(htmlUnsubmitted.includes("فتح التاسك"), "Must include dominant 'فتح التاسك' action button");
  assert.ok(htmlUnsubmitted.includes('data-open-task-details="task-python-loops"'), "Must wire data-open-task-details");
  assert.ok(htmlUnsubmitted.includes("مرفق متاح"), "Must show attachment chip when fileUrl exists");

  // Scenario B: Submitted task (pending grading)
  const submissionPending = {
    id: "sub-1",
    assignmentId: "task-python-loops",
    studentUid: "student-123",
    answerText: "print('Hello')",
    fileUrl: "https://example.com/solution.py",
    grade: null,
    feedback: null,
    submittedAt: new Date()
  };
  const htmlSubmitted = renderStudentAssignmentCard({ assignment: baseTask, submission: submissionPending });
  assert.ok(htmlSubmitted.includes("تم التسليم"), "Must show 'تم التسليم' badge");
  assert.ok(htmlSubmitted.includes("قيد التصحيح"), "Must indicate pending grading");
  assert.ok(htmlSubmitted.includes("is-submitted"), "Must apply is-submitted styling");

  // Scenario C: Graded task
  const submissionGraded = {
    ...submissionPending,
    grade: 95,
    feedback: "أحسنت الكود منظم وممتاز"
  };
  const htmlGraded = renderStudentAssignmentCard({ assignment: baseTask, submission: submissionGraded });
  assert.ok(htmlGraded.includes("95/100"), "Must display grade 95/100");
  assert.ok(htmlGraded.includes("تم التصحيح"), "Must indicate graded status");

  // Scenario D: Expired unsubmitted task
  const expiredTask = { ...baseTask, deadline: "2020-01-01" };
  const htmlExpired = renderStudentAssignmentCard({ assignment: expiredTask, submission: null });
  assert.ok(htmlExpired.includes("انتهى الموعد"), "Must show expired badge");
  assert.ok(htmlExpired.includes("is-expired"), "Must apply is-expired class");

  console.log("    ✓ Student assignment card renders correctly across all states.");
}

// ========================================================
// 3. Test renderStudentAssignmentSkeletonGrid
// ========================================================
{
  console.log("\n  3. Testing renderStudentAssignmentSkeletonGrid...");

  const skeletonHtml = renderStudentAssignmentSkeletonGrid(3);
  assert.ok(skeletonHtml.includes("student-assignments-grid"), "Must use student-assignments-grid wrapper");
  assert.ok(skeletonHtml.includes("is-skeleton"), "Must contain is-skeleton cards");
  const count = (skeletonHtml.match(/is-skeleton/g) || []).length;
  assert.strictEqual(count, 3, "Must render exactly 3 skeleton placeholders");

  console.log("    ✓ Skeleton grid matches card layout and count.");
}

// ========================================================
// 4. Test renderAssignmentDetailsContent
// ========================================================
{
  console.log("\n  4. Testing renderAssignmentDetailsContent...");

  const task = {
    id: "task-oop",
    title: "تطبيق على Object-Oriented Programming",
    description: "قم بإنشاء كلاس BankAccount مع دوال الإيداع والسحب والتحقق من الرصيد.",
    deadline: "2030-11-20",
    group: "مجموعة الأحد والأربعاء",
    fileUrl: "https://example.com/oop_guide.pdf"
  };

  // Scenario A: Unsubmitted state details view
  const htmlUnsubmitted = renderAssignmentDetailsContent({
    assignment: task,
    submission: null,
    isSubmitting: false
  });
  assert.ok(htmlUnsubmitted.includes("تطبيق على Object-Oriented Programming"), "Must show title in header");
  assert.ok(htmlUnsubmitted.includes("المطلوب وتنفيذ التاسك"), "Must have requirements section");
  assert.ok(htmlUnsubmitted.includes("ملف الشرح والمرفقات المرجعية"), "Must show teacher reference file section");
  assert.ok(htmlUnsubmitted.includes("https://example.com/oop_guide.pdf"), "Must link to reference file");
  assert.ok(htmlUnsubmitted.includes('id="detailsTaskAnswerText"'), "Must include answer textarea");
  assert.ok(htmlUnsubmitted.includes('id="detailsTaskUploadZone"'), "Must include file upload zone");
  assert.ok(htmlUnsubmitted.includes('id="detailsSubmitBtn"'), "Must include submit button");
  assert.ok(htmlUnsubmitted.includes("تسليم التاسك 🚀"), "Button must have clear action label");

  // Scenario B: Submitted & graded state details view
  const submission = {
    id: "sub-oop-1",
    assignmentId: "task-oop",
    studentUid: "student-456",
    answerText: "class BankAccount:\n    def __init__(self, balance=0):\n        self.balance = balance",
    fileUrl: "https://storage.googleapis.com/solution.py",
    grade: 90,
    feedback: "كود رائع والتزام كامل بمبادئ الـ OOP",
    submittedAt: new Date("2026-09-10T12:00:00")
  };

  const htmlSubmitted = renderAssignmentDetailsContent({
    assignment: task,
    submission,
    isSubmitting: false
  });
  assert.ok(htmlSubmitted.includes("تم تسليم هذا التاسك بنجاح"), "Must show success banner");
  assert.ok(htmlSubmitted.includes("90 / 100"), "Must display grade score");
  assert.ok(htmlSubmitted.includes("كود رائع والتزام كامل"), "Must display teacher feedback notes");
  assert.ok(htmlSubmitted.includes("class BankAccount"), "Must show submitted answer code");
  assert.ok(htmlSubmitted.includes("https://storage.googleapis.com/solution.py"), "Must show link to submitted solution file");
  assert.ok(!htmlSubmitted.includes('id="detailsSubmitBtn"'), "Must NOT show active submit form once submitted");

  // Scenario C: Expired unsubmitted task
  const expiredTask = { ...task, deadline: "2020-01-01" };
  const htmlExpired = renderAssignmentDetailsContent({
    assignment: expiredTask,
    submission: null
  });
  assert.ok(htmlExpired.includes("انتهى موعد تسليم هذا الواجب"), "Must show expired notice banner");
  assert.ok(!htmlExpired.includes('id="detailsSubmitBtn"'), "Must NOT show submit form when expired");

  console.log("    ✓ Assignment details content renders all states accurately.");
}

// ========================================================
// 5. Test Submission Payload Validations & MIME type resolution
// ========================================================
{
  console.log("\n  5. Testing Submission Payload Validations & MIME resolution...");

  function validateSubmissionInput(assignmentId, answerText, file) {
    if (!assignmentId) throw new Error("معرف الواجب غير محدد.");
    const cleanText = (answerText || "").trim();
    if (!cleanText && !file) throw new Error("يجب كتابة نص الإجابة أو إرفاق ملف للحل.");
    return { valid: true };
  }

  function resolveFileMime(fileName, rawType) {
    if (rawType && rawType !== "application/octet-stream") return rawType;
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    const mimeMap = {
      py: "text/x-python",
      txt: "text/plain",
      pdf: "application/pdf",
      zip: "application/zip",
      rar: "application/x-zip-compressed",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    };
    return mimeMap[ext] || "text/plain";
  }

  // Validate empty assignment ID
  assert.throws(
    () => validateSubmissionInput("", "code", null),
    { message: "معرف الواجب غير محدد." }
  );

  // Validate empty answer and empty file
  assert.throws(
    () => validateSubmissionInput("task-1", "   ", null),
    { message: "يجب كتابة نص الإجابة أو إرفاق ملف للحل." }
  );

  // Validate valid text
  assert.deepStrictEqual(validateSubmissionInput("task-1", "my code", null), { valid: true });

  // Validate valid file only
  assert.deepStrictEqual(validateSubmissionInput("task-1", "", { name: "solution.py" }), { valid: true });

  // Validate MIME resolution
  assert.strictEqual(resolveFileMime("script.py", ""), "text/x-python");
  assert.strictEqual(resolveFileMime("notes.txt", "application/octet-stream"), "text/plain");
  assert.strictEqual(resolveFileMime("report.pdf", ""), "application/pdf");
  assert.strictEqual(resolveFileMime("archive.zip", ""), "application/zip");

  console.log("    ✓ Validation rules & MIME normalizations work as expected.");
}

// ========================================================
// 6. Test Teacher Assignment Card
// ========================================================
{
  console.log("\n  6. Testing renderTeacherAssignmentCard...");

  const teacherCardHtml = renderTeacherAssignmentCard({
    assignment: {
      id: "t-1",
      title: "تاسك المعلم 1",
      description: "وصف التاسك",
      deadline: "2026-10-01",
      group: "ALL"
    }
  });
  assert.ok(teacherCardHtml.includes("تاسك المعلم 1"), "Must display teacher task title");
  assert.ok(teacherCardHtml.includes('data-teacher-view-submissions="t-1"'), "Must wire view submissions action");

  console.log("    ✓ Teacher assignment card verified.");
}

console.log("\n🎉 ALL STUDENT ASSIGNMENTS TESTS PASSED SUCCESSFULLY!\n");
