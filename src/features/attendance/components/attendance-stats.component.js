// src/features/attendance/components/attendance-stats.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderTable } from "../../../shared/components/Table/table.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for student's attendance stats and sessions table.
 */
export function renderStudentAttendanceView({ records = [], sessions = [] }) {
  const sessionMap = new Map();
  sessions.forEach((s) => sessionMap.set(s.id, s));

  const total = sessions.length || records.length;
  let presentCount = 0;

  const rows = records.map((rec) => {
    const session = sessionMap.get(rec.sessionId);
    const sessionName = session?.name || rec.sessionName || "حصة تدريبية";
    const sessionDate = session?.date || rec.date;
    const isPresent = rec.status === "present" || rec.present === true;

    if (isPresent) presentCount += 1;

    const statusBadge = isPresent
      ? renderBadge({ text: "حاضر", variant: "success", icon: "✓" })
      : renderBadge({ text: "غائب", variant: "danger", icon: "✗" });

    return [
      `<strong>${escapeHtml(sessionName)}</strong>`,
      formatDate(sessionDate),
      statusBadge
    ];
  });

  const absentCount = Math.max(0, total - presentCount);
  const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 100;

  const statsHtml = `
    <div class="stats-grid">
      <div class="stats-card">
        <div>
          <div class="stats-label">إجمالي السيشنز</div>
          <div class="stats-value">${total}</div>
        </div>
        <div class="stats-icon">📅</div>
      </div>

      <div class="stats-card">
        <div>
          <div class="stats-label">مرات الحضور</div>
          <div class="stats-value text-accent">${presentCount}</div>
        </div>
        <div class="stats-icon">✅</div>
      </div>

      <div class="stats-card">
        <div>
          <div class="stats-label">مرات الغياب</div>
          <div class="stats-value text-danger">${absentCount}</div>
        </div>
        <div class="stats-icon">❌</div>
      </div>

      <div class="stats-card">
        <div>
          <div class="stats-label">نسبة الالتزام</div>
          <div class="stats-value text-gold">${percentage}%</div>
        </div>
        <div class="stats-icon">⭐</div>
      </div>
    </div>
  `;

  const tableHtml = renderTable({
    headers: ["اسم المحاضرة / السيشن", "التاريخ", "الحالة"],
    rows,
    emptyMessage: "لم يتم تسجيل أي سجلات غياب لك حتى الآن."
  });

  return statsHtml + `<div class="mt-4">${tableHtml}</div>`;
}
