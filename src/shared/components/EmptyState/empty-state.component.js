// src/shared/components/EmptyState/empty-state.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an Empty State placeholder.
 * @param {object} options
 * @param {string} [options.icon]
 * @param {string} options.title
 * @param {string} [options.description]
 * @param {string} [options.actionButtonHtml]
 * @param {string} [options.className]
 */
export function renderEmptyState({
  icon = "📭",
  title = "لا توجد عناصر حالياً",
  description = "",
  actionButtonHtml = "",
  className = ""
} = {}) {
  return `
    <div class="empty-state ${escapeHtml(className)}">
      <div class="empty-state-icon" aria-hidden="true">${icon}</div>
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      ${description ? `<p class="empty-state-desc">${escapeHtml(description)}</p>` : ""}
      ${actionButtonHtml ? `<div class="mt-4">${actionButtonHtml}</div>` : ""}
    </div>
  `;
}
