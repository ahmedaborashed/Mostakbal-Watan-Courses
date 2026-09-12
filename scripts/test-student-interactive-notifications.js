// scripts/test-student-interactive-notifications.js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("===================================================================");
console.log("🧪 RUNNING STUDENT INTERACTIVE NOTIFICATIONS VERIFICATION");
console.log("===================================================================\n");

// 1. Verify NOTIFICATION_TYPES in constants.js
console.log("--- TEST SUITE 1: CONSTANTS & TYPES ---");
const { NOTIFICATION_TYPES } = await import("../src/core/constants.js");
assert.equal(NOTIFICATION_TYPES.PYTHON_CHALLENGE, "python_challenge");
assert.equal(NOTIFICATION_TYPES.LECTURE_REMINDER, "lecture_reminder");
console.log("  ✅ [PASS] NOTIFICATION_TYPES contains PYTHON_CHALLENGE and LECTURE_REMINDER");


// 2. Verify student-interactive-banner.component.js
console.log("\n--- TEST SUITE 2: INTERACTIVE BANNER COMPONENT RENDERING ---");
const { renderStudentInteractiveBanner } = await import(
  "../src/features/notifications/components/student-interactive-banner.component.js"
);

// Test Python Challenge Topic
const htmlPython = renderStudentInteractiveBanner({
  student: { name: "أحمد علي", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30" },
  activeTopic: "python-challenge",
  isCollapsed: false
});

assert.ok(htmlPython.includes("تحدي وادي بايثون"), "Must mention Python Valley challenge");
assert.ok(htmlPython.includes("وادي المتغيرات"), "Must mention Variables Valley level");
assert.ok(htmlPython.includes("+50 XP"), "Must mention XP reward");
assert.ok(htmlPython.includes('data-interactive-navigate="python-adventure"'), "Must have action to navigate to python-adventure");
assert.ok(htmlPython.includes("data-banner-topic=\"python-challenge\""), "Must have tab for python challenge");
console.log("  ✅ [PASS] Python Valley Challenge interactive alert renders with XP reward, level, and CTA");

// Test Lecture Reminder Topic
const htmlLecture = renderStudentInteractiveBanner({
  student: { name: "أحمد علي", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30" },
  activeTopic: "lecture-reminder",
  isCollapsed: false
});

assert.ok(htmlLecture.includes("مواعيد المحاضرات والدروس"), "Must mention lectures");
assert.ok(htmlLecture.includes("مجموعة الأحد والأربعاء | 9:00 - 10:30"), "Must display student group schedule");
assert.ok(htmlLecture.includes('data-interactive-navigate="videos"'), "Must have action to navigate to videos");
console.log("  ✅ [PASS] Lecture appointment interactive alert renders with group schedule and materials CTA");

// Test Task Reminder Topic
const htmlTask = renderStudentInteractiveBanner({
  student: { name: "أحمد علي", group: "مجموعة الأحد والأربعاء | 9:00 - 10:30" },
  activeTopic: "task-reminder",
  isCollapsed: false
});

assert.ok(htmlTask.includes("تاسكات بايثون العملية"), "Must mention practical coding tasks");
assert.ok(htmlTask.includes("من 10"), "Must mention /10 grading criteria");
assert.ok(htmlTask.includes('data-interactive-navigate="tasks"'), "Must have action to navigate to tasks");
console.log("  ✅ [PASS] Tasks interactive alert renders with grading criteria and submission CTA");

// Test Collapsed State
const htmlCollapsed = renderStudentInteractiveBanner({
  student: { name: "أحمد علي" },
  activeTopic: "python-challenge",
  isCollapsed: true
});

assert.ok(htmlCollapsed.includes("is-collapsed"), "Must have is-collapsed class");
assert.ok(htmlCollapsed.includes("expandInteractiveBannerBtn"), "Must have expand button");
console.log("  ✅ [PASS] Collapsed state renders compact bar with expand toggle");


// 3. Verify Layout & Page Mounting
console.log("\n--- TEST SUITE 3: LAYOUT & PAGE INTEGRATION ---");
const layoutPath = path.join(rootDir, "src/shared/layouts/StudentLayout/student-layout.component.js");
const layoutContent = fs.readFileSync(layoutPath, "utf-8");
assert.ok(layoutContent.includes('id="studentInteractiveAlertSlot"'), "Layout must provide #studentInteractiveAlertSlot");
console.log("  ✅ [PASS] StudentLayout includes #studentInteractiveAlertSlot above tab sections");

const studentHtmlPath = path.join(rootDir, "pages/student.html");
const studentHtmlContent = fs.readFileSync(studentHtmlPath, "utf-8");
assert.ok(
  studentHtmlContent.includes("NotificationsController.mountStudentInteractiveBanner"),
  "student.html must mount interactive banner"
);
console.log("  ✅ [PASS] student.html mounts interactive banner on session initialization");

const controllerPath = path.join(rootDir, "src/features/notifications/notifications.controller.js");
const controllerContent = fs.readFileSync(controllerPath, "utf-8");
assert.ok(
  controllerContent.includes("mountStudentInteractiveBanner"),
  "NotificationsController must export/define mountStudentInteractiveBanner"
);
console.log("  ✅ [PASS] NotificationsController exposes mountStudentInteractiveBanner helper");


// 4. Verify CSS Styles
console.log("\n--- TEST SUITE 4: CSS STYLES INTEGRITY ---");
const cssPath = path.join(rootDir, "src/styles/components.css");
const cssContent = fs.readFileSync(cssPath, "utf-8");
assert.ok(cssContent.includes(".student-interactive-banner"), "CSS must define .student-interactive-banner");
assert.ok(cssContent.includes(".banner-tab-pill"), "CSS must define .banner-tab-pill");
assert.ok(cssContent.includes(".banner-primary-action-btn"), "CSS must define .banner-primary-action-btn");
assert.ok(cssContent.includes(".banner-stat-chip"), "CSS must define .banner-stat-chip");
console.log("  ✅ [PASS] Modern interactive banner styling defined in components.css");

console.log("\n===================================================================");
console.log("📊 ALL INTERACTIVE NOTIFICATION CHECKS PASSED SUCCESSFULLY!");
console.log("===================================================================\n");
