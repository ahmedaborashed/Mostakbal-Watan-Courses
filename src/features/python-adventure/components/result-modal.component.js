// src/features/python-adventure/components/result-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Renders the Challenge Result Feedback Modal (Success or Failure).
 */
export function renderResultModal({
  passed = false,
  earnedXp = 0,
  stars = 3,
  levelUp = false,
  newLevel = 1,
  feedback = "",
  errorDetails = "",
  skillsGained = [],
  newlyUnlockedAchievements = [],
  hasNextChallenge = true
}) {
  return `
    <div class="adventure-modal-overlay" id="adventureResultModal" role="dialog" aria-modal="true">
      <div class="adventure-modal-card result-card ${passed ? "success" : "failure"}">
        ${passed ? `
          <!-- SUCCESS STATE -->
          <div class="result-celebration-header">
            <div class="result-badge-anim">🎉</div>
            <h3 class="result-title">أحسنت صنعاً!</h3>
            <p class="result-subtitle">تم اجتياز المهمة البرمجية بنجاح واكتساب المفهوم.</p>
          </div>

          <div class="result-rewards-row">
            <div class="result-xp-chip">+${earnedXp} XP</div>
            <div class="result-stars-chip">
              <span class="${stars >= 1 ? "star-lit" : "star-dim"}">★</span>
              <span class="${stars >= 2 ? "star-lit" : "star-dim"}">★</span>
              <span class="${stars >= 3 ? "star-lit" : "star-dim"}">★</span>
            </div>
          </div>

          ${levelUp ? `
            <div class="result-levelup-banner">
              <span>🚀 ارتقيت إلى الرتبة البرمجية: <strong>Level ${newLevel}</strong>!</span>
            </div>
          ` : ""}

          ${newlyUnlockedAchievements.length > 0 ? `
            <div class="result-achievement-unlock">
              ${newlyUnlockedAchievements.map((ach) => `
                <div class="ach-unlock-card">
                  <span class="ach-icon">${ach.icon || "🏆"}</span>
                  <div>
                    <strong>وسام جديد: ${escapeHtml(ach.title)}</strong>
                    <p class="text-xs text-muted">${escapeHtml(ach.description || "")}</p>
                  </div>
                </div>
              `).join("")}
            </div>
          ` : ""}

          ${skillsGained.length > 0 ? `
            <div class="result-skills-box">
              <strong class="text-xs text-muted">المهارات المكتسبة:</strong>
              <div class="skills-tags-wrap">
                ${skillsGained.map((sk) => `<span class="skill-tag">✓ ${escapeHtml(sk)}</span>`).join("")}
              </div>
            </div>
          ` : ""}

          <div class="result-actions-row">
            ${hasNextChallenge ? `
              <button type="button" class="btn btn-primary btn-lg w-100" id="resultNextMissionBtn">
                <span>المهمة التالية ➔</span>
              </button>
            ` : `
              <button type="button" class="btn btn-primary btn-lg w-100" id="resultReturnMapBtn">
                <span>🏆 تم إكمال هذا المسار - العودة للخريطة</span>
              </button>
            `}
            <button type="button" class="btn btn-secondary w-100 mt-2" id="resultReturnMapBtnSecondary">
              <span>خريطة العوالم</span>
            </button>
          </div>

        ` : `
          <!-- FAILURE / CONSTRUCTIVE STATE -->
          <div class="result-fail-header">
            <div class="result-badge-anim fail">❌</div>
            <h3 class="result-title text-warning">لم تنجح المهمة بعد</h3>
            <p class="result-subtitle">لا تقلق، البرمجة قائمة على المحاولة والتعلم من الأخطاء!</p>
          </div>

          <div class="result-feedback-box">
            <div class="feedback-icon">💡</div>
            <div class="feedback-text">
              <p>${escapeHtml(feedback || "الكود لم يحقق الناتج المطلوب تماماً. راجع المتطلبات وجرب مرة أخرى.")}</p>
              ${errorDetails ? `<pre class="feedback-error-pre" dir="ltr"><code>${escapeHtml(errorDetails)}</code></pre>` : ""}
            </div>
          </div>

          <div class="result-actions-row">
            <button type="button" class="btn btn-primary btn-lg w-100" id="resultTryAgainBtn">
              <span>🔄 العودة وتعديل الكود</span>
            </button>
            <button type="button" class="btn btn-secondary w-100 mt-2" id="resultGetHintBtn">
              <span>💡 طلب تلميح إضافي</span>
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}
