// src/features/python-adventure/python-adventure.state.js

class PythonAdventureStore {
  constructor() {
    this.state = {
      student: null,
      progress: null,
      activeView: "home", // home | world-map | challenge | skill-tree | achievements | daily | profile
      selectedWorldId: "world-1",
      activeChallengeId: null,
      activeChallenge: null,
      editorCode: "",
      terminalOutput: "",
      terminalError: null,
      hintsRevealed: 0,
      attemptsCount: 1,
      solutionRevealed: false,
      isRunning: false,
      isSubmitting: false,
      lastResult: null
    };
    this.listeners = new Set();
  }

  getState() {
    return this.state;
  }

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error("State listener error:", err);
      }
    }
  }

  resetEditor(code = "") {
    this.setState({
      editorCode: code,
      terminalOutput: "",
      terminalError: null,
      hintsRevealed: 0,
      attemptsCount: 1,
      solutionRevealed: false,
      isRunning: false,
      isSubmitting: false,
      lastResult: null
    });
  }
}

export const adventureStore = new PythonAdventureStore();
