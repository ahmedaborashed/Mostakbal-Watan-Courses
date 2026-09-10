// auth-guard.js - Modernized wrapper delegating to src/core/guard.js
import { protectRoute } from "./src/core/guard.js";

export function protectPage(requiredRole = null) {
  if (!requiredRole) {
    return protectRoute(["student", "teacher", "admin"]);
  }
  return protectRoute(requiredRole);
}

export { protectRoute };