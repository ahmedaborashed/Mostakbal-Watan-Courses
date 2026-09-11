// src/features/lectures/components/lesson-filters.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the Student Lesson Library compact search & filter toolbar.
 * Calm, compact educational toolbar containing Search, Status filter, and Sort order.
 * @param {object} options
 * @param {string} [options.searchQuery=""]
 * @param {string} [options.statusFilter="ALL"]
 * @param {string} [options.sortOrder="newest"]
 * @returns {string}
 */
export function renderStudentLessonFilters({
  searchQuery = "",
  statusFilter = "ALL",
  sortOrder = "newest"
} = {}) {
  return `
    <div class="card mb-4 student-lesson-filters-card">
      <div class="student-filters-toolbar">
        <!-- Search Input -->
        <div class="search-bar-wrapper student-search-wrapper">
          <span class="search-bar-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            id="studentLessonSearchInput"
            class="form-input search-bar-input"
            placeholder="ابحث عن محاضرة أو موضوع..."
            value="${escapeHtml(searchQuery)}"
            aria-label="ابحث عن محاضرة"
          />
        </div>

        <div class="student-filters-controls">
          <!-- Status Filter -->
          <div class="filter-select-wrapper">
            <select id="studentLessonStatusFilter" class="form-select" aria-label="تصفية المحاضرات">
              <option value="ALL" ${statusFilter === "ALL" ? "selected" : ""}>كل الدروس</option>
              <option value="NEW" ${statusFilter === "NEW" ? "selected" : ""}>لم تتم المشاهدة</option>
              <option value="WATCHED" ${statusFilter === "WATCHED" ? "selected" : ""}>تمت المشاهدة</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="filter-select-wrapper">
            <select id="studentLessonSortOrder" class="form-select" aria-label="ترتيب المحاضرات">
              <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>الأحدث أولاً</option>
              <option value="oldest" ${sortOrder === "oldest" ? "selected" : ""}>الأقدم أولاً</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for the Teacher / Staff Lesson Filter & Search Toolbar.
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
