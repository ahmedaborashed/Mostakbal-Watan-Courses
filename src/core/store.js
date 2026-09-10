// src/core/store.js

/**
 * Lightweight, zero-dependency Reactive Store using JS Proxy and Pub-Sub.
 */
export class Store {
  constructor(initialState = {}) {
    this.subscribers = new Map();
    this._target = { ...initialState };
    this.state = new Proxy(this._target, {
      set: (target, key, value) => {
        const prevValue = target[key];
        target[key] = value;
        if (this.subscribers.has(key) && prevValue !== value) {
          this.subscribers.get(key).forEach(callback => {
            try { callback(value, prevValue); } catch (err) { console.error(`Store listener error on [${String(key)}]:`, err); }
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
      try { callback(this.state[key], undefined); } catch (err) { console.error(`Store initial call error on [${String(key)}]:`, err); }
    }
    return () => this.subscribers.get(key)?.delete(callback);
  }

  set(key, value) {
    this.state[key] = value;
  }

  get(key) {
    return this.state[key];
  }

  update(partial) {
    Object.entries(partial).forEach(([k, v]) => {
      this.state[k] = v;
    });
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
