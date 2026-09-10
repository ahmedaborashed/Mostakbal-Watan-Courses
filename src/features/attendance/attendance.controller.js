// src/features/attendance/attendance.controller.js
import { AttendanceService } from "./attendance.service.js";
import { StudentsService } from "../students/students.service.js";
import { attendanceState } from "./attendance.state.js";
import { renderStudentAttendanceView } from "./components/attendance-stats.component.js";
import { renderAttendanceManagementView } from "./components/attendance-sheet.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const AttendanceController = {
  /**
   * Loads attendance history and stats for student view.
   */
  async loadStudentAttendance(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل سجل الغياب والحضور... 📊" }));

    try {
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";
      const [sessions, records] = await Promise.all([
        AttendanceService.getAllSessions(),
        AttendanceService.getStudentAttendance(studentUid)
      ]);

      attendanceState.set("sessions", sessions);
      attendanceState.set("studentRecords", records);

      setHtml(container, renderStudentAttendanceView({ records, sessions }));
    } catch (err) {
      console.error("Load attendance error:", err);
      setHtml(container, renderEmptyState({ icon: "❌", title: "خطأ في تحميل سجل الغياب", description: err.message }));
    }
  },

  /**
   * Loads attendance taking sheet for Teacher / Admin view.
   */
  async loadTeacherAttendance(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل بيانات الغياب..." }));

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
          saveBtn.innerText = "جاري حفظ الحضور والغياب... ⏳";
        }

        try {
          // 1. Create session
          const sessionRes = await AttendanceService.createSession(name, date, group);
          const sessionId = sessionRes?.sessionId || sessionRes?.id;

          // 2. Prepare batch records
          const visibleChecks = Array.from(container.querySelectorAll(".attendance-check")).filter((chk) => {
            const tr = chk.closest("tr");
            return tr && tr.style.display !== "none";
          });

          const records = visibleChecks.map((chk) => ({
            studentUid: chk.getAttribute("data-student-uid"),
            status: chk.checked ? "present" : "absent"
          }));

          // 3. Batch save records
          await AttendanceService.recordBatch(sessionId, records);
          showToast("تم حفظ السيشن وتسجيل الحضور والغياب بنجاح ✅", "success");

          // Reset form
          document.getElementById("sessionNameInput").value = "";
        } catch (err) {
          console.error("Save attendance batch error:", err);
          showToast(err.message, "error");
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = "حفظ الغياب والسيشن 💾";
          }
        }
      });
    } catch (err) {
      setHtml(container, renderEmptyState({ icon: "❌", title: "خطأ في تحميل صفحة الغياب", description: err.message }));
    }
  }
};
