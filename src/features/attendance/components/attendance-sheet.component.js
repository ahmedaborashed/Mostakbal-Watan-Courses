// src/features/attendance/components/attendance-sheet.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for Teacher/Admin session creation and attendance taking sheet.
 */
export function renderAttendanceManagementView({ students = [], sessions = [] }) {
  const today = new Date().toISOString().slice(0, 10);

  const headerHtml = `
    <div class="card mb-6">
      <h3 class="card-title mb-2">📋 تسجيل جلسة حضور وغياب جديدة</h3>
      <p class="text-xs text-muted mb-4">أدخل عنوان المحاضرة وتاريخ الانعقاد وحدد المجموعة لتسجيل حضور الطلاب.</p>
      <form id="createSessionForm" class="grid-3" onsubmit="return false;">
        <div>
          <label class="form-label" for="sessionNameInput">عنوان السيشن</label>
          <input type="text" id="sessionNameInput" class="form-input" placeholder="مثال: المحاضرة الثالثة - Loops" required />
        </div>
        <div>
          <label class="form-label" for="sessionDateInput">تاريخ الانعقاد</label>
          <input type="date" id="sessionDateInput" class="form-input" value="${today}" required />
        </div>
        <div>
          <label class="form-label" for="sessionGroupSelect">المجموعة الدراسية</label>
          <select id="sessionGroupSelect" class="form-select">
            <option value="ALL">جميع المجموعات (ALL)</option>
            ${GROUPS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
          </select>
        </div>
      </form>
    </div>

    <div class="card mb-6">
      <div class="d-flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h4 class="font-extrabold" style="font-size:1.1rem;margin:0;">كشف رصد حضور الطلاب</h4>
          <span class="text-xs text-muted">إجمالي الطلاب في الكشف: <strong>${students.length}</strong> طالب</span>
        </div>
        <div class="d-flex gap-2">
          ${renderButton({ id: "selectAllPresentBtn", text: "تحديد الكل حاضر ✓", size: "sm", variant: "outline" })}
          ${renderButton({ id: "saveAttendanceBatchBtn", text: "حفظ واعتماد الكشف 💾", variant: "primary" })}
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table-modern">
          <thead>
            <tr>
              <th scope="col">اسم الطالب</th>
              <th scope="col">المجموعة الدراسية</th>
              <th scope="col" style="width:180px;">تسجيل الحضور</th>
            </tr>
          </thead>
          <tbody id="attendanceSheetTbody">
            ${students
              .map((s) => {
                const uid = s.id || s.firestoreId;
                const name = s.studentName || s.name;
                const group = s.studentGroup || s.group || "ALL";
                return `
                <tr data-student-uid="${escapeHtml(uid)}" data-group="${escapeHtml(group)}">
                  <td><strong>${escapeHtml(name)}</strong></td>
                  <td>${renderBadge({ text: group, variant: "gold" })}</td>
                  <td>
                    <label class="d-inline-flex items-center gap-2" style="cursor:pointer;">
                      <input type="checkbox" class="attendance-check" data-student-uid="${escapeHtml(uid)}" checked style="width:20px;height:20px;accent-color:var(--color-primary);" />
                      <span class="status-label text-success font-bold text-sm">حاضر</span>
                    </label>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;

  return headerHtml;
}
