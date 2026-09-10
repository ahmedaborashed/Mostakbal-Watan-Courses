// src/features/profile/profile.state.js
import { Store } from "../../core/store.js";
import { StorageUtils } from "../../shared/utils/storage.utils.js";
import { STORAGE_KEYS, THEMES, LANGUAGES } from "../../core/constants.js";

export const profileState = new Store({
  theme: StorageUtils.get(STORAGE_KEYS.THEME, THEMES.GREEN),
  language: StorageUtils.get(STORAGE_KEYS.LANGUAGE, LANGUAGES.AR),
  fontScale: Number(StorageUtils.get(STORAGE_KEYS.FONT_SCALE, 100)),
  profileData: null,
  loading: false,
  error: null
});
