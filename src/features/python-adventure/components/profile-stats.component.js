// src/features/python-adventure/components/profile-stats.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderAvatar } from "../../../shared/components/Avatar/avatar.component.js";

/**
 * Renders the Player Profile, Analytics, and Inventory screen.
 */
export function renderProfileStats({ student, progress }) {
  const name = student?.studentName || student?.name || "المغامر";
  const xp = progress?.xp || 0;
  const level = progress?.level || 1;
  const streak = progress?.streak?.count || 1;
  const totalStars = Object.values(progress?.stars || {}).reduce((a, b) => a + b, 0);
  const completedCount = Object.keys(progress?.completedChallenges || {}).length;
  const totalRuns = progress?.stats?.totalRuns || completedCount;

  const successRate = totalRuns > 0 ? Math.min(100, Math.round((completedCount / totalRuns) * 100)) : 100;

  // Inventory items
  const inventoryItems = [
    { id: "starter_compass", name: "بوصلة المغامر 🧭", desc: "أداة إرشادية تدلك على مسارات بايثون الأولى." },
    { id: "loop_key", name: "مفتاح التكرار السحري 🔑", desc: "فتح بوابات غابة التكرار المعقدة." },
    { id: "debug_gem", name: "جوهرة فحص الأخطاء 💎", desc: "تكتشف أخطاء الصياغة والمسافات البادئة." },
    { id: "hero_crest", name: "وسام بطل بايثون 🛡️", desc: "درع الشرف الممنوح لخريجي أكاديمية بايثون." }
  ];

  return `
    <div class="adventure-profile-wrapper">
      <div class="adventure-view-header">
        <div>
          <button type="button" class="btn btn-sm btn-secondary" id="profileBackBtn">
            <span>➔ العودة للرئيسية</span>
          </button>
          <h2 class="view-title">👤 الملف البرمجي والحقيبة</h2>
          <p class="view-subtitle">سجل إنجازاتك الشخصية، الإحصائيات الواقعية، ومخزون الأوسمة والأدوات.</p>
        </div>
      </div>

      <!-- Profile Header Card -->
      <div class="profile-hero-card">
        <div class="d-flex items-center gap-4">
          <div class="profile-avatar-box">
            ${renderAvatar({ name, size: "lg" })}
          </div>
          <div>
            <h3 class="profile-name">${escapeHtml(name)}</h3>
            <div class="d-flex items-center gap-2 mt-1">
              <span class="badge badge-primary">Level ${level}</span>
              <span class="text-sm text-muted">إجمالي الخبرة: ${xp} XP</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Real Analytics Grid -->
      <div class="profile-analytics-grid">
        <div class="analytics-card">
          <span class="analytics-icon">🎯</span>
          <strong>${completedCount}</strong>
          <span>المهمات المنجزة</span>
        </div>

        <div class="analytics-card">
          <span class="analytics-icon">⭐</span>
          <strong>${totalStars}</strong>
          <span>إجمالي النجوم</span>
        </div>

        <div class="analytics-card">
          <span class="analytics-icon">🔥</span>
          <strong>${streak} أيام</strong>
          <span>سلسلة الالتزام</span>
        </div>

        <div class="analytics-card">
          <span class="analytics-icon">📈</span>
          <strong>${successRate}%</strong>
          <span>معدل الدقة والنجاح</span>
        </div>
      </div>

      <!-- Inventory Section -->
      <div class="profile-inventory-section">
        <h3 class="section-title">🎒 حقيبة الأدوات والأوسمة (Inventory)</h3>
        <div class="inventory-grid">
          ${inventoryItems.map((item, idx) => {
            const hasItem = idx <= Math.floor(level / 2);
            return `
              <div class="inventory-item-card ${hasItem ? "owned" : "locked"}">
                <div class="inv-icon">${item.name.split(" ").pop()}</div>
                <div class="inv-info">
                  <h4>${escapeHtml(item.name)}</h4>
                  <p class="text-xs text-muted">${escapeHtml(item.desc)}</p>
                  <span class="inv-status text-xs ${hasItem ? "text-success" : "text-muted"}">
                    ${hasItem ? "في الحقيبة ✅" : "يفتح مع تقدمك"}
                  </span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}
