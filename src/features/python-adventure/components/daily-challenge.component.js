// src/features/python-adventure/components/daily-challenge.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Renders the Daily Challenge Screen.
 */
export function renderDailyChallenge({ daily, progress }) {
  const streak = progress?.streak?.count || 1;
  const today = new Date().toISOString().split("T")[0];
  const isDoneToday = progress?.stats?.dailyCompletedDate === today;

  return `
    <div class="adventure-daily-wrapper">
      <div class="adventure-view-header">
        <div>
          <button type="button" class="btn btn-sm btn-secondary" id="dailyBackBtn">
            <span>➔ العودة للرئيسية</span>
          </button>
          <h2 class="view-title">🎯 التحدي اليومي وسلسلة الالتزام</h2>
          <p class="view-subtitle">تحدٍ برمجي جديد كل 24 ساعة يمنحك +100 XP ويعزز استمراريتك البرمجية.</p>
        </div>
      </div>

      <div class="daily-main-card">
        <div class="daily-card-top">
          <div class="d-flex items-center gap-3">
            <div class="daily-flame-box">
              <span class="flame-icon">🔥</span>
              <span class="flame-count">${streak}</span>
            </div>
            <div>
              <h3 class="daily-heading">${escapeHtml(daily?.title || "تحدي اليوم")}</h3>
              <p class="text-xs text-muted">سلسلة الالتزام اليومي الحالية: ${streak} أيام متتالية</p>
            </div>
          </div>
          <div class="daily-reward-tag">+100 XP</div>
        </div>

        <div class="daily-desc-box">
          <p>${escapeHtml(daily?.description || "")}</p>
          ${daily?.requirements ? `
            <div class="mt-3">
              <strong class="text-xs font-bold text-muted">الشروط:</strong>
              <ul class="requirements-list mt-1">
                ${daily.requirements.map((r) => `<li>✓ ${escapeHtml(r)}</li>`).join("")}
              </ul>
            </div>
          ` : ""}
        </div>

        <div class="daily-cta-box">
          ${isDoneToday ? `
            <div class="daily-completed-banner">
              <span>✅ أحسنت! لقد أكملت التحدي اليومي لليوم وحافظت على شعلة الالتزام 🔥</span>
            </div>
          ` : `
            <button type="button" class="btn btn-primary btn-lg" id="startDailyChallengeBtn">
              <span>خوض التحدي اليومي الآن ⚔️</span>
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
