// src/shared/components/StatCard/stat-card.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a KPI Statistic Card.
 * @param {object} options
 * @param {string} options.label - Metric name
 * @param {string|number} options.value - Primary value
 * @param {string} [options.icon] - Emoji or icon
 * @param {string} [options.color] - CSS color or class
 * @param {string} [options.subtitle] - Context label
 */
export function renderStatCard({
  label = "",
  value = 0,
  icon = "📊",
  color = "var(--color-primary)",
  subtitle = ""
} = {}) {
  return `
    <div class="stat-card">
      <div>
        <div class="stat-label">${escapeHtml(label)}</div>
        <div class="stat-value" style="color:${escapeHtml(color)};">${escapeHtml(value)}</div>
        ${subtitle ? `<div class="text-xs text-muted mt-1">${escapeHtml(subtitle)}</div>` : ""}
      </div>
      <div class="stat-icon" aria-hidden="true">${icon}</div>
    </div>
  `;
}
