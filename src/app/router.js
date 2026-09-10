// src/app/router.js
import { protectRoute } from "../core/guard.js";
import { ROLES } from "../core/constants.js";

export const Router = {
  /**
   * Enforces role security on the current page.
   * @param {string|string[]} allowedRoles
   */
  async guard(allowedRoles) {
    return await protectRoute(allowedRoles);
  },

  navigateToRole(role) {
    if (role === ROLES.ADMIN) window.location.href = "admin.html";
    else if (role === ROLES.TEACHER) window.location.href = "teacher.html";
    else window.location.href = "student.html";
  },

  navigateToLogin() {
    window.location.href = "index.html";
  }
};
