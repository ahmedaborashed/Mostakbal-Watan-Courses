// src/features/attendance/components/attendance-widget.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Returns HTML string for compact attendance widget on Student Dashboard.
 */
export function renderAttendanceDashboardWidget({ attendanceData }) {
  if (!attendanceData) return "";

  const {
    totalSessions = 0,
    presentCount = 0,
    absentCount = 0,
    attendanceRate = 100,
    status = "excellent",
    currentStreak = 0
  } = attendanceData;

  let circleClass = "";
  let badgeHtml = "";
  if (status === "excellent") {
    circleClass = "";
    badgeHtml = `<span class="badge badge-success">✓ ملتزم</span>`;
  } else if (status === "warning") {
    circleClass = "warning";
    badgeHtml = `<span class="badge badge-gold">⚠️ تنبيه</span>`;
  } else {
    circleClass = "danger";
    badgeHtml = `<span class="badge badge-danger">✗ حرج</span>`;
  }

  return `
    <div class="attendance-dashboard-widget">
      <div class="attendance-widget-main">
        <div class="attendance-widget-circle ${circleClass}">
          ${attendanceRate}%
        </div>
        <div class="attendance-widget-text">
          <div class="d-flex items-center gap-2 mb-1">
            <h4>سجل حضور المحاضرات</h4>
            ${badgeHtml}
          </div>
          <p>
            ${presentCount} حاضر · ${absentCount} غياب · ${totalSessions} إجمالي المحاضرات
            ${currentStreak >= 3 ? ` · <span style="color:#f59e0b;font-weight:700;">🔥 سلسلة ${currentStreak}</span>` : ""}
          </p>
        </div>
      </div>
      <div>
        <button type="button" id="widgetViewAttendanceBtn" class="btn btn-outline btn-sm">
          <span>عرض سجل الغياب والحضور</span>
          <span>📊</span>
        </button>
      </div>
    </div>
  `;
}
