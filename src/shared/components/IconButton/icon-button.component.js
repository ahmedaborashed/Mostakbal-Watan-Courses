// src/shared/components/IconButton/icon-button.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an Icon Button.
 * @param {object} options
 * @param {string} [options.id]
 * @param {string} options.icon - Icon symbol or SVG
 * @param {string} options.ariaLabel - Accessible label
 * @param {"primary"|"secondary"|"ghost"|"outline"|"danger"} [options.variant]
 * @param {"sm"|"md"|"lg"} [options.size]
 * @param {string} [options.className]
 * @param {string} [options.extraAttrs]
 * @returns {string}
 */
export function renderIconButton({
  id = "",
  icon = "🔘",
  ariaLabel = "إجراء",
  variant = "ghost",
  size = "",
  className = "",
  extraAttrs = ""
} = {}) {
  const idAttr = id ? `id="${escapeHtml(id)}"` : "";
  const sizeClass = size ? `btn-${size}` : "";

  return `
    <button
      ${idAttr}
      type="button"
      class="btn btn-icon btn-${escapeHtml(variant)} ${sizeClass} ${escapeHtml(className)}"
      aria-label="${escapeHtml(ariaLabel)}"
      title="${escapeHtml(ariaLabel)}"
      ${extraAttrs}
    >
      <span aria-hidden="true">${icon}</span>
    </button>
  `;
}
