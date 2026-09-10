// auth-guard.js - Modernized wrapper with Custom Claims support
import { protectRoute } from "./src/core/guard.js";

export function protectPage(requiredRole = null) {
  if (!requiredRole) {
    protectRoute(["student", "teacher", "admin"]);
  } else {
    protectRoute(requiredRole);
  }
}

// Export protectRoute directly as well
export { protectRoute };