// src/shared/components/Card/card.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a Card container.
 */
export function renderCard({
  id = "",
  title = "",
  icon = "",
  content = "",
  footer = "",
  headerAction = "",
  className = "",
  interactive = false
}) {
  const idAttr = id ? `id="${escapeHtml(id)}"` : "";
  const interactiveClass = interactive ? "card-interactive" : "";

  return `
    <div ${idAttr} class="card ${interactiveClass} ${escapeHtml(className)}">
      ${
        title || headerAction
          ? `
        <div class="card-header">
          <div class="card-title">
            ${icon ? `<span class="card-icon">${icon}</span>` : ""}
            <span>${escapeHtml(title)}</span>
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
