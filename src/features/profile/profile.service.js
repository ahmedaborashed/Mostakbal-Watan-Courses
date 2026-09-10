// src/features/profile/profile.service.js
import { auth } from "../../core/firebase.js";
import { updatePassword as fbUpdatePassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { StorageUtils } from "../../shared/utils/storage.utils.js";
import { STORAGE_KEYS, THEMES, LANGUAGES } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";

export const ProfileService = {
  /**
   * Updates password for the currently signed-in user.
   */
  async updatePassword(newPassword) {
    const user = auth.currentUser;
    if (!user) throw new Error("يجب تسجيل الدخول أولاً لتغيير كلمة المرور.");

    try {
      await fbUpdatePassword(user, newPassword);
    } catch (err) {
      throw normalizeError(err);
    }
  },

  /**
   * Saves and applies theme token across document.
   */
  applyTheme(theme) {
    const validThemes = Object.values(THEMES);
    const targetTheme = validThemes.includes(theme) ? theme : THEMES.GREEN;

    StorageUtils.set(STORAGE_KEYS.THEME, targetTheme);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", targetTheme);
    }
    return targetTheme;
  },

  /**
   * Saves and applies language preference.
   */
  applyLanguage(lang) {
    const targetLang = lang === LANGUAGES.EN ? LANGUAGES.EN : LANGUAGES.AR;
    StorageUtils.set(STORAGE_KEYS.LANGUAGE, targetLang);
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", targetLang);
      document.documentElement.setAttribute("dir", targetLang === LANGUAGES.AR ? "rtl" : "ltr");
    }
    return targetLang;
  },

  /**
   * Adjusts font scale percentage.
   */
  applyFontScale(delta) {
    let currentScale = Number(StorageUtils.get(STORAGE_KEYS.FONT_SCALE, 100));
    currentScale = Math.min(130, Math.max(85, currentScale + delta * 5));
    StorageUtils.set(STORAGE_KEYS.FONT_SCALE, currentScale);

    if (typeof document !== "undefined") {
      document.documentElement.style.fontSize = `${(16 * currentScale) / 100}px`;
    }
    return currentScale;
  }
};
