// src/app/landing.js - Bootstrap & Authentication Wiring for Landing Page
import { AuthController } from "../features/auth/auth.controller.js";
import { bootstrapApp } from "./bootstrap.js";

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
});

export { AuthController };
