// src/features/exams/exam.controller.js
import { ExamService } from "./exam.service.js";
import { examState } from "./exam.state.js";
import { renderStudentExamCard, renderTeacherExamCard, renderAdminExamCard } from "./components/exam-card.component.js";
import { renderExamTimer } from "./components/exam-timer.component.js";
import { renderExamQuestion } from "./components/exam-question.component.js";
import { renderExamQuestionNavigator } from "./components/exam-question-navigator.component.js";
import { renderExamProgress } from "./components/exam-progress.component.js";
import { renderExamSubmitDialog, EXAM_SUBMIT_MODAL_ID } from "./components/exam-submit-dialog.component.js";
import { renderExamResult } from "./components/exam-result.component.js";
import { renderExamListSkeleton, renderExamQuestionSkeleton } from "./components/exam-skeleton.component.js";
import { renderAdminExamsView } from "./components/exam-list.component.js";
import {
  renderExamFormModal,
  renderExamFormStepper,
  renderExamInfoStep,
  EXAM_FORM_MODAL_ID
} from "./components/exam-form.component.js";
import {
  renderExamDetailsModal,
  renderExamDetailsContent,
  EXAM_DETAILS_MODAL_ID,
  renderStudentExamDetailsModal,
  renderStudentExamDetailsContent,
  STUDENT_EXAM_DETAILS_MODAL_ID,
  renderPreExamConfirmationModal,
  PRE_EXAM_CONFIRM_MODAL_ID
} from "./components/exam-details.component.js";
import {
  renderExamEssayGradingModal,
  renderEssayGradingContent,
  ESSAY_GRADING_MODAL_ID
} from "./components/exam-essay-grading-modal.component.js";
import {
  renderSingleExamPrintableReport,
  renderAllExamsSummaryPrintableReport,
  triggerPrintReport
} from "./components/exam-report.component.js";
import {
  renderQuestionsContainer,
  renderQuestionRow
} from "./components/exam-question-editor.component.js";
import { renderExamReview } from "./components/exam-review.component.js";
import { renderStudentExamReviewMode } from "./components/student-exam-review.component.js";
import { getExamStatusInfo } from "./components/exam-status-badge.component.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { renderButton } from "../../shared/components/Button/button.component.js";
import { renderProgressBar } from "../../shared/components/ProgressBar/progress-bar.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { showConfirmDialog } from "../../shared/components/ConfirmDialog/confirm-dialog.component.js";
import { StorageUtils } from "../../shared/utils/storage.utils.js";
import { formatTimer } from "../../shared/utils/date.utils.js";
import { setHtml, escapeHtml } from "../../shared/utils/dom.utils.js";
import { STORAGE_KEYS } from "../../core/constants.js";

// Internal debounce helper
function debounce(fn, delay = 250) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

let timerInterval = null;
let adminViewMode = "cards"; // "cards" | "table"
let activeAdminContainer = null;
let currentExpandedQuestion = null;
let draggedQuestionIdx = null;

// Anti-Cheat Telemetry & Deterrent Listeners State
let examTelemetryEvents = [];
let antiCheatAttached = false;
let handleVisibilityChange = null;
let handleWindowBlur = null;
let handleBeforeUnload = null;
let handleOnline = null;
let handleOffline = null;
let handleFullscreenChange = null;
let lastBlurWarning = 0;

