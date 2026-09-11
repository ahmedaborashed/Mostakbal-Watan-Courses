// src/features/assignments/assignment.state.js
import { Store } from "../../core/store.js";

export const assignmentState = new Store({
  assignments: [],
  submissions: new Map(),
  activeAssignment: null,
  activeSubmission: null,
  assignmentLoading: false,
  submissionLoading: false,
  uploading: false,
  submissionSuccess: false,
  submissionError: null,
  loading: false,
  error: null
});
