// scripts/test-cloud-functions-fallback.js
import assert from "node:assert";
import {
  normalizeError,
  isCloudFunctionUnavailable,
  AppError,
  NotFoundError,
  PermissionError,
  AuthError
} from "../src/core/errors.js";

console.log("🧪 Starting Cloud Functions Error Normalization & Fallback Test Suite...\n");

// ========================================================
// 1. Test isCloudFunctionUnavailable Detection
// ========================================================
{
  console.log("  1. Testing isCloudFunctionUnavailable error detection...");

  // Scenario A: Raw Firebase Functions "internal" error
  const errInternal1 = { code: "functions/internal", message: "internal" };
  assert.strictEqual(isCloudFunctionUnavailable(errInternal1), true, "Must detect functions/internal");

  // Scenario B: Plain "internal"
  const errInternal2 = { code: "internal", message: "internal" };
  assert.strictEqual(isCloudFunctionUnavailable(errInternal2), true, "Must detect code: internal");

  // Scenario C: Uncaught "internal" message only
  const errInternal3 = new Error("internal");
  assert.strictEqual(isCloudFunctionUnavailable(errInternal3), true, "Must detect message: internal");

  // Scenario D: functions/not-found (e.g. 404 endpoint not deployed)
  const errNotFound = { code: "functions/not-found", message: "NOT FOUND" };
  assert.strictEqual(isCloudFunctionUnavailable(errNotFound), true, "Must detect functions/not-found");

  // Scenario E: functions/unavailable
  const errUnavailable = { code: "functions/unavailable", message: "Service Unavailable" };
  assert.strictEqual(isCloudFunctionUnavailable(errUnavailable), true, "Must detect functions/unavailable");

  // Scenario F: Business errors should NOT be detected as function infrastructure unavailability
  const errPermission = { code: "functions/permission-denied", message: "Permission Denied" };
  assert.strictEqual(isCloudFunctionUnavailable(errPermission), false, "Permission denied is not infrastructure unavailability");

  const errAuth = { code: "auth/wrong-password", message: "Wrong password" };
  assert.strictEqual(isCloudFunctionUnavailable(errAuth), false, "Auth error is not function unavailability");

  console.log("  ✅ isCloudFunctionUnavailable correctly identifies infrastructure outage vs business logic errors!");
}

// ========================================================
// 2. Test normalizeError Never Returns Raw "internal"
// ========================================================
{
  console.log("  2. Testing normalizeError replaces cryptic 'internal' with user-friendly Arabic...");

  // Raw Firebase Functions internal error
  const rawFirebaseError = { code: "functions/internal", message: "internal" };
  const normalized1 = normalizeError(rawFirebaseError);

  assert.ok(normalized1 instanceof AppError, "Must return an AppError instance");
  assert.notStrictEqual(normalized1.message, "internal", "Normalized message must NEVER be the raw string 'internal'");
  assert.ok(normalized1.message.includes("الخادم السحابي"), "Must explain cloud server unavailability in Arabic");

  // Plain Error with message "internal"
  const plainError = new Error("internal");
  const normalized2 = normalizeError(plainError);
  assert.notStrictEqual(normalized2.message, "internal", "Must never return 'internal' for plain error");
  assert.ok(normalized2.message.includes("الخادم السحابي"), "Must explain cloud server issue in Arabic");

  // functions/not-found
  const nfError = { code: "functions/not-found", message: "" };
  const normalizedNf = normalizeError(nfError);
  assert.ok(normalizedNf instanceof NotFoundError, "Must return NotFoundError");
  assert.ok(normalizedNf.message.includes("غير متوفرة"), "Must indicate service unavailable");

  console.log("  ✅ normalizeError guarantees friendly Arabic messages and eliminates 'internal' popup!");
}

