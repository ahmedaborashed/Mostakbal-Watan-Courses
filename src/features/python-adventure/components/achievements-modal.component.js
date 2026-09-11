// src/features/python-adventure/components/achievements-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { ACHIEVEMENTS_DATA } from "../python-adventure-data.js";

/**
 * Renders the Achievements Showcase Screen.
 */
export function renderAchievements({ progress }) {
  const unlocked = new Set(progress?.achievements || []);

  return `
    <div class="adventure-achievements-wrapper">
      <div class="adventure-view-header">
        <div>
          <button type="button" class="btn btn-sm btn-secondary" id="achievementsBackBtn">
            <span>➔ العودة للرئيسية</span>
          </button>
          <h2 class="view-title">🏆 لوحة الأوسمة والإنجازات</h2>
          <p class="view-subtitle">الأوسمة تُمنح تلقائياً عند تحقيق أهداف برمجية حقيقية أثناء مغامرتك.</p>
        </div>
      </div>

      <div class="achievements-cards-grid">
        ${ACHIEVEMENTS_DATA.map((ach) => {
          const isUnlocked = unlocked.has(ach.id);
          return `
            <div class="achievement-card ${isUnlocked ? "unlocked" : "locked"}">
              <div class="ach-emblem">
                <span class="ach-icon-large">${ach.icon}</span>
                ${isUnlocked ? '<span class="ach-check-badge">✓</span>' : '<span class="ach-lock-badge">🔒</span>'}
              </div>

              <div class="ach-card-body">
                <h3 class="ach-title">${escapeHtml(ach.title)}</h3>
                <p class="ach-desc">${escapeHtml(ach.description)}</p>
                <div class="ach-footer">
                  <span class="ach-reward-tag">+${ach.rewardXp} XP</span>
                  <span class="ach-status-label ${isUnlocked ? "text-success" : "text-muted"}">
                    ${isUnlocked ? "تم الفتح ✅" : "مغلق حالياً"}
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
