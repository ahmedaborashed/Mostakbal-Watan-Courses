import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import {
  createStudentHandler,
  resetStudentPasswordHandler,
  deleteStudentHandler
} from "./modules/students";

import {
  getExamForStudentHandler,
  startExamAttemptHandler,
  submitExamHandler,
  gradeEssayHandler
} from "./modules/exams";

import {
  createAttendanceSessionHandler,
  recordAttendanceBatchHandler
} from "./modules/attendance";

import {
  submitAssignmentHandler,
  gradeAssignmentHandler
} from "./modules/assignments";

import {
  setUserRoleHandler,
  syncUserClaimsHandler
} from "./modules/auth";

// Set global options: European region, timeout, memory
setGlobalOptions({
  region: "europe-west1",
  maxInstances: 10,
  timeoutSeconds: 60
});

// ==========================================
// 1. STUDENTS MANAGEMENT
// ==========================================
export const createStudent = onCall(createStudentHandler);
export const resetStudentPassword = onCall(resetStudentPasswordHandler);
export const deleteStudent = onCall(deleteStudentHandler);

// ==========================================
// 2. EXAMS & SECURE GRADING
// ==========================================
export const getExamForStudent = onCall(getExamForStudentHandler);
export const startExamAttempt = onCall(startExamAttemptHandler);
export const submitExam = onCall(submitExamHandler);
export const gradeEssay = onCall(gradeEssayHandler);

// ==========================================
// 3. ATTENDANCE MANAGEMENT
// ==========================================
export const createAttendanceSession = onCall(createAttendanceSessionHandler);
export const recordAttendanceBatch = onCall(recordAttendanceBatchHandler);

// ==========================================
// 4. ASSIGNMENTS & SUBMISSIONS
// ==========================================
export const submitAssignment = onCall(submitAssignmentHandler);
export const gradeAssignment = onCall(gradeAssignmentHandler);

// ==========================================
// 5. AUTH & ROLES
// ==========================================
export const setUserRole = onCall(setUserRoleHandler);
export const syncUserClaims = onCall(syncUserClaimsHandler);
