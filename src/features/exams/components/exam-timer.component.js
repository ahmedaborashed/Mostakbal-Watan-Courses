// src/features/exams/components/exam-timer.component.js
import { formatTimer } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for modern exam countdown timer.
 */
export function renderExamTimer({ seconds = 0 }) {
  const isUrgent = seconds <= 120 && seconds > 0;
  return `
    <div id="examTimerWrapper" class="d-flex items-center gap-3" style="background:var(--color-bg-secondary);padding:0.65rem 1.25rem;border-radius:var(--radius-md);border:1px solid ${isUrgent ? "var(--color-danger)" : "var(--color-border-primary)"};box-shadow:${isUrgent ? "0 0 16px var(--color-danger-bg)" : "var(--shadow-sm)"};">
      <span style="font-size:1.4rem;" aria-hidden="true">${isUrgent ? "🚨" : "⏳"}</span>
      <div>
        <div class="text-xs text-muted font-bold">الوقت المتبقي</div>
        <strong id="examCountdownDisplay" style="font-size:1.25rem;font-weight:900;color:${isUrgent ? "var(--color-danger)" : "var(--color-primary)"};letter-spacing:1px;direction:ltr;display:inline-block;">
          ${formatTimer(seconds)}
        </strong>
      </div>
    </div>
  `;
}
