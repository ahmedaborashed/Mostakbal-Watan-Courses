// src/services/auth.service.js
import { auth } from "../core/firebase.js";
import { signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { appStore } from "../core/store.js";

export const AuthService = {
  /**
   * Unified login that authenticates the user, extracts the Custom Claim,
   * and returns the user object and target redirect page.
   */
  async login(username, password) {
    const cleanUser = (username || "").trim();
    const cleanPass = (password || "").trim();

    if (!cleanUser || !cleanPass) {
      throw new Error("يرجى إدخال اسم المستخدم وكلمة المرور.");
    }

    let userCredential = null;
    let targetEmail = "";

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
        throw new Error("بيانات الدخول غير صحيحة، يرجى التأكد والمحاولة مرة أخرى ❌");
      }
    }

    const user = userCredential.user;
    const tokenResult = await user.getIdTokenResult(true); // Force refresh to get claims
    const claims = tokenResult.claims || {};

    let role = claims.role;
    if (!role) {
      if (targetEmail.endsWith("@admin.local")) role = "admin";
      else if (targetEmail.endsWith("@system.local")) role = "teacher";
      else role = "student";
    }

    appStore.set("user", user);
    appStore.set("role", role);
    appStore.set("claims", claims);

    let redirectPage = "student.html";
    if (role === "admin") redirectPage = "admin.html";
    else if (role === "teacher") redirectPage = "teacher.html";

    return {
      user,
      role,
      redirectPage
    };
  },

  async logout() {
    await signOut(auth);
    appStore.set("user", null);
    appStore.set("role", null);
    window.location.replace("index.html");
  }
};
