// src/shared/components/Button/button.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a styled Button.
 * @param {object} options
 * @param {string} [options.id]
 * @param {string} [options.text]
 * @param {string} [options.icon]
 * @param {"primary"|"secondary"|"ghost"|"outline"|"danger"|"success"|"warning"|"gold"} [options.variant]
 * @param {"sm"|"md"|"lg"} [options.size]
 * @param {"button"|"submit"|"reset"} [options.type]
 * @param {string} [options.className]
 * @param {boolean} [options.disabled]
 * @param {boolean} [options.loading]
 * @param {string} [options.extraAttrs]
 * @returns {string}
 */
export function renderButton({
  id = "",
  text = "",
  icon = "",
  variant = "primary",
  size = "",
  type = "button",
  className = "",
  disabled = false,
  loading = false,
  extraAttrs = ""
} = {}) {
  const variantClass = `btn-${variant}`;
  const sizeClass = size ? `btn-${size}` : "";
  const loadingClass = loading ? "is-loading" : "";
  const idAttr = id ? `id="${escapeHtml(id)}"` : "";
  const disabledAttr = disabled || loading ? "disabled" : "";

  return `
    <button
      ${idAttr}
      type="${escapeHtml(type)}"
      class="btn ${variantClass} ${sizeClass} ${loadingClass} ${escapeHtml(className)}"
      ${disabledAttr}
      ${extraAttrs}
    >
      ${icon ? `<span class="btn-icon-slot" aria-hidden="true">${icon}</span>` : ""}
      <span>${escapeHtml(text)}</span>
    </button>
  `;
}
