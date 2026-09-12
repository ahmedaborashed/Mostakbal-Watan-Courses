// src/features/students/components/student-list.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderTable } from "../../../shared/components/Table/table.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the student management list view.
 * @param {object} options
 * @param {Array} options.students - Filtered student array
 * @param {boolean} options.canDelete - Whether delete is allowed
 * @param {number} options.totalCount - Total student count (before filter)
 */
export function renderStudentListView({ students = [], canDelete = false, totalCount = 0, absencesMap = new Map() }) {
  const filteredCount = students.length;
  const countLabel = totalCount > 0
    ? `عرض <strong>${filteredCount}</strong> طالب من أصل <strong>${totalCount}</strong>`
    : `<strong>${filteredCount}</strong> طالب`;

  const filterToolbarHtml = `
    <div class="card mb-6">
      <div class="d-flex items-center justify-between gap-4 flex-wrap">
        <div class="d-flex gap-3 flex-1 flex-wrap">
          <div style="min-width:260px;flex:1;">
            <input
              type="search"
              id="studentSearchInput"
              class="form-input"
              placeholder="🔍 بحث باسم الطالب أو رقم الهاتف..."
              aria-label="بحث في قائمة الطلاب"
            />
          </div>
          <div style="min-width:220px;">
            <select id="studentGroupFilter" class="form-select" aria-label="تصفية بالمجموعة">
              <option value="ALL">جميع المجموعات (الكل)</option>
              ${GROUPS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
            </select>
          </div>
        </div>
        <div>
          ${renderButton({
            id: "openAddStudentModalBtn",
            text: "➕ إضافة طالب جديد",
            variant: "primary"
          })}
        </div>
      </div>
      <div class="mt-3 text-xs text-muted" id="studentCountIndicator">
        ${countLabel}
      </div>
    </div>
  `;

  const headers = ["#", "الطالب", "رقم الهاتف (اسم المستخدم)", "المجموعة", "الإجراءات"];
  const rows = students.map((s, index) => {
    const studentUid = s.id || s.firestoreId;
    const studentName = s.studentName || s.name || "—";
    const studentPhone = s.studentPhone || s.phone || "—";
    const studentGroup = s.studentGroup || s.group || "ALL";

    // Row number
    const rowNum = `<span class="text-muted font-bold">${index + 1}</span>`;

    // Absence stats check (Rule 30: 4 or more absences -> Highlight student in RED)
    const absInfo = typeof absencesMap?.get === "function"
      ? (absencesMap.get(studentUid) || absencesMap.get(studentPhone))
      : (absencesMap?.[studentUid] || absencesMap?.[studentPhone]);
    const absenceCount = typeof absInfo === "number" ? absInfo : (absInfo?.count || 0);
    const isHighAbsence = absenceCount >= 4;

    // Student cell with avatar & high absence warning badge
    const studentCell = `
      <div class="d-flex items-center gap-3">
        ${renderAvatar({ name: studentName, size: "sm" })}
        <div class="d-flex flex-col">
          <strong style="color: ${isHighAbsence ? 'var(--color-danger)' : 'var(--color-text-primary)'}; font-weight: 800;">
            ${escapeHtml(studentName)}
          </strong>
          ${
            isHighAbsence
              ? `
            <span
              class="badge badge-danger text-xs font-bold mt-1"
              style="width: fit-content; display: inline-flex; align-items: center; gap: 4px;"
              title="تجاوز الطالب الحد المسموح به للغياب (أكثر من 3 غيابات)"
            >
              <span aria-hidden="true">🔴</span>
              <span>${absenceCount} غيابات (إنذار غياب مرتفع)</span>
            </span>
          `
              : ""
          }
        </div>
      </div>
    `;

    // Actions cell with view, edit, reset password, and optionally delete
    const actionsHtml = `
      <div class="d-flex gap-2 items-center flex-wrap">
        ${renderButton({
          text: "👁️",
          size: "sm",
          variant: "outline",
          extraAttrs: `data-view-student="${escapeHtml(studentUid)}" title="عرض تفاصيل الطالب" aria-label="عرض تفاصيل ${escapeHtml(studentName)}"`
        })}
        ${renderButton({
          text: "✏️",
          size: "sm",
          variant: "outline",
          extraAttrs: `data-edit-student="${escapeHtml(studentUid)}" title="تعديل بيانات الطالب" aria-label="تعديل ${escapeHtml(studentName)}"`
        })}
        ${renderButton({
          text: "🔑",
          size: "sm",
          variant: "secondary",
          extraAttrs: `data-reset-pass="${escapeHtml(studentUid)}" data-student-name="${escapeHtml(studentName)}" title="إعادة تعيين كلمة المرور"`
        })}
        ${
          canDelete
            ? renderButton({
                text: "🗑️",
                size: "sm",
                variant: "danger",
                extraAttrs: `data-delete-student="${escapeHtml(studentUid)}" data-student-name="${escapeHtml(studentName)}" title="حذف الحساب"`
              })
            : ""
        }
      </div>
    `;

    return [
      rowNum,
      studentCell,
      `<span style="direction:ltr;display:inline-block;font-weight:700;">${escapeHtml(studentPhone)}</span>`,
      renderBadge({ text: studentGroup, variant: "gold" }),
      actionsHtml
    ];
  });

  const tableHtml = renderTable({
    headers,
    rows,
    emptyMessage: "لا يوجد طلاب مسجلين يطابقون شروط البحث الحالية."
  });

  return filterToolbarHtml + `<div id="studentsTableWrapper">${tableHtml}</div>`;
}
