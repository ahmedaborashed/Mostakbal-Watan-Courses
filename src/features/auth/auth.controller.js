// src/features/auth/auth.controller.js
import { AuthService } from "./auth.service.js";
import { authState } from "./auth.state.js";
import { validateLogin } from "../../shared/validators/auth.validator.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { showLoadingScreen, hideLoadingScreen } from "../../shared/components/Loader/loader.component.js";

export const AuthController = {
  /**
   * Orchestrates user login process.
   */
  async submitLogin(username, password) {
    const errorEl = document.getElementById("loginErrorMsg");
    if (errorEl) {
      errorEl.classList.add("d-none");
      errorEl.textContent = "";
    }

    try {
      const validated = validateLogin(username, password);
      authState.set("isSubmitting", true);

      const submitBtn = document.getElementById("submitLoginBtn");
      const originalText = submitBtn?.innerText || "تسجيل الدخول 🚀";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "جاري التحقق... ⏳";
      }

      const { redirectPage } = await AuthService.login(validated.username, validated.password);

      showLoadingScreen("أهلاً بيك 🚀 جاري توجيهك...");
      setTimeout(() => {
        window.location.href = redirectPage;
      }, 450);
    } catch (err) {
      console.error("Login submission error:", err);
      authState.set("error", err.message);

      const submitBtn = document.getElementById("submitLoginBtn");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "تسجيل الدخول 🚀";
      }

      if (errorEl) {
        errorEl.textContent = err.message;
        errorEl.classList.remove("d-none");
      }
      showToast(err.message, "error");
    } finally {
      authState.set("isSubmitting", false);
    }
  },

  /**
   * Orchestrates user logout.
   */
  async logout() {
    showToast("جاري تسجيل الخروج...", "info");
    await AuthService.logout();
  },

  /**
   * Binds the login form submit event.
   */
  initLoginForm() {
    const form = document.getElementById("loginForm") || document.getElementById("login");
    const submitBtn = document.getElementById("submitLoginBtn") || document.querySelector("#login button");

    const onLoginSubmit = async () => {
      const usernameInput = document.getElementById("loginUsername") || document.querySelector("input[name='username']");
      const passwordInput = document.getElementById("loginPassword") || document.querySelector("input[name='password']");

      const username = usernameInput?.value || "";
      const password = passwordInput?.value || "";

      await this.submitLogin(username, password);
    };

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        onLoginSubmit();
      });
    }

    if (submitBtn && !submitBtn.hasAttribute("data-bound")) {
      submitBtn.setAttribute("data-bound", "true");
      submitBtn.addEventListener("click", (e) => {
        e.preventDefault();
        onLoginSubmit();
      });
    }
  }
};

// Expose on window for legacy button inline handlers if any
if (typeof window !== "undefined") {
  window.login = () => {
    const username = document.getElementById("loginUsername")?.value || "";
    const password = document.getElementById("loginPassword")?.value || "";
    AuthController.submitLogin(username, password);
  };
  window.logout = () => AuthController.logout();
}
