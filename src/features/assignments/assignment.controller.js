// src/features/assignments/assignment.controller.js
import { AssignmentService } from "./assignment.service.js";
import { assignmentState } from "./assignment.state.js";
import {
  renderStudentAssignmentCard,
  renderStudentAssignmentSkeletonGrid,
  renderTeacherAssignmentCard,
  formatAssignmentContent
} from "./components/assignment-card.component.js";
import {
  renderAssignmentDetailsModal,
  renderAssignmentDetailsContent,
  ASSIGNMENT_DETAILS_MODAL_ID
} from "./components/assignment-details-modal.component.js";
import {
  renderAssignmentEvaluationModal,
  renderAssignmentEvaluationContent,
  ASSIGNMENT_EVALUATION_MODAL_ID
} from "./components/assignment-evaluation-modal.component.js";
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
import { formatDate, formatDateTime, isDeadlinePassed } from "../../shared/utils/date.utils.js";
import { auth } from "../../core/firebase.js";
import { GROUPS } from "../../core/constants.js";

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
   * Loads assignments for student dashboard with responsive tabs, academic history, & details view.
   */
  async loadStudentAssignments(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    this.ensureStudentModal();
    setHtml(container, renderStudentAssignmentSkeletonGrid(3));

    try {
      const studentUid = auth.currentUser?.uid || currentStudent?.firestoreId || currentStudent?.id || "";
      const studentGroup = (currentStudent?.group && currentStudent.group !== "ALL")
        ? currentStudent.group
        : (currentStudent?.studentGroup && currentStudent.studentGroup !== "ALL"
            ? currentStudent.studentGroup
            : (currentStudent?.group || currentStudent?.studentGroup || "ALL"));

      // 1. Fetch all assignments first without hiding past ones
      const allAssignments = await AssignmentService.getAllAssignments();
      const relevant = allAssignments.filter(
        (a) => !a.group || a.group === "ALL" || a.group === studentGroup
      );

      // 2. Fetch submissions for relevant assignments
      const relevantIds = relevant.map((a) => a.id);
      const submissionsMap = await AssignmentService.getStudentSubmissions(studentUid, relevantIds);

      assignmentState.set("assignments", relevant);
      assignmentState.set("submissions", submissionsMap);
      assignmentState.set("activeFilterTab", "all");

      if (relevant.length === 0) {
        setHtml(
          container,
          renderEmptyState({
            icon: "📋",
            title: "لا توجد تاسكات مضافة حالياً",
            description: "لم يتم تعيين تاسكات أو واجبات برمجية جديدة لمجموعتك حتى الآن."
          })
        );
        return;
      }

      this.renderStudentViewWithTabs(container, relevant, submissionsMap, currentStudent);
    } catch (err) {
      console.error("Failed to load student assignments:", err);
      setHtml(
        container,
        renderErrorState({
          title: "تعذر تحميل التاسكات",
          message: err.message || "حدث خطأ غير متوقع أثناء جلب بيانات التاسكات.",
          retryBtnId: "retryStudentAssignmentsBtn"
        })
      );
      document.getElementById("retryStudentAssignmentsBtn")?.addEventListener("click", () => {
        this.loadStudentAssignments(containerId, currentStudent);
      });
    }
  },

  /**
   * Renders tabs (الكل, مطلوب تسليمه, تم التسليم, منتهي) and the cards grid.
   */
  renderStudentViewWithTabs(container, assignments, submissionsMap, currentStudent) {
    const currentTab = assignmentState.get("activeFilterTab") || "all";

    // Categorize counts
    let pendingCount = 0;
    let submittedCount = 0;
    let expiredCount = 0;

    assignments.forEach((a) => {
      const hasSub = submissionsMap.has(a.id);
      const expired = isDeadlinePassed(a.deadline);
      if (hasSub) {
        submittedCount++;
      } else if (expired) {
        expiredCount++;
      } else {
        pendingCount++;
      }
    });

    const allCount = assignments.length;

    const tabsHtml = `
      <div class="academic-tabs-wrapper mb-4" dir="rtl">
        <div class="academic-filter-tabs" role="tablist" aria-label="أقسام التاسكات">
          <button
            type="button"
            role="tab"
            class="academic-filter-btn ${currentTab === 'all' ? 'active' : ''}"
            data-assignment-tab="all"
            aria-selected="${currentTab === 'all'}"
          >
            <span>الكل</span>
            <span class="filter-badge-count">${allCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="academic-filter-btn ${currentTab === 'pending' ? 'active' : ''}"
            data-assignment-tab="pending"
            aria-selected="${currentTab === 'pending'}"
          >
            <span>مطلوب تسليمه</span>
            <span class="filter-badge-count">${pendingCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="academic-filter-btn ${currentTab === 'submitted' ? 'active' : ''}"
            data-assignment-tab="submitted"
            aria-selected="${currentTab === 'submitted'}"
          >
            <span>تم التسليم</span>
            <span class="filter-badge-count">${submittedCount}</span>
          </button>
          <button
            type="button"
            role="tab"
            class="academic-filter-btn ${currentTab === 'expired' ? 'active' : ''}"
            data-assignment-tab="expired"
            aria-selected="${currentTab === 'expired'}"
          >
            <span>منتهي</span>
            <span class="filter-badge-count">${expiredCount}</span>
          </button>
        </div>
      </div>
      <div id="studentAssignmentsGridContainer"></div>
    `;

    setHtml(container, tabsHtml);

    // Bind tab clicks
    container.querySelectorAll("[data-assignment-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-assignment-tab");
        assignmentState.set("activeFilterTab", tab);

        // Update active classes
        container.querySelectorAll("[data-assignment-tab]").forEach((b) => {
          const isActive = b.getAttribute("data-assignment-tab") === tab;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-selected", String(isActive));
        });

        this.renderFilteredCards(container, assignments, submissionsMap, currentStudent, tab);
      });
    });

    // Render cards initially
    this.renderFilteredCards(container, assignments, submissionsMap, currentStudent, currentTab);
  },

  /**
   * Renders the cards filtered by the selected tab.
   */
  renderFilteredCards(container, assignments, submissionsMap, currentStudent, tab = "all") {
    const gridContainer = container.querySelector("#studentAssignmentsGridContainer");
    if (!gridContainer) return;

    let filtered = assignments;
    if (tab === "pending") {
      filtered = assignments.filter((a) => !submissionsMap.has(a.id) && !isDeadlinePassed(a.deadline));
    } else if (tab === "submitted") {
      filtered = assignments.filter((a) => submissionsMap.has(a.id));
    } else if (tab === "expired") {
      filtered = assignments.filter((a) => !submissionsMap.has(a.id) && isDeadlinePassed(a.deadline));
    }

    if (filtered.length === 0) {
      let emptyMsg = "لا توجد تاسكات في هذا القسم.";
      if (tab === "pending") emptyMsg = "رائع! لقد قمت بتسليم كافة التاسكات المطلوبة منك حالياً.";
      if (tab === "submitted") emptyMsg = "لم تقم بتسليم أي تاسك بعد. افتح أحد التاسكات المتاحة وقم برفع حلك.";
      if (tab === "expired") emptyMsg = "لا توجد أي تاسكات منتهية الموعد دون تسليم.";

      setHtml(
        gridContainer,
        renderEmptyState({
          icon: tab === "pending" ? "🎉" : "📋",
          title: "لا توجد عناصر",
          description: emptyMsg
        })
      );
      return;
    }

    const gridHtml = `
      <div class="student-assignments-grid" dir="rtl">
        ${filtered
          .map((a) =>
            renderStudentAssignmentCard({
              assignment: a,
              submission: submissionsMap.get(a.id) || null
            })
          )
          .join("")}
      </div>
    `;
    setHtml(gridContainer, gridHtml);

    // Bind 'فتح التاسك' buttons
    gridContainer.querySelectorAll("[data-open-task-details]").forEach((btn) => {
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

    const { title: formattedTitle } = formatAssignmentContent(assignment.title, assignment.description);
    if (modalTitle) modalTitle.textContent = formattedTitle || assignment.title || "تفاصيل التاسك";
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

    // Bind file upload zone & form submission if unsubmitted
    if (!submission && !isDeadlinePassed(assignment.deadline)) {
      bindFileUploadZone("detailsTaskUploadZone", "detailsTaskSubmissionFile");
      this.bindDetailsSubmissionForm(assignment, container, currentStudent);
    }

    openModal(ASSIGNMENT_DETAILS_MODAL_ID);
  },

  /**
   * Binds submission form inside Assignment Details Modal with duplicate-click protection.
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

      if (this._isSubmittingTask) return;
      this._isSubmittingTask = true;

      const submitBtn = document.getElementById("detailsSubmitBtn");
      if (submitBtn) {
        if (submitBtn.disabled) {
          this._isSubmittingTask = false;
          return;
        }
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

        // Immediately update modal content to show submitted state & solution
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

        // Re-render tab counts & cards grid immediately
        const assignments = assignmentState.get("assignments") || [];
        this.renderStudentViewWithTabs(container, assignments, submissionsMap, currentStudent);
      } catch (err) {
        console.error("Submit assignment error:", err);
        showToast(err.message || "تعذر تسليم التاسك.", "error");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove("is-loading");
          submitBtn.innerText = "تسليم التاسك 🚀";
        }
      } finally {
        this._isSubmittingTask = false;
        assignmentState.set("submissionLoading", false);
      }
    });
  },

  // Teacher Dashboard Local State
  _teacherSearchQuery: "",
  _teacherGroupFilter: "ALL",
  _teacherStatusFilter: "ALL",
  _teacherSortOrder: "newest",
  _isCreateFormOpen: false,
  _currentTeacherContainer: null,

  /**
   * Loads teacher assignments dashboard.
   * @param {string|HTMLElement} containerId
   */
  async loadTeacherAssignments(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;
    this._currentTeacherContainer = container;

    setHtml(container, renderLoader({ text: "جاري تحميل التاسكات والواجبات... ⏳" }));

    try {
      const assignments = await AssignmentService.getAllAssignments();
      assignmentState.set("teacherAssignments", assignments);
      this.renderTeacherDashboard(container);
    } catch (err) {
      console.error("Teacher assignments load error:", err);
      setHtml(
        container,
        renderErrorState({
          title: "خطأ في تحميل التاسكات",
          message: err.message,
          retryBtnId: "retryTeacherAssignmentsBtn"
        })
      );
      document.getElementById("retryTeacherAssignmentsBtn")?.addEventListener("click", () => {
        this.loadTeacherAssignments(container);
      });
    }
  },

  /**
   * Renders the complete teacher assignments dashboard view:
   * 1. Top Metrics & Action Banner
   * 2. Collapsible Create Assignment Form
   * 3. Live Search, Filter & Sort Toolbar
   * 4. Assignments Grid or Empty State
   * @param {HTMLElement} container
   */
  renderTeacherDashboard(container) {
    const allAssignments = assignmentState.get("teacherAssignments") || [];
    const searchQuery = (this._teacherSearchQuery || "").trim().toLowerCase();
    const groupFilter = this._teacherGroupFilter || "ALL";
    const statusFilter = this._teacherStatusFilter || "ALL";
    const sortOrder = this._teacherSortOrder || "newest";

    // Metrics calculations
    const totalCount = allAssignments.length;
    const activeCount = allAssignments.filter((a) => !isDeadlinePassed(a.deadline)).length;
    const expiredCount = allAssignments.filter((a) => isDeadlinePassed(a.deadline)).length;

    // Distinct groups for dropdown
    const distinctGroups = Array.from(
      new Set([...GROUPS, ...allAssignments.map((a) => a.group).filter(Boolean)])
    );

    // Filter assignments
    let filtered = allAssignments.filter((a) => {
      // 1. Search Query (Title, Description, or Group)
      if (searchQuery) {
        const titleMatch = (a.title || "").toLowerCase().includes(searchQuery);
        const descMatch = (a.description || "").toLowerCase().includes(searchQuery);
        const groupMatch = (a.group || "").toLowerCase().includes(searchQuery);
        if (!titleMatch && !descMatch && !groupMatch) return false;
      }

      // 2. Group Filter
      if (groupFilter !== "ALL") {
        if (a.group !== groupFilter) return false;
      }

      // 3. Status Filter
      if (statusFilter === "ACTIVE" && isDeadlinePassed(a.deadline)) return false;
      if (statusFilter === "EXPIRED" && !isDeadlinePassed(a.deadline)) return false;

      return true;
    });

    // Sort assignments
    filtered.sort((a, b) => {
      const dateA = a.deadline ? new Date(a.deadline).getTime() : 0;
      const dateB = b.deadline ? new Date(b.deadline).getTime() : 0;
      if (sortOrder === "newest") return dateA - dateB;
      if (sortOrder === "latest") return dateB - dateA;
      if (sortOrder === "created_desc") {
        const cA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const cB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return cB - cA;
      }
      return 0;
    });

    // 1. Stats & Action Banner
    const statsHtml = `
      <div class="card mb-4 teacher-assignments-stats-card" dir="rtl">
        <div class="d-flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div class="d-flex items-center gap-2">
              <h3 class="card-title m-0" style="font-size:1.15rem; font-weight:700;">
                <span>📋</span>
                <span>لوحة متابعة الواجبات والتاسكات</span>
              </h3>
              <span class="badge badge-gold font-bold">بوابة المعلم</span>
            </div>
            <div class="d-flex items-center gap-3 mt-2 flex-wrap text-xs text-muted">
              <span>إجمالي الواجبات: <strong class="text-primary font-bold">${totalCount}</strong></span>
              <span class="text-muted">•</span>
              <span>سارية حالياً: <strong class="text-success font-bold">${activeCount}</strong></span>
              <span class="text-muted">•</span>
              <span>منتهية الموعد: <strong class="text-warning font-bold">${expiredCount}</strong></span>
            </div>
          </div>
          <div class="d-flex items-center gap-2">
            <button type="button" id="toggleCreateTaskBtn" class="btn ${this._isCreateFormOpen ? 'btn-secondary' : 'btn-primary'}">
              <span>${this._isCreateFormOpen ? '✕ إخفاء النموذج' : '➕ تعيين واجب جديد'}</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // 2. Collapsible Create Form
    const createFormHtml = `
      <div id="createAssignmentPanel" class="card card-glass mb-4" dir="rtl" style="${this._isCreateFormOpen ? '' : 'display:none;'} border-color: var(--primary); box-shadow: 0 8px 24px rgba(16, 185, 129, 0.12);">
        <div class="card-header pb-3 mb-4" style="border-bottom: 1px solid var(--border);">
          <div class="d-flex items-center justify-between w-full">
            <h4 class="m-0 font-bold d-flex items-center gap-2" style="font-size: 1.1rem; color: var(--primary);">
              <span>✨</span>
              <span>تعيين واجب عملي جديد للطلاب</span>
            </h4>
            <button type="button" id="closeCreateTaskBtn" class="btn btn-ghost btn-sm text-muted" aria-label="إغلاق">
              <span>✕ إغلاق</span>
            </button>
          </div>
        </div>

        <form id="createAssignmentForm" class="card-body p-0">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 1.25rem;" class="mb-4 form-row-responsive">
            <!-- Title Input -->
            <div class="form-group mb-0">
              <label for="newTaskTitle" class="form-label font-bold">
                <span>عنوان التاسك المطلوب *</span>
                <span class="text-xs text-muted font-normal">🏷️ مثال: نظام تحليل درجات الطلاب بالـ OOP</span>
              </label>
              <input
                type="text"
                id="newTaskTitle"
                class="form-input"
                placeholder="اكتب عنواناً واضحاً ومميزاً للتاسك..."
                required
              />
            </div>

            <!-- Deadline Picker -->
            <div class="form-group mb-0">
              <label for="newTaskDeadline" class="form-label font-bold">
                <span>آخر موعد للتسليم (الديدلاين) *</span>
                <span class="text-xs text-muted font-normal">📅 تاريخ الاستحقاق</span>
              </label>
              <input
                type="date"
                id="newTaskDeadline"
                class="form-input"
                required
              />
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1.8fr; gap: 1.25rem;" class="mb-4 form-row-responsive">
            <!-- Target Group -->
            <div class="form-group mb-0">
              <label for="newTaskGroup" class="form-label font-bold">
                <span>المجموعة المستهدفة *</span>
                <span class="text-xs text-muted font-normal">👥 المجموعة الدراسية</span>
              </label>
              <select id="newTaskGroup" class="form-select">
                <option value="ALL">جميع المجموعات (واجب عام)</option>
                ${distinctGroups
                  .filter((g) => g !== "ALL")
                  .map((g) => `<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`)
                  .join("")}
              </select>
            </div>

            <!-- Attachment File URL (Optional) -->
            <div class="form-group mb-0">
              <label for="newTaskFileUrl" class="form-label font-bold">
                <span>رابط ملف مرفق أو مرجع تعليمي (اختياري)</span>
                <span class="text-xs text-muted font-normal">📎 Google Drive / GitHub / URL</span>
              </label>
              <input
                type="url"
                id="newTaskFileUrl"
                class="form-input"
                placeholder="https://..."
              />
            </div>
          </div>

          <!-- Description & Code Requirements -->
          <div class="form-group mb-4">
            <label for="newTaskDesc" class="form-label font-bold">
              <span>شروط الكود والمطلوب البرمجي بالتفصيل</span>
              <span class="text-xs text-muted font-normal">📝 شرح الخطوات والمدخلات والمخرجات المتوقعة</span>
            </label>
            <textarea
              id="newTaskDesc"
              class="form-textarea"
              rows="4"
              placeholder="وضح للطلاب فكرة التاسك البرمجي، القواعد المطلوبة (Functions, Loops, OOP)، وأمثلة على الـ Inputs/Outputs..."
            ></textarea>
          </div>

          <div class="d-flex items-center justify-between pt-3 flex-wrap gap-3" style="border-top: 1px solid var(--border);">
            <span class="text-xs text-muted">سيتم إشعار طلاب المجموعة المحددة فور نشر هذا الواجب 🔔</span>
            <div class="d-flex items-center gap-2">
              <button type="button" id="cancelCreateTaskBtn" class="btn btn-ghost">إلغاء</button>
              <button type="submit" id="saveNewTaskBtn" class="btn btn-primary btn-md font-bold">
                <span>نشر وتكليف الواجب 🚀</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    `;

    // 3. Search & Filter Bar
    const filtersHtml = `
      <div class="card mb-4 lesson-filters-card" dir="rtl">
        <div class="lesson-filters-grid">
          <!-- Search Input -->
          <div class="search-bar-wrapper">
            <span class="search-bar-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              id="teacherAssignmentSearchInput"
              class="form-input search-bar-input"
              placeholder="ابحث في عناوين أو تفاصيل الواجبات..."
              value="${escapeHtml(this._teacherSearchQuery || "")}"
              aria-label="بحث في الواجبات"
            />
          </div>

          <!-- Group Filter -->
          <div class="filter-select-wrapper">
            <select id="teacherAssignmentGroupFilter" class="form-select" aria-label="تصفية المجموعات">
              <option value="ALL" ${groupFilter === "ALL" ? "selected" : ""}>جميع المجموعات</option>
              ${distinctGroups
                .filter((g) => g !== "ALL")
                .map((g) => `<option value="${escapeHtml(g)}" ${groupFilter === g ? "selected" : ""}>${escapeHtml(g)}</option>`)
                .join("")}
            </select>
          </div>

          <!-- Status Filter -->
          <div class="filter-select-wrapper">
            <select id="teacherAssignmentStatusFilter" class="form-select" aria-label="تصفية الحالة">
              <option value="ALL" ${statusFilter === "ALL" ? "selected" : ""}>جميع الحالات</option>
              <option value="ACTIVE" ${statusFilter === "ACTIVE" ? "selected" : ""}>سارية حالياً 🟢</option>
              <option value="EXPIRED" ${statusFilter === "EXPIRED" ? "selected" : ""}>منتهية الموعد ⌛</option>
            </select>
          </div>

          <!-- Sort Order -->
          <div class="filter-select-wrapper">
            <select id="teacherAssignmentSortOrder" class="form-select" aria-label="ترتيب الواجبات">
              <option value="newest" ${sortOrder === "newest" ? "selected" : ""}>الديدلاين: الأقرب أولاً</option>
              <option value="latest" ${sortOrder === "latest" ? "selected" : ""}>الديدلاين: الأبعد أولاً</option>
              <option value="created_desc" ${sortOrder === "created_desc" ? "selected" : ""}>الأحدث إضافة</option>
            </select>
          </div>
        </div>
      </div>
    `;

    // 4. Cards Grid or Empty State
    let listHtml = "";
    if (filtered.length === 0) {
      const isFiltering = Boolean(searchQuery || groupFilter !== "ALL" || statusFilter !== "ALL");
      listHtml = renderEmptyState({
        icon: isFiltering ? "🔍" : "📋",
        title: isFiltering ? "لا توجد واجبات مطابقة لبحثك" : "لا توجد تاسكات منشورة حتى الآن",
        description: isFiltering
          ? "لم يتم العثور على أي واجبات مطابقة للفلاتر الحالية. جرب إعادة ضبط البحث أو اختيار مجموعة أخرى."
          : "ابدأ بتكليف الطلاب بأول واجب برمجي عملي لمتابعة تقدمهم وتقييم حلولهم.",
        actionButtonHtml: isFiltering
          ? `<button type="button" id="resetAssignmentFiltersBtn" class="btn btn-outline btn-sm">إعادة ضبط الفلاتر 🔄</button>`
          : `<button type="button" id="emptyAddAssignmentBtn" class="btn btn-primary btn-sm">➕ تعيين واجب جديد</button>`
      });
    } else {
      listHtml = `
        <div class="teacher-assignments-grid" dir="rtl">
          ${filtered.map((a) => renderTeacherAssignmentCard({ assignment: a })).join("")}
        </div>
      `;
    }

    setHtml(container, statsHtml + createFormHtml + filtersHtml + listHtml);
    this.bindTeacherDashboardEvents(container);
  },

  /**
   * Binds interactive events for Teacher Assignments Dashboard:
   * form toggling, live search/filtering, creation submit, submissions view, and deletion.
   * @param {HTMLElement} container
   */
  bindTeacherDashboardEvents(container) {
    // 1. Toggle creation panel
    const toggleBtn = container.querySelector("#toggleCreateTaskBtn");
    toggleBtn?.addEventListener("click", () => {
      this._isCreateFormOpen = !this._isCreateFormOpen;
      this.renderTeacherDashboard(container);
      if (this._isCreateFormOpen) {
        container.querySelector("#newTaskTitle")?.focus();
      }
    });

    const closeBtn = container.querySelector("#closeCreateTaskBtn");
    closeBtn?.addEventListener("click", () => {
      this._isCreateFormOpen = false;
      this.renderTeacherDashboard(container);
    });

    const cancelBtn = container.querySelector("#cancelCreateTaskBtn");
    cancelBtn?.addEventListener("click", () => {
      this._isCreateFormOpen = false;
      this.renderTeacherDashboard(container);
    });

    const emptyAddBtn = container.querySelector("#emptyAddAssignmentBtn");
    emptyAddBtn?.addEventListener("click", () => {
      this._isCreateFormOpen = true;
      this.renderTeacherDashboard(container);
      container.querySelector("#newTaskTitle")?.focus();
    });

    // 2. Search & filter handlers
    const searchInput = container.querySelector("#teacherAssignmentSearchInput");
    searchInput?.addEventListener("input", (e) => {
      this._teacherSearchQuery = e.target.value;
      this.renderTeacherDashboard(container);
      // restore focus and cursor position
      const nextInput = container.querySelector("#teacherAssignmentSearchInput");
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
      }
    });

    const groupFilter = container.querySelector("#teacherAssignmentGroupFilter");
    groupFilter?.addEventListener("change", (e) => {
      this._teacherGroupFilter = e.target.value;
      this.renderTeacherDashboard(container);
    });

    const statusFilter = container.querySelector("#teacherAssignmentStatusFilter");
    statusFilter?.addEventListener("change", (e) => {
      this._teacherStatusFilter = e.target.value;
      this.renderTeacherDashboard(container);
    });

    const sortOrder = container.querySelector("#teacherAssignmentSortOrder");
    sortOrder?.addEventListener("change", (e) => {
      this._teacherSortOrder = e.target.value;
      this.renderTeacherDashboard(container);
    });

    const resetFiltersBtn = container.querySelector("#resetAssignmentFiltersBtn");
    resetFiltersBtn?.addEventListener("click", () => {
      this._teacherSearchQuery = "";
      this._teacherGroupFilter = "ALL";
      this._teacherStatusFilter = "ALL";
      this._teacherSortOrder = "newest";
      this.renderTeacherDashboard(container);
    });

    // 3. Create assignment form submission
    const createForm = container.querySelector("#createAssignmentForm");
    createForm?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const title = container.querySelector("#newTaskTitle")?.value.trim();
      const deadline = container.querySelector("#newTaskDeadline")?.value;
      const group = container.querySelector("#newTaskGroup")?.value || "ALL";
      const fileUrl = container.querySelector("#newTaskFileUrl")?.value.trim() || "";
      const description = container.querySelector("#newTaskDesc")?.value.trim();

      if (!title || !deadline) {
        showToast("يرجى ملء عنوان الواجب وموعد التسليم ⚠️", "warning");
        return;
      }

      const saveBtn = container.querySelector("#saveNewTaskBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add("is-loading");
        saveBtn.innerText = "جاري الحفظ والنشر... ⏳";
      }

      try {
        await AssignmentService.createAssignment({ title, deadline, group, fileUrl, description });
        showToast("تم نشر وتكليف الواجب بنجاح ✅", "success");
        this._isCreateFormOpen = false;
        await this.loadTeacherAssignments(container);
      } catch (err) {
        showToast(err.message, "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.classList.remove("is-loading");
          saveBtn.innerText = "نشر وتكليف الواجب 🚀";
        }
      }
    });

    // 4. View submissions modal button
    container.querySelectorAll("[data-teacher-view-submissions]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const taskId = btn.getAttribute("data-teacher-view-submissions");
        const title = btn.getAttribute("data-task-title") || "التاسك";
        this.showTeacherSubmissionsModal(taskId, title);
      });
    });

    // 5. Delete assignment button with confirm dialog
    container.querySelectorAll("[data-teacher-delete-assignment]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const taskId = btn.getAttribute("data-teacher-delete-assignment");
        const taskTitle = btn.getAttribute("data-task-title") || "التاسك";

        const confirmed = await showConfirmDialog({
          title: "حذف الواجب العملي",
          message: `هل أنت متأكد من رغبتك في حذف واجب: "${taskTitle}" نهائياً من المنصة؟ لن يتمكن الطلاب من استعراضه.`,
          confirmText: "حذف نهائي",
          cancelText: "إلغاء",
          variant: "danger",
          icon: "🗑️"
        });

        if (!confirmed) return;

        try {
          await AssignmentService.deleteAssignment(taskId);
          showToast("تم حذف الواجب بنجاح ✅", "success");
          await this.loadTeacherAssignments(container);
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });
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
          setHtml(
            bodyEl,
            renderEmptyState({
              icon: "📭",
              title: "لا توجد تسليمات حتى الآن",
              description: "لم يقم أي طالب برفع حل لهذا الواجب بعد."
            })
          );
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

        // Bind grading action buttons to open dedicated evaluation modal
        bodyEl.querySelectorAll("[data-grade-submission]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const sUid = btn.getAttribute("data-grade-submission");
            const targetSub = submissions.find(
              (s) => (s.studentUid || s.studentId || s.id) === sUid
            );
            if (!targetSub) {
              showToast("تعذر العثور على بيانات تسليم الطالب.", "error");
              return;
            }
            this.openEvaluationModal({ taskId, taskTitle, submission: targetSub });
          });
        });
      }
    } catch (e) {
      if (bodyEl) setHtml(bodyEl, renderErrorState({ message: e.message }));
    }
  },

  /**
   * Opens the dedicated Assignment Evaluation Modal for a student submission.
   * @param {object} params
   * @param {string} params.taskId
   * @param {string} params.taskTitle
   * @param {object} params.submission
   */
  openEvaluationModal({ taskId, taskTitle, submission }) {
    if (!document.getElementById(ASSIGNMENT_EVALUATION_MODAL_ID)) {
      document.body.insertAdjacentHTML("beforeend", renderAssignmentEvaluationModal());
    }

    const titleEl = document.getElementById("assignmentEvaluationModalTitle");
    const bodyEl = document.getElementById("assignmentEvaluationModalBody");

    if (titleEl) {
      titleEl.textContent = `تقييم تسليم: ${submission.studentName || submission.name || "الطالب"}`;
    }

    if (bodyEl) {
      setHtml(bodyEl, renderAssignmentEvaluationContent({ taskTitle, submission }));
    }

    openModal(ASSIGNMENT_EVALUATION_MODAL_ID);

    const submitBtn = document.getElementById("submitAssignmentGradeBtn");
    if (submitBtn) {
      const newSubmitBtn = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

      newSubmitBtn.addEventListener("click", async () => {
        const gradeInput = document.getElementById("evalGradeInput");
        const feedbackInput = document.getElementById("evalFeedbackInput");

        const rawGrade = gradeInput ? parseFloat(gradeInput.value) : NaN;
        if (isNaN(rawGrade) || rawGrade < 0 || rawGrade > 100) {
          showToast("الدرجة يجب أن تكون رقماً بين 0 و 100", "warning");
          gradeInput?.focus();
          return;
        }

        const feedback = feedbackInput ? feedbackInput.value.trim() : "";
        const sUid = submission.studentUid || submission.studentId || submission.id;

        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = "جاري الحفظ والاعتماد... ⏳";

        try {
          await AssignmentService.gradeTask(taskId, sUid, rawGrade, feedback);
          showToast(`تم حفظ تقييم الطالب بنجاح ✅`, "success");
          closeModal(ASSIGNMENT_EVALUATION_MODAL_ID);
          // Refresh submissions list immediately
          this.showTeacherSubmissionsModal(taskId, taskTitle);
        } catch (err) {
          showToast(err.message || "تعذر حفظ تقييم الواجب.", "error");
          newSubmitBtn.disabled = false;
          newSubmitBtn.textContent = "حفظ التقييم واعتماد الدرجة ✅";
        }
      });
    }
  }
};
