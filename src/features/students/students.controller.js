// src/features/students/students.controller.js
import { StudentsService } from "./students.service.js";
import { studentsState } from "./students.state.js";
import { renderStudentListView } from "./components/student-list.component.js";
import { renderStudentStats } from "./components/student-stats.component.js";
import { renderStudentDetailModal, renderStudentDetailContent } from "./components/student-detail.component.js";
import { renderEditStudentModal, populateEditStudentForm } from "./components/student-edit.component.js";
import { renderAddStudentModal, renderResetPasswordModal } from "./components/student-form.component.js";
import { validateStudentData, validateStudentEditData } from "../../shared/validators/student.validator.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { showConfirmDialog } from "../../shared/components/ConfirmDialog/confirm-dialog.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const StudentsController = {
  /** Tracks whether modals have been injected to avoid duplicates */
  _modalsInjected: false,

  /**
   * Injects all required modals into document.body once.
   */
  _ensureModals() {
    if (this._modalsInjected) return;

    if (!document.getElementById("addStudentModal")) {
      document.body.insertAdjacentHTML("beforeend", renderAddStudentModal());
    }
    if (!document.getElementById("resetStudentPasswordModal")) {
      document.body.insertAdjacentHTML("beforeend", renderResetPasswordModal());
    }
    if (!document.getElementById("studentDetailModal")) {
      document.body.insertAdjacentHTML("beforeend", renderStudentDetailModal());
    }
    if (!document.getElementById("editStudentModal")) {
      document.body.insertAdjacentHTML("beforeend", renderEditStudentModal());
    }

    this._modalsInjected = true;
  },

  /**
   * Loads all students and renders the complete management view.
   */
  async loadStudentsList(containerId, { canDelete = false } = {}) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل قائمة الطلاب... 👥" }));

    // Inject all modals once
    this._ensureModals();

    try {
      const students = await StudentsService.getAllStudents();
      studentsState.set("students", students);

      this.renderFullView(container, canDelete);
      this.bindToolbarEvents(container, canDelete);
      this.bindModalForms(container, canDelete);
      this.bindEditForm(container, canDelete);
      this.bindDetailActions(canDelete);
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

  /**
   * Renders the full view: KPI stats + filtered table.
   */
  renderFullView(container, canDelete) {
    const all = studentsState.get("students") || [];
    const groupFilter = studentsState.get("filterGroup") || "ALL";
    const search = (studentsState.get("searchQuery") || "").toLowerCase().trim();

    const filtered = this._filterStudents(all, groupFilter, search);

    const statsHtml = renderStudentStats(all);
    const listHtml = renderStudentListView({
      students: filtered,
      canDelete,
      totalCount: all.length
    });

    setHtml(container, statsHtml + listHtml);
    this.bindRowActions(container, canDelete);
  },

  /**
   * Re-renders only the table portion for search/filter performance.
   */
  updateTableOnly(canDelete) {
    const wrapper = document.getElementById("studentsTableWrapper");
    const countEl = document.getElementById("studentCountIndicator");
    if (!wrapper) return;

    const all = studentsState.get("students") || [];
    const groupFilter = studentsState.get("filterGroup") || "ALL";
    const search = (studentsState.get("searchQuery") || "").toLowerCase().trim();

    const filtered = this._filterStudents(all, groupFilter, search);

    // Re-render table
    const tempDiv = document.createElement("div");
    setHtml(tempDiv, renderStudentListView({
      students: filtered,
      canDelete,
      totalCount: all.length
    }));

    const newTableWrapper = tempDiv.querySelector("#studentsTableWrapper");
    if (newTableWrapper) {
      wrapper.innerHTML = newTableWrapper.innerHTML;
      this.bindRowActions(wrapper, canDelete);
    }

    // Update count indicator
    if (countEl) {
      countEl.innerHTML = `عرض <strong>${filtered.length}</strong> طالب من أصل <strong>${all.length}</strong>`;
    }
  },

  /**
   * Filters students by group and search term.
   * @private
   */
  _filterStudents(all, groupFilter, search) {
    return all.filter((s) => {
      const name = (s.studentName || s.name || "").toLowerCase();
      const phone = String(s.studentPhone || s.phone || "");
      const group = s.studentGroup || s.group || "ALL";

      const matchesGroup = groupFilter === "ALL" || group === groupFilter;
      const matchesSearch = !search || name.includes(search) || phone.includes(search);

      return matchesGroup && matchesSearch;
    });
  },

  /**
   * Finds a student by UID from the local state.
   * @private
   */
  _findStudent(uid) {
    const all = studentsState.get("students") || [];
    return all.find((s) => (s.id || s.firestoreId) === uid) || null;
  },

  // ─────────────────────────────────────────────
  // TOOLBAR EVENTS (search, filter, add button)
  // ─────────────────────────────────────────────
  bindToolbarEvents(container, canDelete) {
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

  // ─────────────────────────────────────────────
  // ROW ACTIONS (view, edit, reset pass, delete)
  // ─────────────────────────────────────────────
  bindRowActions(scopeElement, canDelete) {
    // View student detail
    scopeElement.querySelectorAll("[data-view-student]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-view-student");
        this.openStudentDetail(uid, canDelete);
      });
    });

    // Edit student
    scopeElement.querySelectorAll("[data-edit-student]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-edit-student");
        this.openEditStudentModal(uid);
      });
    });

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
        btn.addEventListener("click", () => {
          const uid = btn.getAttribute("data-delete-student");
          const name = btn.getAttribute("data-student-name");
          this._confirmAndDeleteStudent(uid, name, canDelete);
        });
      });
    }
  },

  // ─────────────────────────────────────────────
  // STUDENT DETAIL
  // ─────────────────────────────────────────────
  openStudentDetail(uid, canDelete = false) {
    const student = this._findStudent(uid);
    if (!student) {
      showToast("لم يتم العثور على بيانات هذا الطالب", "error");
      return;
    }

    const bodyEl = document.getElementById("studentDetailBody");
    if (bodyEl) {
      setHtml(bodyEl, renderStudentDetailContent(student, { canDelete }));
      this._bindDetailInternalActions(bodyEl, canDelete);
    }

    openModal("studentDetailModal");
  },

  /**
   * Binds action buttons inside the detail modal content.
   * @private
   */
  _bindDetailInternalActions(bodyEl, canDelete) {
    // Edit from detail
    bodyEl.querySelectorAll("[data-detail-edit-student]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-detail-edit-student");
        closeModal("studentDetailModal");
        this.openEditStudentModal(uid);
      });
    });

    // Reset password from detail
    bodyEl.querySelectorAll("[data-detail-reset-pass]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-detail-reset-pass");
        const name = btn.getAttribute("data-student-name");

        closeModal("studentDetailModal");

        const uidInput = document.getElementById("resetPasswordStudentUid");
        const hintEl = document.getElementById("resetPasswordStudentNameHint");
        if (uidInput) uidInput.value = uid;
        if (hintEl) hintEl.textContent = `إعادة تعيين كلمة السر للطالب: ${name}`;

        openModal("resetStudentPasswordModal");
      });
    });

    // Delete from detail
    if (canDelete) {
      bodyEl.querySelectorAll("[data-detail-delete-student]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const uid = btn.getAttribute("data-detail-delete-student");
          const name = btn.getAttribute("data-student-name");
          closeModal("studentDetailModal");
          this._confirmAndDeleteStudent(uid, name, canDelete);
        });
      });
    }
  },

  /**
   * Binds delegated events for detail modal actions (global, once).
   */
  bindDetailActions(canDelete) {
    // This is handled internally via _bindDetailInternalActions when the modal opens
  },

  // ─────────────────────────────────────────────
  // EDIT STUDENT
  // ─────────────────────────────────────────────
  openEditStudentModal(uid) {
    const student = this._findStudent(uid);
    if (!student) {
      showToast("لم يتم العثور على بيانات هذا الطالب", "error");
      return;
    }

    populateEditStudentForm(student);
    openModal("editStudentModal");
  },

  /**
   * Binds the edit student form submit handler.
   */
  bindEditForm(container, canDelete) {
    const editForm = document.getElementById("editStudentForm");
    if (!editForm || editForm._bound) return;
    editForm._bound = true;

    editForm.addEventListener("submit", async () => {
      const uid = document.getElementById("editStudentUid")?.value;
      const name = document.getElementById("editStudentName")?.value;
      const nationalId = document.getElementById("editStudentNationalId")?.value;
      const address = document.getElementById("editStudentAddress")?.value;
      const group = document.getElementById("editStudentGroup")?.value;

      const submitBtn = document.getElementById("submitEditStudentBtn");

      try {
        const validated = validateStudentEditData({ name, nationalId, address, group });

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = "جاري حفظ التعديلات... ⏳";
        }

        await StudentsService.updateStudent(uid, validated);
        showToast("تم تحديث بيانات الطالب بنجاح ✅", "success");
        closeModal("editStudentModal");

        // Update local state directly for instant feedback
        const all = studentsState.get("students") || [];
        const updated = all.map((s) => {
          if ((s.id || s.firestoreId) === uid) {
            return { ...s, ...validated };
          }
          return s;
        });
        studentsState.set("students", updated);
        this.updateTableOnly(canDelete);

        // Also refresh stats
        this._refreshStats();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = "حفظ التعديلات ✅";
        }
      }
    });
  },

  /**
   * Refreshes the KPI stats bar without reloading the whole view.
   * @private
   */
  _refreshStats() {
    const statsContainer = document.getElementById("studentStatsBar");
    if (statsContainer) {
      const all = studentsState.get("students") || [];
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = renderStudentStats(all);
      const newStats = tempDiv.querySelector("#studentStatsBar");
      if (newStats) {
        statsContainer.innerHTML = newStats.innerHTML;
      }
    }
  },

  // ─────────────────────────────────────────────
  // DELETE STUDENT
  // ─────────────────────────────────────────────
  async _confirmAndDeleteStudent(uid, name, canDelete) {
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
        this._refreshStats();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  },

  // ─────────────────────────────────────────────
  // ADD & RESET PASSWORD FORMS
  // ─────────────────────────────────────────────
  bindModalForms(container, canDelete) {
    // Add student form
    const addForm = document.getElementById("addStudentForm");
    if (addForm && !addForm._bound) {
      addForm._bound = true;
      addForm.addEventListener("submit", async () => {
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
          this._refreshStats();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "إضافة الطالب وتوليد الحساب 🚀";
          }
        }
      });
    }

    // Reset password form
    const resetForm = document.getElementById("resetStudentPasswordForm");
    if (resetForm && !resetForm._bound) {
      resetForm._bound = true;
      resetForm.addEventListener("submit", async () => {
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
  }
};
