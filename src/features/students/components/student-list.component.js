// src/features/students/components/student-list.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderTable } from "../../../shared/components/Table/table.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for the student management list view.
 */
export function renderStudentListView({ students = [], canDelete = false }) {
  const filterToolbarHtml = `
    <div class="card mb-4">
      <div class="d-flex items-center justify-between gap-3 flex-wrap">
        <div class="d-flex gap-2 flex-1 flex-wrap">
          <input
            type="text"
            id="studentSearchInput"
            class="form-input"
            style="max-width: 280px;"
            placeholder="🔍 بحث بالاسم أو الهاتف..."
          />
          <select id="studentGroupFilter" class="form-select" style="max-width: 240px;">
            <option value="ALL">جميع المجموعات</option>
            ${GROUPS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
          </select>
        </div>
        ${renderButton({
          id: "openAddStudentModalBtn",
          text: "➕ إضافة طالب جديد",
          variant: "primary"
        })}
      </div>
    </div>
  `;

  const headers = ["الاسم", "رقم الهاتف", "المجموعة", "الإجراءات"];
  const rows = students.map((s) => {
    const studentUid = s.id || s.firestoreId;
    const studentName = s.studentName || s.name || "—";
    const studentPhone = s.studentPhone || s.phone || "—";
    const studentGroup = s.studentGroup || s.group || "ALL";

    const actionsHtml = `
      <div class="d-flex gap-1 items-center">
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
      `<strong>${escapeHtml(studentName)}</strong>`,
      `<span style="direction:ltr;display:inline-block;">${escapeHtml(studentPhone)}</span>`,
      renderBadge({ text: studentGroup, variant: "gold" }),
      actionsHtml
    ];
  });

  const tableHtml = renderTable({
    headers,
    rows,
    emptyMessage: "لا يوجد طلاب مسجلين يطابقون شروط البحث."
  });

  return filterToolbarHtml + `<div id="studentsTableWrapper">${tableHtml}</div>`;
}
