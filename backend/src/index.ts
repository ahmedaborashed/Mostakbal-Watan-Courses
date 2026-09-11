import { onCall } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

import {
  createStudentHandler,
  resetStudentPasswordHandler,
  deleteStudentHandler
} from "./modules/students";

import {
  getAvailableExamsForStudentHandler,
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

import {
  getPythonAdventureProgressHandler,
  getPythonAdventureChallengeHandler,
  submitPythonAdventureChallengeHandler,
  getDailyChallengeHandler
} from "./modules/python-adventure";

import {
  getStudentGamificationProfileHandler,
  getLeaderboardHandler,
  getCompetitionsHandler,
  getCompetitionDetailsHandler,
  joinCompetitionHandler,
  getNotificationsHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler
} from "./modules/gamification";

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
export const getAvailableExamsForStudent = onCall(getAvailableExamsForStudentHandler);
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

// ==========================================
// 6. PYTHON ADVENTURE (GAMIFIED LEARNING)
// ==========================================
export const getPythonAdventureProgress = onCall(getPythonAdventureProgressHandler);
export const getPythonAdventureChallenge = onCall(getPythonAdventureChallengeHandler);
export const submitPythonAdventureChallenge = onCall(submitPythonAdventureChallengeHandler);
export const getDailyChallenge = onCall(getDailyChallengeHandler);

// ==========================================
// 7. GAMIFICATION, RANKINGS & COMPETITIONS
// ==========================================
export const getStudentGamificationProfile = onCall(getStudentGamificationProfileHandler);
export const getLeaderboard = onCall(getLeaderboardHandler);
export const getCompetitions = onCall(getCompetitionsHandler);
export const getCompetitionDetails = onCall(getCompetitionDetailsHandler);
export const joinCompetition = onCall(joinCompetitionHandler);
export const getNotifications = onCall(getNotificationsHandler);
export const markNotificationAsRead = onCall(markNotificationAsReadHandler);
export const markAllNotificationsAsRead = onCall(markAllNotificationsAsReadHandler);

