// src/features/lectures/lectures.state.js
import { Store } from "../../core/store.js";

export const lecturesState = new Store({
  lectures: [],
  watchedIds: new Set(),
  selectedLesson: null,
  searchQuery: "",
  groupFilter: "ALL",
  statusFilter: "ALL", // "ALL" | "ACTIVE" | "INACTIVE"
  sortOrder: "newest", // "newest" | "oldest"
  loading: false,
  saving: false,
  error: null
});
