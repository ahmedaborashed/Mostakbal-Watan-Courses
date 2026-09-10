// src/shared/utils/storage.utils.js

/**
 * Safe localStorage wrapper with JSON parsing.
 */
export const StorageUtils = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item);
    } catch {
      return localStorage.getItem(key) || defaultValue;
    }
  },

  set(key, value) {
    try {
      const serialized = typeof value === "string" ? value : JSON.stringify(value);
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.warn(`Failed to save [${key}] to localStorage:`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  }
};
