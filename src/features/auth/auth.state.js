// src/features/auth/auth.state.js
import { Store } from "../../core/store.js";

export const authState = new Store({
  isSubmitting: false,
  error: null,
  currentUser: null,
  role: null
});
