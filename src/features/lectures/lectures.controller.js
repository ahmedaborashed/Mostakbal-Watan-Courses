// src/features/lectures/lectures.controller.js
import { LecturesService } from "./lectures.service.js";
import { lecturesState } from "./lectures.state.js";
import { renderStudentVideoCard, renderTeacherVideoCard } from "./components/video-card.component.js";
import { openModal, closeModal } from "../../shared/components/Modal/modal.component.js";
import { renderLoader } from "../../shared/components/Loader/loader.component.js";
import { renderEmptyState } from "../../shared/components/EmptyState/empty-state.component.js";
import { renderErrorState } from "../../shared/components/ErrorState/error-state.component.js";
import { showToast } from "../../shared/components/Toast/toast.component.js";
import { showConfirmDialog } from "../../shared/components/ConfirmDialog/confirm-dialog.component.js";
import { setHtml } from "../../shared/utils/dom.utils.js";

export const LecturesController = {
  /**
   * Loads video lectures for student view.
   */
  async loadStudentLectures(containerId, currentStudent) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل الدروس... 📚" }));

    try {
      const studentPhone = currentStudent?.studentPhone || "";
      const studentUid = currentStudent?.firestoreId || currentStudent?.id || "";

      const [lectures, watchedIds] = await Promise.all([
        LecturesService.getAllLectures(),
        LecturesService.getStudentWatchedLogs(studentUid, studentPhone)
      ]);

      lecturesState.set("lectures", lectures);
      lecturesState.set("watchedIds", watchedIds);

      // Filter by group if set
      const studentGroup = currentStudent?.studentGroup || currentStudent?.group || "ALL";
      const filtered = lectures.filter((l) => !l.group || l.group === "ALL" || l.group === studentGroup);

      if (filtered.length === 0) {
        setHtml(container, renderEmptyState({
          icon: "📚",
          title: "لا توجد دروس منشورة حالياً",
          description: "سيقوم المعلم بنشر شروحات ودروس جديدة قريباً."
        }));
        return;
      }

      const gridHtml = `
        <div class="grid-3">
          ${filtered.map((lec) => renderStudentVideoCard({ lecture: lec, isWatched: watchedIds.has(lec.videoId || lec.id) })).join("")}
        </div>
      `;
      setHtml(container, gridHtml);

      // Bind play video buttons
      container.querySelectorAll("[data-play-video]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const videoId = btn.getAttribute("data-video-id");
          const videoName = btn.getAttribute("data-video-name");
          this.openVideoPlayer(videoId, videoName, currentStudent);
        });
      });
    } catch (err) {
      console.error("Failed to load student lectures:", err);
      setHtml(container, renderErrorState({
        title: "تعذر تحميل الدروس",
        message: err.message,
        retryBtnId: "retryLoadLecturesBtn"
      }));
      document.getElementById("retryLoadLecturesBtn")?.addEventListener("click", () => {
        this.loadStudentLectures(containerId, currentStudent);
      });
    }
  },

  /**
   * Opens the embedded video player modal and records watch log.
   */
  openVideoPlayer(videoId, videoName, currentStudent) {
    if (!videoId) {
      showToast("معرف الفيديو غير صالح", "warning");
      return;
    }

    const titleEl = document.getElementById("videoPlayerTitle");
    const frameEl = document.getElementById("videoPlayerFrame");

    let cleanId = videoId;
    if (videoId.includes("v=")) cleanId = videoId.split("v=")[1].split("&")[0];
    else if (videoId.includes("youtu.be/")) cleanId = videoId.split("youtu.be/")[1].split("?")[0];

    if (titleEl) titleEl.textContent = videoName || "مشاهدة الدرس";
    if (frameEl) {
      frameEl.src = `https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0`;
    }

    openModal("videoPlayerModal");

    // Clear frame src when modal is closed to stop video playing in background
    const modal = document.getElementById("videoPlayerModal");
    if (modal && !modal.hasAttribute("data-player-cleanup")) {
      modal.setAttribute("data-player-cleanup", "true");
      modal.querySelectorAll("[data-modal-close]").forEach((c) => {
        c.addEventListener("click", () => {
          if (frameEl) frameEl.src = "";
        });
      });
    }

    // Record log in background if student is present
    if (currentStudent) {
      LecturesService.recordWatchLog(
        cleanId || videoId,
        currentStudent.firestoreId || currentStudent.id,
        currentStudent.studentPhone,
        currentStudent.studentName || currentStudent.name
      );
    }
  },

  /**
   * Loads video lectures for teacher management view.
   */
  async loadTeacherLectures(containerId) {
    const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
    if (!container) return;

    setHtml(container, renderLoader({ text: "جاري تحميل قائمة الدروس..." }));

    try {
      const lectures = await LecturesService.getAllLectures();
      lecturesState.set("lectures", lectures);

      const headerHtml = `
        <div class="card mb-6">
          <h3 class="card-title mb-3">➕ إضافة درس ومحاضرة جديدة</h3>
          <p class="text-xs text-muted mb-4">أدخل عنوان المحاضرة ورابط أو كود فيديو يوتيوب وحدد المجموعة المستهدفة.</p>
          <form id="addLectureForm" class="grid-3" onsubmit="return false;">
            <input type="text" id="lectureTitleInput" class="form-input" placeholder="عنوان الدرس (مثال: الشرح الأول للـ Variables)" required />
            <input type="text" id="lectureVideoIdInput" class="form-input" placeholder="YouTube Video ID أو الرابط الكامل" required />
            <select id="lectureGroupSelect" class="form-select">
              <option value="ALL">جميع المجموعات (ALL)</option>
              <option value="مجموعة الأحد والأربعاء | 7:00 - 8:30">مجموعة الأحد والأربعاء | 7:00 - 8:30</option>
              <option value="مجموعة الأحد والأربعاء | 9:00 - 10:30">مجموعة الأحد والأربعاء | 9:00 - 10:30</option>
            </select>
            <div style="grid-column: 1 / -1;" class="text-left mt-2">
              <button type="submit" id="saveLectureBtn" class="btn btn-primary">حفظ ونشر الدرس 🚀</button>
            </div>
          </form>
        </div>
      `;

      let listHtml = "";
      if (lectures.length === 0) {
        listHtml = renderEmptyState({
          icon: "📚",
          title: "لا توجد فيديوهات منشورة حالياً",
          description: "استخدم النموذج أعلاه لإضافة ونشر الدرس الأول."
        });
      } else {
        listHtml = `
          <div class="grid-3">
            ${lectures.map((lec) => renderTeacherVideoCard({ lecture: lec })).join("")}
          </div>
        `;
      }

      setHtml(container, headerHtml + listHtml);

      // Bind add lecture form
      document.getElementById("addLectureForm")?.addEventListener("submit", async () => {
        const title = document.getElementById("lectureTitleInput")?.value.trim();
        let vid = document.getElementById("lectureVideoIdInput")?.value.trim();
        const group = document.getElementById("lectureGroupSelect")?.value || "ALL";

        if (!title || !vid) {
          showToast("يرجى ملء جميع الحقول", "warning");
          return;
        }

        if (vid.includes("v=")) vid = vid.split("v=")[1].split("&")[0];
        else if (vid.includes("youtu.be/")) vid = vid.split("youtu.be/")[1].split("?")[0];

        try {
          await LecturesService.createLecture({ name: title, videoId: vid, group });
          showToast("تم إضافة ونشر الدرس بنجاح ✅", "success");
          this.loadTeacherLectures(container);
        } catch (e) {
          showToast(e.message, "error");
        }
      });

      // Bind preview and delete buttons
      container.querySelectorAll("[data-teacher-preview]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const videoId = btn.getAttribute("data-video-id");
          this.openVideoPlayer(videoId, "معاينة الدرس", null);
        });
      });

      container.querySelectorAll("[data-teacher-delete]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-teacher-delete");
          const name = btn.getAttribute("data-video-name") || "هذا الفيديو";

          const confirmed = await showConfirmDialog({
            title: "حذف الفيديو",
            message: `هل أنت متأكد من رغبتك في حذف "${name}"؟ لن يتمكن الطلاب من مشاهدته بعد الآن.`,
            confirmText: "حذف نهائي",
            variant: "danger"
          });

          if (confirmed) {
            try {
              await LecturesService.deleteLecture(id);
              showToast("تم حذف الفيديو بنجاح", "info");
              this.loadTeacherLectures(container);
            } catch (e) {
              showToast(e.message, "error");
            }
          }
        });
      });
    } catch (err) {
      setHtml(container, renderErrorState({ title: "خطأ في تحميل الفيديوهات", message: err.message }));
    }
  }
};
