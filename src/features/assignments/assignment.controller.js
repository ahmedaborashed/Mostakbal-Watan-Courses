// src/features/assignments/assignment.controller.js
import { AssignmentService } from "./assignment.service.js";
import { assignmentState } from "./assignment.state.js";
import { renderStudentAssignmentCard, renderTeacherAssignmentCard } from "./components/assignment-card.component.js";
import { renderSubmissionModal } from "./components/submission-form.component.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

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
          description: "كل التاسكات تم تسليمها أو لم يتم تعيين مهام جديدة بعد."
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
          if (idInp) idInp.value = taskId;
          if (titleEl) titleEl.textContent = taskTitle;

          openModal("taskSubmissionModal");
        });
      });
    } catch (err) {
      console.error("Failed to load student assignments:", err);
      setHtml(container, renderEmptyState({ icon: "❌", title: "تعذر تحميل التاسكات", description: err.message }));
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
          submitBtn.innerText = "إرسال الحل الآن 🚀";
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
        <div class="card mb-4">
          <h3 class="card-title mb-3">➕ إضافة وتكليف تاسك جديد</h3>
          <form id="createAssignmentForm" class="grid-2" onsubmit="return false;">
            <input type="text" id="newTaskTitle" class="form-input" placeholder="عنوان التاسك" required />
            <input type="date" id="newTaskDeadline" class="form-input" required />
            <select id="newTaskGroup" class="form-select">
              <option value="ALL">جميع المجموعات (ALL)</option>
              <option value="مجموعة الأحد والأربعاء | 7:00 - 8:30">مجموعة الأحد والأربعاء | 7:00 - 8:30</option>
              <option value="مجموعة الأحد والأربعاء | 9:00 - 10:30">مجموعة الأحد والأربعاء | 9:00 - 10:30</option>
            </select>
            <textarea id="newTaskDesc" class="form-textarea" placeholder="تفاصيل ومطلوب التاسك..." style="grid-column:1/-1;" rows="3"></textarea>
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
          description: "قم بإنشاء تاسك جديد باستخدام النموذج أعلاه."
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
    } catch (err) {
      setHtml(container, renderEmptyState({ icon: "❌", title: "خطأ في تحميل التاسكات", description: err.message }));
    }
  }
};
