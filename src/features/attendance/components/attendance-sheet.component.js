// src/features/attendance/components/attendance-sheet.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { GROUPS } from "../../../core/constants.js";

/**
 * Returns HTML string for Teacher/Admin session creation, selection, and attendance taking sheet.
 * @param {object} options
 * @param {Array} options.students
 * @param {Array} options.sessions
 * @param {string} [options.selectedSessionId="NEW"]
 * @param {object|null} [options.selectedSession=null]
 * @param {Map} [options.sessionRecords=new Map()]
 * @returns {string}
 */
export function renderAttendanceManagementView({
  students = [],
  sessions = [],
  selectedSessionId = "NEW",
  selectedSession = null,
  sessionRecords = new Map()
}) {
  const isNewSession = selectedSessionId === "NEW" || !selectedSession;
  const today = new Date().toISOString().slice(0, 10);

  const initialName = !isNewSession ? (selectedSession?.name || selectedSession?.title || "") : "";
  const initialDate = !isNewSession ? (selectedSession?.date || selectedSession?.sessionDate || today) : today;
  const initialGroup = !isNewSession ? (selectedSession?.group || "ALL") : "ALL";

  return `
    <div class="attendance-management-view" dir="rtl">
      <!-- Session Selector & Details Card -->
      <div class="card mb-4" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h3 class="card-title font-black m-0" style="font-size:1.25rem;">
              <span>${isNewSession ? "📋 تسجيل جلسة حضور وغياب جديدة" : "✏️ تعديل كشف حضور جلسة سابقة"}</span>
            </h3>
            <p class="text-xs text-muted mt-1 mb-0">
              ${
                isNewSession
                  ? "يتم ضبط جميع الطلاب كـ (غائب) تلقائياً، قم بتحديد الطلاب الحاضرين فعلياً فقط."
                  : "تم استرجاع بيانات الجلسة وسجلات الطلاب المسجلة. يمكنك تعديل الحالات وحفظها مباشرة."
              }
            </p>
          </div>
          <div>
            <span class="badge ${isNewSession ? 'badge-gold' : 'badge-info'} font-bold">
              ${isNewSession ? "جلسة جديدة" : "تعديل جلسة قائمة"}
            </span>
          </div>
        </div>

        <form id="attendanceSessionForm" class="grid-4 gap-3 mb-0" onsubmit="return false;">
          <!-- Session Selector Dropdown -->
          <div style="grid-column: span 2;">
            <label class="form-label font-bold text-xs" for="sessionSelector">
              اختر الجلسة الدراسية: <span class="text-primary font-bold">(قائمة الجلسات)</span>
            </label>
            <select id="sessionSelector" class="form-select font-bold">
              <option value="NEW" ${isNewSession ? "selected" : ""}>➕ [ + جلسة جديدة ] - بدء رصد جلسة جديدة</option>
              ${sessions
                .map((s) => {
                  const sId = s.id || s.sessionId;
                  const sName = escapeHtml(s.name || s.title || "جلسة غير معنونة");
                  const sDate = s.date || s.sessionDate || "";
                  const sGroup = s.group || "ALL";
                  const isSelected = sId === selectedSessionId;
                  return `<option value="${escapeHtml(sId)}" ${isSelected ? "selected" : ""}>
                    ${sName} (${sDate}) [${escapeHtml(sGroup)}]
                  </option>`;
                })
                .join("")}
            </select>
          </div>

          <!-- Session Name Input -->
          <div>
            <label class="form-label font-bold text-xs" for="sessionNameInput">
              عنوان الجلسة / المحاضرة: <span class="text-danger">*</span>
            </label>
            <input
              type="text"
              id="sessionNameInput"
              class="form-input"
              value="${escapeHtml(initialName)}"
              placeholder="مثال: المحاضرة 4 - الدوال والمصفوفات"
              required
            />
          </div>

          <!-- Session Date Input -->
          <div>
            <label class="form-label font-bold text-xs" for="sessionDateInput">
              تاريخ الانعقاد: <span class="text-danger">*</span>
            </label>
            <input
              type="date"
              id="sessionDateInput"
              class="form-input"
              value="${escapeHtml(initialDate)}"
              required
            />
          </div>
        </form>
      </div>

      <!-- Attendance Sheet Table Card -->
      <div class="card mb-6" style="background:var(--color-surface-elevated);border:1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <h4 class="font-black" style="font-size:1.15rem;margin:0;color:var(--color-text-primary);">
              كشف رصد حضور وغياب الطلاب
            </h4>
            <div class="d-flex items-center gap-2 text-xs text-muted mt-1">
              <span>إجمالي الطلاب: <strong id="sheetStudentsCount">${students.length}</strong></span>
              <span>·</span>
              <span>الحاضرون: <strong id="sheetPresentCount" class="text-success">0</strong></span>
              <span>·</span>
              <span>الغائبون: <strong id="sheetAbsentCount" class="text-danger">0</strong></span>
            </div>
          </div>

          <!-- Filter, Search & Batch Actions Toolbar -->
          <div class="d-flex items-center gap-2 flex-wrap">
            <div style="min-width:180px;">
              <select id="sessionGroupSelect" class="form-select form-select-sm font-bold" aria-label="تصفية بالمجموعة">
                <option value="ALL" ${initialGroup === "ALL" ? "selected" : ""}>جميع المجموعات (الكل)</option>
                ${GROUPS.map(
                  (g) => `<option value="${escapeHtml(g)}" ${initialGroup === g ? "selected" : ""}>${escapeHtml(g)}</option>`
                ).join("")}
              </select>
            </div>
            <div style="min-width:180px;">
              <input
                type="search"
                id="attendanceStudentSearchInput"
                class="form-input form-input-sm"
                placeholder="🔍 بحث باسم الطالب..."
                aria-label="بحث في كشف الحضور"
              />
            </div>
            ${renderButton({ id: "selectAllPresentBtn", text: "الكل حاضر ✓", size: "sm", variant: "outline" })}
            ${renderButton({ id: "selectAllAbsentBtn", text: "الكل غائب ✗", size: "sm", variant: "outline" })}
            ${renderButton({
              id: "saveAttendanceBatchBtn",
              text: isNewSession ? "حفظ واعتماد الكشف 💾" : "حفظ التعديلات 💾",
              variant: "primary",
              className: "font-bold"
            })}
          </div>
        </div>

        <div class="table-wrapper" style="border:1px solid var(--color-border-subtle);border-radius:var(--radius-md);overflow-x:auto;">
          <table class="table-modern w-full" id="attendanceSheetTable">
            <thead>
              <tr>
                <th scope="col" style="width:40px;text-align:center;">#</th>
                <th scope="col" style="text-align:start;">اسم الطالب</th>
                <th scope="col">رقم الهاتف</th>
                <th scope="col">المجموعة</th>
                <th scope="col" style="width:200px;text-align:center;">تسجيل الحالة</th>
              </tr>
            </thead>
            <tbody id="attendanceSheetTbody">
              ${
                students.length === 0
                  ? `<tr><td colspan="5" class="text-center p-5 text-muted">لا يوجد طلاب مسجلين في هذا الكشف.</td></tr>`
                  : students
                      .map((s, idx) => {
                        const uid = s.id || s.firestoreId;
                        const name = s.studentName || s.name || "طالب";
                        const phone = s.studentPhone || s.phone || "—";
                        const group = s.studentGroup || s.group || "ALL";

                        // Rule 37 & 40:
                        // New session -> default FALSE (absent)
                        // Existing session -> read record status
                        let isPresent = false;
                        if (!isNewSession) {
                          const rec = typeof sessionRecords?.get === "function"
                            ? (sessionRecords.get(uid) || sessionRecords.get(phone))
                            : (sessionRecords?.[uid] || sessionRecords?.[phone]);
                          isPresent = Boolean(rec?.present || rec?.status === "present");
                        }

                        return `
                          <tr
                            data-attendance-row
                            data-student-uid="${escapeHtml(uid)}"
                            data-student-name="${escapeHtml(name.toLowerCase())}"
                            data-group="${escapeHtml(group)}"
                          >
                            <td style="text-align:center;color:var(--color-text-secondary);font-weight:bold;">${idx + 1}</td>
                            <td>
                              <strong style="color:var(--color-text-primary);font-size:0.95rem;">${escapeHtml(name)}</strong>
                            </td>
                            <td>
                              <span style="direction:ltr;display:inline-block;font-family:monospace;font-size:0.85rem;color:var(--color-text-secondary);">${escapeHtml(phone)}</span>
                            </td>
                            <td>
                              ${renderBadge({ text: group, variant: "gold", className: "text-xs font-bold" })}
                            </td>
                            <td style="text-align:center;">
                              <label class="d-inline-flex items-center gap-2" style="cursor:pointer;user-select:none;">
                                <input
                                  type="checkbox"
                                  class="attendance-check"
                                  data-student-uid="${escapeHtml(uid)}"
                                  data-student-name="${escapeHtml(name)}"
                                  data-student-phone="${escapeHtml(phone)}"
                                  data-student-group="${escapeHtml(group)}"
                                  ${isPresent ? "checked" : ""}
                                  style="width:20px;height:20px;accent-color:var(--color-primary);cursor:pointer;"
                                  aria-label="تسجيل حضور ${escapeHtml(name)}"
                                />
                                <span class="status-label font-bold text-sm ${isPresent ? 'text-success' : 'text-danger'}">
                                  ${isPresent ? "حاضر ✓" : "غائب ✗"}
                                </span>
                              </label>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
