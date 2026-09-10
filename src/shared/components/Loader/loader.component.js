// src/shared/components/Loader/loader.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an inline loader.
 * @param {object} options
 * @param {string} [options.text]
 * @param {"normal"|"sm"} [options.size]
 */
export function renderLoader({ text = "جاري التحميل... ⏳", size = "normal" } = {}) {
  const sizeClass = size === "sm" ? "spinner-sm" : "";
  return `
    <div class="text-center py-6" role="status" aria-live="polite">
      <div class="spinner ${sizeClass}"></div>
      ${text ? `<p class="text-muted text-sm mt-3 font-semibold">${escapeHtml(text)}</p>` : ""}
    </div>
  `;
}

/**
 * Shows the full screen loading overlay if available in DOM.
 */
export function showLoadingScreen(message = "أهلاً بيك 🚀") {
  const screen = document.getElementById("loadingScreen");
  const count = document.getElementById("loadingCount");
  const text = document.getElementById("loadingText");
  if (screen) {
    if (text) text.innerText = message;
    if (count) count.innerText = "⏳";
    screen.style.display = "flex";
    screen.setAttribute("aria-hidden", "false");
  }
}

/**
 * Hides the full screen loading overlay.
 */
export function hideLoadingScreen() {
  const screen = document.getElementById("loadingScreen");
  if (screen) {
    screen.style.display = "none";
    screen.setAttribute("aria-hidden", "true");
  }
}
