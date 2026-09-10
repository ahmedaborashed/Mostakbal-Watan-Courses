// src/features/assignments/assignment.state.js
import { Store } from "../../core/store.js";

export const assignmentState = new Store({
  assignments: [],
  submissions: new Map(),
  activeAssignment: null,
  isUploading: false,
  loading: false,
  error: null
});
