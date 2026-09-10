// src/shared/components/Loader/loader.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an inline loader.
 */
export function renderLoader({ text = "جاري التحميل... ⏳", size = "normal" } = {}) {
  const sizeClass = size === "sm" ? "spinner-sm" : "";
  return `
    <div class="text-center py-4">
      <div class="spinner ${sizeClass}"></div>
      ${text ? `<p class="text-muted mt-2">${escapeHtml(text)}</p>` : ""}
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
  }
}

/**
 * Hides the full screen loading overlay.
 */
export function hideLoadingScreen() {
  const screen = document.getElementById("loadingScreen");
  if (screen) {
    screen.style.display = "none";
  }
}
