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
  error: null
});
