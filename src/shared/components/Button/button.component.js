// src/shared/components/Button/button.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a styled Button.
 * @param {object} options
 * @returns {string}
 */
export function renderButton({
  id = "",
  text = "",
  icon = "",
  variant = "primary", // primary, secondary, danger, success, warning, outline
  size = "", // sm, lg, or empty
  type = "button",
  className = "",
  disabled = false,
  extraAttrs = ""
}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size ? `btn-${size}` : "";
  const idAttr = id ? `id="${escapeHtml(id)}"` : "";
  const disabledAttr = disabled ? "disabled" : "";

  return `
    <button
      ${idAttr}
      type="${escapeHtml(type)}"
      class="btn ${variantClass} ${sizeClass} ${escapeHtml(className)}"
      ${disabledAttr}
      ${extraAttrs}
    >
      ${icon ? `<span class="btn-icon">${icon}</span>` : ""}
      <span>${escapeHtml(text)}</span>
    </button>
  `;
}
