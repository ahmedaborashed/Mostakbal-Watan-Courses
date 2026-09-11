// src/features/exams/exam.state.js
import { Store } from "../../core/store.js";

export const examState = new Store({
  exams: [],
  activeExam: null,
  questions: [],
  answers: {},
  timeRemaining: 0,
  timerActive: false,
  isSubmitting: false,
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
