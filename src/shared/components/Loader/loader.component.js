// src/shared/components/Loader/loader.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a modern, high-fidelity loader.
 * @param {object} options
 * @param {string} [options.text]
 * @param {"normal"|"sm"} [options.size]
 */
export function renderLoader({ text = "جاري التحميل... ⏳", size = "normal" } = {}) {
  if (size === "sm") {
    return `
      <div class="modern-loader-sm text-center py-2" role="status" aria-live="polite">
        <span class="spinner spinner-sm" aria-hidden="true"></span>
        ${text ? `<span class="text-muted text-xs font-semibold">${escapeHtml(text)}</span>` : ""}
      </div>
    `;
  }

  return `
    <div class="modern-loader" role="status" aria-live="polite">
      <div class="modern-loader-spinner-wrap" aria-hidden="true">
        <div class="modern-loader-track"></div>
        <div class="modern-loader-arc"></div>
        <div class="modern-loader-dot"></div>
      </div>
      ${text ? `<p class="modern-loader-text">${escapeHtml(text)}</p>` : ""}
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
    screen.classList.remove("loading-hide");
    screen.style.display = "flex";
    screen.setAttribute("aria-hidden", "false");
  }
}

/**
 * Hides the full screen loading overlay with smooth fade.
 */
export function hideLoadingScreen() {
  const screen = document.getElementById("loadingScreen");
  if (screen) {
    screen.classList.add("loading-hide");
    screen.setAttribute("aria-hidden", "true");
    setTimeout(() => {
      if (screen.classList.contains("loading-hide")) {
        screen.style.display = "none";
      }
    }, 400);
  }
}
