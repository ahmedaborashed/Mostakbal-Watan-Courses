// src/features/exams/exam.state.js
import { Store } from "../../core/store.js";

export const examState = new Store({
  // Student Exams State
  exams: [],
  availableExams: [],
  activeExam: null,
  activeAttempt: null,
  questions: [],
  answers: {},
  currentQuestionIndex: 0,
  isInReviewMode: false,
  isNavigatorCollapsed: false,
  timeRemaining: 0,
  timerActive: false,
  isSubmitting: false,
  submissionState: "idle", // "idle" | "submitting" | "submitted" | "error"
  lastResult: null,
  loading: false,
  error: null,

  // Admin Management State
  adminExams: [],
  adminResultsMap: {},
  selectedExam: null,
  editingExam: null,
  editingQuestions: [],
  currentStep: 1,
  adminFilters: {
    searchQuery: "",
    group: "ALL",
    status: "ALL",
    sort: "newest"
  },
  saving: false
});
