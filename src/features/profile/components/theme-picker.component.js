// src/features/profile/components/theme-picker.component.js
import { renderCard } from "../../../shared/components/Card/card.component.js";

/**
 * Returns HTML string for the platform settings and theme selector view.
 */
export function renderThemePickerView({ currentTheme = "green", currentFont = 100, currentLang = "ar" }) {
  const contentHtml = `
    <div class="grid-2">
      <!-- Theme Color Card -->
      <div class="card" style="background:var(--bg-secondary);">
        <h4 class="font-bold mb-2">🎨 لون الواجهة الأساسي</h4>
        <p class="text-sm text-muted mb-3">اختر اللون المميز لمنصة التعليم.</p>
        <div class="d-flex gap-2">
          <button type="button" class="btn btn-sm ${currentTheme === "green" ? "btn-primary" : "btn-secondary"}" data-theme-choice="green" style="border-color:#00e676;">
            🟢 الأخضر
          </button>
          <button type="button" class="btn btn-sm ${currentTheme === "cyan" ? "btn-primary" : "btn-secondary"}" data-theme-choice="cyan" style="border-color:#22d3ee;">
            🔵 السماوي
          </button>
          <button type="button" class="btn btn-sm ${currentTheme === "purple" ? "btn-primary" : "btn-secondary"}" data-theme-choice="purple" style="border-color:#a855f7;">
            🟣 البنفسجي
          </button>
          <button type="button" class="btn btn-sm ${currentTheme === "gold" ? "btn-primary" : "btn-secondary"}" data-theme-choice="gold" style="border-color:#fbbf24;">
            🟡 الذهبي
          </button>
        </div>
      </div>

      <!-- Font Size Card -->
      <div class="card" style="background:var(--bg-secondary);">
        <h4 class="font-bold mb-2">🔤 حجم الخط</h4>
        <p class="text-sm text-muted mb-3">تكبير أو تصغير حجم النصوص في المنصة.</p>
        <div class="d-flex items-center gap-3">
          <button type="button" id="fontDecBtn" class="btn btn-secondary btn-sm font-bold" style="width:40px;">A−</button>
          <span id="fontScaleDisplay" class="font-bold text-accent">${currentFont}%</span>
          <button type="button" id="fontIncBtn" class="btn btn-secondary btn-sm font-bold" style="width:40px;">A+</button>
        </div>
      </div>

      <!-- Language Card -->
      <div class="card" style="background:var(--bg-secondary);grid-column:1/-1;">
        <h4 class="font-bold mb-2">🌐 اللغة (Language)</h4>
        <p class="text-sm text-muted mb-3">اختر لغة العرض الأساسية.</p>
        <select id="platformLanguageSelect" class="form-select" style="max-width:260px;">
          <option value="ar" ${currentLang === "ar" ? "selected" : ""}>العربية (Arabic)</option>
          <option value="en" ${currentLang === "en" ? "selected" : ""}>English (الإنجليزية)</option>
        </select>
      </div>
    </div>
  `;

  return renderCard({
    title: "تفضيلات المظهر والنظام",
    icon: "⚙️",
    content: contentHtml
  });
}
