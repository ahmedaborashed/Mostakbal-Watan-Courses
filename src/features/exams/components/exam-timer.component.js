// src/features/exams/components/exam-timer.component.js
import { formatTimer } from "../../../shared/utils/date.utils.js";

/**
 * Returns HTML string for modern exam countdown timer.
 * @param {object} options
 * @param {number} options.seconds - Total remaining seconds
 */
export function renderExamTimer({ seconds = 0 }) {
  const isCritical = seconds > 0 && seconds <= 60;
  const isWarning = seconds > 60 && seconds <= 300;

  let timerStateClass = "timer-normal";
  if (isCritical) {
    timerStateClass = "timer-critical";
  } else if (isWarning) {
    timerStateClass = "timer-warning";
  }

  return `
    <div id="examTimerWrapper" class="exam-timer-chip ${timerStateClass}" role="timer" aria-label="الوقت المتبقي">
      <span class="timer-icon" aria-hidden="true">${isCritical ? "⚠️" : "⏱️"}</span>
      <div class="timer-info">
        <span class="timer-label">الوقت المتبقي</span>
        <strong id="examCountdownDisplay" class="timer-digits">
          ${formatTimer(Math.max(0, seconds))}
        </strong>
      </div>
    </div>
  `;
}
