// src/shared/components/Badge/badge.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a Badge.
 * @param {object} options
 * @param {string} options.text
 * @param {"primary"|"success"|"danger"|"warning"|"gold"} options.variant
 * @param {string} options.icon
 */
export function renderBadge({ text = "", variant = "primary", icon = "" }) {
  const variantClass = variant !== "primary" ? `badge-${variant}` : "";
  return `
    <span class="badge ${variantClass}">
      ${icon ? `<span class="badge-icon">${icon}</span>` : ""}
      <span>${escapeHtml(text)}</span>
    </span>
  `;
}
