// src/shared/components/ErrorState/error-state.component.js
import { escapeHtml } from "../../utils/dom.utils.js";
import { renderButton } from "../Button/button.component.js";

/**
 * Returns HTML string for an Error State display.
 * @param {object} options
 * @param {string} [options.title]
 * @param {string} options.message
 * @param {string} [options.retryBtnId]
 * @param {string} [options.retryBtnText]
 */
export function renderErrorState({
  title = "حدث خطأ غير متوقع",
  message = "تعذر تحميل البيانات المطلوبة، يرجى المحاولة مرة أخرى.",
  retryBtnId = "errorStateRetryBtn",
  retryBtnText = "إعادة المحاولة 🔄"
} = {}) {
  const retryBtnHtml = renderButton({
    id: retryBtnId,
    text: retryBtnText,
    variant: "primary",
    size: "sm"
  });

  return `
    <div class="empty-state" style="border-color:var(--color-danger);background:var(--color-danger-bg);" role="alert">
      <div class="empty-state-icon" aria-hidden="true">⚠️</div>
      <h3 class="empty-state-title text-danger">${escapeHtml(title)}</h3>
      <p class="empty-state-desc">${escapeHtml(message)}</p>
      <div class="mt-4">${retryBtnHtml}</div>
    </div>
  `;
}
