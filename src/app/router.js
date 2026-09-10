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
    const isPagesDir = window.location.pathname.includes("/pages/");
    const prefix = isPagesDir ? "" : "pages/";

    if (role === ROLES.ADMIN) {
      window.location.href = `${prefix}admin.html`;
    } else if (role === ROLES.TEACHER) {
      window.location.href = `${prefix}teacher.html`;
    } else {
      window.location.href = `${prefix}student.html`;
    }
  },

  navigateToLogin() {
    const isPagesDir = window.location.pathname.includes("/pages/");
    window.location.href = isPagesDir ? "../index.html" : "index.html";
  }
};
