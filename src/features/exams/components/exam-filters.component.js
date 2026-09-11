// src/features/exams/components/exam-filters.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { GROUPS } from "../../../core/constants.js";
import { renderSearchBar } from "../../../shared/components/SearchBar/search-bar.component.js";

/**
 * Returns HTML string for the Admin Exams Filter Bar.
 * @param {object} options
 * @param {string} [options.searchQuery=""]
 * @param {string} [options.groupFilter="ALL"]
 * @param {string} [options.statusFilter="ALL"]
 * @param {string} [options.sortOrder="newest"]
 * @param {"cards"|"table"} [options.viewMode="cards"]
 * @returns {string}
 */
export function renderExamFilters({
  searchQuery = "",
  groupFilter = "ALL",
  statusFilter = "ALL",
  sortOrder = "newest",
  viewMode = "cards"
} = {}) {
  const groupOptions = [
    `<option value="ALL" ${groupFilter === "ALL" ? "selected" : ""}>جميع المجموعات</option>`,
    ...GROUPS.map(
      (g) => `<option value="${escapeHtml(g)}" ${groupFilter === g ? "selected" : ""}>${escapeHtml(g)}</option>`
    )
  ].join("");

  const statusOptions = [
    { value: "ALL", label: "جميع الحالات" },
    { value: "ACTIVE", label: "● نشط" },
    { value: "INACTIVE", label: "○ معطل" },
    { value: "UPCOMING", label: "⏰ قريباً" },
    { value: "EXPIRED", label: "⌛ منتهي" }
  ]
    .map(
      (s) => `<option value="${s.value}" ${statusFilter === s.value ? "selected" : ""}>${s.label}</option>`
    )
    .join("");

  const sortOptions = [
    { value: "newest", label: "الأحدث أولاً" },
    { value: "oldest", label: "الأقدم أولاً" }
  ]
    .map(
      (s) => `<option value="${s.value}" ${sortOrder === s.value ? "selected" : ""}>${s.label}</option>`
    )
    .join("");

  return `
    <div class="card mb-4" style="padding: var(--space-4);">
      <div class="d-flex items-center justify-between gap-3 flex-wrap">
        <!-- Search bar -->
        <div style="flex: 1; min-width: 220px; max-width: 380px;">
          ${renderSearchBar({
            id: "adminExamSearchInput",
            placeholder: "بحث باسم الامتحان أو الوصف...",
            value: searchQuery
          })}
        </div>

        <!-- Filter Selects -->
        <div class="d-flex items-center gap-2 flex-wrap" style="flex: 2; justify-content: flex-end;">
          <!-- Group Select -->
          <div style="min-width: 170px;">
            <select id="adminExamGroupFilter" class="form-select" aria-label="تصفية حسب المجموعة" style="font-size: var(--font-size-xs); padding-block: 0.55rem;">
              ${groupOptions}
            </select>
          </div>

          <!-- Status Select -->
          <div style="min-width: 130px;">
            <select id="adminExamStatusFilter" class="form-select" aria-label="تصفية حسب الحالة" style="font-size: var(--font-size-xs); padding-block: 0.55rem;">
              ${statusOptions}
            </select>
          </div>

          <!-- Sort Select -->
          <div style="min-width: 120px;">
            <select id="adminExamSortFilter" class="form-select" aria-label="ترتيب حسب التاريخ" style="font-size: var(--font-size-xs); padding-block: 0.55rem;">
              ${sortOptions}
            </select>
          </div>

          <!-- View Mode Toggle (Cards vs Table) -->
          <div class="d-flex items-center gap-1 p-1" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle);">
            <button
              type="button"
              id="adminExamViewCardsBtn"
              class="btn btn-ghost btn-sm ${viewMode === "cards" ? "active" : ""}"
              title="عرض كبطاقات"
              aria-label="عرض كبطاقات"
              style="padding: 0.35rem 0.6rem; min-height: auto; ${viewMode === "cards" ? "background: var(--color-surface-elevated); box-shadow: var(--shadow-sm);" : ""}"
            >
              <span aria-hidden="true">🗂️</span>
            </button>
            <button
              type="button"
              id="adminExamViewTableBtn"
              class="btn btn-ghost btn-sm ${viewMode === "table" ? "active" : ""}"
              title="عرض كجدول"
              aria-label="عرض كجدول"
              style="padding: 0.35rem 0.6rem; min-height: auto; ${viewMode === "table" ? "background: var(--color-surface-elevated); box-shadow: var(--shadow-sm);" : ""}"
            >
              <span aria-hidden="true">📋</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
