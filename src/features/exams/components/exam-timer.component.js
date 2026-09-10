// src/features/exams/components/exam-timer.component.js
import { formatTimer } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for exam timer badge.
 */
export function renderExamTimer({ seconds = 0 }) {
  const isUrgent = seconds <= 120 && seconds > 0;
  return `
    <div id="examTimerWrapper" class="d-flex items-center gap-2" style="background:var(--bg-secondary);padding:.5rem 1rem;border-radius:var(--radius-sm);border:1px solid ${isUrgent ? "var(--color-danger)" : "var(--border-primary)"};">
      <span style="font-size:1.2rem;">⏳</span>
      <div>
        <div class="text-xs text-muted">الوقت المتبقي</div>
        <strong id="examCountdownDisplay" style="font-size:1.15rem;color:${isUrgent ? "var(--color-danger)" : "var(--accent)"};">
          ${formatTimer(seconds)}
        </strong>
      </div>
    </div>
  `;
}
