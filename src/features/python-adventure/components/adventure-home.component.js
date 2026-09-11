// src/features/python-adventure/components/adventure-home.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { WORLDS_DATA } from "../python-adventure-data.js";

/**
 * Renders the Game Home Dashboard.
 */
export function renderAdventureHome({ student, progress, onContinue, onNavigate }) {
  const xp = progress?.xp || 0;
  const level = progress?.level || 1;
  const streak = progress?.streak?.count || 1;
  const totalStars = Object.values(progress?.stars || {}).reduce((a, b) => a + b, 0);
  const completedCount = Object.keys(progress?.completedChallenges || {}).length;

  const XP_PER_LEVEL = 250;
  const currentLevelBase = (level - 1) * XP_PER_LEVEL;
  const currentLevelXp = xp - currentLevelBase;
  const progressPercent = Math.min(100, Math.max(0, Math.round((currentLevelXp / XP_PER_LEVEL) * 100)));

  const currentWorldId = progress?.currentWorldId || "world-1";
  const currentWorld = WORLDS_DATA.find((w) => w.id === currentWorldId) || WORLDS_DATA[0];

  const studentDisplayName = student?.studentName || student?.name || "المغامر";

  return `
    <div class="adventure-home-wrapper">
      <!-- Hero Banner -->
      <div class="adventure-hero-card">
        <div class="adventure-hero-content">
          <div class="adventure-hero-badge">
            <span class="pulse-dot"></span>
            <span>🐍 مغامرة بايثون البرمجية</span>
          </div>
          <h1 class="adventure-hero-title">مرحباً بك يا ${escapeHtml(studentDisplayName)}!</h1>
          <p class="adventure-hero-subtitle">
            انطلق في رحلة مشوقة لتعلم وإتقان لغة بايثون من خلال مهمات برمجية تفاعلية وتحديات واقعية.
          </p>

          <!-- Level & XP Bar -->
          <div class="adventure-xp-box">
            <div class="adventure-xp-header">
              <div class="d-flex items-center gap-2">
                <span class="adventure-level-badge">Level ${level}</span>
                <span class="text-sm font-semibold text-muted">الرتبة البرمجية</span>
              </div>
              <div class="text-sm font-bold adventure-xp-counter">
                <span>${currentLevelXp}</span>
                <span class="text-muted">/ ${XP_PER_LEVEL} XP</span>
              </div>
            </div>
            <div class="adventure-progress-track" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
              <div class="adventure-progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <!-- Current World & Continue CTA -->
          <div class="adventure-cta-row">
            <button type="button" class="btn btn-primary btn-lg adventure-continue-btn" id="adventureContinueBtn">
              <span class="btn-icon">⚔️</span>
              <span>استكمال اللعب</span>
              <span class="btn-subtext">(${escapeHtml(currentWorld.title)})</span>
            </button>

            <button type="button" class="btn btn-secondary adventure-map-quick-btn" id="adventureQuickMapBtn">
              <span>🗺 خريطة العوالم</span>
            </button>
          </div>
        </div>

        <!-- Hero Stats Cards -->
        <div class="adventure-stats-grid">
          <div class="adventure-stat-card">
            <div class="adventure-stat-icon gold">⭐</div>
            <div class="adventure-stat-info">
              <strong>${totalStars}</strong>
              <span>النجوم المجمعة</span>
            </div>
          </div>

          <div class="adventure-stat-card">
            <div class="adventure-stat-icon flame">🔥</div>
            <div class="adventure-stat-info">
              <strong>${streak} أيام</strong>
              <span>التتابع اليومي</span>
            </div>
          </div>

          <div class="adventure-stat-card">
            <div class="adventure-stat-icon emerald">🎯</div>
            <div class="adventure-stat-info">
              <strong>${completedCount}</strong>
              <span>مهمة مكتملة</span>
            </div>
          </div>

          <div class="adventure-stat-card">
            <div class="adventure-stat-icon purple">🌍</div>
            <div class="adventure-stat-info">
              <strong>${escapeHtml(currentWorld.title)}</strong>
              <span>العالم الحالي</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Hub Navigation Grid -->
      <div class="adventure-hub-section">
        <h2 class="section-title">مركز الاستكشاف والأنشطة</h2>
        <div class="adventure-hub-grid">
          <!-- Hub 1: World Map -->
          <div class="adventure-hub-card" data-nav="world-map" role="button" tabindex="0">
            <div class="hub-card-icon" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🗺️</div>
            <div class="hub-card-body">
              <h3>خريطة العوالم</h3>
              <p>8 عوالم برمجية من قرية بايثون حتى حلبة الأبطال والمشروع الختامي.</p>
              <div class="hub-card-link">فتح الخريطة ➔</div>
            </div>
          </div>

          <!-- Hub 2: Daily Challenge -->
          <div class="adventure-hub-card" data-nav="daily" role="button" tabindex="0">
            <div class="hub-card-icon" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🎯</div>
            <div class="hub-card-body">
              <h3>التحدي اليومي</h3>
              <p>تحدٍ سريع كل 24 ساعة يمنحك +100 XP ويحافظ على شعلة تتابعك.</p>
              <div class="hub-card-link">بدء التحدي اليومي ➔</div>
            </div>
          </div>

          <!-- Hub 3: Skill Tree -->
          <div class="adventure-hub-card" data-nav="skill-tree" role="button" tabindex="0">
            <div class="hub-card-icon" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">🌳</div>
            <div class="hub-card-body">
              <h3>شجرة المهارات والتمكن</h3>
              <p>متابعة نسبة إتقانك لمفاهيم الشروط، الحلقات، القوائم، والدوال.</p>
              <div class="hub-card-link">عرض شجرة المهارات ➔</div>
            </div>
          </div>

          <!-- Hub 4: Achievements -->
          <div class="adventure-hub-card" data-nav="achievements" role="button" tabindex="0">
            <div class="hub-card-icon" style="background: rgba(139, 92, 246, 0.15); color: #8b5cf6;">🏆</div>
            <div class="hub-card-body">
              <h3>لوحة الإنجازات</h3>
              <p>أوسمة وجوائز برمجية تفتحها مع كل انتصار وتحقيق إنجاز حقيقي.</p>
              <div class="hub-card-link">استعراض الأوسمة ➔</div>
            </div>
          </div>

          <!-- Hub 5: Player Profile & Analytics -->
          <div class="adventure-hub-card" data-nav="profile" role="button" tabindex="0">
            <div class="hub-card-icon" style="background: rgba(236, 72, 153, 0.15); color: #ec4899;">👤</div>
            <div class="hub-card-body">
              <h3>الملف البرمجي والحقيبة</h3>
              <p>سجل إحصائياتك الشخصية، دقة الحلول، ومخزون الأدوات البرمجية.</p>
              <div class="hub-card-link">عرض الملف الشخصي ➔</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
