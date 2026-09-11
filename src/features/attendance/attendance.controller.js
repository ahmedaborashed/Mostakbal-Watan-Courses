// src/features/attendance/attendance.controller.js
import { AttendanceService } from "./attendance.service.js";
import { StudentsService } from "../students/students.service.js";
import { attendanceState } from "./attendance.state.js";
import {
  renderStudentAttendanceView,
  renderAttendanceSkeleton
} from "./components/attendance-stats.component.js";
import { renderAttendanceDashboardWidget } from "./components/attendance-widget.component.js";
import { renderAttendanceManagementView } from "./components/attendance-sheet.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const AttendanceController = {
  activeFilter: "all",
  sortOrder: "desc",

  /**
   * Loads attendance history and statistics for student view.
   */
  async loadStudentAttendance(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    // 1. Render Skeleton Loader (Never show 0% or 0/8 during loading)
    setHtml(container, renderAttendanceSkeleton());

    try {
      // 2. Fetch authoritative student attendance data
      const data = await AttendanceService.getStudentAttendance(currentStudent);
      attendanceState.set("studentAttendance", data);

      // 3. Render Dashboard View
      this.renderView(container, data);
    } catch (err) {
      console.error("Load attendance error:", err);
      // Explicit error state: never treat error as empty or 0%
      setHtml(container, renderErrorState({
        title: "تعذر تحميل سجل الحضور والغياب",
        message: err.message || "حدث خطأ غير متوقع أثناء استرجاع بيانات الحضور. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.",
        retryBtnId: "retryAttendanceBtn"
      }));

      document.getElementById("retryAttendanceBtn")?.addEventListener("click", () => {
        this.loadStudentAttendance(containerId, currentStudent);
      });
    }
  },

  /**
   * Helper to render and bind interactive filters and sort controls.
   */
  renderView(container, data) {
    setHtml(container, renderStudentAttendanceView({
      attendanceData: data,
      activeFilter: this.activeFilter,
      sortOrder: this.sortOrder
    }));

    // Bind Filter Tabs
    container.querySelectorAll("[data-attendance-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const filter = btn.getAttribute("data-attendance-filter");
        this.activeFilter = filter;
        this.renderView(container, data);
      });
    });

    // Bind Sort Select
    const sortSelect = container.querySelector("#attendanceSortSelect");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.sortOrder = e.target.value;
        this.renderView(container, data);
      });
    }
  },

  /**
   * Loads and renders the compact attendance widget for the Student Dashboard.
   */
  async loadDashboardWidget(containerId, currentStudent, onNavigate) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    try {
      let data = attendanceState.get("studentAttendance");
      if (!data) {
        data = await AttendanceService.getStudentAttendance(currentStudent);
        attendanceState.set("studentAttendance", data);
      }

      setHtml(container, renderAttendanceDashboardWidget({ attendanceData: data }));

      document.getElementById("widgetViewAttendanceBtn")?.addEventListener("click", () => {
        if (typeof onNavigate === "function") {
          onNavigate("attendance");
        }
      });
    } catch (err) {
      console.warn("Dashboard attendance widget error:", err);
      // Suppress or render empty if dashboard widget fails
      container.innerHTML = "";
    }
  },

  /**
   * Loads attendance taking sheet for Teacher / Admin view.
   */
  async loadTeacherAttendance(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل بيانات كشف الغياب والحضور..." }));

    try {
      const [students, sessions] = await Promise.all([
        StudentsService.getAllStudents(),
        AttendanceService.getAllSessions()
      ]);

      attendanceState.set("sessions", sessions);

      setHtml(container, renderAttendanceManagementView({ students, sessions }));

      // Bind checkbox label toggling
      container.querySelectorAll(".attendance-check").forEach((chk) => {
        chk.addEventListener("change", () => {
          const label = chk.parentElement.querySelector(".status-label");
          if (label) {
            label.textContent = chk.checked ? "حاضر" : "غائب";
            label.className = `status-label font-bold text-sm ${chk.checked ? "text-success" : "text-danger"}`;
          }
        });
      });

      // Bind select all present
      document.getElementById("selectAllPresentBtn")?.addEventListener("click", () => {
        container.querySelectorAll(".attendance-check").forEach((chk) => {
          chk.checked = true;
          const label = chk.parentElement.querySelector(".status-label");
          if (label) {
            label.textContent = "حاضر";
            label.className = "status-label font-bold text-sm text-success";
          }
        });
      });

      // Bind filter by group select
      document.getElementById("sessionGroupSelect")?.addEventListener("change", (e) => {
        const selGroup = e.target.value;
        container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
          const rowGroup = tr.getAttribute("data-group");
          const visible = selGroup === "ALL" || rowGroup === selGroup;
          tr.style.display = visible ? "" : "none";
        });
      });

      // Bind batch save
      document.getElementById("saveAttendanceBatchBtn")?.addEventListener("click", async () => {
        const name = document.getElementById("sessionNameInput")?.value?.trim();
        const date = document.getElementById("sessionDateInput")?.value;
        const group = document.getElementById("sessionGroupSelect")?.value || "ALL";

        if (!name || !date) {
          showToast("يرجى إدخال عنوان وتاريخ السيشن ⚠️", "warning");
          return;
        }

        const saveBtn = document.getElementById("saveAttendanceBatchBtn");
        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.classList.add("is-loading");
          saveBtn.innerText = "جاري الحفظ... ⏳";
        }

        try {
          // 1. Create the session
          const session = await AttendanceService.createSession({ name, date, group });

          // 2. Prepare attendance records from checked states
          const records = [];
          container.querySelectorAll(".attendance-check").forEach((chk) => {
            const studentUid = chk.getAttribute("data-student-uid");
            records.push({
              studentUid,
              studentId: studentUid,
              present: chk.checked,
              status: chk.checked ? "present" : "absent"
            });
          });

          // 3. Save batch records
          await AttendanceService.recordBatch(session.sessionId || session.id, records);
          showToast("تم حفظ واعتماد كشف الحضور بنجاح ✅", "success");
          this.loadTeacherAttendance(container);
        } catch (e) {
          showToast(e.message, "error");
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove("is-loading");
            saveBtn.innerText = "حفظ واعتماد الكشف 💾";
          }
        }
      });
    } catch (err) {
      setHtml(container, renderErrorState({ title: "خطأ في تحميل كشف الحضور", message: err.message }));
    }
  }
};
