// script.js - Refactored with AuthService & Custom Claims Architecture
import { AuthService } from "./src/services/auth.service.js";

// Contact modal handlers
window.openContactOptions = function() {
  const modal = document.getElementById("contactModal");
  if (modal) modal.classList.add("show");
};

window.closeContactOptions = function() {
  const modal = document.getElementById("contactModal");
  if (modal) modal.classList.remove("show");
};

window.addEventListener("click", function(e) {
  const modal = document.getElementById("contactModal");
  if (e.target === modal) {
    window.closeContactOptions();
  }
});

// Fast loading transition
function startLoading(redirectPage) {
  const loadingScreen = document.getElementById("loadingScreen");
  const countText = document.getElementById("loadingCount");
  const loginForm = document.getElementById("login");

  if (loginForm) loginForm.style.display = "none";
  if (loadingScreen) {
    loadingScreen.style.display = "flex";
    if (countText) countText.innerText = "🚀";
  }

  // Smooth fast transition (0.5s instead of 5s)
  setTimeout(() => {
    window.location.href = redirectPage;
  }, 500);
}

// Unified Login Handler
window.login = async () => {
  const usernameInput = document.getElementById("loginUsername")?.value.trim();
  const passwordInput = document.getElementById("loginPassword")?.value.trim();

  if (!usernameInput || !passwordInput) {
    alert("ادخل البيانات ❗");
    return;
  }

  const loginBtn = document.querySelector("#login button");
  const originalText = loginBtn ? loginBtn.innerText : "";
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerText = "جاري التحقق... ⏳";
  }

  try {
    const { redirectPage } = await AuthService.login(usernameInput, passwordInput);
    startLoading(redirectPage);
  } catch (error) {
    console.error("Login Error:", error);
    alert(error.message || "بيانات الدخول غير صحيحة ❌");
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerText = originalText;
    }
  }
};