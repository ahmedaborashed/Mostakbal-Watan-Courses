// src/shared/components/ProgressBar/progress-bar.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for an accessible progress bar.
 * @param {object} options
 * @param {string} [options.label]
 * @param {number} [options.percentage] - 0 to 100
 * @param {string} [options.valueText]
 * @param {string} [options.colorVariant] - primary, success, warning, danger, gold
 * @param {string} [options.className]
 */
export function renderProgressBar({
  label = "",
  percentage = 0,
  valueText = "",
  colorVariant = "primary",
  className = ""
} = {}) {
  const safePercent = Math.min(100, Math.max(0, Math.round(percentage)));
  const displayVal = valueText || `${safePercent}%`;

  return `
    <div class="progress-wrapper ${escapeHtml(className)}">
      ${
        label || displayVal
          ? `
        <div class="progress-header">
          ${label ? `<span>${escapeHtml(label)}</span>` : ""}
          <span>${escapeHtml(displayVal)}</span>
        </div>
      `
          : ""
      }
      <div
        class="progress-track"
        role="progressbar"
        aria-valuenow="${safePercent}"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="${escapeHtml(label || "نسبة التقدم")}"
      >
        <div class="progress-fill" style="width:${safePercent}%;"></div>
      </div>
    </div>
  `;
}
