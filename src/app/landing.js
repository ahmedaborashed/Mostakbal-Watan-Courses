// src/app/landing.js - Bootstrap & Authentication Wiring for Landing Page
import { AuthController } from "../features/auth/auth.controller.js";
import { bootstrapApp } from "./bootstrap.js";
import { auth } from "../core/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { ROLES } from "../core/constants.js";
import { Router } from "./router.js";

// Initialize environment (theme, language, font scale)
bootstrapApp();

// Contact modal handlers
window.openContactOptions = function () {
  const modal = document.getElementById("contactModal");
  if (modal) modal.classList.add("show");
};

window.closeContactOptions = function () {
  const modal = document.getElementById("contactModal");
  if (modal) modal.classList.remove("show");
};

window.addEventListener("click", function (e) {
  const modal = document.getElementById("contactModal");
  if (e.target === modal) {
    window.closeContactOptions();
  }
});

// Initialize login form listeners
document.addEventListener("DOMContentLoaded", () => {
  AuthController.initLoginForm();

  // Smart Session Check: If already authenticated, update buttons to direct portal access
  try {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (!user) return;

      try {
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims || {};
        const email = (user.email || "").toLowerCase();

        let role = claims.role;
        if (!role) {
          if (email.endsWith("@admin.local")) role = ROLES.ADMIN;
          else if (email.endsWith("@system.local")) role = ROLES.TEACHER;
          else role = ROLES.STUDENT;
        }

        const roleLabel =
          role === ROLES.ADMIN
            ? "لوحة الإدارة"
            : role === ROLES.TEACHER
            ? "لوحة المعلم"
            : "بوابة الطالب";

        const loginBtns = document.querySelectorAll(".landing-login-btn");
        loginBtns.forEach((btn) => {
          btn.innerHTML = `<span>🚀</span><span>الدخول إلى ${roleLabel}</span>`;
          btn.onclick = (e) => {
            e.preventDefault();
            Router.navigateToRole(role);
          };
        });
      } catch (err) {
        console.warn("Session check warning:", err);
      }
    });
  } catch (authErr) {
    console.warn("Auth observer error in landing:", authErr);
  }
});

export { AuthController };
