// src/features/attendance/attendance.state.js
import { Store } from "../../core/store.js";

export const attendanceState = new Store({
  sessions: [],
  studentRecords: [],
  activeSession: null,
  loading: false,
  error: null
});
