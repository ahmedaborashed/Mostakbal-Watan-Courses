// src/features/exams/exam.controller.js
import { ExamService } from "./exam.service.js";
import { examState } from "./exam.state.js";
import { renderStudentExamCard, renderTeacherExamCard } from "./components/exam-card.component.js";
import { renderExamTimer } from "./components/exam-timer.component.js";
import { renderExamQuestion } from "./components/exam-question.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { renderButton } from "../../shared/components/Button/button.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { StorageUtils } from "../../shared/utils/storage.utils.js";
import { formatTimer } from "../../shared/utils/date.utils.js";
import { setHtml, escapeHtml } from "../../shared/utils/dom.utils.js";
import { STORAGE_KEYS } from "../../core/constants.js";

let timerInterval = null;

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
          description: "سيتم إشعارك فور قيام المعلم بفتح اختبار جديد."
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
            alert(`نتيجة الامتحان:\nالدرجة: ${result.score} / ${result.totalQuestions || 100}\n${result.notes || ""}`);
          }
        });
      });

      // Check if student was in an ongoing exam before refresh
      this.resumeExamIfActive(currentStudent);
    } catch (err) {
      console.error("Failed to load student exams:", err);
      setHtml(container, renderEmptyState({ icon: "❌", title: "تعذر تحميل الامتحانات", description: err.message }));
    }
  },

  /**
   * Initiates or resumes taking an exam.
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

      // Render Active Exam Screen
      const headerHtml = `
        <div class="card mb-4" style="background:var(--panel-secondary);">
          <div class="d-flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 style="font-size:1.4rem;font-weight:900;">${escapeHtml(examData.title || "الامتحان")}</h2>
              <p class="text-sm text-muted">عدد الأسئلة: ${questions.length} سؤال</p>
            </div>
            <div id="examTimerSlot">
              ${renderExamTimer({ seconds: durationMin * 60 })}
            </div>
          </div>
        </div>
      `;

      const questionsHtml = questions
        .map((q, idx) => renderExamQuestion({ question: q, index: idx, currentAnswer: savedDraft[idx] ?? "" }))
        .join("");

      const submitSectionHtml = `
        <div class="card text-center p-4 mt-4">
          <p class="text-muted mb-3">تأكد من إجابتك على جميع الأسئلة قبل تسليم الامتحان.</p>
          ${renderButton({
            id: "submitExamFinalBtn",
            text: "تسليم الامتحان وتأكيد الإرسال 🚀",
            variant: "primary",
            className: "btn-lg w-full",
            extraAttrs: 'style="max-width:320px;"'
          })}
        </div>
      `;

      setHtml(activeContainer, headerHtml + questionsHtml + submitSectionHtml);

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
          }
        }

        if (remaining <= 0) {
          clearInterval(timerInterval);
          showToast("انتهى وقت الامتحان! يتم تسليم إجاباتك تلقائياً ⏳", "warning");
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
        }
      });

      // 6. Bind submit button
      document.getElementById("submitExamFinalBtn")?.addEventListener("click", () => {
        if (confirm("هل أنت متأكد من رغبتك في تسليم الامتحان؟ لن يمكنك تعديل الإجابات بعد ذلك.")) {
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
        <div class="card text-center p-5 mt-4" style="max-width:550px;margin:2rem auto;">
          <div style="font-size:3.5rem;margin-bottom:1rem;">🎉</div>
          <h2 class="font-extrabold mb-2">تم تسليم الامتحان بنجاح!</h2>
          <p class="text-muted mb-4">تم تقييم إجاباتك عبر السيرفر بأمان.</p>

          <div class="stats-card justify-center mb-4" style="flex-direction:column;gap:.5rem;">
            <div class="stats-label">درجتك النهائية</div>
            <div class="stats-value" style="font-size:2.8rem;">${result.score ?? "—"} <span class="text-sm text-muted">/ ${result.totalQuestions || 100}</span></div>
          </div>

          ${renderButton({
            id: "backToExamsListBtn",
            text: "العودة لقائمة الامتحانات",
            variant: "secondary",
            className: "w-full"
          })}
        </div>
      `;

      if (activeContainer) {
        setHtml(activeContainer, resultHtml);
        document.getElementById("backToExamsListBtn")?.addEventListener("click", () => {
          activeContainer.classList.add("d-none");
          const list = document.getElementById("examListContainer");
          if (list) list.classList.remove("d-none");
          this.loadStudentExams(list, currentStudent);
        });
      }

      showToast("تم اعتماد النتيجة وتسليم الامتحان ✅", "success");
    } catch (err) {
      console.error("Submit exam error:", err);
      showToast(err.message, "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerText = "إعادة محاولة التسليم ⚠️";
      }
    }
  },

  resumeExamIfActive(currentStudent) {
    const activeExamId = StorageUtils.get(STORAGE_KEYS.CURRENT_EXAM);
    if (activeExamId) {
      this.startExamSession(activeExamId, currentStudent);
    }
  },

  /**
   * Teacher view: loads exams management interface.
   */
  async loadTeacherExams(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل الامتحانات..." }));

    try {
      const exams = await ExamService.getAllExams();
      examState.set("exams", exams);

      const headerHtml = `
        <div class="card mb-4">
          <div class="d-flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 class="card-title">📝 إدارة ونشر الامتحانات</h3>
            ${renderButton({
              id: "openCreateExamBtn",
              text: "➕ إنشاء امتحان جديد",
              variant: "primary"
            })}
          </div>
          <p class="text-sm text-muted">يمكنك تفعيل وتعطيل الامتحانات، وإضافة أسئلة مقالية واختيار من متعدد، ومراجعة نتائج الطلاب.</p>
        </div>
      `;

      let listHtml = "";
      if (exams.length === 0) {
        listHtml = renderEmptyState({
          icon: "📝",
          title: "لا توجد امتحانات منشورة",
          description: "اضغط على زر إنشاء امتحان جديد لإضافة أول اختبار."
        });
      } else {
        listHtml = `
          <div class="grid-3">
            ${exams.map((ex) => renderTeacherExamCard({ exam: ex })).join("")}
          </div>
        `;
      }

      setHtml(container, headerHtml + listHtml);

      // Bind toggle status
      container.querySelectorAll("[data-teacher-toggle-exam]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-teacher-toggle-exam");
          const current = btn.getAttribute("data-current-active") === "true";
          try {
            await ExamService.toggleExamStatus(id, !current);
            showToast(`تم ${!current ? "تفعيل" : "تعطيل"} الامتحان بنجاح`, "success");
            this.loadTeacherExams(container);
          } catch (e) {
            showToast(e.message, "error");
          }
        });
      });

      // Bind delete
      container.querySelectorAll("[data-teacher-delete-exam]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-teacher-delete-exam");
          if (confirm("هل أنت متأكد من حذف هذا الامتحان بالكامل؟ ⚠️")) {
            try {
              await ExamService.deleteExam(id);
              showToast("تم حذف الامتحان", "info");
              this.loadTeacherExams(container);
            } catch (e) {
              showToast(e.message, "error");
            }
          }
        });
      });

      // Bind results view
      container.querySelectorAll("[data-teacher-view-results]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-teacher-view-results");
          const title = btn.getAttribute("data-exam-title");
          this.showTeacherExamResults(id, title);
        });
      });
    } catch (err) {
      setHtml(container, renderEmptyState({ icon: "❌", title: "خطأ في تحميل الامتحانات", description: err.message }));
    }
  },

  async showTeacherExamResults(examId, examTitle) {
    try {
      showToast("جاري تحميل نتائج الطلاب...", "info");
      const results = await ExamService.getExamResults(examId);
      alert(`نتائج ${examTitle}:\nإجمالي المسلمين: ${results.length} طالب.\nمتوسط الدرجات: ${results.length > 0 ? (results.reduce((acc, r) => acc + (Number(r.score) || 0), 0) / results.length).toFixed(1) : 0}`);
    } catch (e) {
      showToast(e.message, "error");
    }
  }
};
