// src/core/store.js

/**
 * Lightweight, zero-dependency Reactive Store using JS Proxy and Pub-Sub.
 */
class Store {
  constructor(initialState = {}) {
    this.subscribers = new Map();
    this.state = new Proxy(initialState, {
      set: (target, key, value) => {
        target[key] = value;
        if (this.subscribers.has(key)) {
          this.subscribers.get(key).forEach(callback => {
            try { callback(value); } catch (err) { console.error(`Store listener error on [${String(key)}]:`, err); }
          });
        }
        return true;
      }
    });
  }

  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);
    if (this.state[key] !== undefined) {
      callback(this.state[key]);
    }
    return () => this.subscribers.get(key)?.delete(callback);
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }
}

export const appStore = new Store({
  user: null,
  role: null,
  claims: null,
  theme: localStorage.getItem("future_watan_theme") || "green",
  language: localStorage.getItem("future_watan_lang") || "ar",
  loading: false,
  activeExam: null
});
