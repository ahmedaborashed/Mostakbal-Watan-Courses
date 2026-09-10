// src/features/students/students.controller.js
import { StudentsService } from "./students.service.js";
import { studentsState } from "./students.state.js";
import { renderStudentListView } from "./components/student-list.component.js";
import { renderAddStudentModal, renderResetPasswordModal } from "./components/student-form.component.js";
import { validateStudentData } from "../../shared/validators/student.validator.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { showConfirmDialog } from "../../shared/components/ConfirmDialog/confirm-dialog.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const StudentsController = {
  /**
   * Loads all students and renders list with filters and management modals.
   */
  async loadStudentsList(containerId, { canDelete = false } = {}) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل قائمة الطلاب... 👥" }));

    // Append modals to DOM if not already present
    if (!document.getElementById("addStudentModal")) {
      document.body.insertAdjacentHTML("beforeend", renderAddStudentModal());
    }
    if (!document.getElementById("resetStudentPasswordModal")) {
      document.body.insertAdjacentHTML("beforeend", renderResetPasswordModal());
    }

    try {
      const students = await StudentsService.getAllStudents();
      studentsState.set("students", students);

      this.renderFilteredList(container, canDelete);
      this.bindToolbarEvents(container, canDelete);
      this.bindModalForms(container, canDelete);
    } catch (err) {
      console.error("Failed to load students:", err);
      showToast(err.message, "error");
      setHtml(
        container,
        renderErrorState({
          title: "تعذر تحميل قائمة الطلاب",
          message: err.message || "حدث خطأ غير متوقع أثناء استرجاع بيانات الطلاب من الخادم.",
          retryBtnText: "إعادة المحاولة 🔄",
        })
      );
      container.querySelector("#retryBtn")?.addEventListener("click", () => {
        this.loadStudentsList(containerId, { canDelete });
      });
    }
  },

  renderFilteredList(container, canDelete) {
    const all = studentsState.get("students") || [];
    const groupFilter = studentsState.get("filterGroup") || "ALL";
    const search = (studentsState.get("searchQuery") || "").toLowerCase().trim();

    const filtered = all.filter((s) => {
      const name = (s.studentName || s.name || "").toLowerCase();
      const phone = String(s.studentPhone || s.phone || "");
      const group = s.studentGroup || s.group || "ALL";

      const matchesGroup = groupFilter === "ALL" || group === groupFilter;
      const matchesSearch = !search || name.includes(search) || phone.includes(search);

      return matchesGroup && matchesSearch;
    });

    setHtml(container, renderStudentListView({ students: filtered, canDelete }));
    this.bindRowActions(container, canDelete);
  },

  bindToolbarEvents(container, canDelete) {
    // We attach delegated events on container for inputs
    container.addEventListener("input", (e) => {
      if (e.target.id === "studentSearchInput") {
        studentsState.set("searchQuery", e.target.value);
        this.updateTableOnly(canDelete);
      }
    });

    container.addEventListener("change", (e) => {
      if (e.target.id === "studentGroupFilter") {
        studentsState.set("filterGroup", e.target.value);
        this.updateTableOnly(canDelete);
      }
    });

    container.addEventListener("click", (e) => {
      if (e.target.closest("#openAddStudentModalBtn")) {
        openModal("addStudentModal");
      }
    });
  },

  updateTableOnly(canDelete) {
    const wrapper = document.getElementById("studentsTableWrapper");
    if (!wrapper) return;

    const all = studentsState.get("students") || [];
    const groupFilter = studentsState.get("filterGroup") || "ALL";
    const search = (studentsState.get("searchQuery") || "").toLowerCase().trim();

    const filtered = all.filter((s) => {
      const name = (s.studentName || s.name || "").toLowerCase();
      const phone = String(s.studentPhone || s.phone || "");
      const group = s.studentGroup || s.group || "ALL";
      return (groupFilter === "ALL" || group === groupFilter) && (!search || name.includes(search) || phone.includes(search));
    });

    // Re-render table
    const tempDiv = document.createElement("div");
    setHtml(tempDiv, renderStudentListView({ students: filtered, canDelete }));
    const newTableWrapper = tempDiv.querySelector("#studentsTableWrapper");
    if (newTableWrapper) {
      wrapper.innerHTML = newTableWrapper.innerHTML;
      this.bindRowActions(wrapper, canDelete);
    }
  },

  bindRowActions(scopeElement, canDelete) {
    // Reset password button
    scopeElement.querySelectorAll("[data-reset-pass]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-reset-pass");
        const name = btn.getAttribute("data-student-name");

        const uidInput = document.getElementById("resetPasswordStudentUid");
        const hintEl = document.getElementById("resetPasswordStudentNameHint");
        if (uidInput) uidInput.value = uid;
        if (hintEl) hintEl.textContent = `إعادة تعيين كلمة السر للطالب: ${name}`;

        openModal("resetStudentPasswordModal");
      });
    });

    // Delete student button (Admin)
    if (canDelete) {
      scopeElement.querySelectorAll("[data-delete-student]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const uid = btn.getAttribute("data-delete-student");
          const name = btn.getAttribute("data-student-name");

          const confirmed = await showConfirmDialog({
            title: "حذف حساب طالب",
            message: `هل أنت متأكد من حذف حساب الطالب "${name}" نهائياً؟ ⚠️ لا يمكن التراجع عن هذه الخطوة وسيتم حذف الحساب وبياناته بالكامل.`,
            confirmText: "نعم، حذف الحساب 🗑️",
            confirmVariant: "danger",
            cancelText: "إلغاء",
          });

          if (confirmed) {
            try {
              await StudentsService.deleteStudent(uid);
              showToast("تم حذف حساب الطالب بنجاح", "info");
              // Refresh state
              const updated = (studentsState.get("students") || []).filter((s) => (s.id || s.firestoreId) !== uid);
              studentsState.set("students", updated);
              this.updateTableOnly(canDelete);
            } catch (err) {
              showToast(err.message, "error");
            }
          }
        });
      });
    }
  },

  bindModalForms(container, canDelete) {
    // Add student form
    const addForm = document.getElementById("addStudentForm");
    addForm?.addEventListener("submit", async () => {
      const name = document.getElementById("newStudentName")?.value;
      const phone = document.getElementById("newStudentPhone")?.value;
      const nationalId = document.getElementById("newStudentNationalId")?.value;
      const address = document.getElementById("newStudentAddress")?.value;
      const group = document.getElementById("newStudentGroup")?.value;

      const submitBtn = document.getElementById("submitAddStudentBtn");
      try {
        const validated = validateStudentData({ name, phone, nationalId, address, group });
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "جاري الحفظ والتسجيل... ⏳";
        }

        await StudentsService.createStudent(validated);
        showToast("تم إنشاء حساب الطالب بنجاح ✅", "success");
        closeModal("addStudentModal");
        addForm.reset();

        // Reload students list
        const fresh = await StudentsService.getAllStudents();
        studentsState.set("students", fresh);
        this.updateTableOnly(canDelete);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "إضافة الطالب وتوليد الحساب 🚀";
        }
      }
    });

    // Reset password form
    const resetForm = document.getElementById("resetStudentPasswordForm");
    resetForm?.addEventListener("submit", async () => {
      const uid = document.getElementById("resetPasswordStudentUid")?.value;
      const newPass = document.getElementById("resetNewPasswordInput")?.value?.trim();
      const submitBtn = document.getElementById("submitResetPasswordBtn");

      if (!uid || !newPass || newPass.length < 6) {
        showToast("كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام.", "warning");
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "جاري التحديث... ⏳";
        }
        await StudentsService.resetPassword(uid, newPass);
        showToast("تم تغيير كلمة المرور بنجاح 🔐", "success");
        closeModal("resetStudentPasswordModal");
        resetForm.reset();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "حفظ كلمة المرور الجديدة 🔐";
        }
      }
    });
  }
};
