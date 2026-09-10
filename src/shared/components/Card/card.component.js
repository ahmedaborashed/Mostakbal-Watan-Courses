// src/shared/components/Card/card.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a Card container.
 * @param {object} options
 * @param {string} [options.id]
 * @param {string} [options.title]
 * @param {string} [options.subtitle]
 * @param {string} [options.icon]
 * @param {string} [options.content]
 * @param {string} [options.footer]
 * @param {string} [options.headerAction]
 * @param {string} [options.className]
 * @param {boolean} [options.interactive]
 * @param {boolean} [options.glass]
 * @returns {string}
 */
export function renderCard({
  id = "",
  title = "",
  subtitle = "",
  icon = "",
  content = "",
  footer = "",
  headerAction = "",
  className = "",
  interactive = false,
  glass = false
} = {}) {
  const idAttr = id ? `id="${escapeHtml(id)}"` : "";
  const interactiveClass = interactive ? "card-interactive" : "";
  const glassClass = glass ? "card-glass" : "";

  return `
    <div ${idAttr} class="card ${interactiveClass} ${glassClass} ${escapeHtml(className)}">
      ${
        title || headerAction
          ? `
        <div class="card-header">
          <div>
            <div class="card-title">
              ${icon ? `<span class="card-icon" aria-hidden="true">${icon}</span>` : ""}
              <span>${escapeHtml(title)}</span>
            </div>
            ${subtitle ? `<div class="card-subtitle">${escapeHtml(subtitle)}</div>` : ""}
          </div>
          ${headerAction ? `<div class="card-header-action">${headerAction}</div>` : ""}
        </div>
      `
          : ""
      }
      <div class="card-body">
        ${content}
      </div>
      ${footer ? `<div class="card-footer">${footer}</div>` : ""}
    </div>
  `;
}
