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
export function redirectToLogin() {
  const isPagesDir = window.location.pathname.includes("/pages/");
  window.location.replace(isPagesDir ? "../index.html" : "index.html");
}

export function protectRoute(allowedRoles, { timeoutMs = 2800 } = {}) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return new Promise((resolve, reject) => {
    let settled = false;

    // Fail-safe watchdog: Never allow route guard to hang indefinitely
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      console.warn(`[RouteGuard] Auth check timed out after ${timeoutMs}ms. Redirecting to login.`);
      try { unsubscribe(); } catch (_) {}
      redirectToLogin();
      reject(new Error("AUTH_TIMEOUT: تعذر التحقق من الجلسة في الوقت المحدد."));
    }, timeoutMs);

    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (user) => {
          if (settled) return;

          if (!user) {
            settled = true;
            clearTimeout(timer);
            try { unsubscribe(); } catch (_) {}
            redirectToLogin();
            reject(new Error("UNAUTHENTICATED: يرجى تسجيل الدخول أولاً."));
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
              settled = true;
              clearTimeout(timer);
              try { unsubscribe(); } catch (_) {}
              await signOut(auth).catch(() => {});
              redirectToLogin();
              reject(new Error("UNAUTHORIZED_ROLE: حسابك غير مخول للوصول إلى هذه الصفحة."));
              return;
            }

            settled = true;
            clearTimeout(timer);
            try { unsubscribe(); } catch (_) {}
            resolve({ user, role, claims });
          } catch (err) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            console.error("Auth guard verification error:", err);
            try { unsubscribe(); } catch (_) {}
            redirectToLogin();
            reject(err);
          }
        },
        (authError) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          console.error("Auth state observer error:", authError);
          try { unsubscribe(); } catch (_) {}
          redirectToLogin();
          reject(authError);
        }
      );
    } catch (initErr) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      console.error("Failed to attach auth observer:", initErr);
      redirectToLogin();
      reject(initErr);
    }
  });
}
