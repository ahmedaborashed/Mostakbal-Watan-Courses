// src/app/bootstrap.js
import { ProfileService } from "../features/profile/profile.service.js";
import { StorageUtils } from "../shared/utils/storage.utils.js";
import { STORAGE_KEYS, THEMES, LANGUAGES } from "../core/constants.js";

/**
 * Initializes frontend environment: applies saved theme, font scale, and language.
 */
export function bootstrapApp() {
  const savedTheme = StorageUtils.get(STORAGE_KEYS.THEME, THEMES.GREEN);
  const savedLang = StorageUtils.get(STORAGE_KEYS.LANGUAGE, LANGUAGES.AR);
  const savedFont = StorageUtils.get(STORAGE_KEYS.FONT_SCALE, 100);

  ProfileService.applyTheme(savedTheme);
  ProfileService.applyLanguage(savedLang);
  ProfileService.applyFontScale(0); // apply current font scale without delta

  console.log("🚀 Mostakbal Watan Courses app bootstrapped successfully.");
}
