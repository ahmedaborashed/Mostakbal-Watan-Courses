// src/core/guard.js
import { auth } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { appStore } from "./store.js";
import { ROLES } from "./constants.js";

/**
 * Modern Route Guard based on Custom Claims (with fallback to legacy email suffix).
 * @param {string|string[]} allowedRoles - 'student', 'teacher', 'admin', or array of roles
 * @returns {Promise<{user: object, role: string, claims: object}>}
 */
export function protectRoute(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        unsubscribe();
        window.location.replace("index.html");
        return;
      }

      try {
        // Fetch ID token result to extract Custom Claims
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims || {};
        const email = (user.email || "").toLowerCase();

        // Determine user role
        let role = claims.role;
        if (!role) {
          if (email.endsWith("@admin.local")) role = ROLES.ADMIN;
          else if (email.endsWith("@system.local")) role = ROLES.TEACHER;
          else if (email.endsWith("@student.local")) role = ROLES.STUDENT;
          else role = ROLES.STUDENT;
        }

        appStore.set("user", user);
        appStore.set("role", role);
        appStore.set("claims", claims);

        if (!roles.includes(role)) {
          unsubscribe();
          await signOut(auth);
          window.location.replace("index.html");
          return;
        }

        unsubscribe();
        resolve({ user, role, claims });
      } catch (err) {
        console.error("Auth guard verification error:", err);
        unsubscribe();
        window.location.replace("index.html");
        reject(err);
      }
    });
  });
}
