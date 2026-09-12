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
   * Loads attendance taking sheet for Teacher / Admin view with session selector,
   * default absent for new sessions, and live modification of old sessions.
   * @param {string|HTMLElement} containerId
   * @param {string} [initialSessionId="NEW"]
   */
  async loadTeacherAttendance(containerId, initialSessionId = "NEW") {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل بيانات كشف الغياب والحضور..." }));

    try {
      const [students, sessions] = await Promise.all([
        StudentsService.getAllStudents(),
        AttendanceService.getAllSessions()
      ]);

      attendanceState.set("sessions", sessions);

      let selectedSessionId = initialSessionId;
      let selectedSession = sessions.find((s) => (s.id || s.sessionId) === selectedSessionId) || null;
      let sessionRecords = new Map();

      if (!selectedSession && selectedSessionId !== "NEW" && sessions.length > 0) {
        selectedSessionId = "NEW";
      }

      if (selectedSession) {
        sessionRecords = await AttendanceService.getSessionRecords(selectedSession.id || selectedSession.sessionId);
      }

      const renderCurrentSheet = () => {
        setHtml(
          container,
          renderAttendanceManagementView({
            students,
            sessions,
            selectedSessionId,
            selectedSession,
            sessionRecords
          })
        );

        this.bindTeacherAttendanceEvents(container, {
          students,
          sessions,
          selectedSessionId,
          selectedSession,
          sessionRecords,
          onSessionChange: async (newSessionId) => {
            await this.loadTeacherAttendance(container, newSessionId);
          }
        });
      };

      renderCurrentSheet();
    } catch (err) {
      console.error("Load teacher attendance error:", err);
      setHtml(container, renderErrorState({ title: "خطأ في تحميل كشف الحضور", message: err.message }));
    }
  },

  /**
   * Binds interactive events for the teacher/admin attendance sheet.
   */
  bindTeacherAttendanceEvents(container, { students, sessions, selectedSessionId, selectedSession, sessionRecords, onSessionChange }) {
    const isNew = selectedSessionId === "NEW";

    // 1. Helper to update live counters
    const updateCounters = () => {
      let totalVisible = 0;
      let presentCount = 0;
      let absentCount = 0;

      container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
        if (tr.style.display !== "none") {
          totalVisible++;
          const chk = tr.querySelector(".attendance-check");
          if (chk && chk.checked) {
            presentCount++;
          } else {
            absentCount++;
          }
        }
      });

      const totalEl = container.querySelector("#sheetStudentsCount");
      const presentEl = container.querySelector("#sheetPresentCount");
      const absentEl = container.querySelector("#sheetAbsentCount");

      if (totalEl) totalEl.textContent = totalVisible;
      if (presentEl) presentEl.textContent = presentCount;
      if (absentEl) absentEl.textContent = absentCount;
    };

    updateCounters();

    // 2. Session Selector Change
    container.querySelector("#sessionSelector")?.addEventListener("change", async (e) => {
      const newSessionId = e.target.value;
      if (typeof onSessionChange === "function") {
        onSessionChange(newSessionId);
      }
    });

    // 3. Checkbox toggling
    container.querySelectorAll(".attendance-check").forEach((chk) => {
      chk.addEventListener("change", () => {
        const label = chk.parentElement.querySelector(".status-label");
        if (label) {
          label.textContent = chk.checked ? "حاضر ✓" : "غائب ✗";
          label.className = `status-label font-bold text-sm ${chk.checked ? "text-success" : "text-danger"}`;
        }
        updateCounters();
      });
    });

    // 4. Select All Present
    container.querySelector("#selectAllPresentBtn")?.addEventListener("click", () => {
      container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
        if (tr.style.display !== "none") {
          const chk = tr.querySelector(".attendance-check");
          if (chk) {
            chk.checked = true;
            const label = chk.parentElement.querySelector(".status-label");
            if (label) {
              label.textContent = "حاضر ✓";
              label.className = "status-label font-bold text-sm text-success";
            }
          }
        }
      });
      updateCounters();
    });

    // 5. Select All Absent
    container.querySelector("#selectAllAbsentBtn")?.addEventListener("click", () => {
      container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
        if (tr.style.display !== "none") {
          const chk = tr.querySelector(".attendance-check");
          if (chk) {
            chk.checked = false;
            const label = chk.parentElement.querySelector(".status-label");
            if (label) {
              label.textContent = "غائب ✗";
              label.className = "status-label font-bold text-sm text-danger";
            }
          }
        }
      });
      updateCounters();
    });

    // 6. Filter by group select
    container.querySelector("#sessionGroupSelect")?.addEventListener("change", (e) => {
      const selGroup = e.target.value;
      const searchVal = (container.querySelector("#attendanceStudentSearchInput")?.value || "").trim().toLowerCase();

      container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
        const rowGroup = tr.getAttribute("data-group") || "ALL";
        const rowName = tr.getAttribute("data-student-name") || "";
        const matchesGroup = selGroup === "ALL" || rowGroup === selGroup;
        const matchesSearch = !searchVal || rowName.includes(searchVal);
        tr.style.display = matchesGroup && matchesSearch ? "" : "none";
      });
      updateCounters();
    });

    // 7. Search by student name
    container.querySelector("#attendanceStudentSearchInput")?.addEventListener("input", (e) => {
      const searchVal = (e.target.value || "").trim().toLowerCase();
      const selGroup = container.querySelector("#sessionGroupSelect")?.value || "ALL";

      container.querySelectorAll("#attendanceSheetTbody tr").forEach((tr) => {
        const rowGroup = tr.getAttribute("data-group") || "ALL";
        const rowName = tr.getAttribute("data-student-name") || "";
        const matchesGroup = selGroup === "ALL" || rowGroup === selGroup;
        const matchesSearch = !searchVal || rowName.includes(searchVal);
        tr.style.display = matchesGroup && matchesSearch ? "" : "none";
      });
      updateCounters();
    });

    // 8. Batch Save Button
    container.querySelector("#saveAttendanceBatchBtn")?.addEventListener("click", async () => {
      if (this._isSavingAttendance) return;

      const nameInput = container.querySelector("#sessionNameInput");
      const dateInput = container.querySelector("#sessionDateInput");
      const groupInput = container.querySelector("#sessionGroupSelect");

      const name = nameInput?.value?.trim();
      const date = dateInput?.value;
      const group = groupInput?.value || "ALL";

      if (!name || !date) {
        showToast("يرجى إدخال عنوان وتاريخ الجلسة ⚠️", "warning");
        nameInput?.focus();
        return;
      }

      this._isSavingAttendance = true;
      const saveBtn = container.querySelector("#saveAttendanceBatchBtn");
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.classList.add("is-loading");
        saveBtn.innerText = "جاري الحفظ والاعتماد... ⏳";
      }

      try {
        let targetSessionId = selectedSessionId;

        if (isNew) {
          // Rule 37: Create new session
          const created = await AttendanceService.createSession({ name, date, group });
          targetSessionId = created.sessionId || created.id;
        } else {
          // Rule 40: Update existing session metadata without creating duplicates
          await AttendanceService.updateSession(targetSessionId, { name, date, group });
        }

        // Prepare attendance records
        const records = [];
        container.querySelectorAll(".attendance-check").forEach((chk) => {
          const studentUid = chk.getAttribute("data-student-uid");
          records.push({
            studentUid,
            studentId: studentUid,
            studentName: chk.getAttribute("data-student-name") || "",
            studentPhone: chk.getAttribute("data-student-phone") || "",
            group: chk.getAttribute("data-student-group") || "ALL",
            present: chk.checked,
            status: chk.checked ? "present" : "absent"
          });
        });

        // Save batch records to subcollection
        await AttendanceService.recordBatch(targetSessionId, records);
        showToast("تم حفظ واعتماد كشف الحضور والغياب بنجاح ✅", "success");

        // Reload sheet targeting this session
        await this.loadTeacherAttendance(container, targetSessionId);
      } catch (e) {
        console.error("Save attendance batch error:", e);
        showToast(e.message || "تعذر حفظ كشف الحضور.", "error");
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.classList.remove("is-loading");
          saveBtn.innerText = isNew ? "حفظ واعتماد الكشف 💾" : "حفظ التعديلات 💾";
        }
      } finally {
        this._isSavingAttendance = false;
      }
    });
  }
};