export const ExamController = {
  /**
   * Ensures student exam modals are injected into the DOM once.
   */
  ensureStudentModals() {
    if (!document.getElementById(STUDENT_EXAM_DETAILS_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderStudentExamDetailsModal());
    }
    if (!document.getElementById("examSubmitConfirmModalWrapper")) {
      const wrapper = document.createElement("div");
      wrapper.id = "examSubmitConfirmModalWrapper";
      document.body.appendChild(wrapper);
    }
  },

  /**
   * Loads exams for student dashboard (authorized available exams only).
   */
  /**
   * Loads exams for student dashboard (available, upcoming, completed, and expired).
   */
  async loadStudentExams(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    // Reset any lingering exam mode body classes
    document.body.classList.remove("is-in-exam-mode");
    this.ensureStudentModals();

    setHtml(container, renderExamListSkeleton(3));

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const studentGroup = (currentStudent?.group && currentStudent.group !== "ALL")
        ? currentStudent.group
        : (currentStudent?.studentGroup && currentStudent.studentGroup !== "ALL"
            ? currentStudent.studentGroup
            : (currentStudent?.group || currentStudent?.studentGroup || "ALL"));

      // Fetch complete academic exams history (all, available, upcoming, completed, expired)
      const allExams = await ExamService.getStudentExams(studentGroup, studentUid);
      examState.set("allStudentExams", allExams);
      examState.set("availableExams", allExams);

      if (allExams.length === 0) {
        setHtml(
          container,
          renderEmptyState({
            icon: "📝",
            title: "لا توجد امتحانات مسجلة حاليًا.",
            description: "سيتم عرض الامتحانات هنا فور تعيينها لمجموعتك من قِبل المعلم."
          })
        );
        return;
      }

      // Compute categories
      const availableExams = allExams.filter((e) => {
        const info = getExamStatusInfo(e, e.result);
        return info.status === "available" || info.status === "in_progress";
      });

      const upcomingExams = allExams.filter((e) => {
        const info = getExamStatusInfo(e, e.result);
        return info.status === "upcoming";
      });

      const pastExams = allExams.filter((e) => {
        const info = getExamStatusInfo(e, e.result);
        return (
          info.status === "graded" ||
          info.status === "pending_essay" ||
          info.status === "submitted" ||
          info.status === "expired"
        );
      });

      // Render tab bar shell
      const shellHtml = `
        <div class="student-exams-shell" dir="rtl">
          <!-- Category Tabs Navigation -->
          <div class="academic-tabs-wrapper mb-4">
            <div class="academic-filter-tabs" role="tablist" aria-label="أقسام الامتحانات">
              <button
                type="button"
                class="academic-filter-btn active"
                data-exam-filter="all"
                role="tab"
                aria-selected="true"
              >
                <span>الكل</span>
                <span class="filter-badge-count">${allExams.length}</span>
              </button>

              <button
                type="button"
                class="academic-filter-btn"
                data-exam-filter="available"
                role="tab"
                aria-selected="false"
              >
                <span>متاحة</span>
                <span class="filter-badge-count">${availableExams.length}</span>
              </button>

              <button
                type="button"
                class="academic-filter-btn"
                data-exam-filter="upcoming"
                role="tab"
                aria-selected="false"
              >
                <span>قادمة</span>
                <span class="filter-badge-count">${upcomingExams.length}</span>
              </button>

              <button
                type="button"
                class="academic-filter-btn"
                data-exam-filter="past"
                role="tab"
                aria-selected="false"
              >
                <span>سابقة</span>
                <span class="filter-badge-count">${pastExams.length}</span>
              </button>
            </div>
          </div>

          <!-- Exams Grid Container Slot -->
          <div id="studentExamsCardsSlot"></div>
        </div>
      `;
      setHtml(container, shellHtml);

      const slot = document.getElementById("studentExamsCardsSlot");

      const renderGridForCategory = (category) => {
        if (!slot) return;
        let list = allExams;
        let emptyTitle = "لا توجد امتحانات في هذا القسم";
        let emptyDesc = "سيتم تحديث هذه القائمة فور توفر اختبارات جديدة.";

        if (category === "available") {
          list = availableExams;
          emptyTitle = "لا توجد امتحانات متاحة للبدء حاليًا";
          emptyDesc = "يمكنك مراجعة الامتحانات السابقة أو متابعة مواعيد الامتحانات القادمة.";
        } else if (category === "upcoming") {
          list = upcomingExams;
          emptyTitle = "لا توجد امتحانات قادمة مجدولة";
          emptyDesc = "سيظهر هنا أي امتحان محدد موعده في تاريخ لاحق.";
        } else if (category === "past") {
          list = pastExams;
          emptyTitle = "لا توجد امتحانات سابقة حتى الآن";
          emptyDesc = "الامتحانات التي تم تسليمها أو انتهى موعدها ستظهر هنا مع النتائج.";
        }

        if (list.length === 0) {
          setHtml(
            slot,
            renderEmptyState({
              icon: "📭",
              title: emptyTitle,
              description: emptyDesc
            })
          );
          return;
        }

        const gridHtml = `
          <div class="grid-3" dir="rtl">
            ${list.map((exam) => renderStudentExamCard({ exam, result: exam.result })).join("")}
          </div>
        `;
        setHtml(slot, gridHtml);

        // Bind open exam details
        slot.querySelectorAll("[data-open-exam-details]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const examId = btn.getAttribute("data-open-exam-details");
            this.openStudentExamDetails(examId, currentStudent);
          });
        });

        // Bind view result buttons
        slot.querySelectorAll("[data-view-exam-result]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const examId = btn.getAttribute("data-view-exam-result");
            this.showExamResult(examId, currentStudent);
          });
        });

        // Bind direct start buttons from card with duplicate click locking
        slot.querySelectorAll("[data-start-exam]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const examId = btn.getAttribute("data-start-exam");
            btn.disabled = true;
            btn.classList.add("is-loading");
            try {
              this.confirmStartExam(examId, currentStudent);
            } finally {
              btn.disabled = false;
              btn.classList.remove("is-loading");
            }
          });
        });
      };

      // Initial render: All exams
      renderGridForCategory("all");

      // Bind category tab switching
      container.querySelectorAll("[data-exam-filter]").forEach((tabBtn) => {
        tabBtn.addEventListener("click", () => {
          container.querySelectorAll("[data-exam-filter]").forEach((b) => {
            b.classList.remove("active");
            b.setAttribute("aria-selected", "false");
          });
          tabBtn.classList.add("active");
          tabBtn.setAttribute("aria-selected", "true");

          const filter = tabBtn.getAttribute("data-exam-filter") || "all";
          renderGridForCategory(filter);
        });
      });

      // Check if student was in an ongoing exam before refresh
      this.resumeExamIfActive(currentStudent);
    } catch (err) {
      console.error("Failed to load student exams:", err);
      setHtml(
        container,
        renderErrorState({
          title: "تعذر تحميل الامتحانات",
          message: err.message || "تعذر تحميل الامتحانات المتاحة لك.",
          retryBtnId: "retryStudentExamsBtn"
        })
      );
      document.getElementById("retryStudentExamsBtn")?.addEventListener("click", () => {
        this.loadStudentExams(containerId, currentStudent);
      });
    }
  },

  /**
   * Opens student exam details modal.
   */
  async openStudentExamDetails(examId, currentStudent) {
    this.ensureStudentModals();
    openModal(STUDENT_EXAM_DETAILS_MODAL_ID);

    const bodySlot = document.getElementById("studentExamDetailsBodySlot");
    if (bodySlot) {
      setHtml(bodySlot, renderLoader({ text: "جاري تجهيز تفاصيل الامتحان... ⏳" }));
    }

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const availableExams = examState.get("availableExams") || [];
      let exam = availableExams.find((e) => e.id === examId);

      if (!exam) {
        exam = await ExamService.getExam(examId);
      }

      let result = exam?.result;
      if (!result && studentUid) {
        result = await ExamService.getResult(examId, studentUid);
      }

      if (bodySlot) {
        setHtml(bodySlot, renderStudentExamDetailsContent({ exam, result }));

        // Bind start action inside details modal
        bodySlot.querySelector("[data-action-start-exam]")?.addEventListener("click", () => {
          closeModal(STUDENT_EXAM_DETAILS_MODAL_ID);
          this.confirmStartExam(examId, currentStudent);
        });

        // Bind view result action inside details modal
        bodySlot.querySelector("[data-action-view-result]")?.addEventListener("click", () => {
          closeModal(STUDENT_EXAM_DETAILS_MODAL_ID);
          this.showExamResult(examId, currentStudent);
        });
      }
    } catch (err) {
      console.error("Open exam details error:", err);
      if (bodySlot) {
        setHtml(
          bodySlot,
          renderErrorState({
            title: "تعذر عرض تفاصيل الامتحان",
            message: err.message
          })
        );
      }
    }
  },

  /**
   * Shows dedicated pre-exam confirmation dialog before starting official attempt.
   */
  async confirmStartExam(examId, currentStudent) {
    const availableExams = examState.get("availableExams") || [];
    let exam = availableExams.find((e) => e.id === examId);
    if (!exam) {
      try {
        exam = await ExamService.getExam(examId);
      } catch (err) {
        console.warn("Could not fetch full exam metadata for confirmation:", err);
        exam = { id: examId, title: "الامتحان", duration: 30 };
      }
    }

    let wrapper = document.getElementById("preExamConfirmModalWrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "preExamConfirmModalWrapper";
      document.body.appendChild(wrapper);
    }

    setHtml(wrapper, renderPreExamConfirmationModal(exam));
    openModal(PRE_EXAM_CONFIRM_MODAL_ID);

    document.getElementById("cancelPreExamBtn")?.addEventListener("click", () => {
      closeModal(PRE_EXAM_CONFIRM_MODAL_ID);
    });

    document.getElementById("confirmStartExamOfficialBtn")?.addEventListener("click", () => {
      closeModal(PRE_EXAM_CONFIRM_MODAL_ID);
      this.startExamSession(examId, currentStudent);
    });
  },

  /**
   * Initiates student exam taking session in distraction-free Exam Mode.
   */
  async startExamSession(examId, currentStudent) {
    if (this._isStartingExam) return;
    this._isStartingExam = true;

    const listContainer = document.getElementById("examListContainer");
    const activeContainer = document.getElementById("activeExamContainer");
    if (!activeContainer) {
      this._isStartingExam = false;
      return;
    }

    if (listContainer) listContainer.classList.add("d-none");
    activeContainer.classList.remove("d-none");
    document.body.classList.add("is-in-exam-mode");

    setHtml(activeContainer, renderExamQuestionSkeleton());

    try {
      // 1. Official attempt creation on backend (server calculates official start and expiry)
      const attemptData = await ExamService.startAttempt(examId);

      // 2. Fetch sanitized questions (answers stripped on server)
      const examData = await ExamService.getExamForStudent(examId);
      const questions = Array.isArray(examData.questions) ? examData.questions : [];
      if (questions.length === 0) {
        throw new Error("لا توجد أسئلة مسجلة في هذا الامتحان حالياً.");
      }

      const studentUid = currentStudent.id || currentStudent.firestoreId;
      const draftKey = `${STORAGE_KEYS.EXAM_DRAFT_PREFIX}${studentUid}_${examId}`;
      const savedDraft = StorageUtils.get(draftKey, {});
      StorageUtils.set(STORAGE_KEYS.CURRENT_EXAM, examId);

      examState.set("activeExam", examData);
      examState.set("questions", questions);
      examState.set("answers", savedDraft);
      examState.set("currentQuestionIndex", 0);
      examState.set("isInReviewMode", false);
      examState.set("isNavigatorCollapsed", false);
      examState.set("activeAttempt", attemptData);

      // 3. Attach Anti-Cheat & Network Telemetry Listeners
      this.attachAntiCheatListeners(examId);

      // 4. Render Exam Mode Shell
      this.renderExamModeView(activeContainer, examId, currentStudent);

      // 5. Start authoritative timer countdown based on server expiresAt
      this.initExamTimer(examId, currentStudent, attemptData.expiresAt);

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Start exam error:", err);
      showToast(err.message || "تعذر بدء الامتحان.", "error");
      this.cleanupExamSession();
      activeContainer.classList.add("d-none");
      if (listContainer) {
        listContainer.classList.remove("d-none");
        this.loadStudentExams(listContainer, currentStudent);
      }
    } finally {
      this._isStartingExam = false;
    }
  },

  /**
   * Attaches non-intrusive anti-cheat telemetry and network monitoring listeners.
   */
  attachAntiCheatListeners(examId) {
    if (antiCheatAttached) return;
    antiCheatAttached = true;
    examTelemetryEvents = [];

    handleVisibilityChange = () => {
      if (document.hidden) {
        examTelemetryEvents.push({ type: "tab_hidden", timestamp: Date.now() });
        const now = Date.now();
        if (now - lastBlurWarning > 6000) {
          lastBlurWarning = now;
          showToast("انتقلت خارج صفحة الامتحان. يُفضّل البقاء داخل صفحة الامتحان حتى الانتهاء.", "warning", 4000);
        }
      } else {
        examTelemetryEvents.push({ type: "tab_visible", timestamp: Date.now() });
      }
    };

    handleWindowBlur = () => {
      examTelemetryEvents.push({ type: "window_blur", timestamp: Date.now() });
      const now = Date.now();
      if (now - lastBlurWarning > 6000) {
        lastBlurWarning = now;
        showToast("انتقلت خارج صفحة الامتحان. يُفضّل البقاء داخل صفحة الامتحان حتى الانتهاء.", "warning", 4000);
      }
    };

    handleBeforeUnload = (e) => {
      const msg = "أنت داخل امتحان حاليًا. التأكد من خروجك قد يؤدي إلى فقدان تقدمك.";
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    handleOffline = () => {
      examTelemetryEvents.push({ type: "network_offline", timestamp: Date.now() });
      showToast("⚠️ اتصال الإنترنت غير مستقر. حاول إعادة الاتصال.", "warning", 6000);
    };

    handleOnline = () => {
      examTelemetryEvents.push({ type: "network_online", timestamp: Date.now() });
      showToast("✅ تمت استعادة الاتصال بالإنترنت.", "success", 3000);
    };

    handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        examTelemetryEvents.push({ type: "fullscreen_exit", timestamp: Date.now() });
        const btn = document.getElementById("btnToggleFullscreen");
        if (btn) btn.innerHTML = "<span>⛶ ملء الشاشة</span>";
      } else {
        examTelemetryEvents.push({ type: "fullscreen_enter", timestamp: Date.now() });
        const btn = document.getElementById("btnToggleFullscreen");
        if (btn) btn.innerHTML = "<span>🗗 تصغير الشاشة</span>";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
  },

  /**
   * Renders single-question or review layout in Exam Mode.
   */
  renderExamModeView(activeContainer, examId, currentStudent) {
    const examData = examState.get("activeExam") || {};
    const questions = examState.get("questions") || [];
    const answers = examState.get("answers") || {};
    const currentIndex = examState.get("currentQuestionIndex") || 0;
    const isInReviewMode = examState.get("isInReviewMode") || false;
    const isCollapsedOnMobile = examState.get("isNavigatorCollapsed") || false;
    const currentQ = questions[currentIndex];

    // Compute answered count
    const answeredCount = questions.filter(
      (_, idx) => answers[idx] !== undefined && answers[idx] !== null && String(answers[idx]).trim() !== ""
    ).length;

    const remainingSec = this.getRemainingSeconds();
    const timerHtml = renderExamTimer({ seconds: remainingSec });

    // Review Mode View
    if (isInReviewMode) {
      const reviewHtml = renderStudentExamReviewMode({
        examTitle: examData.title || "الامتحان",
        questions,
        answers,
        currentIndex,
        timerHtml
      });
      setHtml(activeContainer, reviewHtml);
      this.bindReviewModeEvents(activeContainer, examId, currentStudent);
      return;
    }

    // Single Question View
    const isLastQuestion = currentIndex === questions.length - 1;

    const shellHtml = `
      <div class="exam-mode-shell">
        <!-- Header: Title, Fullscreen, Review, Official Timer, Progress -->
        <header class="exam-mode-header mb-5">
          <div class="d-flex items-center justify-between flex-wrap gap-3 mb-3">
            <div class="exam-title-badge-group">
              <span class="badge badge-gold font-bold mb-1">جلسة امتحان رسمية</span>
              <h2 class="exam-mode-title m-0">${escapeHtml(examData.title || "الامتحان")}</h2>
            </div>

            <div class="d-flex items-center gap-2">
              <button
                type="button"
                id="btnToggleFullscreen"
                class="btn btn-secondary btn-sm d-flex items-center gap-1 font-semibold"
                aria-label="تبديل وضع ملء الشاشة"
              >
                <span>${document.fullscreenElement ? "🗗 تصغير الشاشة" : "⛶ ملء الشاشة"}</span>
              </button>

              <button
                type="button"
                id="btnOpenReviewMode"
                class="btn btn-secondary btn-sm d-flex items-center gap-1 font-semibold"
                aria-label="مراجعة جميع الإجابات"
              >
                <span>مراجعة الإجابات 📋</span>
              </button>

              <div id="examTimerSlot">
                ${timerHtml}
              </div>
            </div>
          </div>

          <div id="examProgressSlot">
            ${renderExamProgress({ answeredCount, totalQuestions: questions.length })}
          </div>
        </header>

        <!-- Question Navigator Grid (Collapsible on Mobile) -->
        <div id="examNavigatorSlot" class="mb-5">
          ${renderExamQuestionNavigator({
            totalQuestions: questions.length,
            currentIndex,
            answers,
            isCollapsedOnMobile
          })}
        </div>

        <!-- Single Question Viewport -->
        <main id="examQuestionViewportSlot" class="mb-5" aria-live="polite">
          ${renderExamQuestion({
            question: currentQ,
            index: currentIndex,
            currentAnswer: answers[currentIndex] ?? "",
            totalQuestions: questions.length
          })}
        </main>

        <!-- Navigation Footer -->
        <footer class="exam-mode-nav-bar card p-4">
          <div class="d-flex items-center justify-between flex-wrap gap-3">
            <div class="d-flex items-center gap-2">
              ${renderButton({
                id: "btnPrevQuestion",
                text: "السابق ↵",
                variant: "secondary",
                className: "btn-md",
                extraAttrs: currentIndex === 0 ? "disabled" : ""
              })}

              <span id="navQuestionIndicator" class="text-xs text-muted font-bold px-2">
                السؤال ${currentIndex + 1} من ${questions.length}
              </span>

              ${
                isLastQuestion
                  ? renderButton({
                      id: "btnNextQuestion",
                      text: "مراجعة الإجابات 📋",
                      variant: "secondary",
                      className: "btn-md font-bold"
                    })
                  : renderButton({
                      id: "btnNextQuestion",
                      text: "التالي ↳",
                      variant: "secondary",
                      className: "btn-md"
                    })
              }
            </div>

            <div class="d-flex items-center gap-2">
              ${renderButton({
                id: "btnOpenSubmitExamModal",
                text: "تسليم الامتحان 🚀",
                variant: "primary",
                className: "btn-md"
              })}
            </div>
          </div>
        </footer>
      </div>
    `;

    setHtml(activeContainer, shellHtml);
    this.bindExamModeEvents(activeContainer, examId, currentStudent);
  },

  /**
   * Binds interaction events for active exam mode.
   */
  bindExamModeEvents(activeContainer, examId, currentStudent) {
    const studentUid = currentStudent.id || currentStudent.firestoreId;
    const draftKey = `${STORAGE_KEYS.EXAM_DRAFT_PREFIX}${studentUid}_${examId}`;

    // 1. Anti-cheat deterrent: intercept contextmenu and copy on questions
    activeContainer.addEventListener("contextmenu", (e) => {
      if (e.target.tagName.toLowerCase() !== "textarea") {
        e.preventDefault();
        showToast("القائمة المختصرة غير مفعلة أثناء الامتحان.", "info", 2000);
      }
    });

    activeContainer.addEventListener("copy", (e) => {
      if (e.target.tagName.toLowerCase() !== "textarea") {
        e.preventDefault();
        showToast("النسخ غير متاح أثناء جلسة الامتحان.", "info", 2000);
      }
    });

    // 2. Fullscreen Toggle Button
    activeContainer.querySelector("#btnToggleFullscreen")?.addEventListener("click", () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch((err) => {
          console.warn("Fullscreen request error:", err);
          showToast("تعذر تفعيل وضع ملء الشاشة على هذا الجهاز.", "info", 2500);
        });
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });

    // 3. Open Review Mode Button
    activeContainer.querySelector("#btnOpenReviewMode")?.addEventListener("click", () => {
      examState.set("isInReviewMode", true);
      this.renderExamModeView(activeContainer, examId, currentStudent);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 4. Mobile Navigator Collapse Toggle
    activeContainer.querySelector("#btnToggleQuestionNav")?.addEventListener("click", () => {
      const isCurrentlyCollapsed = examState.get("isNavigatorCollapsed") || false;
      const nextCollapsed = !isCurrentlyCollapsed;
      examState.set("isNavigatorCollapsed", nextCollapsed);
      const navEl = activeContainer.querySelector(".exam-question-navigator");
      if (navEl) {
        navEl.classList.toggle("is-collapsed-mobile", nextCollapsed);
      }
      const toggleBtn = activeContainer.querySelector("#btnToggleQuestionNav");
      if (toggleBtn) {
        toggleBtn.setAttribute("aria-expanded", String(!nextCollapsed));
        toggleBtn.innerHTML = `<span>${nextCollapsed ? "عرض الفهرس ▾" : "إخفاء الفهرس ▴"}</span>`;
      }
    });

    // 5. Listen for answer inputs (radio MCQ & textarea Essay)
    activeContainer.addEventListener("input", (e) => {
      const input = e.target;
      const qIdx = input.getAttribute("data-question-index");
      if (qIdx === null) return;

      const idx = Number(qIdx);
      const currentAnswers = examState.get("answers") || {};
      const questions = examState.get("questions") || [];

      if (input.type === "radio") {
        currentAnswers[idx] = Number(input.value);
        // Visual radio card highlight update
        const optionCards = activeContainer.querySelectorAll(".exam-option-card");
        optionCards.forEach((card) => card.classList.remove("is-selected"));
        const parentLabel = input.closest(".exam-option-card");
        if (parentLabel) parentLabel.classList.add("is-selected");
      } else if (input.tagName.toLowerCase() === "textarea") {
        currentAnswers[idx] = input.value;
        const charCountEl = document.getElementById("essayCharCount");
        if (charCountEl) {
          charCountEl.textContent = `${input.value.length} حرف`;
        }
      }

      examState.set("answers", currentAnswers);
      StorageUtils.set(draftKey, currentAnswers);

      // Update progress bar
      const answeredCount = questions.filter(
        (_, i) => currentAnswers[i] !== undefined && currentAnswers[i] !== null && String(currentAnswers[i]).trim() !== ""
      ).length;
      const progressSlot = document.getElementById("examProgressSlot");
      if (progressSlot) {
        setHtml(progressSlot, renderExamProgress({ answeredCount, totalQuestions: questions.length }));
      }

      // Update question navigator pill without full re-render
      const currentQIdx = examState.get("currentQuestionIndex") || 0;
      const isCollapsed = examState.get("isNavigatorCollapsed") || false;
      const navSlot = document.getElementById("examNavigatorSlot");
      if (navSlot) {
        setHtml(
          navSlot,
          renderExamQuestionNavigator({
            totalQuestions: questions.length,
            currentIndex: currentQIdx,
            answers: currentAnswers,
            isCollapsedOnMobile: isCollapsed
          })
        );
      }
    });

    // 6. Previous question
    activeContainer.querySelector("#btnPrevQuestion")?.addEventListener("click", () => {
      const currentIdx = examState.get("currentQuestionIndex") || 0;
      if (currentIdx > 0) {
        this.selectQuestion(currentIdx - 1, currentStudent);
      }
    });

    // 7. Next question / Review button on last question
    activeContainer.querySelector("#btnNextQuestion")?.addEventListener("click", () => {
      const questions = examState.get("questions") || [];
      const currentIdx = examState.get("currentQuestionIndex") || 0;
      if (currentIdx < questions.length - 1) {
        this.selectQuestion(currentIdx + 1, currentStudent);
      } else {
        // Last question -> open review mode
        examState.set("isInReviewMode", true);
        this.renderExamModeView(activeContainer, examId, currentStudent);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

    // 8. Question navigator click delegation
    activeContainer.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-nav-question-index]");
      if (pill) {
        const targetIdx = Number(pill.getAttribute("data-nav-question-index"));
        this.selectQuestion(targetIdx, currentStudent);
      }
    });

    // 9. Open submit confirmation modal
    activeContainer.querySelector("#btnOpenSubmitExamModal")?.addEventListener("click", () => {
      this.openSubmitExamModal(examId, currentStudent);
    });
  },

  /**
   * Binds interaction events for student review mode.
   */
  bindReviewModeEvents(activeContainer, examId, currentStudent) {
    // Jump to specific question
    activeContainer.querySelectorAll("[data-jump-to-question]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetIdx = Number(btn.getAttribute("data-jump-to-question"));
        examState.set("isInReviewMode", false);
        examState.set("currentQuestionIndex", targetIdx);
        this.renderExamModeView(activeContainer, examId, currentStudent);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });

    // Return to question mode
    activeContainer.querySelector("#btnReturnToQuestionMode")?.addEventListener("click", () => {
      examState.set("isInReviewMode", false);
      this.renderExamModeView(activeContainer, examId, currentStudent);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // Submit from review screen
    activeContainer.querySelector("#btnReviewSubmitExam")?.addEventListener("click", () => {
      this.openSubmitExamModal(examId, currentStudent);
    });
  },

  /**
   * Switches active single-question view.
   */
  selectQuestion(targetIndex, currentStudent) {
    const questions = examState.get("questions") || [];
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    examState.set("currentQuestionIndex", targetIndex);
    const answers = examState.get("answers") || {};
    const question = questions[targetIndex];
    const isCollapsed = examState.get("isNavigatorCollapsed") || false;

    // 1. Re-render question viewport
    const viewport = document.getElementById("examQuestionViewportSlot");
    if (viewport) {
      setHtml(
        viewport,
        renderExamQuestion({
          question,
          index: targetIndex,
          currentAnswer: answers[targetIndex] ?? "",
          totalQuestions: questions.length
        })
      );
    }

    // 2. Update navigator state
    const navSlot = document.getElementById("examNavigatorSlot");
    if (navSlot) {
      setHtml(
        navSlot,
        renderExamQuestionNavigator({
          totalQuestions: questions.length,
          currentIndex: targetIndex,
          answers,
          isCollapsedOnMobile: isCollapsed
        })
      );
    }

    // 3. Update footer navigation buttons
    const prevBtn = document.getElementById("btnPrevQuestion");
    const nextBtn = document.getElementById("btnNextQuestion");
    const indicator = document.getElementById("navQuestionIndicator");

    if (prevBtn) prevBtn.disabled = targetIndex === 0;
    if (nextBtn) {
      const isLast = targetIndex === questions.length - 1;
      nextBtn.innerHTML = isLast ? "<span>مراجعة الإجابات 📋</span>" : "<span>التالي ↳</span>";
    }
    if (indicator) indicator.textContent = `السؤال ${targetIndex + 1} من ${questions.length}`;

    // Focus on question title for a11y
    viewport?.querySelector(".exam-question-title")?.focus?.();
  },

  /**
   * Initializes authoritative timer countdown based on server expiresAt timestamp.
   */
  initExamTimer(examId, currentStudent, expiresAt) {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    let expiresTimestamp = 0;
    if (typeof expiresAt?.toDate === "function") {
      expiresTimestamp = expiresAt.toDate().getTime();
    } else if (expiresAt instanceof Date) {
      expiresTimestamp = expiresAt.getTime();
    } else if (typeof expiresAt === "string" || typeof expiresAt === "number") {
      expiresTimestamp = new Date(expiresAt).getTime();
    }

    // If invalid timestamp fallback to 30 mins
    if (!expiresTimestamp || isNaN(expiresTimestamp)) {
      expiresTimestamp = Date.now() + 30 * 60 * 1000;
    }

    this._expiresTimestamp = expiresTimestamp;

    const tick = () => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.floor((expiresTimestamp - now) / 1000));

      const display = document.getElementById("examCountdownDisplay");
      const wrapper = document.getElementById("examTimerWrapper");

      if (display) {
        display.textContent = formatTimer(remainingSec);
      }

      if (wrapper) {
        wrapper.classList.remove("timer-normal", "timer-warning", "timer-critical");
        if (remainingSec <= 60) {
          wrapper.classList.add("timer-critical");
        } else if (remainingSec <= 300) {
          wrapper.classList.add("timer-warning");
        } else {
          wrapper.classList.add("timer-normal");
        }
      }

      if (remainingSec <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast("انتهى وقت الامتحان! يتم تسليم إجاباتك تلقائياً ⏳", "warning", 5000);
        this.submitExamSession(examId, currentStudent, true);
      }
    };

    tick();
    timerInterval = setInterval(tick, 1000);
  },

  /**
   * Returns remaining seconds based on server expiresAt.
   */
  getRemainingSeconds() {
    if (!this._expiresTimestamp) return 0;
    return Math.max(0, Math.floor((this._expiresTimestamp - Date.now()) / 1000));
  },

  /**
   * Opens the confirmation dialog showing answered vs unanswered questions before final submission.
   */
  openSubmitExamModal(examId, currentStudent) {
    const questions = examState.get("questions") || [];
    const answers = examState.get("answers") || {};
    const answeredCount = questions.filter(
      (_, idx) =>
        answers[idx] !== undefined &&
        answers[idx] !== null &&
        String(answers[idx]).trim() !== ""
    ).length;
    const totalQuestions = questions.length;

    let wrapper = document.getElementById("examSubmitConfirmModalWrapper");
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = "examSubmitConfirmModalWrapper";
      document.body.appendChild(wrapper);
    }

    setHtml(wrapper, renderExamSubmitDialog({ answeredCount, totalQuestions }));

    openModal(EXAM_SUBMIT_MODAL_ID);

    document.getElementById("cancelSubmitExamBtn")?.addEventListener("click", () => {
      closeModal(EXAM_SUBMIT_MODAL_ID);
    });

    document.getElementById("confirmFinalSubmitExamBtn")?.addEventListener("click", () => {
      closeModal(EXAM_SUBMIT_MODAL_ID);
      this.submitExamSession(examId, currentStudent, false);
    });
  },

  /**
   * Submits student exam answers for server evaluation.
   */
  async submitExamSession(examId, currentStudent, isAuto = false) {
    if (this._isSubmittingExam) return;
    this._isSubmittingExam = true;

    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    const activeContainer = document.getElementById("activeExamContainer");
    if (!activeContainer) {
      this._isSubmittingExam = false;
      return;
    }

    // Lock UI completely
    const allInputs = activeContainer.querySelectorAll("input, textarea, button");
    allInputs.forEach((el) => {
      el.disabled = true;
    });

    // Show loading state
    const submitBtn = document.getElementById("btnOpenSubmitExamModal");
    if (submitBtn) {
      submitBtn.classList.add("is-loading");
      submitBtn.innerText = "جاري تسليم الإجابات... ⏳";
    }

    setHtml(
      activeContainer,
      renderLoader({
        text: isAuto
          ? "انتهى الوقت المحدد! جاري تسليم إجاباتك واعتمادها بالسيرفر... ⏳"
          : "جاري إرسال إجاباتك للتصحيح السحابي المعتمد... ⏳"
      })
    );

    try {
      const answers = examState.get("answers") || {};
      const questions = examState.get("questions") || [];

      // Format answers as array matching questions count
      const answersArray = Array.from({ length: questions.length }, (_, i) => {
        const val = answers[i];
        if (val === undefined || val === null || val === "") return null;
        return isNaN(Number(val)) || (typeof val === "string" && val.trim().length > 2)
          ? val
          : Number(val);
      });

      const result = await ExamService.submitExam(examId, answersArray, questions.length);

      // Clear draft & active session
      const studentUid = currentStudent.id || currentStudent.firestoreId;
      const draftKey = `${STORAGE_KEYS.EXAM_DRAFT_PREFIX}${studentUid}_${examId}`;
      StorageUtils.remove(draftKey);
      StorageUtils.remove(STORAGE_KEYS.CURRENT_EXAM);

      this.cleanupExamSession();

      // Render official result card
      const exam = examState.get("activeExam") || { id: examId };
      setHtml(activeContainer, renderExamResult({ exam, result }));

      // Bind return button
      document.getElementById("backToExamsListBtn")?.addEventListener("click", () => {
        activeContainer.classList.add("d-none");
        const listContainer = document.getElementById("examListContainer");
        if (listContainer) {
          listContainer.classList.remove("d-none");
          this.loadStudentExams(listContainer, currentStudent);
        }
      });
    } catch (err) {
      console.error("Submit exam error:", err);
      showToast(err.message || "تعذر تسليم الامتحان. حاول مرة أخرى.", "error");

      // Re-render exam view to allow retry without losing student answers
      this.renderExamModeView(activeContainer, examId, currentStudent);
    } finally {
      this._isSubmittingExam = false;
    }
  },

  /**
   * Displays the official exam result screen.
   */
  async showExamResult(examId, currentStudent) {
    const listContainer = document.getElementById("examListContainer");
    const activeContainer = document.getElementById("activeExamContainer");
    if (!activeContainer) return;

    if (listContainer) listContainer.classList.add("d-none");
    activeContainer.classList.remove("d-none");
    document.body.classList.remove("is-in-exam-mode");

    setHtml(activeContainer, renderLoader({ text: "جاري جلب نتيجتك الرسمية من السيرفر... 📊" }));

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const result = await ExamService.getResult(examId, studentUid);

      const availableExams = examState.get("availableExams") || [];
      let exam = availableExams.find((e) => e.id === examId);
      if (!exam) {
        exam = await ExamService.getExam(examId);
      }

      setHtml(activeContainer, renderExamResult({ exam, result }));

      document.getElementById("backToExamsListBtn")?.addEventListener("click", () => {
        activeContainer.classList.add("d-none");
        if (listContainer) {
          listContainer.classList.remove("d-none");
          this.loadStudentExams(listContainer, currentStudent);
        }
      });
    } catch (err) {
      console.error("Show exam result error:", err);
      setHtml(
        activeContainer,
        renderErrorState({
          title: "حدث خطأ أثناء تحميل النتيجة",
          message: err.message || "تعذر جلب النتيجة من السيرفر."
        })
      );
    }
  },

  /**
   * Automatically resumes an active exam if the student refreshes the browser.
   */
  resumeExamIfActive(currentStudent) {
    const activeExamId = StorageUtils.get(STORAGE_KEYS.CURRENT_EXAM);
    if (activeExamId) {
      showToast("جاري استئناف جلستك الامتحانية... ⏳", "info");
      this.startExamSession(activeExamId, currentStudent);
    }
  },

  /**
   * Cleans up timer intervals, event listeners, and body classes.
   */
  cleanupExamSession() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    this._expiresTimestamp = null;
    document.body.classList.remove("is-in-exam-mode");

    if (antiCheatAttached) {
      if (handleVisibilityChange) document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (handleWindowBlur) window.removeEventListener("blur", handleWindowBlur);
      if (handleBeforeUnload) window.removeEventListener("beforeunload", handleBeforeUnload);
      if (handleOffline) window.removeEventListener("offline", handleOffline);
      if (handleOnline) window.removeEventListener("online", handleOnline);
      if (handleFullscreenChange) document.removeEventListener("fullscreenchange", handleFullscreenChange);
      antiCheatAttached = false;
      examTelemetryEvents = [];
    }
  },

  /**
   * Loads teacher exams management view (delegating to unified staff exams workflow).
   * @param {string|HTMLElement} containerId
   */
  async loadTeacherExams(containerId) {
    return this.loadAdminExams(containerId);
  },

  // ========================================================
  // ADMIN EXAMS MANAGEMENT WORKFLOW
  // ========================================================

  /**
   * Loads and renders exams for the Admin dashboard.
   * @param {string|HTMLElement} containerId
   */
  async loadAdminExams(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    activeAdminContainer = container;
    setHtml(container, renderLoader({ text: "جاري تحميل الامتحانات والبيانات... 📝" }));
    this.ensureAdminModals();

    try {
      const exams = await ExamService.getAllExams();
      examState.set("adminExams", exams);

      // Fetch results count in parallel for real metrics
      const resultsMap = {};
      await Promise.all(
        exams.map(async (e) => {
          try {
            const res = await ExamService.getExamResults(e.id);
            resultsMap[e.id] = res;
          } catch {
            resultsMap[e.id] = [];
          }
        })
      );
      examState.set("adminResultsMap", resultsMap);

      this.renderAdminView(container);
    } catch (err) {
      console.error("Admin load exams error:", err);
      setHtml(
        container,
        renderErrorState({
          title: "تعذر تحميل الامتحانات",
          message: err.message || "حدث خطأ أثناء جلب قائمة الامتحانات من السيرفر.",
          retryBtnId: "retryAdminExamsBtn"
        })
      );
      document.getElementById("retryAdminExamsBtn")?.addEventListener("click", () => {
        this.loadAdminExams(container);
      });
    }
  },

  /**
   * Renders the admin view with filtered exams and binds interactive events.
   * @param {HTMLElement} container
   */
  renderAdminView(container) {
    const allExams = examState.get("adminExams") || [];
    const resultsMap = examState.get("adminResultsMap") || {};
    const filters = examState.get("adminFilters") || { searchQuery: "", group: "ALL", status: "ALL", sort: "newest" };

    // Apply filters
    let filtered = allExams.filter((exam) => {
      // 1. Search Query
      if (filters.searchQuery) {
        const q = filters.searchQuery.trim().toLowerCase();
        const matchTitle = (exam.title || "").toLowerCase().includes(q);
        const matchDesc = (exam.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      // 2. Group Filter
      if (filters.group && filters.group !== "ALL") {
        if (exam.group !== filters.group) return false;
      }

      // 3. Status Filter
      if (filters.status && filters.status !== "ALL") {
        const statusInfo = getExamStatusInfo(exam);
        if (filters.status === "ACTIVE" && statusInfo.status !== "active") return false;
        if (filters.status === "INACTIVE" && statusInfo.status !== "inactive" && statusInfo.status !== "draft") return false;
        if (filters.status === "UPCOMING" && statusInfo.status !== "upcoming") return false;
        if (filters.status === "EXPIRED" && statusInfo.status !== "expired") return false;
      }

      return true;
    });

    // Sort order
    filtered.sort((a, b) => {
      const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.startDate ? new Date(a.startDate).getTime() : 0);
      const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.startDate ? new Date(b.startDate).getTime() : 0);
      return filters.sort === "oldest" ? dateA - dateB : dateB - dateA;
    });

    const viewHtml = renderAdminExamsView({
      allExams,
      filteredExams: filtered,
      resultsMap,
      filters,
      viewMode: adminViewMode
    });

    setHtml(container, viewHtml);
    this.bindAdminViewEvents(container);
  },

  /**
   * Binds all event listeners for the admin list view.
   * @param {HTMLElement} container
   */
  bindAdminViewEvents(container) {
    // 1. Open Create Modal
    const handleOpenCreate = () => this.openCreateExamModal();
    container.querySelector("#openCreateExamBtn")?.addEventListener("click", handleOpenCreate);
    container.querySelector("#emptyStateCreateExamBtn")?.addEventListener("click", handleOpenCreate);

    // 1.1 Print All Exams Summary Report
    container.querySelector("#printAllExamsSummaryBtn")?.addEventListener("click", async () => {
      try {
        showToast("جاري إعداد تقرير الامتحانات الشامل... ⏳", "info");
        const { exams, matrix } = await ExamService.getAllExamsResultsSummary();
        const reportHtml = renderAllExamsSummaryPrintableReport({ exams, matrix });
        triggerPrintReport(reportHtml);
      } catch (err) {
        console.error("Print summary report error:", err);
        showToast("تعذر استخراج تقرير الامتحانات الشامل.", "error");
      }
    });

    // 2. Debounced Search
    const searchInput = container.querySelector("#adminExamSearchInput");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        debounce((e) => {
          const filters = examState.get("adminFilters") || {};
          filters.searchQuery = e.target.value;
          examState.set("adminFilters", filters);
          this.renderAdminView(container);
        }, 250)
      );
    }

    // 3. Group Filter
    container.querySelector("#adminExamGroupFilter")?.addEventListener("change", (e) => {
      const filters = examState.get("adminFilters") || {};
      filters.group = e.target.value;
      examState.set("adminFilters", filters);
      this.renderAdminView(container);
    });

    // 4. Status Filter
    container.querySelector("#adminExamStatusFilter")?.addEventListener("change", (e) => {
      const filters = examState.get("adminFilters") || {};
      filters.status = e.target.value;
      examState.set("adminFilters", filters);
      this.renderAdminView(container);
    });

    // 5. Sort Filter
    container.querySelector("#adminExamSortFilter")?.addEventListener("change", (e) => {
      const filters = examState.get("adminFilters") || {};
      filters.sort = e.target.value;
      examState.set("adminFilters", filters);
      this.renderAdminView(container);
    });

    // 6. View Mode Switcher
    container.querySelector("#adminExamViewCardsBtn")?.addEventListener("click", () => {
      if (adminViewMode !== "cards") {
        adminViewMode = "cards";
        this.renderAdminView(container);
      }
    });

    container.querySelector("#adminExamViewTableBtn")?.addEventListener("click", () => {
      if (adminViewMode !== "table") {
        adminViewMode = "table";
        this.renderAdminView(container);
      }
    });

    // 7. Reset Filters Button in empty state
    container.querySelector("#resetAdminExamFiltersBtn")?.addEventListener("click", () => {
      examState.set("adminFilters", { searchQuery: "", group: "ALL", status: "ALL", sort: "newest" });
      this.renderAdminView(container);
    });

    // 8. View Exam Details Buttons
    container.querySelectorAll("[data-admin-view-exam]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const examId = btn.getAttribute("data-admin-view-exam");
        this.openExamDetailsModal(examId);
      });
    });

    // 9. Edit Exam Buttons
    container.querySelectorAll("[data-admin-edit-exam]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const examId = btn.getAttribute("data-admin-edit-exam");
        this.openEditExamModal(examId);
      });
    });

    // 10. Toggle Active Status Buttons
    container.querySelectorAll("[data-admin-toggle-exam]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const examId = btn.getAttribute("data-admin-toggle-exam");
        const currentActive = btn.getAttribute("data-current-active") === "true";
        this.handleToggleExam(examId, currentActive);
      });
    });

    // 11. Delete Exam Buttons
    container.querySelectorAll("[data-admin-delete-exam]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const examId = btn.getAttribute("data-admin-delete-exam");
        const title = btn.getAttribute("data-exam-title") || "الامتحان";
        this.handleDeleteExam(examId, title);
      });
    });
  },

  /**
   * Injects the required modals into the DOM once.
   */
  ensureAdminModals() {
    if (!document.getElementById(EXAM_FORM_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderExamFormModal());
    }
    if (!document.getElementById(EXAM_DETAILS_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderExamDetailsModal());
    }
    if (!document.getElementById(ESSAY_GRADING_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderExamEssayGradingModal());
    }
    this.bindAdminModalEvents();
  },

  /**
   * Binds all event listeners for the exam form modal and interactive editor.
   */
  bindAdminModalEvents() {
    const formModal = document.getElementById(EXAM_FORM_MODAL_ID);
    if (!formModal || formModal.hasAttribute("data-admin-events-bound")) return;
    formModal.setAttribute("data-admin-events-bound", "true");

    // 1. Stepper direct tab click navigation
    formModal.addEventListener("click", (e) => {
      const stepItem = e.target.closest("[data-step-nav]");
      if (stepItem) {
        const targetStep = Number(stepItem.getAttribute("data-step-nav"));
        const currentStep = examState.get("currentStep") || 1;
        if (targetStep < currentStep) {
          this.navigateWizardStep(targetStep);
        } else if (targetStep > currentStep) {
          if (currentStep === 1 && this.validateStep1()) {
            this.navigateWizardStep(targetStep);
          } else if (currentStep === 2 && this.validateStep2()) {
            this.navigateWizardStep(targetStep);
          }
        }
      }
    });

    // 2. Wizard footer buttons
    document.getElementById("examFormNextStepBtn")?.addEventListener("click", () => {
      const currentStep = examState.get("currentStep") || 1;
      if (currentStep === 1) {
        if (this.validateStep1()) {
          this.navigateWizardStep(2);
        }
      } else if (currentStep === 2) {
        if (this.validateStep2()) {
          this.navigateWizardStep(3);
        }
      }
    });

    document.getElementById("examFormPrevStepBtn")?.addEventListener("click", () => {
      const currentStep = examState.get("currentStep") || 1;
      if (currentStep > 1) {
        this.syncCurrentStepInputs();
        this.navigateWizardStep(currentStep - 1);
      }
    });

    document.getElementById("examFormDraftBtn")?.addEventListener("click", () => {
      this.handleSaveExam({ publish: false });
    });

    document.getElementById("examFormPublishBtn")?.addEventListener("click", () => {
      this.handleSaveExam({ publish: true });
    });

    // 3. Question Editor Delegated Events inside Step 2
    const stepContainer = document.getElementById("examFormStepContainer");
    if (stepContainer) {
      // Add MCQ
      stepContainer.addEventListener("click", (e) => {
        if (e.target.closest(".btn-add-mcq-btn")) {
          this.handleAddQuestion("mcq");
        }
      });

      // Add Essay
      stepContainer.addEventListener("click", (e) => {
        if (e.target.closest(".btn-add-essay-btn")) {
          this.handleAddQuestion("essay");
        }
      });

      // Change question type
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-change-type");
        if (btn) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          const newType = btn.getAttribute("data-new-type");
          const questions = examState.get("editingQuestions") || [];
          if (questions[qIdx]) {
            questions[qIdx].type = newType;
            if (newType === "mcq" && (!Array.isArray(questions[qIdx].options) || questions[qIdx].options.length < 2)) {
              questions[qIdx].options = ["", "", "", ""];
              questions[qIdx].correct = 0;
            }
            examState.set("editingQuestions", questions);
            this.renderWizardStepContent(2);
          }
        }
      });

      // Toggle expand/collapse
      stepContainer.addEventListener("click", (e) => {
        const toggleEl = e.target.closest("[data-toggle-collapse]") || e.target.closest(".btn-toggle-expand");
        if (toggleEl) {
          const qIdx = Number(toggleEl.getAttribute("data-toggle-collapse") || toggleEl.getAttribute("data-q-idx"));
          currentExpandedQuestion = currentExpandedQuestion === qIdx ? null : qIdx;
          this.renderWizardStepContent(2);
        }
      });

      // Collapse button in editor body
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-collapse-question");
        if (btn) {
          currentExpandedQuestion = null;
          this.renderWizardStepContent(2);
        }
      });

      // Delete Question
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-delete-question");
        if (btn) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          this.handleDeleteQuestion(qIdx);
        }
      });

      // Move Up
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-move-up");
        if (btn && !btn.disabled) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          this.handleMoveQuestion(qIdx, qIdx - 1);
        }
      });

      // Move Down
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-move-down");
        if (btn && !btn.disabled) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          this.handleMoveQuestion(qIdx, qIdx + 1);
        }
      });

      // Add Option in MCQ
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-add-option");
        if (btn) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          const questions = examState.get("editingQuestions") || [];
          if (questions[qIdx] && Array.isArray(questions[qIdx].options) && questions[qIdx].options.length < 6) {
            this.syncCurrentStepInputs();
            questions[qIdx].options.push("");
            examState.set("editingQuestions", questions);
            this.renderWizardStepContent(2);
          }
        }
      });

      // Remove Option in MCQ
      stepContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-remove-option");
        if (btn) {
          const qIdx = Number(btn.getAttribute("data-q-idx"));
          const optIdx = Number(btn.getAttribute("data-opt-idx"));
          const questions = examState.get("editingQuestions") || [];
          if (questions[qIdx] && Array.isArray(questions[qIdx].options) && questions[qIdx].options.length > 2) {
            this.syncCurrentStepInputs();
            questions[qIdx].options.splice(optIdx, 1);
            if (questions[qIdx].correct >= questions[qIdx].options.length) {
              questions[qIdx].correct = 0;
            }
            examState.set("editingQuestions", questions);
            this.renderWizardStepContent(2);
          }
        }
      });

      // Input changes sync
      stepContainer.addEventListener("input", (e) => {
        const input = e.target;
        const questions = examState.get("editingQuestions") || [];

        // Question text
        if (input.classList.contains("q-text-input")) {
          const qIdx = Number(input.getAttribute("data-q-idx"));
          if (questions[qIdx]) questions[qIdx].question = input.value;
        }

        // Question degree
        if (input.classList.contains("q-degree-input")) {
          const qIdx = Number(input.getAttribute("data-q-idx"));
          if (questions[qIdx]) questions[qIdx].degree = Math.max(1, Number(input.value) || 1);
        }

        // Option text
        if (input.classList.contains("option-text-input")) {
          const qIdx = Number(input.getAttribute("data-q-idx"));
          const optIdx = Number(input.getAttribute("data-opt-idx"));
          if (questions[qIdx] && Array.isArray(questions[qIdx].options)) {
            questions[qIdx].options[optIdx] = input.value;
          }
        }
      });

      // Correct radio change
      stepContainer.addEventListener("change", (e) => {
        if (e.target.classList.contains("option-correct-radio")) {
          const qIdx = Number(e.target.getAttribute("data-q-idx"));
          const optIdx = Number(e.target.getAttribute("data-opt-idx"));
          const questions = examState.get("editingQuestions") || [];
          if (questions[qIdx]) {
            questions[qIdx].correct = optIdx;
            // Update visual radio styles within question editor
            const editorBody = e.target.closest(".question-editor-body");
            if (editorBody) {
              editorBody.querySelectorAll(".option-row").forEach((row) => {
                const rOptIdx = Number(row.getAttribute("data-option-row"));
                const badge = row.querySelector(".badge");
                if (badge) {
                  badge.className = `badge ${rOptIdx === optIdx ? "badge-success" : "badge-neutral"}`;
                }
              });
            }
          }
        }
      });

      // 4. Native Drag & Drop Handlers for Questions Reordering
      stepContainer.addEventListener("dragstart", (e) => {
        const handle = e.target.closest("[data-drag-handle]");
        if (handle) {
          draggedQuestionIdx = Number(handle.getAttribute("data-drag-handle"));
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", String(draggedQuestionIdx));
          const card = handle.closest("[data-question-row]");
          if (card) card.classList.add("is-dragging");
        }
      });

      stepContainer.addEventListener("dragover", (e) => {
        const row = e.target.closest("[data-question-row]");
        if (row) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          row.classList.add("is-drag-over");
        }
      });

      stepContainer.addEventListener("dragleave", (e) => {
        const row = e.target.closest("[data-question-row]");
        if (row) {
          row.classList.remove("is-drag-over");
        }
      });

      stepContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        const row = e.target.closest("[data-question-row]");
        if (row) {
          row.classList.remove("is-drag-over");
          const targetIdx = Number(row.getAttribute("data-question-row"));
          if (draggedQuestionIdx !== null && targetIdx !== null && draggedQuestionIdx !== targetIdx) {
            this.handleMoveQuestion(draggedQuestionIdx, targetIdx);
          }
        }
      });

      stepContainer.addEventListener("dragend", () => {
        draggedQuestionIdx = null;
        stepContainer.querySelectorAll(".is-dragging, .is-drag-over").forEach((el) => {
          el.classList.remove("is-dragging", "is-drag-over");
        });
      });
    }
  },

  /**
   * Opens modal to create a new exam from scratch.
   */
  openCreateExamModal() {
    this.ensureAdminModals();
    examState.set("editingExam", {
      id: null,
      title: "",
      description: "",
      group: "ALL",
      duration: 30,
      passDegree: 50,
      active: true,
      startDate: "",
      deadline: "",
      questions: []
    });
    examState.set("editingQuestions", []);
    examState.set("currentStep", 1);
    currentExpandedQuestion = null;

    const titleEl = document.getElementById("examFormModalHeaderTitle");
    if (titleEl) titleEl.textContent = "إنشاء امتحان جديد";

    this.renderWizardStepContent(1);
    openModal(EXAM_FORM_MODAL_ID);
  },

  /**
   * Opens modal to edit an existing exam.
   * @param {string} examId
   */
  async openEditExamModal(examId) {
    this.ensureAdminModals();
    try {
      showToast("جاري تحميل بيانات الامتحان... ⏳", "info");
      const exam = await ExamService.getExam(examId);

      // Deep clone questions for safe editing
      const clonedQuestions = Array.isArray(exam.questions)
        ? JSON.parse(JSON.stringify(exam.questions))
        : [];

      examState.set("editingExam", { ...exam });
      examState.set("editingQuestions", clonedQuestions);
      examState.set("currentStep", 1);
      currentExpandedQuestion = null;

      const titleEl = document.getElementById("examFormModalHeaderTitle");
      if (titleEl) titleEl.textContent = `تعديل الامتحان: ${exam.title || ""}`;

      this.renderWizardStepContent(1);
      openModal(EXAM_FORM_MODAL_ID);
    } catch (err) {
      console.error("Open edit exam error:", err);
      showToast(err.message || "تعذر تحميل بيانات الامتحان للتعديل.", "error");
    }
  },

  /**
   * Opens the admin details modal with complete questions and live analytics.
   * @param {string} examId
   */
  async openExamDetailsModal(examId) {
    this.ensureAdminModals();
    openModal(EXAM_DETAILS_MODAL_ID);

    const bodySlot = document.getElementById("adminExamDetailsBodySlot");
    if (bodySlot) {
      setHtml(bodySlot, renderLoader({ text: "جاري تحميل تفاصيل الامتحان والنتائج... ⏳" }));
    }

    try {
      const [exam, results] = await Promise.all([
        ExamService.getExam(examId),
        ExamService.getExamResults(examId)
      ]);

      if (bodySlot) {
        setHtml(bodySlot, renderExamDetailsContent({ exam, results }));

        // 1. Bind inner edit button
        bodySlot.querySelector("[data-details-edit-exam]")?.addEventListener("click", () => {
          closeModal(EXAM_DETAILS_MODAL_ID);
          this.openEditExamModal(examId);
        });

        // 2. Bind print single exam report
        bodySlot.querySelector("[data-details-print-exam]")?.addEventListener("click", () => {
          const reportHtml = renderSingleExamPrintableReport({ exam, results });
          triggerPrintReport(reportHtml);
        });

        // 3. Bind tabs switching
        bodySlot.querySelectorAll("[data-exam-details-tab]").forEach((tabBtn) => {
          tabBtn.addEventListener("click", () => {
            const tab = tabBtn.getAttribute("data-exam-details-tab");
            bodySlot.querySelectorAll("[data-exam-details-tab]").forEach((b) => b.classList.remove("active"));
            tabBtn.classList.add("active");

            const tabResults = bodySlot.querySelector("#examDetailsTabResults");
            const tabQuestions = bodySlot.querySelector("#examDetailsTabQuestions");

            if (tab === "results") {
              if (tabResults) tabResults.style.display = "block";
              if (tabQuestions) tabQuestions.style.display = "none";
            } else {
              if (tabResults) tabResults.style.display = "none";
              if (tabQuestions) tabQuestions.style.display = "block";
            }
          });
        });

        // 4. Bind results search input
        const searchInput = bodySlot.querySelector("#examResultsSearchInput");
        if (searchInput) {
          searchInput.addEventListener("input", (e) => {
            const q = (e.target.value || "").trim().toLowerCase();
            const rows = bodySlot.querySelectorAll("#examResultsTableBody tr[data-result-row]");
            rows.forEach((row) => {
              const name = row.getAttribute("data-student-name") || "";
              const phone = row.getAttribute("data-student-phone") || "";
              const matches = !q || name.includes(q) || phone.includes(q);
              row.style.display = matches ? "" : "none";
            });
          });
        }

        // 5. Bind essay grading buttons
        bodySlot.querySelectorAll("[data-grade-essay-result]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const resultId = btn.getAttribute("data-grade-essay-result");
            const targetResult = results.find((r) => r.id === resultId);
            if (!targetResult) {
              showToast("لم يتم العثور على نتيجة الطالب.", "error");
              return;
            }
            this.openEssayGradingModal({ exam, result: targetResult });
          });
        });
      }
    } catch (err) {
      console.error("Open exam details error:", err);
      if (bodySlot) {
        setHtml(bodySlot, renderErrorState({ title: "خطأ في عرض التفاصيل", message: err.message }));
      }
    }
  },

  /**
   * Opens the essay grading modal for a student's submission.
   * @param {object} params
   * @param {object} params.exam
   * @param {object} params.result
   */
  async openEssayGradingModal({ exam, result }) {
    this.ensureAdminModals();
    const bodySlot = document.getElementById("essayGradingModalBodySlot");
    if (!bodySlot) return;

    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    const essayQuestions = questions
      .map((q, idx) => ({ ...q, originalIndex: idx }))
      .filter((q) => q.type === "essay");

    if (essayQuestions.length === 0) {
      showToast("لا يحتوي هذا الامتحان على أسئلة مقالية.", "info");
      return;
    }

    const targetQ = essayQuestions.find((q) => {
      const s = result.essayScores?.[q.originalIndex];
      return s == null;
    }) || essayQuestions[0];

    const studentAnswer = result.answers?.[targetQ.originalIndex] || "";
    const currentScore = result.essayScores?.[targetQ.originalIndex] ?? null;

    setHtml(
      bodySlot,
      renderEssayGradingContent({
        exam,
        result,
        questionIndex: targetQ.originalIndex,
        question: targetQ,
        studentAnswer,
        currentScore
      })
    );

    openModal(ESSAY_GRADING_MODAL_ID);

    const submitBtn = document.getElementById("submitEssayGradeBtn");
    if (submitBtn) {
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

      newSubmitBtn.addEventListener("click", async () => {
        const input = document.getElementById("essayGradeInput");
        const val = input ? parseFloat(input.value) : NaN;
        const maxDegree = Number(targetQ.degree) || 1;

        if (isNaN(val) || val < 0 || val > maxDegree) {
          showToast(`يرجى إدخال درجة صالحة بين 0 و ${maxDegree}.`, "error");
          input?.focus();
          return;
        }

        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = "جاري الحفظ والاعتماد... ⏳";

        try {
          await ExamService.gradeEssay(result.id, targetQ.originalIndex, val);
          showToast("تم اعتماد درجة المقالي وتحديث نتيجة الطالب بنجاح ✅", "success");
          closeModal(ESSAY_GRADING_MODAL_ID);
          this.openExamDetailsModal(exam.id);
        } catch (err) {
          showToast(err.message || "فشل في حفظ درجة السؤال المقالي.", "error");
          newSubmitBtn.disabled = false;
          newSubmitBtn.textContent = "اعتماد الدرجة وحفظ النتيجة ✅";
        }
      });
    }
  },

  /**
   * Navigates between wizard steps and updates UI state.
   * @param {number} targetStep (1, 2, or 3)
   */
  navigateWizardStep(targetStep) {
    this.syncCurrentStepInputs();
    examState.set("currentStep", targetStep);
    this.renderWizardStepContent(targetStep);
  },

  /**
   * Renders the active wizard step content and updates Stepper + Buttons.
   * @param {number} step
   */
  renderWizardStepContent(step) {
    const stepperSlot = document.getElementById("examFormStepperSlot");
    if (stepperSlot) {
      setHtml(stepperSlot, renderExamFormStepper(step));
    }

    const stepContainer = document.getElementById("examFormStepContainer");
    if (!stepContainer) return;

    const editingExam = examState.get("editingExam") || {};
    const editingQuestions = examState.get("editingQuestions") || [];

    if (step === 1) {
      setHtml(stepContainer, renderExamInfoStep(editingExam));
    } else if (step === 2) {
      setHtml(
        stepContainer,
        renderQuestionsContainer({
          questions: editingQuestions,
          expandedIndex: currentExpandedQuestion
        })
      );
    } else if (step === 3) {
      setHtml(
        stepContainer,
        renderExamReview({
          examData: editingExam,
          questions: editingQuestions
        })
      );
    }

    // Update wizard footer action buttons
    const prevBtn = document.getElementById("examFormPrevStepBtn");
    const nextBtn = document.getElementById("examFormNextStepBtn");
    const draftBtn = document.getElementById("examFormDraftBtn");
    const publishBtn = document.getElementById("examFormPublishBtn");

    if (prevBtn) prevBtn.classList.toggle("d-none", step === 1);

    if (nextBtn) {
      if (step === 1) {
        nextBtn.classList.remove("d-none");
        nextBtn.innerText = "التالي: الأسئلة →";
      } else if (step === 2) {
        nextBtn.classList.remove("d-none");
        nextBtn.innerText = "التالي: المراجعة →";
      } else {
        nextBtn.classList.add("d-none");
      }
    }

    if (draftBtn) draftBtn.classList.remove("d-none");
    if (publishBtn) publishBtn.classList.toggle("d-none", step !== 3);
  },

  /**
   * Synchronizes input values from the current DOM view back into working state.
   */
  syncCurrentStepInputs() {
    const currentStep = examState.get("currentStep") || 1;
    const editingExam = examState.get("editingExam") || {};
    const editingQuestions = examState.get("editingQuestions") || [];

    if (currentStep === 1) {
      const titleInput = document.getElementById("examFormTitle");
      const descInput = document.getElementById("examFormDesc");
      const groupInput = document.getElementById("examFormGroup");
      const durationInput = document.getElementById("examFormDuration");
      const startInput = document.getElementById("examFormStartDate");
      const deadlineInput = document.getElementById("examFormDeadline");
      const passDegreeInput = document.getElementById("examFormPassDegree");
      const activeToggle = document.getElementById("examFormActiveToggle");

      if (titleInput) editingExam.title = titleInput.value.trim();
      if (descInput) editingExam.description = descInput.value.trim();
      if (groupInput) editingExam.group = groupInput.value;
      if (durationInput) editingExam.duration = Math.max(5, Number(durationInput.value) || 30);
      if (startInput) editingExam.startDate = startInput.value ? new Date(startInput.value) : null;
      if (deadlineInput) editingExam.deadline = deadlineInput.value ? new Date(deadlineInput.value) : null;
      if (passDegreeInput) editingExam.passDegree = Number(passDegreeInput.value) || 0;
      if (activeToggle) editingExam.active = activeToggle.checked;

      examState.set("editingExam", editingExam);
    } else if (currentStep === 2) {
      // Sync open question inputs
      const stepContainer = document.getElementById("examFormStepContainer");
      if (stepContainer) {
        stepContainer.querySelectorAll("[data-question-row]").forEach((row) => {
          const qIdx = Number(row.getAttribute("data-question-row"));
          if (editingQuestions[qIdx]) {
            const textEl = row.querySelector(".q-text-input");
            const degreeEl = row.querySelector(".q-degree-input");
            if (textEl) editingQuestions[qIdx].question = textEl.value.trim();
            if (degreeEl) editingQuestions[qIdx].degree = Math.max(1, Number(degreeEl.value) || 1);

            // Options sync
            const optInputs = row.querySelectorAll(".option-text-input");
            if (optInputs.length > 0) {
              const opts = [];
              optInputs.forEach((optInput) => opts.push(optInput.value.trim()));
              editingQuestions[qIdx].options = opts;
            }
          }
        });
        examState.set("editingQuestions", editingQuestions);
      }
    }
  },

  /**
   * Validates Step 1 inputs (Title, Duration, Dates).
   * @returns {boolean}
   */
  validateStep1() {
    this.syncCurrentStepInputs();
    const editingExam = examState.get("editingExam") || {};

    const titleError = document.getElementById("examFormTitleError");
    const durationError = document.getElementById("examFormDurationError");
    const deadlineError = document.getElementById("examFormDeadlineError");

    let isValid = true;

    // Title validation
    if (!editingExam.title || editingExam.title.trim().length < 3) {
      if (titleError) titleError.classList.remove("d-none");
      document.getElementById("examFormTitle")?.focus();
      isValid = false;
    } else {
      if (titleError) titleError.classList.add("d-none");
    }

    // Duration validation
    if (!editingExam.duration || editingExam.duration < 5) {
      if (durationError) durationError.classList.remove("d-none");
      isValid = false;
    } else {
      if (durationError) durationError.classList.add("d-none");
    }

    // Dates validation (deadline after start)
    if (editingExam.startDate && editingExam.deadline) {
      const startMs = new Date(editingExam.startDate).getTime();
      const deadMs = new Date(editingExam.deadline).getTime();
      if (deadMs <= startMs) {
        if (deadlineError) deadlineError.classList.remove("d-none");
        isValid = false;
      } else {
        if (deadlineError) deadlineError.classList.add("d-none");
      }
    } else {
      if (deadlineError) deadlineError.classList.add("d-none");
    }

    if (!isValid) {
      showToast("يرجى مراجعة الحقول المطلوبة في بيانات الامتحان ⚠️", "warning");
    }

    return isValid;
  },

  /**
   * Validates Step 2 questions.
   * @returns {boolean}
   */
  validateStep2() {
    this.syncCurrentStepInputs();
    const questions = examState.get("editingQuestions") || [];

    if (questions.length === 0) {
      showToast("يجب إضافة سؤال واحد على الأقل قبل المتابعة ⚠️", "warning");
      return false;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question || q.question.trim().length === 0) {
        showToast(`يرجى كتابة نص السؤال رقم ${i + 1} ⚠️`, "warning");
        currentExpandedQuestion = i;
        this.renderWizardStepContent(2);
        return false;
      }

      if (q.type !== "essay") {
        const opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2) {
          showToast(`السؤال رقم ${i + 1} يجب أن يحتوي على خيارين على الأقل ⚠️`, "warning");
          currentExpandedQuestion = i;
          this.renderWizardStepContent(2);
          return false;
        }

        const hasEmptyOption = opts.some((opt) => !opt || opt.trim().length === 0);
        if (hasEmptyOption) {
          showToast(`يرجى تعبئة جميع خيارات السؤال رقم ${i + 1} ⚠️`, "warning");
          currentExpandedQuestion = i;
          this.renderWizardStepContent(2);
          return false;
        }

        if (q.correct === undefined || q.correct === null || q.correct >= opts.length) {
          showToast(`يرجى تحديد الإجابة النموذجية الصحيحة للسؤال رقم ${i + 1} ⚠️`, "warning");
          currentExpandedQuestion = i;
          this.renderWizardStepContent(2);
          return false;
        }
      }
    }

    return true;
  },

  /**
   * Appends a new question to the editing question list.
   * @param {"mcq"|"essay"} type
   */
  handleAddQuestion(type = "mcq") {
    this.syncCurrentStepInputs();
    const questions = examState.get("editingQuestions") || [];
    const newIdx = questions.length;

    const newQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      question: "",
      degree: type === "essay" ? 5 : 1
    };

    if (type === "mcq") {
      newQuestion.options = ["", "", "", ""];
      newQuestion.correct = 0;
    }

    questions.push(newQuestion);
    examState.set("editingQuestions", questions);
    currentExpandedQuestion = newIdx;
    this.renderWizardStepContent(2);

    // Scroll to new question
    setTimeout(() => {
      document.getElementById(`questionRow_${newIdx}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 50);
  },

  /**
   * Deletes a question from the working list.
   * @param {number} qIdx
   */
  async handleDeleteQuestion(qIdx) {
    const questions = examState.get("editingQuestions") || [];
    if (!questions[qIdx]) return;

    const hasContent = questions[qIdx].question && questions[qIdx].question.trim().length > 0;
    if (hasContent) {
      const confirmed = await showConfirmDialog({
        title: "حذف السؤال",
        message: `هل أنت متأكد من حذف السؤال رقم ${qIdx + 1}؟`,
        confirmText: "نعم، احذف",
        variant: "danger"
      });
      if (!confirmed) return;
    }

    this.syncCurrentStepInputs();
    questions.splice(qIdx, 1);
    examState.set("editingQuestions", questions);
    currentExpandedQuestion = null;
    this.renderWizardStepContent(2);
    showToast("تم حذف السؤال", "info");
  },

  /**
   * Moves a question from fromIdx to toIdx for reordering.
   * @param {number} fromIdx
   * @param {number} toIdx
   */
  handleMoveQuestion(fromIdx, toIdx) {
    this.syncCurrentStepInputs();
    const questions = examState.get("editingQuestions") || [];
    if (fromIdx < 0 || fromIdx >= questions.length || toIdx < 0 || toIdx >= questions.length) return;

    const [moved] = questions.splice(fromIdx, 1);
    questions.splice(toIdx, 0, moved);
    examState.set("editingQuestions", questions);
    currentExpandedQuestion = toIdx;
    this.renderWizardStepContent(2);
  },

  /**
   * Saves or publishes the exam into Firestore via ExamService.
   * @param {object} options
   * @param {boolean} [options.publish=false]
   */
  async handleSaveExam({ publish = false }) {
    if (!this.validateStep1()) {
      this.navigateWizardStep(1);
      return;
    }

    if (!this.validateStep2()) {
      this.navigateWizardStep(2);
      return;
    }

    const editingExam = examState.get("editingExam") || {};
    const questions = examState.get("editingQuestions") || [];
    const isEdit = Boolean(editingExam.id);

    const publishBtn = document.getElementById("examFormPublishBtn");
    const draftBtn = document.getElementById("examFormDraftBtn");

    if (publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerText = "جاري الحفظ... ⏳";
    }
    if (draftBtn) {
      draftBtn.disabled = true;
    }

    try {
      const formattedQuestions = questions.map((q, idx) => ({
        id: q.id || `q_${idx}`,
        type: q.type || "mcq",
        question: (q.question || "").trim(),
        degree: Number(q.degree) || 1,
        ...(q.type !== "essay"
          ? {
              options: (q.options || []).map((o) => o.trim()),
              correct: Number(q.correct) || 0
            }
          : {})
      }));

      const payload = {
        title: editingExam.title.trim(),
        description: (editingExam.description || "").trim(),
        group: editingExam.group || "ALL",
        duration: Number(editingExam.duration) || 30,
        startDate: editingExam.startDate || null,
        deadline: editingExam.deadline || null,
        passDegree: Number(editingExam.passDegree) || 0,
        active: publish ? true : false,
        questions: formattedQuestions
      };

      if (isEdit) {
        await ExamService.updateExam(editingExam.id, payload);
        showToast(publish ? "تم تحديث ونشر الامتحان بنجاح 🚀" : "تم حفظ تعديلات الامتحان كمسودة 📝", "success");
      } else {
        await ExamService.createExam(payload);
        showToast(publish ? "تم إنشاء الامتحان ونشره للطلاب بنجاح 🚀" : "تم إنشاء الامتحان وحفظه كمسودة 📝", "success");
      }

      closeModal(EXAM_FORM_MODAL_ID);

      // Refresh admin exam list
      if (activeAdminContainer) {
        this.loadAdminExams(activeAdminContainer);
      }
    } catch (err) {
      console.error("Save exam error:", err);
      showToast(err.message || "تعذر حفظ الامتحان، يرجى المحاولة لاحقاً.", "error");
    } finally {
      if (publishBtn) {
        publishBtn.disabled = false;
        publishBtn.innerText = "حفظ ونشر الامتحان 🚀";
      }
      if (draftBtn) {
        draftBtn.disabled = false;
      }
    }
  },

  /**
   * Toggles active / inactive status of an exam with warning dialog if needed.
   * @param {string} examId
   * @param {boolean} currentActive
   */
  async handleToggleExam(examId, currentActive) {
    if (currentActive) {
      const confirmed = await showConfirmDialog({
        title: "تعطيل الامتحان",
        message: "هل أنت متأكد من رغبتك في تعطيل هذا الاختبار؟ لن يتمكن الطلاب من بدء محاولات جديدة حتى يُعاد تفعيله.",
        confirmText: "نعم، عطل الاختبار",
        cancelText: "إلغاء",
        variant: "warning",
        icon: "⏸️"
      });
      if (!confirmed) return;
    }

    try {
      await ExamService.toggleExamStatus(examId, !currentActive);
      showToast(!currentActive ? "تم تفعيل الامتحان للطلاب بنجاح ✅" : "تم تعطيل الامتحان", "success");
      if (activeAdminContainer) {
        this.loadAdminExams(activeAdminContainer);
      }
    } catch (err) {
      console.error("Toggle exam status error:", err);
      showToast(err.message || "تعذر تغيير حالة الامتحان.", "error");
    }
  },

  /**
   * Deletes an exam completely after user confirmation.
   * @param {string} examId
   * @param {string} title
   */
  async handleDeleteExam(examId, title) {
    const confirmed = await showConfirmDialog({
      title: "حذف الامتحان نهائياً",
      message: `هل أنت متأكد تماماً من رغبتك في حذف "${title}"؟ ستفقد جميع الأسئلة المرتبطة به نهائياً ولا يمكن التراجع.`,
      confirmText: "حذف نهائي 🗑️",
      cancelText: "إلغاء",
      variant: "danger",
      icon: "⚠️"
    });

    if (confirmed) {
      try {
        await ExamService.deleteExam(examId);
        showToast("تم حذف الامتحان بنجاح 🗑️", "info");
        if (activeAdminContainer) {
          this.loadAdminExams(activeAdminContainer);
        }
      } catch (err) {
        console.error("Delete exam error:", err);
        showToast(err.message || "تعذر حذف الامتحان.", "error");
      }
    }
  }
};

