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
        targetEmail = cleanUser;
        userCredential = await signInWithEmailAndPassword(auth, targetEmail, cleanPass);
      } else {
        // 2. Sequential fallback for existing legacy accounts (@admin.local -> @system.local -> @student.local)
        const attempts = [
          `${cleanUser}@admin.local`,
          `${cleanUser}@system.local`,
          `${cleanUser}@student.local`
        ];

        let lastError = null;
        for (const email of attempts) {
          try {
            userCredential = await signInWithEmailAndPassword(auth, email, cleanPass);
            targetEmail = email;
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!userCredential) {
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

      let redirectPage = "student.html";
      if (role === ROLES.ADMIN) redirectPage = "admin.html";
      else if (role === ROLES.TEACHER) redirectPage = "teacher.html";

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
      window.location.replace("index.html");
    } catch (err) {
      console.error("Logout Error:", err);
      window.location.replace("index.html");
    }
  }
};
