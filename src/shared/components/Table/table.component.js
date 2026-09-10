// src/shared/components/Table/table.component.js
import { escapeHtml } from "../../utils/dom.utils.js";

/**
 * Returns HTML string for a styled Data Table.
 * @param {object} options
 * @param {string[]} options.headers - Array of column header labels
 * @param {Array<string[]>} options.rows - Array of row cell values (can include HTML strings)
 * @param {string} options.emptyMessage - Display message when rows is empty
 */
export function renderTable({ headers = [], rows = [], emptyMessage = "لا توجد بيانات متاحة حالياً." }) {
  if (!rows || rows.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">📋</div>
        <div class="empty-state-title">${escapeHtml(emptyMessage)}</div>
      </div>
    `;
  }

  return `
    <div class="table-wrapper">
      <table class="table-modern">
        <thead>
          <tr>
            ${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (r) => `
            <tr>
              ${r.map((cell) => `<td>${cell !== null && cell !== undefined ? cell : "—"}</td>`).join("")}
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}
