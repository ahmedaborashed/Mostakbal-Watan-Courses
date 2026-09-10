// src/features/profile/components/theme-picker.component.js
import { renderCard } from "../../../shared/components/Card/card.component.js";

/**
 * Returns HTML string for the platform settings and theme selector view.
 */
export function renderThemePickerView({ currentTheme = "green", currentFont = 100, currentLang = "ar" }) {
  const contentHtml = `
    <div class="grid-2">
      <!-- Theme Color Card -->
      <div class="card" style="background:var(--color-bg-secondary);border-color:var(--color-border-subtle);">
        <h4 class="font-extrabold mb-1" style="font-size:1.1rem;">🎨 سمة ولون الواجهة</h4>
        <p class="text-xs text-muted mb-4">اختر النمط اللوني المفضل للمنصة من بين السمات المعتمدة.</p>
        <div class="d-flex gap-2 flex-wrap">
          <button
            type="button"
            class="btn btn-sm ${currentTheme === "green" ? "btn-primary" : "btn-secondary"}"
            data-theme-choice="green"
            style="border-color:#10b981;"
          >
            🟢 الأخضر (الرسمي)
          </button>
          <button
            type="button"
            class="btn btn-sm ${currentTheme === "cyan" ? "btn-primary" : "btn-secondary"}"
            data-theme-choice="cyan"
            style="border-color:#0284c7;"
          >
            🔵 الأزرق السماوي
          </button>
          <button
            type="button"
            class="btn btn-sm ${currentTheme === "purple" ? "btn-primary" : "btn-secondary"}"
            data-theme-choice="purple"
            style="border-color:#7c3aed;"
          >
            🟣 البنفسجي الملكي
          </button>
          <button
            type="button"
            class="btn btn-sm ${currentTheme === "gold" ? "btn-primary" : "btn-secondary"}"
            data-theme-choice="gold"
            style="border-color:#d97706;"
          >
            🟡 الذهبي الفاخر
          </button>
        </div>
      </div>

      <!-- Font Size Card -->
      <div class="card" style="background:var(--color-bg-secondary);border-color:var(--color-border-subtle);">
        <h4 class="font-extrabold mb-1" style="font-size:1.1rem;">🔤 حجم الخط والنصوص</h4>
        <p class="text-xs text-muted mb-4">تكبير أو تصغير حجم الخط لراحة القراءة على شاشتك.</p>
        <div class="d-flex items-center gap-3">
          <button type="button" id="fontDecBtn" class="btn btn-secondary btn-sm font-bold" style="width:48px;" aria-label="تصغير الخط">A−</button>
          <span id="fontScaleDisplay" class="font-black text-accent" style="font-size:1.25rem;min-width:60px;text-align:center;">${currentFont}%</span>
          <button type="button" id="fontIncBtn" class="btn btn-secondary btn-sm font-bold" style="width:48px;" aria-label="تكبير الخط">A+</button>
        </div>
      </div>

      <!-- Language Card -->
      <div class="card" style="background:var(--color-bg-secondary);border-color:var(--color-border-subtle);grid-column:1/-1;">
        <h4 class="font-extrabold mb-1" style="font-size:1.1rem;">🌐 لغة الواجهة (Platform Language)</h4>
        <p class="text-xs text-muted mb-3">اختر لغة العرض والاتجاه في المنصة.</p>
        <select id="platformLanguageSelect" class="form-select" style="max-width:280px;">
          <option value="ar" ${currentLang === "ar" ? "selected" : ""}>العربية (Arabic) — اليمين لليسار</option>
          <option value="en" ${currentLang === "en" ? "selected" : ""}>English (الإنجليزية) — Left to Right</option>
        </select>
      </div>
    </div>
  `;

  return renderCard({
    title: "تفضيلات العرض والمظهر",
    icon: "⚙️",
    content: contentHtml
  });
}
