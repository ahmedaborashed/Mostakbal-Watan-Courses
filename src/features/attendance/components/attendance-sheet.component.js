// src/features/attendance/components/attendance-sheet.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for Teacher/Admin session creation and attendance taking sheet.
 */
export function renderAttendanceManagementView({ students = [], sessions = [] }) {
  const today = new Date().toISOString().slice(0, 10);

  const headerHtml = `
    <div class="card mb-4">
      <h3 class="card-title mb-3">📋 تسجيل سيشن غياب وحضور جديد</h3>
      <form id="createSessionForm" class="grid-3" onsubmit="return false;">
        <input type="text" id="sessionNameInput" class="form-input" placeholder="عنوان السيشن (مثال: المحاضرة الخامسة)" required />
        <input type="date" id="sessionDateInput" class="form-input" value="${today}" required />
        <select id="sessionGroupSelect" class="form-select">
          <option value="ALL">جميع المجموعات (ALL)</option>
          ${GROUPS.map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join("")}
        </select>
      </form>
    </div>

    <div class="card mb-4">
      <div class="d-flex items-center justify-between flex-wrap gap-2 mb-3">
        <h4 class="font-bold">قائمة الطلاب لتسجيل الحضور</h4>
        <div class="d-flex gap-2">
          ${renderButton({ id: "selectAllPresentBtn", text: "تحديد الكل حاضر ✓", size: "sm", variant: "outline" })}
          ${renderButton({ id: "saveAttendanceBatchBtn", text: "حفظ الغياب والسيشن 💾", variant: "primary" })}
        </div>
      </div>

      <div class="table-wrapper">
        <table class="table-modern">
          <thead>
            <tr>
              <th>الطالب</th>
              <th>المجموعة</th>
              <th>الحالة</th>
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
                  <td>${escapeHtml(group)}</td>
                  <td>
                    <label class="d-inline-flex items-center gap-2" style="cursor:pointer;">
                      <input type="checkbox" class="attendance-check" data-student-uid="${escapeHtml(uid)}" checked style="width:18px;height:18px;" />
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
