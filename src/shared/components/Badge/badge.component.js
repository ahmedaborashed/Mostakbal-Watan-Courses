// src/shared/components/Badge/badge.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a styled Badge.
 * @param {object} options
 * @param {string} options.text
 * @param {"primary"|"success"|"danger"|"warning"|"gold"|"info"|"neutral"} [options.variant]
 * @param {string} [options.icon]
 * @param {string} [options.className]
 * @returns {string}
 */
export function renderBadge({ text = "", variant = "primary", icon = "", className = "" } = {}) {
  const variantClass = variant !== "primary" ? `badge-${variant}` : "";
  return `
    <span class="badge ${variantClass} ${escapeHtml(className)}">
      ${icon ? `<span class="badge-icon-slot" aria-hidden="true">${icon}</span>` : ""}
      <span>${escapeHtml(text)}</span>
    </span>
  `;
}
