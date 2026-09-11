// src/features/auth/auth.service.js
import { auth } from "../../core/firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { appStore } from "../../core/store.js";
import { ROLES } from "../../core/constants.js";
import { normalizeError, AuthError } from "../../core/errors.js";

export const AuthService = {
  /**
   * Authenticates user, extracts Custom Claims, updates global state, and returns redirect route.
   */
  async login(username, password) {
    const cleanUser = (username || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      throw new AuthError("يرجى إدخال اسم المستخدم وكلمة المرور.");
    }

    let userCredential = null;
    let targetEmail = "";

    try {
      // 1. If already full email, use directly
      if (cleanUser.includes("@")) {
        targetEmail = cleanUser.replace(/\s+/g, "");
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
      } else {
        // Convert Arabic-Indic digits to standard Latin digits and remove spaces/dashes
        let normalized = cleanUser
          .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
          .replace(/[\s\-_]/g, "");

        // Normalize Egyptian phone prefixes (+20, 0020, 201...) to 01...
        if (normalized.startsWith("+20")) {
          normalized = "0" + normalized.slice(3);
        } else if (normalized.startsWith("0020")) {
          normalized = "0" + normalized.slice(4);
        } else if (normalized.startsWith("201") && normalized.length === 12) {
          normalized = "0" + normalized.slice(2);
        }

        const isPhone = /^01[0125][0-9]{8}$/.test(normalized) || /^[0-9]{8,15}$/.test(normalized);

        // Prioritize @student.local if input is a phone number to minimize latency and prevent rate-limits
        const attempts = isPhone
          ? [
              `${normalized}@student.local`,
              `${normalized}@admin.local`,
              `${normalized}@system.local`
            ]
          : [
              `${normalized}@admin.local`,
              `${normalized}@system.local`,
              `${normalized}@student.local`
            ];

        let lastError = null;
        for (const email of attempts) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, cleanPass);
            targetEmail = email;
            break;
          } catch (err) {
            lastError = err;
            if (err.code === "auth/too-many-requests") {
              break;
            }
          }
        }

        if (!userCredential) {
          if (lastError && lastError.code === "auth/too-many-requests") {
            throw normalizeError(lastError);
          }
          throw new AuthError("بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مرة أخرى ❌");
        }
      }

      const user = userCredential.user;
      const tokenResult = await user.getIdTokenResult(true); // Force refresh to get claims
      const claims = tokenResult.claims || {};

      let role = claims.role;
      if (!role) {
        if (targetEmail.endsWith("@admin.local")) role = ROLES.ADMIN;
        else if (targetEmail.endsWith("@system.local")) role = ROLES.TEACHER;
        else role = ROLES.STUDENT;
      }

      appStore.set("user", user);
      appStore.set("role", role);
      appStore.set("claims", claims);

      let redirectPage = "pages/student.html";
      if (role === ROLES.ADMIN) redirectPage = "pages/admin.html";
      else if (role === ROLES.TEACHER) redirectPage = "pages/teacher.html";

      return {
        user,
        role,
        claims,
        redirectPage
      };
    } catch (err) {
      throw normalizeError(err);
    }
  },

  async logout() {
    try {
      await signOut(auth);
      appStore.set("user", null);
      appStore.set("role", null);
      appStore.set("claims", null);
      const isPagesDir = window.location.pathname.includes("/pages/");
      window.location.replace(isPagesDir ? "../index.html" : "index.html");
    } catch (err) {
      console.error("Logout Error:", err);
      window.location.replace("index.html");
    }
  }
};
