// src/features/assignments/assignment.controller.js
import { AssignmentService } from "./assignment.service.js";
import { assignmentState } from "./assignment.state.js";
import {
  renderStudentAssignmentCard,
  renderStudentAssignmentSkeletonGrid,
  renderTeacherAssignmentCard
} from "./components/assignment-card.component.js";
import {
  renderAssignmentDetailsModal,
  renderAssignmentDetailsContent,
  ASSIGNMENT_DETAILS_MODAL_ID
} from "./components/assignment-details-modal.component.js";
import { bindFileUploadZone } from "../../shared/components/FileUpload/file-upload.component.js";
import { openModal, closeModal, renderModal } from "../../shared/components/Modal/modal.component.js";
import { showConfirmDialog } from "../../shared/components/ConfirmDialog/confirm-dialog.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { renderTable } from "../../shared/components/Table/table.component.js";
import { renderBadge } from "../../shared/components/Badge/badge.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml, escapeHtml } from "../../shared/utils/dom.utils.js";
import { formatDate, formatDateTime } from "../../shared/utils/date.utils.js";
import { auth } from "../../core/firebase.js";

export const AssignmentController = {
  /**
   * Ensures the student assignment details modal is mounted into document.body.
   */
  ensureStudentModal() {
    if (!document.getElementById(ASSIGNMENT_DETAILS_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderAssignmentDetailsModal());
    }
  },

  /**
   * Loads assignments for student dashboard with responsive grid & details view.
   */
  async loadStudentAssignments(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    this.ensureStudentModal();
    setHtml(container, renderStudentAssignmentSkeletonGrid(3));

    try {
      const studentUid = auth.currentUser?.uid || currentStudent?.firestoreId || currentStudent?.id || "";
      const studentGroup = currentStudent?.studentGroup || currentStudent?.group || "ALL";

      // 1. Fetch all assignments first
      const allAssignments = await AssignmentService.getAllAssignments();
      const relevant = allAssignments.filter(
        (a) => !a.group || a.group === "ALL" || a.group === studentGroup
      );

      // 2. Fetch submissions for relevant assignments
      const relevantIds = relevant.map((a) => a.id);
      const submissionsMap = await AssignmentService.getStudentSubmissions(studentUid, relevantIds);

      assignmentState.set("assignments", relevant);
      assignmentState.set("submissions", submissionsMap);

      if (relevant.length === 0) {
        setHtml(container, renderEmptyState({
          icon: "📋",
          title: "لا توجد تاسكات مطلوبة حالياً",
          description: "كل التاسكات تم تسليمها بنجاح أو لم يتم تعيين مهام جديدة بعد لمجموعتك."
        }));
        return;
      }

      this.renderStudentGrid(container, relevant, submissionsMap, currentStudent);
    } catch (err) {
      console.error("Failed to load student assignments:", err);
      setHtml(container, renderErrorState({
        title: "تعذر تحميل التاسكات",
        message: err.message,
        retryBtnId: "retryStudentAssignmentsBtn"
      }));
      document.getElementById("retryStudentAssignmentsBtn")?.addEventListener("click", () => {
        this.loadStudentAssignments(containerId, currentStudent);
      });
    }
  },

  /**
   * Renders student assignment cards grid and binds details modal actions.
   */
  renderStudentGrid(container, assignments, submissionsMap, currentStudent) {
    const gridHtml = `
      <div class="student-assignments-grid" dir="rtl">
        ${assignments
          .map((a) =>
            renderStudentAssignmentCard({
              assignment: a,
              submission: submissionsMap.get(a.id) || null
            })
          )
          .join("")}
      </div>
    `;
    setHtml(container, gridHtml);

    // Bind 'فتح التاسك' buttons
    container.querySelectorAll("[data-open-task-details]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-open-task-details");
        this.openStudentAssignmentDetails(taskId, container, currentStudent);
      });
    });
  },

  /**
   * Opens the Assignment Details Modal for a specific task.
   */
  openStudentAssignmentDetails(taskId, container, currentStudent) {
    const assignments = assignmentState.get("assignments") || [];
    const submissionsMap = assignmentState.get("submissions") || new Map();
    const assignment = assignments.find((a) => a.id === taskId);

    if (!assignment) {
      showToast("تعذر العثور على بيانات التاسك المطلوب.", "error");
      return;
    }

    const submission = submissionsMap.get(taskId) || null;
    assignmentState.set("activeAssignment", assignment);
    assignmentState.set("activeSubmission", submission);

    const modalBody = document.getElementById("assignmentDetailsModalBody");
    const modalTitle = document.getElementById("assignmentDetailsModalTitle");

    if (modalTitle) modalTitle.textContent = assignment.title || "تفاصيل التاسك";
    if (modalBody) {
      setHtml(
        modalBody,
        renderAssignmentDetailsContent({
          assignment,
          submission,
          isSubmitting: false
        })
      );
    }

    // Bind file upload zone if form is active
    if (!submission) {
      bindFileUploadZone("detailsTaskUploadZone", "detailsTaskSubmissionFile");
      this.bindDetailsSubmissionForm(assignment, container, currentStudent);
    }

    openModal(ASSIGNMENT_DETAILS_MODAL_ID);
  },

  /**
   * Binds submission form inside Assignment Details Modal.
   */
  bindDetailsSubmissionForm(assignment, container, currentStudent) {
    const form = document.getElementById("taskDetailsSubmissionForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const text = document.getElementById("detailsTaskAnswerText")?.value?.trim() || "";
      const fileInput = document.getElementById("detailsTaskSubmissionFile");
      const file = fileInput?.files?.[0] || null;

      if (!text && !file) {
        showToast("يرجى كتابة نص الإجابة أو إرفاق ملف للحل قبل الإرسال ⚠️", "warning");
        return;
      }

      // Explicit confirmation before submitting
      const confirmed = await showConfirmDialog({
        title: "تأكيد تسليم التاسك",
        message: `هل أنت متأكد من رغبتك في تسليم الحل لتاسك: "${assignment.title || 'التاسك'}"؟ لن تتمكن من التعديل بعد التأكيد.`,
        confirmText: "تأكيد التسليم 🚀",
        cancelText: "مراجعة الحل",
        variant: "primary",
        icon: "📤"
      });

      if (!confirmed) return;

      const submitBtn = document.getElementById("detailsSubmitBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        submitBtn.innerText = "جاري رفع الحل والتسليم النهائي... ⏳";
      }

      assignmentState.set("submissionLoading", true);

      try {
        const result = await AssignmentService.submitTask(assignment.id, text, file);

        // Optimistically create submission record in local state
        const studentUid = auth.currentUser?.uid || currentStudent?.firestoreId || currentStudent?.id || "";
        const studentName = currentStudent?.studentName || currentStudent?.name || "طالب مسجل";
        const newSubmission = {
          assignmentId: assignment.id,
          studentUid,
          studentId: studentUid,
          studentName,
          answerText: text,
          fileUrl: result?.fileUrl || "",
          grade: null,
          feedback: null,
          submittedAt: new Date()
        };

        const submissionsMap = assignmentState.get("submissions") || new Map();
        submissionsMap.set(assignment.id, newSubmission);
        assignmentState.set("submissions", new Map(submissionsMap));
        assignmentState.set("activeSubmission", newSubmission);

        showToast("تم تسليم التاسك بنجاح ✅", "success");

        // Immediately update modal content to show submitted state
        const modalBody = document.getElementById("assignmentDetailsModalBody");
        if (modalBody) {
          setHtml(
            modalBody,
            renderAssignmentDetailsContent({
              assignment,
              submission: newSubmission,
              isSubmitting: false
            })
          );
        }

        // Immediately update background cards grid
        const assignments = assignmentState.get("assignments") || [];
        this.renderStudentGrid(container, assignments, submissionsMap, currentStudent);
      } catch (err) {
        console.error("Submit assignment error:", err);
        showToast(err.message, "error");
      } finally {
        assignmentState.set("submissionLoading", false);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          submitBtn.innerText = "تسليم التاسك 🚀";
        }
      }
    });
  },

  /**
   * Loads assignments for teacher management view.
   */
  async loadTeacherAssignments(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل التاسكات..." }));

    try {
      const assignments = await AssignmentService.getAllAssignments();
      assignmentState.set("assignments", assignments);

      const headerHtml = `
        <div class="card mb-6" dir="rtl">
          <h3 class="card-title mb-2">➕ إضافة وتكليف تاسك جديد</h3>
          <p class="text-xs text-muted mb-4">حدد عنوان التاسك، تاريخ انتهاء التسليم (Deadline)، والمجموعة المستهدفة والمطلوب تنفيذه.</p>
          <form id="createAssignmentForm" class="grid-2" onsubmit="return false;">
            <input type="text" id="newTaskTitle" class="form-input" placeholder="عنوان التاسك (مثال: إنشاء برنامج حاسبة بالـ Python)" required />
            <input type="date" id="newTaskDeadline" class="form-input" required />
            <select id="newTaskGroup" class="form-select" style="grid-column:1/-1;">
              <option value="ALL">جميع المجموعات (ALL)</option>
              <option value="مجموعة الأحد والأربعاء | 7:00 - 8:30">مجموعة الأحد والأربعاء | 7:00 - 8:30</option>
              <option value="مجموعة الأحد والأربعاء | 9:00 - 10:30">مجموعة الأحد والأربعاء | 9:00 - 10:30</option>
            </select>
            <textarea id="newTaskDesc" class="form-textarea" placeholder="تفاصيل ومطلوب التاسك وشروط الكود..." style="grid-column:1/-1;" rows="3"></textarea>
            <div class="text-left mt-2" style="grid-column:1/-1;">
              <button type="submit" id="saveNewTaskBtn" class="btn btn-primary">حفظ وتعيين التاسك 🚀</button>
            </div>
          </form>
        </div>
      `;

      let listHtml = "";
      if (assignments.length === 0) {
        listHtml = renderEmptyState({
          icon: "📋",
          title: "لا توجد تاسكات منشورة",
          description: "قم بإنشاء وتكليف تاسك جديد باستخدام النموذج أعلاه."
        });
      } else {
        listHtml = `
          <div class="grid-3" dir="rtl">
            ${assignments.map((a) => renderTeacherAssignmentCard({ assignment: a })).join("")}
          </div>
        `;
      }

      setHtml(container, headerHtml + listHtml);

      // Bind create assignment form
      document.getElementById("createAssignmentForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const title = document.getElementById("newTaskTitle")?.value.trim();
        const deadline = document.getElementById("newTaskDeadline")?.value;
        const group = document.getElementById("newTaskGroup")?.value || "ALL";
        const description = document.getElementById("newTaskDesc")?.value.trim();

        if (!title || !deadline) {
          showToast("يرجى ملء جميع البيانات المطلوبة", "warning");
          return;
        }

        const saveBtn = document.getElementById("saveNewTaskBtn");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.innerText = "جاري الحفظ... ⏳";
        }

        try {
          await AssignmentService.createAssignment({ title, deadline, group, description });
          showToast("تم نشر التاسك بنجاح ✅", "success");
          this.loadTeacherAssignments(container);
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = "حفظ وتعيين التاسك 🚀";
          }
        }
      });

      // Bind teacher view submissions buttons
      container.querySelectorAll("[data-teacher-view-submissions]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const taskId = btn.getAttribute("data-teacher-view-submissions");
          const title = btn.getAttribute("data-task-title") || "التاسك";
          this.showTeacherSubmissionsModal(taskId, title);
        });
      });
    } catch (err) {
      setHtml(container, renderErrorState({ title: "خطأ في تحميل التاسكات", message: err.message }));
    }
  },

  /**
   * Displays modal with submissions list for an assignment with grading capability.
   */
  async showTeacherSubmissionsModal(taskId, taskTitle) {
    let modalEl = document.getElementById("teacherSubmissionsModal");
    if (!modalEl) {
      const modalHtml = renderModal({
        id: "teacherSubmissionsModal",
        title: `<span id="teacherSubmissionsModalTitle">استعراض تسليمات الطلاب</span>`,
        bodyHtml: `<div id="teacherSubmissionsBody"></div>`,
        maxWidth: "800px"
      });
      document.body.insertAdjacentHTML("beforeend", modalHtml);
    }

    const titleEl = document.getElementById("teacherSubmissionsModalTitle");
    const bodyEl = document.getElementById("teacherSubmissionsBody");
    if (titleEl) titleEl.textContent = `📋 تسليمات: ${taskTitle}`;
    if (bodyEl) setHtml(bodyEl, renderLoader({ text: "جاري جلب تسليمات الطلاب... ⏳" }));

    openModal("teacherSubmissionsModal");

    try {
      const submissions = await AssignmentService.getTaskSubmissions(taskId);
      if (!submissions || submissions.length === 0) {
        if (bodyEl) {
          setHtml(bodyEl, renderEmptyState({
            icon: "📭",
            title: "لا توجد تسليمات حتى الآن",
            description: "لم يقم أي طالب برفع حل لهذا الواجب بعد."
          }));
        }
        return;
      }

      const headers = ["الطالب", "تاريخ التسليم", "الحل / الملف", "الدرجة", "الإجراء"];
      const rows = submissions.map((sub) => {
        const studentName = sub.studentName || sub.name || "طالب";
        const studentUid = sub.studentUid || sub.studentId || sub.id;
        const fileLink = sub.fileUrl
          ? `<a href="${escapeHtml(sub.fileUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline btn-xs">ملف 📥</a>`
          : "";
        const textSummary = sub.answerText
          ? `<span class="text-xs text-muted" title="${escapeHtml(sub.answerText)}">نص الإجابة 📝</span>`
          : "";
        const solutionCol = `${fileLink} ${textSummary}`.trim() || `<span class="text-xs text-muted">—</span>`;

        const isGraded = sub.grade !== undefined && sub.grade !== null;
        const gradeText = isGraded ? `${sub.grade} / 100` : "قيد التقييم";
        const gradeCol = isGraded
          ? `<strong class="text-accent">${escapeHtml(gradeText)}</strong>`
          : `<span class="badge badge-warning">جديد</span>`;

        const actionBtn = `
          <button
            type="button"
            class="btn btn-primary btn-xs"
            data-grade-submission="${escapeHtml(studentUid)}"
            data-student-name="${escapeHtml(studentName)}"
            data-current-grade="${isGraded ? escapeHtml(String(sub.grade)) : ''}"
            data-current-feedback="${escapeHtml(sub.feedback || '')}"
          >
            <span>${isGraded ? 'تعديل الدرجة' : 'تقييم الآن'}</span>
          </button>
        `;

        return [
          `<strong>${escapeHtml(studentName)}</strong>`,
          formatDateTime(sub.submittedAt || sub.createdAt),
          solutionCol,
          gradeCol,
          actionBtn
        ];
      });

      if (bodyEl) {
        setHtml(bodyEl, renderTable({ headers, rows }));

        // Bind grading action buttons
        bodyEl.querySelectorAll("[data-grade-submission]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const sUid = btn.getAttribute("data-grade-submission");
            const sName = btn.getAttribute("data-student-name");
            const curGrade = btn.getAttribute("data-current-grade");
            const curFeed = btn.getAttribute("data-current-feedback");

            const inputScore = prompt(`أدخل درجة الطالب "${sName}" من 100:`, curGrade || "100");
            if (inputScore === null) return;

            const numScore = Number(inputScore);
            if (isNaN(numScore) || numScore < 0 || numScore > 100) {
              showToast("الدرجة يجب أن تكون رقم بين 0 و 100", "warning");
              return;
            }

            const inputFeedback = prompt(`ملاحظات أو تعليق للطالب "${sName}" (اختياري):`, curFeed || "") || "";

            try {
              await AssignmentService.gradeTask(taskId, sUid, numScore, inputFeedback);
              showToast(`تم حفظ تقييم الطالب ${sName} بنجاح ✅`, "success");
              this.showTeacherSubmissionsModal(taskId, taskTitle);
            } catch (err) {
              showToast(err.message, "error");
            }
          });
        });
      }
    } catch (e) {
      if (bodyEl) setHtml(bodyEl, renderErrorState({ message: e.message }));
    }
  }
};
