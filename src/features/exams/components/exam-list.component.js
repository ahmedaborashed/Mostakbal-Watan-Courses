// src/features/exams/components/exam-list.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderEmptyState } from "../../../shared/components/EmptyState/empty-state.component.js";
import { renderAdminExamCard } from "./exam-card.component.js";
import { renderExamFilters } from "./exam-filters.component.js";
import { renderExamStatusBadge } from "./exam-status-badge.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for the Admin Exam Table View.
 * @param {Array} exams
 * @param {object} resultsMap
 * @returns {string}
 */
export function renderAdminExamsTable(exams, resultsMap = {}) {
  return `
    <div class="table-wrapper mb-4" style="border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); overflow-x: auto;">
      <table class="table-modern w-full" style="font-size: var(--font-size-xs);">
        <thead>
          <tr>
            <th scope="col" style="text-align: start;">الامتحان</th>
            <th scope="col">المجموعة</th>
            <th scope="col">الأسئلة</th>
            <th scope="col">المدة</th>
            <th scope="col">التاريخ</th>
            <th scope="col">الحالة</th>
            <th scope="col" style="text-align: center;">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          ${exams
            .map((exam) => {
              const isActive = exam.active !== false;
              const qCount = Array.isArray(exam.questions) ? exam.questions.length : (exam.questionCount || 0);
              const duration = Number(exam.duration) || 30;
              const results = resultsMap[exam.id] || [];

              let dateText = "—";
              if (exam.startDate || exam.deadline) {
                const parts = [];
                if (exam.startDate) parts.push(formatDate(exam.startDate));
                if (exam.deadline) parts.push(formatDate(exam.deadline));
                dateText = parts.join(" - ");
              } else if (exam.createdAt) {
                dateText = formatDate(exam.createdAt);
              }

              return `
                <tr>
                  <td>
                    <div class="d-flex flex-col">
                      <strong class="font-extrabold" style="color: var(--color-text-primary); font-size: var(--font-size-sm);">${escapeHtml(exam.title || "امتحان بدون عنوان")}</strong>
                      ${exam.description ? `<span class="text-muted text-xs line-clamp-1">${escapeHtml(exam.description)}</span>` : ""}
                      ${results.length > 0 ? `<small class="text-accent font-bold mt-1">📊 ${results.length} محاولة</small>` : ""}
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-gold text-xs">${escapeHtml(exam.group || "جميع المجموعات")}</span>
                  </td>
                  <td>
                    <strong>${qCount}</strong> سؤال
                  </td>
                  <td>
                    ⏱️ ${duration} دقيقة
                  </td>
                  <td>
                    <span style="direction: ltr; display: inline-block;">${escapeHtml(dateText)}</span>
                  </td>
                  <td>
                    ${renderExamStatusBadge(exam)}
                  </td>
                  <td>
                    <div class="d-flex items-center justify-center gap-1">
                      <button
                        type="button"
                        class="btn btn-ghost btn-sm btn-admin-view-exam"
                        data-admin-view-exam="${escapeHtml(exam.id)}"
                        title="عرض التفاصيل"
                        aria-label="عرض تفاصيل ${escapeHtml(exam.title || "")}"
                      >
                        👁️
                      </button>
                      <button
                        type="button"
                        class="btn btn-secondary btn-sm btn-admin-edit-exam"
                        data-admin-edit-exam="${escapeHtml(exam.id)}"
                        title="تعديل"
                        aria-label="تعديل ${escapeHtml(exam.title || "")}"
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm ${isActive ? "btn-warning" : "btn-success"} btn-admin-toggle-exam"
                        data-admin-toggle-exam="${escapeHtml(exam.id)}"
                        data-current-active="${isActive}"
                        data-exam-title="${escapeHtml(exam.title || "")}"
                        title="${isActive ? "تعطيل" : "تفعيل"}"
                        aria-label="${isActive ? "تعطيل" : "تفعيل"} ${escapeHtml(exam.title || "")}"
                      >
                        ${isActive ? "⏸️" : "▶️"}
                      </button>
                      <button
                        type="button"
                        class="btn btn-danger btn-sm btn-admin-delete-exam"
                        data-admin-delete-exam="${escapeHtml(exam.id)}"
                        data-exam-title="${escapeHtml(exam.title || "")}"
                        title="حذف"
                        aria-label="حذف ${escapeHtml(exam.title || "")}"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Returns complete HTML string for the Admin Exams Section View.
 * @param {object} options
 * @param {Array} options.allExams
 * @param {Array} options.filteredExams
 * @param {object} [options.resultsMap={}]
 * @param {object} [options.filters={}]
 * @param {"cards"|"table"} [options.viewMode="cards"]
 * @returns {string}
 */
export function renderAdminExamsView({
  allExams = [],
  filteredExams = [],
  resultsMap = {},
  filters = {},
  viewMode = "cards"
} = {}) {
  const totalCount = allExams.length;
  const activeCount = allExams.filter((e) => e.active !== false).length;
  const inactiveCount = totalCount - activeCount;

  // Header Bar with Title, Subtitle, Counters, and Primary Action
  const headerHtml = `
    <div class="card mb-4" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border-primary);">
      <div class="d-flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div class="d-flex items-center gap-2 mb-1">
            <span style="font-size: 1.4rem;" aria-hidden="true">📝</span>
            <h2 class="page-title" style="margin: 0; font-size: 1.4rem; font-weight: 900; color: var(--color-text-primary);">الامتحانات</h2>
          </div>
          <p class="page-subtitle text-xs text-muted mb-2">
            إدارة وإنشاء ومتابعة الامتحانات الخاصة بالمنصة.
          </p>
          <div class="d-flex items-center gap-3 text-xs">
            <span>إجمالي الامتحانات: <strong class="text-primary font-bold">${totalCount}</strong></span>
            <span class="text-muted">·</span>
            <span>النشطة: <strong class="text-success font-bold">${activeCount}</strong></span>
            <span class="text-muted">·</span>
            <span>المعطلة: <strong class="text-danger font-bold">${inactiveCount}</strong></span>
          </div>
        </div>

        <div>
          ${renderButton({
            id: "openCreateExamBtn",
            text: "+ إنشاء امتحان",
            variant: "primary",
            className: "btn-md font-bold",
            icon: "➕"
          })}
        </div>
      </div>
    </div>
  `;

  // Filters Bar
  const filtersHtml = renderExamFilters({
    searchQuery: filters.searchQuery || "",
    groupFilter: filters.group || "ALL",
    statusFilter: filters.status || "ALL",
    sortOrder: filters.sort || "newest",
    viewMode
  });

  // Exams List Body (Cards or Table, or Empty State)
  let contentHtml = "";
  if (filteredExams.length === 0) {
    if (allExams.length === 0) {
      contentHtml = renderEmptyState({
        icon: "📝",
        title: "لا توجد امتحانات حتى الآن",
        description: "ابدأ بإنشاء أول امتحان للمنصة.",
        actionButtonHtml: `
          <button type="button" id="emptyStateCreateExamBtn" class="btn btn-primary">
            + إنشاء امتحان
          </button>
        `
      });
    } else {
      contentHtml = renderEmptyState({
        icon: "🔍",
        title: "لم نجد أي امتحانات مطابقة",
        description: "لا توجد امتحانات تطابق معايير البحث والتصفية المحددة. جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر.",
        actionButtonHtml: `
          <button type="button" id="resetAdminExamFiltersBtn" class="btn btn-secondary">
            إعادة ضبط الفلاتر 🔄
          </button>
        `
      });
    }
  } else if (viewMode === "table") {
    contentHtml = renderAdminExamsTable(filteredExams, resultsMap);
  } else {
    // Cards Grid View
    contentHtml = `
      <div class="grid-3 admin-exams-grid">
        ${filteredExams
          .map((exam) =>
            renderAdminExamCard({
              exam,
              resultsCount: (resultsMap[exam.id] || []).length
            })
          )
          .join("")}
      </div>
    `;
  }

  return headerHtml + filtersHtml + contentHtml;
}
