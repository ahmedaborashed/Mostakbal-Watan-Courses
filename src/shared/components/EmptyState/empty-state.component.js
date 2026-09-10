// src/shared/components/EmptyState/empty-state.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an Empty State placeholder.
 */
export function renderEmptyState({
  icon = "📭",
  title = "لا توجد عناصر حالياً",
  description = "",
  actionButtonHtml = ""
}) {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3 class="empty-state-title">${escapeHtml(title)}</h3>
      ${description ? `<p class="empty-state-desc">${escapeHtml(description)}</p>` : ""}
      ${actionButtonHtml ? `<div class="mt-3">${actionButtonHtml}</div>` : ""}
    </div>
  `;
}
