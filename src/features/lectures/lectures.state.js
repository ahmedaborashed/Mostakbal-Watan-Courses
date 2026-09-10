// src/features/lectures/lectures.state.js
import { Store } from "../../core/store.js";

export const lecturesState = new Store({
  lectures: [],
  watchedIds: new Set(),
  activeLecture: null,
  loading: false,
  error: null
});