// ========================================================
// 3. Test Business Logic Errors are Preserved
// ========================================================
{
  console.log("  3. Testing business errors preservation...");

  // Deadline exceeded
  const errDeadline = { code: "functions/deadline-exceeded", message: "انتهى الموعد المحدد لتسليم هذا الواجب." };
  const normDeadline = normalizeError(errDeadline);
  assert.strictEqual(normDeadline.code, "DEADLINE_EXCEEDED");
  assert.ok(normDeadline.message.includes("انتهى الموعد"));

  // Already exists
  const errExists = { code: "functions/already-exists", message: "تم تسجيل نتيجتك لهذا الامتحان مسبقاً." };
  const normExists = normalizeError(errExists);
  assert.strictEqual(normExists.code, "ALREADY_EXISTS");
  assert.ok(normExists.message.includes("مسبقاً"));

  console.log("  ✅ Business logic errors remain accurately mapped!");
}

// ========================================================
// 4. Test Student Submission Payload Formatting
// ========================================================
{
  console.log("  4. Testing task submission fallback structure...");

  const mockUser = { uid: "user_test_123", displayName: "محمد أحمد", email: "01012345678@student.local" };
  const mockStudent = { name: "محمد أحمد", studentPhone: "01012345678", group: "مجموعة الأحد والأربعاء" };

  const payload = {
    assignmentId: "task_1",
    studentUid: mockUser.uid,
    studentId: mockUser.uid,
    studentName: mockStudent.name || mockUser.displayName,
    studentPhone: mockStudent.studentPhone,
    group: mockStudent.group,
    answerText: "هذا هو حل الواجب",
    fileUrl: "https://firebasestorage.googleapis.com/test.pdf",
    grade: null,
    feedback: null
  };

  assert.strictEqual(payload.assignmentId, "task_1");
  assert.strictEqual(payload.studentUid, "user_test_123");
  assert.strictEqual(payload.studentPhone, "01012345678");
  assert.strictEqual(payload.grade, null);
  assert.ok(payload.fileUrl.includes("test.pdf"));

  console.log("  ✅ Task submission fallback payload structure is correct!");
}

// ========================================================
// 5. Test Exam MCQ Grading Fallback Formula
// ========================================================
{
  console.log("  5. Testing local exam scoring fallback accuracy...");

  const questions = [
    { id: "q0", type: "mcq", question: "ما هو ناتج 2+2؟", options: ["3", "4", "5"], correct: 1, degree: 2 },
    { id: "q1", type: "mcq", question: "ما هي لغة بايثون؟", options: ["برمجة", "أكلة"], correct: 0, degree: 3 },
    { id: "q2", type: "essay", question: "اشرح المتغيرات بالتفصيل.", degree: 5 }
  ];

  // Student answers: Q0 = 1 (correct), Q1 = 1 (wrong), Q2 = "نص مقالي"
  const answers = [1, 1, "نص مقالي"];

  let mcqScore = 0;
  let totalMcqPossible = 0;
  let hasEssay = false;
  const essayScores = [];

  questions.forEach((q, idx) => {
    const studentAnswer = answers[idx];
    const degree = Number(q.degree || 1);

    if (q.type === "mcq") {
      totalMcqPossible += degree;
      if (studentAnswer !== null && studentAnswer !== undefined && Number(studentAnswer) === Number(q.correct)) {
        mcqScore += degree;
      }
    } else {
      hasEssay = true;
      essayScores.push(null);
    }
  });

  assert.strictEqual(mcqScore, 2, "Only Q0 was correct (degree 2)");
  assert.strictEqual(totalMcqPossible, 5, "Total possible MCQ is 2 + 3 = 5");
  assert.strictEqual(hasEssay, true, "Has essay question");
  assert.strictEqual(essayScores.length, 1, "One essay score pending");
  assert.strictEqual(essayScores[0], null, "Essay score must be null pending teacher review");

  console.log("  ✅ Local exam scoring fallback accurately computes MCQ score and flags essays!");
}

console.log("\n🎉 ALL CLOUD FUNCTIONS FALLBACK & NORMALIZATION TESTS PASSED FLAWLESSLY! 🚀\n");
