// src/shared/components/Toast/toast.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
  }
}

/**
 * Displays a toast message with icon and auto-dismiss.
 * @param {string} message - Message text
 * @param {"info"|"success"|"error"|"warning"} [type="info"] - Status type
 * @param {number} [duration=3400] - Display time in ms
 */
export function showToast(message, type = "info", duration = 3400) {
  ensureContainer();

  const item = document.createElement("div");
  item.className = `toast-item toast-${type}`;
  item.setAttribute("role", "status");
  item.setAttribute("aria-live", "polite");

  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "❌";
  if (type === "warning") icon = "⚠️";

  item.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-text">${escapeHtml(message)}</span>
  `;

  toastContainer.appendChild(item);

  // Animate in
  requestAnimationFrame(() => {
    item.classList.add("show");
  });

  setTimeout(() => {
    item.classList.remove("show");
    setTimeout(() => item.remove(), 280);
  }, duration);
}

// Window attachment for legacy caller compatibility
if (typeof window !== "undefined") {
  window.showToast = showToast;
}
