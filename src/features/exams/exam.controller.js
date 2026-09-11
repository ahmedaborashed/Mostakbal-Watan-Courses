// src/features/exams/exam.controller.js
import { ExamService } from "./exam.service.js";
import { examState } from "./exam.state.js";
import { renderStudentExamCard, renderTeacherExamCard, renderAdminExamCard } from "./components/exam-card.component.js";
import { renderExamTimer } from "./components/exam-timer.component.js";
import { renderExamQuestion } from "./components/exam-question.component.js";
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
  EXAM_DETAILS_MODAL_ID
} from "./components/exam-details.component.js";
import {
  renderQuestionsContainer,
  renderQuestionRow
} from "./components/exam-question-editor.component.js";
import { renderExamReview } from "./components/exam-review.component.js";
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

export const ExamController = {
  /**
   * Loads exams for student dashboard.
   */
  async loadStudentExams(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل الامتحانات... 📝" }));

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const studentGroup = currentStudent?.studentGroup || currentStudent?.group || "ALL";

      const allExams = await ExamService.getAllExams();
      examState.set("exams", allExams);

      // Filter exams for student group
      const relevantExams = allExams.filter((e) => !e.group || e.group === "ALL" || e.group === studentGroup);

      // Check results for each exam in parallel
      const resultsMap = new Map();
      await Promise.all(
        relevantExams.map(async (exam) => {
          const res = await ExamService.getResult(exam.id, studentUid);
          if (res) resultsMap.set(exam.id, res);
        })
      );

      if (relevantExams.length === 0) {
        setHtml(container, renderEmptyState({
          icon: "📝",
          title: "لا توجد امتحانات متاحة حالياً",
          description: "سيتم إشعارك فور قيام المعلم بفتح اختبار جديد لمجموعتك."
        }));
        return;
      }

      const gridHtml = `
        <div class="grid-3">
          ${relevantExams.map((exam) => renderStudentExamCard({ exam, result: resultsMap.get(exam.id) })).join("")}
        </div>
      `;
      setHtml(container, gridHtml);

      // Bind start exam buttons
      container.querySelectorAll("[data-start-exam]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const examId = btn.getAttribute("data-start-exam");
          this.startExamSession(examId, currentStudent);
        });
      });

      // Bind view result buttons
      container.querySelectorAll("[data-view-exam-result]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const examId = btn.getAttribute("data-view-exam-result");
          const result = resultsMap.get(examId);
          if (result) {
            showToast(`نتيجتك في الامتحان: ${result.score} من ${result.totalQuestions || 100}`, "info", 4500);
          }
        });
      });

      // Check if student was in an ongoing exam before refresh
      this.resumeExamIfActive(currentStudent);
    } catch (err) {
      console.error("Failed to load student exams:", err);
      setHtml(container, renderErrorState({
        title: "تعذر تحميل الامتحانات",
        message: err.message,
        retryBtnId: "retryStudentExamsBtn"
      }));
      document.getElementById("retryStudentExamsBtn")?.addEventListener("click", () => {
        this.loadStudentExams(containerId, currentStudent);
      });
    }
  },

  /**
   * Initiates or resumes taking an exam in distraction-free mode.
   */
  async startExamSession(examId, currentStudent) {
    const listContainer = document.getElementById("examListContainer");
    const activeContainer = document.getElementById("activeExamContainer");
    if (!activeContainer) return;

    if (listContainer) listContainer.classList.add("d-none");
    activeContainer.classList.remove("d-none");
    setHtml(activeContainer, renderLoader({ text: "جاري فتح الامتحان وتجهيز الأسئلة... ⏳" }));

    try {
      // 1. Tell server student is starting attempt
      await ExamService.startAttempt(examId);

      // 2. Fetch sanitized questions
      const examData = await ExamService.getExamForStudent(examId);
      const questions = examData.questions || [];
      const durationMin = Number(examData.duration) || 15;

      // 3. Setup draft and session in LocalStorage
      const draftKey = `${STORAGE_KEYS.EXAM_DRAFT_PREFIX}${currentStudent.id || currentStudent.firestoreId}_${examId}`;
      const savedDraft = StorageUtils.get(draftKey, {});
      StorageUtils.set(STORAGE_KEYS.CURRENT_EXAM, examId);

      examState.set("activeExam", examData);
      examState.set("questions", questions);
      examState.set("answers", savedDraft);

      // Count answered questions
      const answeredCount = Object.keys(savedDraft).filter((k) => savedDraft[k] !== "").length;
      const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

      // Render Active Exam Screen
      const headerHtml = `
        <div class="card mb-6" style="background:var(--color-surface-elevated);border-color:var(--color-border-primary);position:sticky;top:70px;z-index:40;box-shadow:var(--shadow-md);">
          <div class="d-flex items-center justify-between flex-wrap gap-4">
            <div>
              <span class="badge badge-gold mb-1">جلسة امتحان نشطة</span>
              <h2 style="font-size:1.4rem;font-weight:900;color:var(--color-text-primary);margin:0;">${escapeHtml(examData.title || "الامتحان")}</h2>
            </div>
            <div id="examTimerSlot">
              ${renderExamTimer({ seconds: durationMin * 60 })}
            </div>
          </div>
          <div class="mt-3" id="examProgressSlot">
            ${renderProgressBar({
              label: `تمت الإجابة على ${answeredCount} من أصل ${questions.length} سؤال`,
              percentage: progressPercent
            })}
          </div>
        </div>
      `;

      const questionsHtml = questions
        .map((q, idx) => renderExamQuestion({
          question: q,
          index: idx,
          currentAnswer: savedDraft[idx] ?? "",
          totalQuestions: questions.length
        }))
        .join("");

      const submitSectionHtml = `
        <div class="card text-center p-6 mt-6" style="max-width:640px;margin-inline:auto;">
          <h3 class="font-extrabold mb-2" style="font-size:1.25rem;">جاهز لتسليم الاختبار؟</h3>
          <p class="text-muted text-sm mb-4">يرجى مراجعة إجاباتك جيداً. بعد الضغط على تأكيد الإرسال سيتم تقييم إجاباتك فوراً ولن تتمكن من التعديل.</p>
          ${renderButton({
            id: "submitExamFinalBtn",
            text: "تسليم الامتحان وتأكيد الإرسال 🚀",
            variant: "primary",
            className: "btn-lg w-full",
            extraAttrs: 'style="max-width:360px;"'
          })}
        </div>
      `;

      setHtml(activeContainer, headerHtml + questionsHtml + submitSectionHtml);

      // Window scroll to top for exam start
      window.scrollTo({ top: 0, behavior: "smooth" });

      // 4. Start timer countdown
      let remaining = durationMin * 60;
      clearInterval(timerInterval);
      timerInterval = setInterval(() => {
        remaining -= 1;
        const display = document.getElementById("examCountdownDisplay");
        if (display) {
          display.textContent = formatTimer(remaining);
          if (remaining <= 120) {
            display.style.color = "var(--color-danger)";
            const wrapper = document.getElementById("examTimerWrapper");
            if (wrapper) wrapper.style.borderColor = "var(--color-danger)";
          }
        }

        if (remaining <= 0) {
          clearInterval(timerInterval);
          showToast("انتهى وقت الامتحان! يتم تسليم إجاباتك تلقائياً ⏳", "warning", 5000);
          this.submitExamSession(examId, currentStudent, true);
        }
      }, 1000);

      // 5. Bind question input change events to auto-save drafts
      activeContainer.addEventListener("input", (e) => {
        const input = e.target;
        const qIdx = input.getAttribute("data-question-index");
        if (qIdx !== null) {
          const currentAnswers = examState.get("answers") || {};
          currentAnswers[qIdx] = input.value;
          examState.set("answers", currentAnswers);
          StorageUtils.set(draftKey, currentAnswers);

          // Update progress bar
          const updatedAnswered = Object.keys(currentAnswers).filter((k) => currentAnswers[k] !== "").length;
          const updatedPercent = questions.length > 0 ? (updatedAnswered / questions.length) * 100 : 0;
          const progressSlot = document.getElementById("examProgressSlot");
          if (progressSlot) {
            progressSlot.innerHTML = renderProgressBar({
              label: `تمت الإجابة على ${updatedAnswered} من أصل ${questions.length} سؤال`,
              percentage: updatedPercent
            });
          }
        }
      });

      // 6. Bind submit button with confirm dialog
      document.getElementById("submitExamFinalBtn")?.addEventListener("click", async () => {
        const confirmed = await showConfirmDialog({
          title: "تسليم الامتحان النهائي",
          message: "هل أنت متأكد من رغبتك في إنهاء الامتحان وتسليم إجاباتك؟ لن يمكنك إعادة الاختبار بعد ذلك.",
          confirmText: "نعم، تسليم الامتحان",
          cancelText: "متابعة الإجابة",
          variant: "primary",
          icon: "📝"
        });

        if (confirmed) {
          this.submitExamSession(examId, currentStudent, false);
        }
      });
    } catch (err) {
      console.error("Start exam error:", err);
      showToast(err.message, "error");
      activeContainer.classList.add("d-none");
      if (listContainer) listContainer.classList.remove("d-none");
    }
  },

  /**
   * Submits student exam answers for server evaluation.
   */
  async submitExamSession(examId, currentStudent, isAuto = false) {
    clearInterval(timerInterval);
    const activeContainer = document.getElementById("activeExamContainer");
    const submitBtn = document.getElementById("submitExamFinalBtn");

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.classList.add("is-loading");
      submitBtn.innerText = "جاري التصحيح واعتماد النتيجة... ⏳";
    }

    try {
      const answers = examState.get("answers") || {};
      const result = await ExamService.submitExam(examId, answers);

      // Clear draft & active session
      const draftKey = `${STORAGE_KEYS.EXAM_DRAFT_PREFIX}${currentStudent.id || currentStudent.firestoreId}_${examId}`;
      StorageUtils.remove(draftKey);
      StorageUtils.remove(STORAGE_KEYS.CURRENT_EXAM);

      // Render Result Card
      const resultHtml = `
        <div class="card text-center p-8 mt-6" style="max-width:560px;margin:2rem auto;box-shadow:var(--shadow-lg);border-color:var(--color-primary);">
          <div style="font-size:4rem;margin-bottom:1rem;" aria-hidden="true">🎉</div>
          <h2 class="font-black mb-2" style="font-size:1.8rem;color:var(--color-text-primary);">تم تسليم الامتحان بنجاح!</h2>
          <p class="text-muted mb-4">تم تقييم إجاباتك عبر السيرفر بأمان واعتماد النتيجة.</p>

          <div class="stat-card mb-6" style="flex-direction:column;gap:0.5rem;padding:var(--space-6);background:var(--color-bg-secondary);border-radius:var(--radius-lg);">
            <div class="stat-label">درجتك المعتمدة</div>
            <div class="stat-value" style="font-size:3.2rem;color:var(--color-primary);">
              ${result.score ?? "—"} <span class="text-sm text-muted">/ ${result.totalQuestions || 100}</span>
            </div>
          </div>

          ${renderButton({
            id: "backToExamsListBtn",
            text: "العودة لقائمة الامتحانات ↵",
            variant: "secondary",
            className: "w-full btn-lg"
          })}
        </div>
      `;

      setHtml(activeContainer, resultHtml);

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
      showToast(`فشل تسليم الامتحان: ${err.message}`, "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("is-loading");
        submitBtn.innerText = "إعادة محاولة التسليم 🚀";
      }
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
   * Loads teacher exams management view.
   */
  async loadTeacherExams(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل قائمة الامتحانات..." }));

    try {
      const exams = await ExamService.getAllExams();
      examState.set("exams", exams);

      if (exams.length === 0) {
        setHtml(container, renderEmptyState({
          icon: "📝",
          title: "لا توجد امتحانات مضافة",
          description: "لم يتم إنشاء أي امتحانات دراسية حتى الآن."
        }));
        return;
      }

      const gridHtml = `
        <div class="grid-3">
          ${exams.map((exam) => renderTeacherExamCard({ exam })).join("")}
        </div>
      `;
      setHtml(container, gridHtml);

      // Bind toggle active buttons
      container.querySelectorAll("[data-teacher-toggle-exam]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const examId = btn.getAttribute("data-teacher-toggle-exam");
          const currentActive = btn.getAttribute("data-current-active") === "true";
          try {
            await ExamService.updateExam(examId, { active: !currentActive });
            showToast(currentActive ? "تم تعطيل الامتحان للطلاب" : "تم تفعيل الامتحان بنجاح ✅", "success");
            this.loadTeacherExams(container);
          } catch (e) {
            showToast(e.message, "error");
          }
        });
      });

      // Bind delete exam buttons
      container.querySelectorAll("[data-teacher-delete-exam]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const examId = btn.getAttribute("data-teacher-delete-exam");
          const title = btn.getAttribute("data-exam-title") || "هذا الامتحان";

          const confirmed = await showConfirmDialog({
            title: "حذف الامتحان",
            message: `هل أنت متأكد من رغبتك في حذف "${title}"؟ ستفقد جميع الأسئلة المرتبطة به.`,
            confirmText: "حذف نهائي",
            variant: "danger"
          });

          if (confirmed) {
            try {
              await ExamService.deleteExam(examId);
              showToast("تم حذف الامتحان بنجاح", "info");
              this.loadTeacherExams(container);
            } catch (e) {
              showToast(e.message, "error");
            }
          }
        });
      });

      // Bind view results buttons
      container.querySelectorAll("[data-teacher-view-results]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const examId = btn.getAttribute("data-teacher-view-results");
          const title = btn.getAttribute("data-exam-title") || "الامتحان";
          showToast(`عرض نتائج "${title}" متاح في تقرير الطلاب`, "info");
        });
      });
    } catch (err) {
      setHtml(container, renderErrorState({ title: "خطأ في تحميل الامتحانات", message: err.message }));
    }
  }
};
