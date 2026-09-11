// src/features/python-adventure/components/mission-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

/**
 * Renders the interactive Mission Intro & Micro Lesson Modal.
 */
export function renderMissionModal(challenge, currentStep = "story") {
  if (!challenge) return "";

  const isStory = currentStep === "story";
  const micro = challenge.microLesson || {};

  return `
    <div class="adventure-modal-overlay" id="adventureMissionModal" role="dialog" aria-modal="true" aria-labelledby="missionModalTitle">
      <div class="adventure-modal-card">
        <!-- Modal Header -->
        <div class="adventure-modal-header">
          <div class="d-flex items-center gap-2">
            <span class="modal-challenge-icon">${challenge.type === "boss" ? "👑" : "🎯"}</span>
            <div>
              <span class="text-xs text-muted font-bold">${escapeHtml(challenge.worldTitle || "عالم بايثون")} • Level ${challenge.levelNumber}</span>
              <h3 id="missionModalTitle" class="modal-challenge-title">${escapeHtml(challenge.title)}</h3>
            </div>
          </div>
          <button type="button" class="adventure-modal-close" id="closeMissionModalBtn" aria-label="إغلاق">✕</button>
        </div>

        <!-- Step Indicator -->
        <div class="modal-steps-indicator">
          <div class="modal-step ${isStory ? "active" : "done"}">
            <span class="step-num">1</span>
            <span>القصة والمهمة</span>
          </div>
          <div class="modal-step-line ${!isStory ? "active" : ""}"></div>
          <div class="modal-step ${!isStory ? "active" : ""}">
            <span class="step-num">2</span>
            <span>الشرح والدرس السريع</span>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="adventure-modal-body">
          ${isStory ? `
            <!-- STEP 1: STORY INTRO -->
            <div class="mission-story-pane">
              <div class="mission-narrative-box">
                <div class="narrative-icon">📜</div>
                <div class="narrative-text">
                  <p>${escapeHtml(challenge.story)}</p>
                </div>
              </div>

              <!-- Reward Card -->
              <div class="mission-rewards-preview">
                <div class="reward-preview-item">
                  <span class="reward-icon">⚡</span>
                  <div class="reward-text">
                    <span class="label">المكافأة</span>
                    <span class="val">+${challenge.baseXp} XP</span>
                  </div>
                </div>
                <div class="reward-preview-item">
                  <span class="reward-icon">⭐</span>
                  <div class="reward-text">
                    <span class="label">النجوم المتاحة</span>
                    <span class="val">★★★</span>
                  </div>
                </div>
                <div class="reward-preview-item">
                  <span class="reward-icon">🎯</span>
                  <div class="reward-text">
                    <span class="label">نوع التحدي</span>
                    <span class="val">${challenge.type === "boss" ? "تحدي الزعيم" : challenge.type === "fix_code" ? "صيد الأخطاء" : "كتابة كود"}</span>
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <!-- STEP 2: MICRO LESSON -->
            <div class="mission-micro-pane">
              <div class="micro-concept-title">
                <span class="book-icon">💡</span>
                <h4>${escapeHtml(micro.concept || "المفهوم البرمجي")}</h4>
              </div>
              <p class="micro-concept-summary">${escapeHtml(micro.summary || "")}</p>

              ${micro.exampleCode ? `
                <div class="micro-code-box">
                  <div class="micro-code-label">مثال توضيحي (Python):</div>
                  <pre class="micro-code-pre" dir="ltr"><code>${escapeHtml(micro.exampleCode)}</code></pre>
                </div>
              ` : ""}
            </div>
          `}
        </div>

        <!-- Modal Footer -->
        <div class="adventure-modal-footer">
          ${isStory ? `
            <button type="button" class="btn btn-primary btn-lg w-100" id="missionStoryNextBtn">
              <span>التالي: الدرس السريع ➔</span>
            </button>
          ` : `
            <button type="button" class="btn btn-primary btn-lg w-100" id="missionMicroDoneBtn">
              <span>فهمت، ابدأ البرمجة الآن 💻</span>
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}
