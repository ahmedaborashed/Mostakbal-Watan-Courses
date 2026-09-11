// src/features/lectures/components/lesson-filters.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the Lesson Filter & Search Toolbar.
 * @param {object} options
 * @param {boolean} [options.isStaff=false]
 * @param {string} [options.searchQuery=""]
 * @param {string} [options.groupFilter="ALL"]
 * @param {string} [options.statusFilter="ALL"]
 * @param {string} [options.sortOrder="newest"]
 * @returns {string}
 */
export function renderLessonFilters({
  isStaff = false,
  searchQuery = "",
  groupFilter = "ALL",
  statusFilter = "ALL",
  sortOrder = "newest"
} = {}) {
  const groupOptionsHtml = `
    <option value="ALL" ${groupFilter === "ALL" ? "selected" : ""}>جميع المجموعات</option>
    ${GROUPS.map((g) => `<option value="${escapeHtml(g)}" ${groupFilter === g ? "selected" : ""}>${escapeHtml(g)}</option>`).join("")}
  `;

  const statusOptionsHtml = isStaff
    ? `
      <option value="ALL" ${statusFilter === "ALL" ? "selected" : ""}>جميع الحالات</option>
      <option value="ACTIVE" ${statusFilter === "ACTIVE" ? "selected" : ""}>النشطة فقط 🟢</option>
      <option value="INACTIVE" ${statusFilter === "INACTIVE" ? "selected" : ""}>المعطلة فقط ⚪</option>
    `
    : `
      <option value="ALL" ${statusFilter === "ALL" ? "selected" : ""}>كل الدروس</option>
      <option value="NEW" ${statusFilter === "NEW" ? "selected" : ""}>دروس جديدة ✨</option>
      <option value="WATCHED" ${statusFilter === "WATCHED" ? "selected" : ""}>تمت المشاهدة ✓</option>
    `;

  return `
    <div class="card mb-4 lesson-filters-card">
      <div class="lesson-filters-grid">
        <!-- Search Input -->
        <div class="search-bar-wrapper">
          <span class="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="lessonSearchInput"
            class="form-input search-bar-input"
            placeholder="بحث في عنوان المحاضرة أو الوصف..."
            value="${escapeHtml(searchQuery)}"
            aria-label="بحث في المحاضرات"
          />
        </div>

        <!-- Group Filter -->
        <div class="filter-select-wrapper">
          <select id="lessonGroupFilter" class="form-select" aria-label="تصفية حسب المجموعة">
            ${groupOptionsHtml}
          </select>
        </div>

        <!-- Status Filter -->
        <div class="filter-select-wrapper">
          <select id="lessonStatusFilter" class="form-select" aria-label="تصفية حسب الحالة">
            ${statusOptionsHtml}
          </select>
        </div>

        <!-- Sort Order -->
        <div class="filter-select-wrapper">
          <select id="lessonSortOrder" class="form-select" aria-label="ترتيب المحاضرات">
            <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>الأحدث أولاً ⬇️</option>
            <option value="oldest" ${sortOrder === "oldest" ? "selected" : ""}>الأقدم أولاً ⬆️</option>
          </select>
        </div>
      </div>
    </div>
  `;
}
