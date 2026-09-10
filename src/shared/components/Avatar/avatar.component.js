// src/shared/components/Avatar/avatar.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an Avatar.
 * @param {object} options
 * @param {string} [options.name] - User name to extract initial from
 * @param {string} [options.imageUrl] - Image source URL
 * @param {"sm"|"md"|"lg"|"xl"} [options.size]
 * @param {string} [options.className]
 * @param {string} [options.extraAttrs]
 * @returns {string}
 */
export function renderAvatar({
  name = "م",
  imageUrl = "",
  size = "md",
  className = "",
  extraAttrs = ""
} = {}) {
  const sizeClass = `avatar-${size}`;
  const initial = name ? name.trim().charAt(0) : "م";

  return `
    <div class="avatar ${sizeClass} ${escapeHtml(className)}" ${extraAttrs}>
      ${
        imageUrl
          ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" />`
          : `<span>${escapeHtml(initial)}</span>`
      }
    </div>
  `;
}
