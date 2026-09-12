// src/features/python-adventure/python-adventure.controller.js
import { adventureStore } from "./python-adventure.state.js";
import { PythonAdventureService } from "./python-adventure.service.js";
import { runPythonCode } from "./python-adventure-runtime.js";
import { CHALLENGES_CLIENT_DATA, WORLDS_DATA } from "./python-adventure-data.js";
import { escapeHtml } from "../../shared/utils/dom.utils.js";

import { renderAdventureHome } from "./components/adventure-home.component.js";
import { renderWorldMap } from "./components/world-map.component.js";
import { renderMissionModal } from "./components/mission-modal.component.js";
import { renderChallengeView, renderHintsCardContent } from "./components/challenge-view.component.js";
import { wireCodeEditorEvents } from "./components/code-editor.component.js";
import { renderResultModal } from "./components/result-modal.component.js";
import { renderSkillTree } from "./components/skill-tree.component.js";
import { renderAchievements } from "./components/achievements-modal.component.js";
import { renderDailyChallenge } from "./components/daily-challenge.component.js";
import { renderProfileStats } from "./components/profile-stats.component.js";

let containerElement = null;
let currentStudent = null;
let currentRenderedView = null;
let currentRenderedChallengeId = null;

export const PythonAdventureController = {
  /**
   * Initializes the Python Adventure system inside target container.
   */
  async init(containerId, student) {
    containerElement = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!containerElement) return;

    currentStudent = student;
    adventureStore.setState({ student });

    // Show initial loading skeleton
    containerElement.innerHTML = `
      <div class="adventure-loading-card">
        <div class="adventure-loader-spinner"></div>
        <h3>جاري تجهيز مغامرة بايثون... 🐍</h3>
        <p class="text-sm text-muted">استرجاع تقدمك البرمجي، الأوسمة، والعوالم المفتوحة...</p>
      </div>
    `;

    try {
      const studentId = student?.uid || student?.id || student?.firestoreId;
      const progress = await PythonAdventureService.getStudentProgress(studentId);
      adventureStore.setState({
        progress,
        activeView: "home",
        selectedWorldId: progress.currentWorldId || "world-1"
      });

      // Subscribe to store updates for reactive re-rendering
      adventureStore.subscribe((state) => {
        this.renderCurrentView(state);
      });

      this.renderCurrentView(adventureStore.getState());

    } catch (err) {
      console.error("Failed to initialize Python Adventure:", err);
      containerElement.innerHTML = `
        <div class="adventure-error-card">
          <h3>تعذر تحميل مغامرة بايثون</h3>
          <p class="text-sm text-muted">حدث خطأ أثناء استرجاع بياناتك. تأكد من اتصالك بالإنترنت ثم أعد المحاولة.</p>
          <button type="button" class="btn btn-primary mt-3" id="retryAdventureInitBtn">إعادة المحاولة</button>
        </div>
      `;
      document.getElementById("retryAdventureInitBtn")?.addEventListener("click", () => {
        this.init(containerId, student);
      });
    }
  },

  /**
   * Renders the active view based on state.
   */
  renderCurrentView(state) {
    if (!containerElement) return;

    const { activeView, progress, student, selectedWorldId, activeChallenge } = state;

    // Guard against unnecessary full DOM wipes of the active challenge workspace
    if (activeView === "challenge" && currentRenderedView === "challenge" && currentRenderedChallengeId === state.activeChallengeId) {
      return;
    }

    currentRenderedView = activeView;
    currentRenderedChallengeId = activeView === "challenge" ? state.activeChallengeId : null;

    switch (activeView) {
      case "home":
        containerElement.innerHTML = renderAdventureHome({
          student,
          progress,
          onContinue: () => this.handleContinue(),
          onNavigate: (view) => this.navigateTo(view)
        });
        this.wireHomeEvents();
        break;

      case "world-map":
        containerElement.innerHTML = renderWorldMap({
          progress,
          selectedWorldId
        });
        this.wireWorldMapEvents();
        break;

      case "challenge":
        if (activeChallenge) {
          containerElement.innerHTML = renderChallengeView({
            challenge: activeChallenge,
            code: state.editorCode,
            output: state.terminalOutput,
            error: state.terminalError,
            hintsRevealed: state.hintsRevealed,
            attempts: state.attemptsCount,
            isRunning: state.isRunning,
            isSubmitting: state.isSubmitting,
            solutionRevealed: state.solutionRevealed
          });
          this.wireChallengeEvents();
        } else {
          this.navigateTo("world-map");
        }
        break;

      case "skill-tree":
        containerElement.innerHTML = renderSkillTree({ progress });
        this.wireSkillTreeEvents();
        break;

      case "achievements":
        containerElement.innerHTML = renderAchievements({ progress });
        this.wireAchievementsEvents();
        break;

      case "daily":
        containerElement.innerHTML = renderDailyChallenge({
          daily: {
            title: "تحدي جمع الأعداد الزوجية 🔥",
            description: "اكتب برنامجاً يحسب مجموع الأعداد الزوجية من 1 إلى 20 واطبع الناتج (110).",
            requirements: ["استخدم for loop مع range", "اطبع الناتج النهائي فقط (110)"]
          },
          progress
        });
        this.wireDailyEvents();
        break;

      case "profile":
        containerElement.innerHTML = renderProfileStats({ student, progress });
        this.wireProfileEvents();
        break;

      default:
        this.navigateTo("home");
    }
  },

  navigateTo(view, extraState = {}) {
    adventureStore.setState({ activeView: view, ...extraState });
  },

  // ========================================================
  // HOME ACTIONS
  // ========================================================
  wireHomeEvents() {
    document.getElementById("adventureContinueBtn")?.addEventListener("click", () => {
      this.handleContinue();
    });

    document.getElementById("adventureQuickMapBtn")?.addEventListener("click", () => {
      this.navigateTo("world-map");
    });

    containerElement.querySelectorAll(".adventure-hub-card[data-nav]").forEach((card) => {
      card.addEventListener("click", () => {
        const nav = card.getAttribute("data-nav");
        if (nav) this.navigateTo(nav);
      });
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          const nav = card.getAttribute("data-nav");
          if (nav) this.navigateTo(nav);
        }
      });
    });
  },

  /**
   * Primary Action [ استكمال اللعب ]: Finds next unfinished challenge.
   */
  handleContinue() {
    const { progress } = adventureStore.getState();
    const unlocked = progress?.unlockedChallenges || ["world-1-level-1"];
    const completed = progress?.completedChallenges || {};

    // Find first unlocked challenge not yet completed
    let targetChallengeId = unlocked.find((id) => !completed[id]);
    if (!targetChallengeId) {
      targetChallengeId = unlocked[unlocked.length - 1] || "world-1-level-1";
    }

    this.startMissionFlow(targetChallengeId);
  },

  // ========================================================
  // WORLD MAP ACTIONS
  // ========================================================
  wireWorldMapEvents() {
    document.getElementById("mapBackToHomeBtn")?.addEventListener("click", () => {
      this.navigateTo("home");
    });

    containerElement.querySelectorAll(".world-card[data-world-id]").forEach((card) => {
      card.addEventListener("click", () => {
        const worldId = card.getAttribute("data-world-id");
        const { progress } = adventureStore.getState();
        const isUnlocked = (progress?.unlockedWorlds || ["world-1"]).includes(worldId);
        if (isUnlocked) {
          adventureStore.setState({ selectedWorldId: worldId });
          // Scroll levels section smoothly into view
          document.getElementById("worldLevelsSection")?.scrollIntoView({ behavior: "smooth" });
        }
      });
    });

    containerElement.querySelectorAll(".level-card[data-challenge-id]").forEach((card) => {
      card.addEventListener("click", () => {
        const challengeId = card.getAttribute("data-challenge-id");
        const { progress } = adventureStore.getState();
        const isUnlocked = (progress?.unlockedChallenges || ["world-1-level-1"]).includes(challengeId);
        if (isUnlocked && challengeId) {
          this.startMissionFlow(challengeId);
        }
      });
    });
  },

  // ========================================================
  // MISSION INTRO & MICRO LESSON FLOW
  // ========================================================
  async startMissionFlow(challengeId) {
    try {
      const challenge = await PythonAdventureService.getChallenge(challengeId);
      if (!challenge) return;

      // Show Mission Intro Modal (Step 1: Story)
      this.showMissionModal(challenge, "story");

    } catch (err) {
      console.error("Failed to load challenge:", err);
      alert(err.message || "تعذر فتح المهمة.");
    }
  },

  showMissionModal(challenge, step = "story") {
    // Remove existing modal if any
    document.getElementById("adventureMissionModal")?.remove();

    document.body.insertAdjacentHTML("beforeend", renderMissionModal(challenge, step));

    document.getElementById("closeMissionModalBtn")?.addEventListener("click", () => {
      document.getElementById("adventureMissionModal")?.remove();
    });

    document.getElementById("missionStoryNextBtn")?.addEventListener("click", () => {
      this.showMissionModal(challenge, "micro");
    });

    document.getElementById("missionMicroDoneBtn")?.addEventListener("click", () => {
      document.getElementById("adventureMissionModal")?.remove();
      this.openChallengeWorkspace(challenge);
    });
  },

  openChallengeWorkspace(challenge) {
    adventureStore.resetEditor(challenge.starterCode || "");
    adventureStore.setState({
      activeChallengeId: challenge.id,
      activeChallenge: challenge,
      activeView: "challenge"
    });
  },

  // ========================================================
  // CHALLENGE WORKSPACE & PYTHON EXECUTION
  // ========================================================
  wireChallengeEvents() {
    const textareaEl = document.getElementById("pyCodeTextarea");
    const lineNumbersEl = document.getElementById("pyLineNumbers");

    wireCodeEditorEvents({
      textareaEl,
      lineNumbersEl,
      onChange: (code) => {
        adventureStore.setState({ editorCode: code }, { notify: false });
      },
      onRunShortcut: () => {
        this.runCurrentCode();
      }
    });

    document.getElementById("challengeBackBtn")?.addEventListener("click", () => {
      this.navigateTo("world-map");
    });

    document.getElementById("challengeLessonBtn")?.addEventListener("click", () => {
      const { activeChallenge } = adventureStore.getState();
      if (activeChallenge) {
        this.showMissionModal(activeChallenge, "micro");
      }
    });

    document.getElementById("pyCopyCodeBtn")?.addEventListener("click", async () => {
      const currentCode = textareaEl ? textareaEl.value : adventureStore.getState().editorCode;
      if (navigator.clipboard && currentCode) {
        await navigator.clipboard.writeText(currentCode);
        const btn = document.getElementById("pyCopyCodeBtn");
        if (btn) btn.innerHTML = "<span>✓ تم النسخ</span>";
        setTimeout(() => {
          if (btn) btn.innerHTML = "<span>📋 نسخ</span>";
        }, 1500);
      }
    });

    document.getElementById("pyResetCodeBtn")?.addEventListener("click", () => {
      const { activeChallenge } = adventureStore.getState();
      if (activeChallenge && confirm("هل تريد استعادة الكود الأصلي للقالب؟")) {
        const starter = activeChallenge.starterCode || "";
        adventureStore.setState({ editorCode: starter }, { notify: false });
        if (textareaEl) {
          textareaEl.value = starter;
          if (lineNumbersEl) {
            const lines = Math.max(1, starter.split("\n").length);
            lineNumbersEl.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join("");
          }
        }
        const terminalEl = document.getElementById("pyTerminalOutput");
        if (terminalEl) {
          terminalEl.innerHTML = `<div class="terminal-placeholder text-muted"># اضغط "تشغيل الكود" لمعاينة المخرجات هنا...</div>`;
        }
      }
    });

    document.getElementById("pyClearTerminalBtn")?.addEventListener("click", () => {
      adventureStore.setState({ terminalOutput: "", terminalError: null }, { notify: false });
      const terminalEl = document.getElementById("pyTerminalOutput");
      if (terminalEl) {
        terminalEl.innerHTML = `<div class="terminal-placeholder text-muted"># اضغط "تشغيل الكود" لمعاينة المخرجات هنا...</div>`;
      }
    });

    document.getElementById("pyRunBtn")?.addEventListener("click", () => {
      this.runCurrentCode();
    });

    document.getElementById("pySubmitBtn")?.addEventListener("click", () => {
      this.submitCurrentSolution();
    });

    document.getElementById("revealNextHintBtn")?.addEventListener("click", () => {
      this.revealNextHint();
    });

    document.getElementById("revealSolutionPromptBtn")?.addEventListener("click", () => {
      this.promptRevealSolution();
    });
  },

  /**
   * Safe in-browser execution with real-time output (butter-smooth, no page re-renders).
   */
  async runCurrentCode() {
    const state = adventureStore.getState();
    if (state.isRunning || state.isSubmitting) return;

    const textareaEl = document.getElementById("pyCodeTextarea");
    const code = textareaEl ? textareaEl.value : state.editorCode;

    adventureStore.setState({ isRunning: true, terminalError: null }, { notify: false });
    const runBtn = document.getElementById("pyRunBtn");
    if (runBtn) {
      runBtn.disabled = true;
      runBtn.innerHTML = "<span>⏳ جاري التشغيل...</span>";
    }

    const terminalEl = document.getElementById("pyTerminalOutput");
    if (terminalEl) {
      terminalEl.innerHTML = `<div class="terminal-running text-muted">⏳ جاري تشغيل الكود في بايثون...</div>`;
    }

    try {
      const result = await runPythonCode(code, {
        onOutput: (stream) => {
          if (terminalEl) {
            terminalEl.innerHTML = `<div class="terminal-stdout">${escapeHtml(stream)}</div>`;
          }
        }
      });

      if (terminalEl) {
        if (result.error) {
          terminalEl.innerHTML = `
            ${result.output ? `<div class="terminal-stdout">${escapeHtml(result.output)}</div>` : ""}
            <div class="terminal-error">${escapeHtml(result.error)}</div>
          `;
        } else if (result.output) {
          terminalEl.innerHTML = `<div class="terminal-stdout">${escapeHtml(result.output)}</div>`;
        } else {
          terminalEl.innerHTML = `<div class="terminal-placeholder text-muted"># تم تنفيذ الكود بنجاح (لا توجد مخرجات للطباعة).</div>`;
        }
      }

      adventureStore.setState({
        editorCode: code,
        terminalOutput: result.output,
        terminalError: result.error,
        isRunning: false
      }, { notify: false });

    } catch (err) {
      if (terminalEl) {
        terminalEl.innerHTML = `<div class="terminal-error">${escapeHtml(err.message || "حدث خطأ غير متوقع أثناء التشغيل")}</div>`;
      }
      adventureStore.setState({
        editorCode: code,
        terminalError: err.message,
        isRunning: false
      }, { notify: false });
    } finally {
      if (runBtn) {
        runBtn.disabled = false;
        runBtn.innerHTML = "<span>▶ تشغيل الكود</span>";
      }
    }
  },

  /**
   * Submits solution for authoritative verification and reward calculation.
   */
  async submitCurrentSolution() {
    const state = adventureStore.getState();
    if (state.isSubmitting || !state.activeChallenge) return;

    const textareaEl = document.getElementById("pyCodeTextarea");
    const code = textareaEl ? textareaEl.value : state.editorCode;

    adventureStore.setState({ isSubmitting: true }, { notify: false });
    const submitBtn = document.getElementById("pySubmitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = "<span>⏳ جاري التحقق...</span>";
    }

    const terminalEl = document.getElementById("pyTerminalOutput");

    try {
      // 1. Run local syntax & runtime check first
      const runCheck = await runPythonCode(code);
      if (runCheck.error) {
        if (terminalEl) {
          terminalEl.innerHTML = `
            ${runCheck.output ? `<div class="terminal-stdout">${escapeHtml(runCheck.output)}</div>` : ""}
            <div class="terminal-error">${escapeHtml(runCheck.error)}</div>
          `;
        }
        adventureStore.setState({
          editorCode: code,
          terminalError: runCheck.error,
          terminalOutput: runCheck.output,
          isSubmitting: false,
          attemptsCount: state.attemptsCount + 1
        }, { notify: false });

        this.showResultModal({
          passed: false,
          feedback: "الكود يحتوي على أخطاء برمجية تمنع تنفيذه.",
          errorDetails: runCheck.error
        });
        return;
      }

      // 2. Submit to Authoritative Service
      const result = await PythonAdventureService.submitChallenge({
        challengeId: state.activeChallenge.id,
        code,
        hintsUsed: state.hintsRevealed,
        attempts: state.attemptsCount,
        currentProgress: state.progress
      });

      adventureStore.setState({ isSubmitting: false }, { notify: false });

      if (result.passed) {
        // Update local state progress
        const studentId = currentStudent?.uid || currentStudent?.id || currentStudent?.firestoreId;
        const updatedProgress = await PythonAdventureService.getStudentProgress(studentId);
        adventureStore.setState({ progress: updatedProgress }, { notify: false });

        this.showResultModal({
          passed: true,
          earnedXp: result.earnedXp,
          stars: result.stars,
          levelUp: result.levelUp,
          newLevel: result.newLevel,
          feedback: result.feedback,
          skillsGained: result.skillsGained,
          newlyUnlockedAchievements: result.newlyUnlockedAchievements,
          hasNextChallenge: !!result.unlockedNextChallengeId,
          nextChallengeId: result.unlockedNextChallengeId
        });

      } else {
        if (terminalEl && result.testResults?.stdout) {
          terminalEl.innerHTML = `<div class="terminal-stdout">${escapeHtml(result.testResults.stdout)}</div>`;
        }
        adventureStore.setState({
          attemptsCount: state.attemptsCount + 1,
          terminalOutput: result.testResults?.stdout || state.terminalOutput
        }, { notify: false });

        this.showResultModal({
          passed: false,
          feedback: result.feedback,
          errorDetails: result.errorDetails
        });
      }

    } catch (err) {
      console.error("Submission failed:", err);
      adventureStore.setState({ isSubmitting: false }, { notify: false });
      alert("حدث خطأ أثناء إرسال الحل. حاول مرة أخرى.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "<span>🚀 تسليم الحل والتحقق</span>";
      }
    }
  },

  showResultModal(params) {
    document.getElementById("adventureResultModal")?.remove();
    document.body.insertAdjacentHTML("beforeend", renderResultModal(params));

    document.getElementById("resultTryAgainBtn")?.addEventListener("click", () => {
      document.getElementById("adventureResultModal")?.remove();
    });

    document.getElementById("resultGetHintBtn")?.addEventListener("click", () => {
      document.getElementById("adventureResultModal")?.remove();
      this.revealNextHint();
    });

    document.getElementById("resultNextMissionBtn")?.addEventListener("click", () => {
      document.getElementById("adventureResultModal")?.remove();
      if (params.nextChallengeId) {
        this.startMissionFlow(params.nextChallengeId);
      } else {
        this.navigateTo("world-map");
      }
    });

    document.getElementById("resultReturnMapBtn")?.addEventListener("click", () => {
      document.getElementById("adventureResultModal")?.remove();
      this.navigateTo("world-map");
    });

    document.getElementById("resultReturnMapBtnSecondary")?.addEventListener("click", () => {
      document.getElementById("adventureResultModal")?.remove();
      this.navigateTo("world-map");
    });
  },

  updateHintsCardInChallengeView() {
    const cardEl = document.getElementById("hintsSystemCard");
    if (!cardEl) return;
    const state = adventureStore.getState();
    cardEl.innerHTML = renderHintsCardContent({
      challenge: state.activeChallenge,
      hintsRevealed: state.hintsRevealed,
      attempts: state.attemptsCount,
      solutionRevealed: state.solutionRevealed
    });
    document.getElementById("revealNextHintBtn")?.addEventListener("click", () => {
      this.revealNextHint();
    });
    document.getElementById("revealSolutionPromptBtn")?.addEventListener("click", () => {
      this.promptRevealSolution();
    });
  },

  revealNextHint() {
    const { activeChallenge, hintsRevealed } = adventureStore.getState();
    const hints = activeChallenge?.hints || [];
    if (hintsRevealed < hints.length) {
      adventureStore.setState({ hintsRevealed: hintsRevealed + 1 }, { notify: false });
      this.updateHintsCardInChallengeView();
    }
  },

  promptRevealSolution() {
    const confirmed = confirm("⚠️ تنبيه:\nعرض الحل النموذجي سيقلل المكافأة إلى 20% XP ونجمة واحدة لهذه المهمة.\n\nهل أنت متأكد من رغبتك في عرض الحل؟");
    if (confirmed) {
      adventureStore.setState({ solutionRevealed: true, hintsRevealed: 4 }, { notify: false });
      this.updateHintsCardInChallengeView();
    }
  },

  // ========================================================
  // SECONDARY VIEWS NAVIGATION
  // ========================================================
  wireSkillTreeEvents() {
    document.getElementById("skillTreeBackBtn")?.addEventListener("click", () => {
      this.navigateTo("home");
    });
  },

  wireAchievementsEvents() {
    document.getElementById("achievementsBackBtn")?.addEventListener("click", () => {
      this.navigateTo("home");
    });
  },

  wireDailyEvents() {
    document.getElementById("dailyBackBtn")?.addEventListener("click", () => {
      this.navigateTo("home");
    });

    document.getElementById("startDailyChallengeBtn")?.addEventListener("click", () => {
      // Launch daily challenge challenge
      const dailyChallengeObj = {
        id: "daily-loop-sum",
        worldTitle: "التحدي اليومي",
        levelNumber: 1,
        title: "تحدي جمع الأعداد الزوجية 🔥",
        subtitle: "تحدي الـ 24 ساعة",
        difficulty: "medium",
        type: "write_code",
        baseXp: 100,
        story: "اكتب برنامجاً بلغة بايثون يحسب مجموع الأعداد الزوجية من 1 إلى 20 واطبع الناتج النهائي فقط (الناتج هو 110).",
        microLesson: {
          concept: "جمع الأعداد الزوجية",
          summary: "يمكنك استخدام for i in range(2, 21, 2) للمرور على الأعداد الزوجية فقط، وجمعها في متغير total."
        },
        starterCode: "total = 0\n# احسب واطبع مجموع الأعداد الزوجية من 1 إلى 20\n",
        requirements: ["استخدم for loop", "اطبع الناتج النهائي فقط (110)"],
        hints: ["for i in range(2, 21, 2): total += i", "print(total)"]
      };
      this.showMissionModal(dailyChallengeObj, "story");
    });
  },

  wireProfileEvents() {
    document.getElementById("profileBackBtn")?.addEventListener("click", () => {
      this.navigateTo("home");
    });
  }
};
