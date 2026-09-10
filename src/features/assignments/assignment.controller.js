// src/features/assignments/assignment.controller.js
import { AssignmentService } from "./assignment.service.js";
import { assignmentState } from "./assignment.state.js";
import { renderStudentAssignmentCard, renderTeacherAssignmentCard } from "./components/assignment-card.component.js";
import { renderSubmissionModal } from "./components/submission-form.component.js";
import { bindFileUploadZone } from "../../shared/components/FileUpload/file-upload.component.js";
import { openModal, closeModal, renderModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { renderTable } from "../../shared/components/Table/table.component.js";
import { renderBadge } from "../../shared/components/Badge/badge.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml, escapeHtml } from "../../shared/utils/dom.utils.js";
import { formatDate } from "../../shared/utils/date.utils.js";

export const AssignmentController = {
  /**
   * Loads assignments for student dashboard.
   */
  async loadStudentAssignments(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل التاسكات... 📋" }));

    // Inject submission modal if not present
    if (!document.getElementById("taskSubmissionModal")) {
      document.body.insertAdjacentHTML("beforeend", renderSubmissionModal());
      this.bindSubmissionForm(container, currentStudent);
      bindFileUploadZone("taskUploadZone", "taskSubmissionFile");
    }

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const studentPhone = currentStudent?.studentPhone || "";
      const studentGroup = currentStudent?.studentGroup || currentStudent?.group || "ALL";

      const [assignments, submissionsMap] = await Promise.all([
        AssignmentService.getAllAssignments(),
        AssignmentService.getStudentSubmissions(studentUid, studentPhone)
      ]);

      assignmentState.set("assignments", assignments);
      assignmentState.set("submissions", submissionsMap);

      const relevant = assignments.filter((a) => !a.group || a.group === "ALL" || a.group === studentGroup);

      if (relevant.length === 0) {
        setHtml(container, renderEmptyState({
          icon: "📋",
          title: "لا توجد تاسكات مطلوبة حالياً",
          description: "كل التاسكات تم تسليمها بنجاح أو لم يتم تعيين مهام جديدة بعد."
        }));
        return;
      }

      const gridHtml = `
        <div class="grid-3">
          ${relevant.map((a) => renderStudentAssignmentCard({ assignment: a, submission: submissionsMap.get(a.id) })).join("")}
        </div>
      `;
      setHtml(container, gridHtml);

      // Bind open submit modal buttons
      container.querySelectorAll("[data-open-task-submit]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const taskId = btn.getAttribute("data-open-task-submit");
          const taskTitle = btn.getAttribute("data-task-title");

          const idInp = document.getElementById("submitAssignmentId");
          const titleEl = document.getElementById("submitAssignmentTitle");
          const previewEl = document.getElementById("taskUploadZone_preview");
          const form = document.getElementById("taskSubmissionForm");

          if (idInp) idInp.value = taskId;
          if (titleEl) titleEl.textContent = taskTitle;
          if (previewEl) previewEl.textContent = "";
          if (form) form.reset();

          openModal("taskSubmissionModal");
        });
      });
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

  bindSubmissionForm(container, currentStudent) {
    const form = document.getElementById("taskSubmissionForm");
    form?.addEventListener("submit", async () => {
      const taskId = document.getElementById("submitAssignmentId")?.value;
      const text = document.getElementById("taskAnswerText")?.value?.trim() || "";
      const fileInput = document.getElementById("taskSubmissionFile");
      const file = fileInput?.files?.[0] || null;

      if (!text && !file) {
        showToast("يرجى كتابة نص الإجابة أو إرفاق ملف للحل ⚠️", "warning");
        return;
      }

      const submitBtn = document.getElementById("submitTaskAnswerBtn");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.classList.add("is-loading");
        submitBtn.innerText = "جاري رفع الحل والتسليم... ⏳";
      }

      try {
        await AssignmentService.submitTask(taskId, text, file);
        showToast("تم تسليم التاسك بنجاح ✅", "success");
        closeModal("taskSubmissionModal");
        form.reset();

        // Reload assignments list
        this.loadStudentAssignments(container, currentStudent);
      } catch (err) {
        console.error("Submit task error:", err);
        showToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          submitBtn.innerText = "إرسال الحل والتسليم النهائي 🚀";
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
        <div class="card mb-6">
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
          <div class="grid-3">
            ${assignments.map((a) => renderTeacherAssignmentCard({ assignment: a })).join("")}
          </div>
        `;
      }

      setHtml(container, headerHtml + listHtml);

      // Bind create assignment form
      document.getElementById("createAssignmentForm")?.addEventListener("submit", async () => {
        const title = document.getElementById("newTaskTitle")?.value.trim();
        const deadline = document.getElementById("newTaskDeadline")?.value;
        const group = document.getElementById("newTaskGroup")?.value || "ALL";
        const description = document.getElementById("newTaskDesc")?.value.trim();

        if (!title || !deadline) {
          showToast("يرجى ملء جميع البيانات المطلوبة", "warning");
          return;
        }

        try {
          await AssignmentService.createAssignment({ title, deadline, group, description });
          showToast("تم نشر التاسك بنجاح ✅", "success");
          this.loadTeacherAssignments(container);
        } catch (e) {
          showToast(e.message, "error");
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
   * Displays modal with submissions list for an assignment.
   */
  async showTeacherSubmissionsModal(taskId, taskTitle) {
    let modalEl = document.getElementById("teacherSubmissionsModal");
    if (!modalEl) {
      const modalHtml = renderModal({
        id: "teacherSubmissionsModal",
        title: `<span id="teacherSubmissionsModalTitle">استعراض تسليمات الطلاب</span>`,
        bodyHtml: `<div id="teacherSubmissionsBody"></div>`,
        maxWidth: "750px"
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

      const headers = ["الطالب", "تاريخ التسليم", "الملف المرفق", "الدرجة", "الحالة"];
      const rows = submissions.map((sub) => {
        const studentName = sub.studentName || sub.name || "طالب";
        const fileLink = sub.fileUrl
          ? `<a href="${escapeHtml(sub.fileUrl)}" target="_blank" class="btn btn-outline btn-sm">فتح الملف 📥</a>`
          : `<span class="text-xs text-muted">نصي فقط</span>`;
        const gradeText = sub.grade !== undefined && sub.grade !== null ? `${sub.grade}/100` : "قيد التقييم";
        const statusBadge = sub.grade !== undefined && sub.grade !== null
          ? renderBadge({ text: "تم التقييم", variant: "success" })
          : renderBadge({ text: "جديد", variant: "primary" });

        return [
          `<strong>${escapeHtml(studentName)}</strong>`,
          formatDate(sub.createdAt),
          fileLink,
          `<strong class="text-accent">${escapeHtml(gradeText)}</strong>`,
          statusBadge
        ];
      });

      if (bodyEl) {
        setHtml(bodyEl, renderTable({ headers, rows }));
      }
    } catch (e) {
      if (bodyEl) setHtml(bodyEl, renderErrorState({ message: e.message }));
    }
  }
};
