// src/features/attendance/components/profile-attendance-card.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderCard } from "../../../shared/components/Card/card.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";

/**
 * Returns HTML string for the student's attendance summary on their profile.
 */
export function renderProfileAttendanceCard({ attendanceData }) {
  if (!attendanceData) return "";

  const {
    totalSessions = 0,
    presentCount = 0,
    absentCount = 0,
    attendanceRate = 100,
    status = "excellent",
    currentStreak = 0,
    statusMessage = "معدل الحضور مستقر"
  } = attendanceData;

  const contentHtml = `
    <div class="d-flex items-center justify-between flex-wrap gap-4 mb-4 p-4" style="background:var(--color-bg-secondary);border-radius:var(--radius-lg);border:1px solid var(--color-border-subtle);">
      <div class="d-flex items-center gap-3">
        <div style="font-size:2rem;">📊</div>
        <div>
          <h4 class="font-extrabold" style="margin:0;color:var(--color-text-primary);">معدل الحضور الأكاديمي</h4>
          <span class="text-xs text-muted">${escapeHtml(statusMessage)}</span>
        </div>
      </div>
      <div>
        <span class="font-black text-2xl text-${status === 'excellent' ? 'success' : (status === 'warning' ? 'warning' : 'danger')}" style="direction:ltr;display:inline-block;">
          ${attendanceRate}%
        </span>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="table-modern">
        <tbody>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">المحاضرات المحضورة</td>
            <td><strong class="text-success">${presentCount} محاضرة</strong></td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">مرات الغياب</td>
            <td><strong class="text-danger">${absentCount} محاضرة</strong></td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">إجمالي المحاضرات المعقودة</td>
            <td><strong>${totalSessions} محاضرة</strong></td>
          </tr>
          <tr>
            <td style="color:var(--color-text-muted);font-weight:700;">سلسلة المواظبة الحالية</td>
            <td>${renderBadge({ text: `${currentStreak} جلسات متتالية`, variant: "gold", icon: "🔥" })}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;

  return renderCard({
    title: "سجل الالتزام والمواظبة بالمحاضرات",
    icon: "📋",
    content: contentHtml
  });
}
