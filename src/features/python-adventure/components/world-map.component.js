// src/features/python-adventure/components/world-map.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { WORLDS_DATA, CHALLENGES_CLIENT_DATA } from "../python-adventure-data.js";

/**
 * Renders the interactive World Map and Levels Drawer.
 */
export function renderWorldMap({ progress, selectedWorldId = "world-1" }) {
  const unlockedWorlds = new Set(progress?.unlockedWorlds || ["world-1"]);
  const completedChallenges = progress?.completedChallenges || {};
  const starsMap = progress?.stars || {};

  // Group challenges by world
  const worldChallengesMap = {};
  for (const [cId, ch] of Object.entries(CHALLENGES_CLIENT_DATA)) {
    if (!worldChallengesMap[ch.worldId]) worldChallengesMap[ch.worldId] = [];
    worldChallengesMap[ch.worldId].push(ch);
  }

  const activeWorldObj = WORLDS_DATA.find((w) => w.id === selectedWorldId) || WORLDS_DATA[0];
  const activeWorldChallenges = worldChallengesMap[selectedWorldId] || [];

  return `
    <div class="adventure-map-wrapper">
      <!-- Header -->
      <div class="adventure-view-header">
        <div>
          <button type="button" class="btn btn-sm btn-secondary adventure-back-btn" id="mapBackToHomeBtn">
            <span>➔ العودة للرئيسية</span>
          </button>
          <h2 class="view-title">🗺️ خريطة عوالم بايثون</h2>
          <p class="view-subtitle">تدرج عبر العوالم الثمانية لإتقان مفاهيم بايثون من الصفر حتى المشاريع المتكاملة.</p>
        </div>
      </div>

      <!-- Worlds Track Grid -->
      <div class="worlds-grid">
        ${WORLDS_DATA.map((w, index) => {
          const isUnlocked = unlockedWorlds.has(w.id);
          const isCurrent = progress?.currentWorldId === w.id;
          const isSelected = selectedWorldId === w.id;

          const challenges = worldChallengesMap[w.id] || [];
          const worldCompletedCount = challenges.filter((c) => completedChallenges[c.id]).length;
          const isAllCompleted = challenges.length > 0 && worldCompletedCount === challenges.length;

          let statusBadge = "";
          let cardClass = "world-card";

          if (isAllCompleted) {
            statusBadge = '<span class="world-status-badge success">✅ مكتمل</span>';
            cardClass += " completed";
          } else if (isUnlocked) {
            statusBadge = '<span class="world-status-badge active">🔓 متاح</span>';
            cardClass += " active";
          } else {
            statusBadge = '<span class="world-status-badge locked">🔒 مغلق</span>';
            cardClass += " locked";
          }

          if (isSelected) cardClass += " selected";

          // Lock explanation
          const prevWorld = WORLDS_DATA[index - 1];
          const lockReason = prevWorld ? `أكمل ${prevWorld.title} أولاً لفتح هذا العالم.` : "عالم مغلق حالياً.";

          return `
            <div class="${cardClass}" data-world-id="${w.id}" role="button" tabindex="${isUnlocked ? "0" : "-1"}">
              <div class="world-card-top">
                <span class="world-number">عالم ${w.number}</span>
                ${statusBadge}
              </div>

              <div class="world-icon-wrap" style="border-color: ${w.color};">
                <span class="world-icon">${w.icon}</span>
              </div>

              <h3 class="world-title">${escapeHtml(w.title)}</h3>
              <span class="world-english">${escapeHtml(w.englishTitle)}</span>
              <p class="world-concept">${escapeHtml(w.concept)}</p>

              <div class="world-progress-mini">
                <div class="d-flex justify-between text-xs text-muted mb-1">
                  <span>التقدم</span>
                  <span>${worldCompletedCount} / ${challenges.length}</span>
                </div>
                <div class="world-mini-track">
                  <div class="world-mini-fill" style="width: ${challenges.length ? (worldCompletedCount / challenges.length) * 100 : 0}%; background-color: ${w.color};"></div>
                </div>
              </div>

              ${!isUnlocked ? `<div class="world-lock-overlay"><span>🔒 ${lockReason}</span></div>` : ""}
            </div>
          `;
        }).join("")}
      </div>

      <!-- Levels Section for Selected World -->
      <div class="world-levels-section" id="worldLevelsSection">
        <div class="levels-section-header">
          <div class="d-flex items-center gap-3">
            <span class="selected-world-icon">${activeWorldObj.icon}</span>
            <div>
              <h3 class="levels-world-title">${escapeHtml(activeWorldObj.title)} - قائمة المهمات</h3>
              <p class="levels-world-desc">${escapeHtml(activeWorldObj.description)}</p>
            </div>
          </div>
        </div>

        <div class="levels-grid">
          ${activeWorldChallenges.map((ch, idx) => {
            const isCompleted = !!completedChallenges[ch.id];
            const unlockedList = progress?.unlockedChallenges || ["world-1-level-1"];
            const isLevelUnlocked = unlockedList.includes(ch.id);
            const stars = starsMap[ch.id] || 0;

            let levelClass = "level-card";
            if (isCompleted) levelClass += " completed";
            else if (isLevelUnlocked) levelClass += " unlocked";
            else levelClass += " locked";

            // Previous level title for locked explanation
            const prevLevel = activeWorldChallenges[idx - 1];
            const lockMsg = prevLevel ? `أكمل "${prevLevel.title}" لفتح هذه المهمة.` : "أكمل المهمات السابقة.";

            return `
              <div class="${levelClass}" data-challenge-id="${ch.id}" role="button" tabindex="${isLevelUnlocked ? "0" : "-1"}">
                <div class="level-card-header">
                  <span class="level-badge">${ch.type === "boss" ? "👑 زعيم العالم" : `Level ${ch.levelNumber}`}</span>
                  <div class="level-stars">
                    <span class="${stars >= 1 ? "star-active" : "star-dim"}">★</span>
                    <span class="${stars >= 2 ? "star-active" : "star-dim"}">★</span>
                    <span class="${stars >= 3 ? "star-active" : "star-dim"}">★</span>
                  </div>
                </div>

                <h4 class="level-title">${escapeHtml(ch.title)}</h4>
                <p class="level-subtitle">${escapeHtml(ch.subtitle || "")}</p>

                <div class="level-footer">
                  <div class="level-xp-tag">+${ch.baseXp} XP</div>
                  ${isCompleted
                    ? '<span class="level-status-tag done">مكتمل ✅</span>'
                    : isLevelUnlocked
                    ? '<button type="button" class="btn btn-sm btn-primary level-play-btn">ابدأ ⚔️</button>'
                    : `<span class="level-status-tag lock" title="${lockMsg}">🔒 مغلق</span>`}
                </div>

                ${!isLevelUnlocked ? `<div class="level-locked-hint"><span>${lockMsg}</span></div>` : ""}
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}
