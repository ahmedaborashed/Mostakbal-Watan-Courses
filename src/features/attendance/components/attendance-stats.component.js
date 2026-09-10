// src/features/attendance/components/attendance-stats.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderTable } from "../../../shared/components/Table/table.component.js";
import { renderStatCard } from "../../../shared/components/StatCard/stat-card.component.js";
import { renderProgressBar } from "../../../shared/components/ProgressBar/progress-bar.component.js";
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
      ${renderStatCard({
        label: "إجمالي السيشنز والمحاضرات",
        value: total,
        icon: "📅",
        color: "var(--color-text-primary)"
      })}
      ${renderStatCard({
        label: "عدد مرات الحضور",
        value: presentCount,
        icon: "✅",
        color: "var(--color-success)"
      })}
      ${renderStatCard({
        label: "عدد مرات الغياب",
        value: absentCount,
        icon: "❌",
        color: "var(--color-danger)"
      })}
      ${renderStatCard({
        label: "نسبة الالتزام الكلية",
        value: `${percentage}%`,
        icon: "⭐",
        color: "var(--color-gold-light)"
      })}
    </div>

    <div class="card mb-6" style="background:var(--color-surface-elevated);">
      <h4 class="font-extrabold mb-1" style="font-size:1.05rem;">معدل الحضور التراكمي</h4>
      <p class="text-xs text-muted mb-3">نسبة الحضور المطلوبة لاجتياز الدورة بنجاح هي 75% كحد أدنى.</p>
      ${renderProgressBar({
        percentage,
        label: `الالتزام الأكاديمي: ${percentage}%`,
        colorVariant: percentage >= 75 ? "success" : "danger"
      })}
    </div>
  `;

  const tableHtml = renderTable({
    headers: ["اسم المحاضرة / السيشن", "التاريخ", "الحالة"],
    rows,
    emptyMessage: "لم يتم تسجيل أي سجلات غياب لك حتى الآن."
  });

  return statsHtml + `<div>${tableHtml}</div>`;
}
