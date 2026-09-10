// src/features/students/components/student-list.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderTable } from "../../../shared/components/Table/table.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the student management list view.
 */
export function renderStudentListView({ students = [], canDelete = false }) {
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
    </div>
  `;

  const headers = ["الطالب", "رقم الهاتف (اسم المستخدم)", "المجموعة", "الإجراءات"];
  const rows = students.map((s) => {
    const studentUid = s.id || s.firestoreId;
    const studentName = s.studentName || s.name || "—";
    const studentPhone = s.studentPhone || s.phone || "—";
    const studentGroup = s.studentGroup || s.group || "ALL";

    const studentCell = `
      <div class="d-flex items-center gap-3">
        ${renderAvatar({ name: studentName, size: "sm" })}
        <strong>${escapeHtml(studentName)}</strong>
      </div>
    `;

    const actionsHtml = `
      <div class="d-flex gap-2 items-center">
        ${renderButton({
          text: "كلمة السر 🔑",
          size: "sm",
          variant: "secondary",
          extraAttrs: `data-reset-pass="${escapeHtml(studentUid)}" data-student-name="${escapeHtml(studentName)}"`
        })}
        ${
          canDelete
            ? renderButton({
                text: "حذف 🗑️",
                size: "sm",
                variant: "danger",
                extraAttrs: `data-delete-student="${escapeHtml(studentUid)}" data-student-name="${escapeHtml(studentName)}"`
              })
            : ""
        }
      </div>
    `;

    return [
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
