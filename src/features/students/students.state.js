// src/features/students/students.state.js
import { Store } from "../../core/store.js";

export const studentsState = new Store({
  students: [],
  selectedStudent: null,
  filterGroup: "ALL",
  searchQuery: "",
  loading: false,
  error: null
});
