// src/core/constants.js

export const ROLES = Object.freeze({
  STUDENT: "student",
  TEACHER: "teacher",
  ADMIN: "admin"
});

export const GROUPS = Object.freeze([
  "مجموعة الأحد والأربعاء | 7:00 - 8:30",
  "مجموعة الأحد والأربعاء | 9:00 - 10:30"
]);

export const COLLECTIONS = Object.freeze({
  USERS: "users",
  STUDENTS: "students",
  VIDEOS: "videos",
  VIDEO_LOGS: "video_logs",
  VIDEO_PROGRESS: "video_progress",
  EXAMS: "exams",
  ATTEMPTS: "attempts",
  RESULTS: "results",
  ASSIGNMENTS: "assignments",
  SUBMISSIONS: "submissions",
  ATTENDANCE_SESSIONS: "attendance_sessions",
  RECORDS: "records",
  PYTHON_ADVENTURE_PROGRESS: "python_adventure_progress",
  POINTS_LEDGER: "points_ledger",
  COMPETITIONS: "competitions",
  STUDENT_GAMIFICATION: "student_gamification",
  NOTIFICATIONS: "notifications"
});

export const NOTIFICATION_TYPES = Object.freeze({
  EXAM_AVAILABLE: "exam_available",
  EXAM_RESULT: "exam_result",
  ASSIGNMENT_NEW: "assignment_new",
  ASSIGNMENT_GRADED: "assignment_graded",
  ATTENDANCE_RECORDED: "attendance_recorded",
  ATTENDANCE_WARNING: "attendance_warning",
  RANKING_PROMOTED: "ranking_promoted",
  ACHIEVEMENT_UNLOCKED: "achievement_unlocked",
  GAME_LEVEL_UP: "game_level_up",
  COMPETITION_START: "competition_start",
  PYTHON_CHALLENGE: "python_challenge",
  LECTURE_REMINDER: "lecture_reminder",
  GENERAL: "general"
});

export const STORAGE_PATHS = Object.freeze({
  SUBMISSIONS: "submissions",
  MATERIALS: "course_materials"
});

export const STORAGE_KEYS = Object.freeze({
  THEME: "future_watan_theme",
  LANGUAGE: "future_watan_lang",
  FONT_SCALE: "future_watan_font_scale",
  CURRENT_EXAM: "future_watan_current_exam",
  EXAM_DRAFT_PREFIX: "future_watan_exam_draft_",
  PYTHON_ADVENTURE_DRAFT: "future_watan_py_adventure_draft_"
});

export const THEMES = Object.freeze({
  GREEN: "green",
  CYAN: "cyan",
  PURPLE: "purple",
  GOLD: "gold"
});

export const LANGUAGES = Object.freeze({
  AR: "ar",
  EN: "en"
});

export const FEATURES = Object.freeze({
  // Cloud Functions are undeployed on Firebase Spark tier (tesla-5fdef).
  // When false, features use direct resilient Firestore/Auth/Storage operations without 404 network failures.
  USE_CLOUD_FUNCTIONS: false
});
