// src/features/assignments/components/assignment-details-modal.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderFileUploadZone } from "../../../shared/components/FileUpload/file-upload.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { formatDate, formatDateTime, getDeadlineInfo, isDeadlinePassed } from "../../../shared/utils/date.utils.js";
import { formatAssignmentContent } from "./assignment-card.component.js";
import { normalizeAssignmentGrade } from "../assignment.service.js";

export const ASSIGNMENT_DETAILS_MODAL_ID = "assignmentDetailsModal";

/**
 * Returns HTML string for the Assignment Details Modal body.
 * @param {object} options
 * @param {object} options.assignment
 * @param {object|null} options.submission
 * @param {boolean} [options.isSubmitting=false]
 * @returns {string}
 */
export function renderAssignmentDetailsContent({ assignment, submission, isSubmitting = false }) {
  if (!assignment) {
    return `<div class="text-center py-4 text-muted">لم يتم العثور على بيانات التاسك.</div>`;
  }

  const isSubmitted = !!submission;
  const isExpired = !isSubmitted && isDeadlinePassed(assignment.deadline);
  const deadlineInfo = getDeadlineInfo(assignment.deadline);

  // 1. Status Badge Resolution
  let statusBadgeHtml = "";
  if (isSubmitted) {
    const normalizedGrade = normalizeAssignmentGrade(submission.grade);
    const isGraded = normalizedGrade !== null;
    if (isGraded) {
      statusBadgeHtml = renderBadge({
        text: `تم التصحيح: ${normalizedGrade} / 10`,
        variant: "success",
        icon: "✓"
      });
    } else {
      statusBadgeHtml = renderBadge({
        text: "تم التسليم بنجاح (قيد التصحيح)",
        variant: "success",
        icon: "✓"
      });
    }
  } else if (isExpired) {
    statusBadgeHtml = renderBadge({
      text: "انتهى موعد التسليم",
      variant: "danger",
      icon: "🔴"
    });
  } else if (deadlineInfo.isUrgent) {
    statusBadgeHtml = renderBadge({
      text: deadlineInfo.label,
      variant: "warning",
      icon: "🟡"
    });
  } else {
    statusBadgeHtml = renderBadge({
      text: "مطلوب تسليمه",
      variant: "gold",
      icon: "📌"
    });
  }

  const { title: displayTitle } = formatAssignmentContent(assignment.title, assignment.description);
  const safeTitle = escapeHtml(displayTitle || assignment.title || "تاسك عملي");
  const rawDesc = (assignment.description || "").trim();
  const safeDesc = rawDesc ? escapeHtml(rawDesc) : "لا يوجد وصف إضافي مضاف.";
  const groupLabel = assignment.group === "ALL" ? "جميع المجموعات" : (assignment.group || "عام");
  const safeGroup = escapeHtml(groupLabel);

  // 2. Reference Material / File from Teacher
  let referenceFileHtml = "";
  if (assignment.fileUrl) {
    referenceFileHtml = `
      <div class="assignment-detail-section mb-4">
        <h4 class="assignment-section-title">
          <span aria-hidden="true">📎</span>
          <span>ملف الشرح والمرفقات المرجعية</span>
        </h4>
        <div class="assignment-ref-card">
          <div class="ref-file-icon" aria-hidden="true">📄</div>
          <div class="ref-file-info">
            <strong class="ref-file-name">ملف ومراجع التاسك</strong>
            <span class="text-xs text-muted">ملف مرفق من المعلم لتحميله والاطلاع على المتطلبات</span>
          </div>
          <a
            href="${escapeHtml(assignment.fileUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="btn btn-outline btn-sm"
          >
            <span>تحميل الملف</span>
            <span aria-hidden="true">📥</span>
          </a>
        </div>
      </div>
    `;
  }

  // 3. Submission Area Content
  let submissionAreaHtml = "";
  if (isSubmitted) {
    const normalizedGrade = normalizeAssignmentGrade(submission.grade);
    const isGraded = normalizedGrade !== null;
    const submittedTime = formatDateTime(submission.submittedAt || submission.createdAt);

    const rawAnswer = (
      submission.answerText ||
      submission.answer ||
      submission.code ||
      submission.solution ||
      submission.content ||
      submission.text ||
      ""
    ).trim();

    submissionAreaHtml = `
      <div class="assignment-submission-panel is-submitted">
        <div class="submission-success-banner mb-3">
          <div class="success-icon" aria-hidden="true">✓</div>
          <div>
            <h4 class="font-bold text-success" style="margin:0 0 2px 0;">تم تسليم هذا التاسك بنجاح</h4>
            <span class="text-xs text-muted">تاريخ ووقت الإرسال: ${escapeHtml(submittedTime)}</span>
          </div>
        </div>

        <!-- Teacher Grading Section -->
        <div class="grading-result-box mb-3 ${isGraded ? 'is-graded' : 'is-pending'}">
          <div class="d-flex items-center justify-between mb-2">
            <strong class="text-sm">حالة التقييم:</strong>
            ${
              isGraded
                ? `<span class="badge badge-success">تم التصحيح والتقييم</span>`
                : `<span class="badge badge-warning">قيد التصحيح ⏳</span>`
            }
          </div>
          ${
            isGraded
              ? `
                <div class="grade-score-row mb-2">
                  <span class="text-xs text-muted">الدرجة:</span>
                  <strong class="grade-score-val text-accent" style="font-size:1.15rem;">${escapeHtml(String(normalizedGrade))} / 10</strong>
                </div>
                ${
                  submission.feedback
                    ? `
                      <div class="teacher-feedback-note">
                        <strong class="text-xs text-muted d-block mb-1">ملاحظات المعلم:</strong>
                        <div class="feedback-text">${escapeHtml(submission.feedback)}</div>
                      </div>
                    `
                    : `
                      <div class="teacher-feedback-note">
                        <span class="text-xs text-muted">لم تُضف ملاحظات نصية من المعلم.</span>
                      </div>
                    `
                }
              `
              : `
                <p class="text-xs text-muted m-0">سيتم عرض الدرجة وملاحظات المعلم هنا فور الانتهاء من مراجعة حلك.</p>
              `
          }
        </div>

        <!-- Student Submitted Content Review -->
        <div class="submitted-content-summary">
          <h5 class="text-xs font-bold text-muted mb-2">نسخة إجابتك والكود البرمجي المرسل:</h5>
          ${
            rawAnswer
              ? `
                <div class="submitted-code-box mb-3" style="background:#0f172a;border:1px solid #334155;border-radius:6px;overflow:hidden;">
                  <div style="background:#1e293b;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #334155;">
                    <span style="font-size:0.75rem;font-family:monospace;color:#94a3b8;">إجابة الطالب / الكود البرمجي 💻</span>
                    <button
                      type="button"
                      class="btn btn-ghost btn-xs text-muted"
                      onclick="navigator.clipboard?.writeText(this.closest('.submitted-code-box').querySelector('code').innerText);this.innerText='تم النسخ ✓';setTimeout(()=>this.innerText='نسخ الكود 📋',2000);"
                      style="padding:2px 8px;font-size:0.75rem;"
                    >
                      نسخ الكود 📋
                    </button>
                  </div>
                  <pre class="m-0 p-3" dir="ltr" style="margin:0;padding:12px;font-family:'Fira Code','Courier New',monospace;font-size:0.9rem;line-height:1.5;color:#f8fafc;overflow-x:auto;white-space:pre;text-align:left;"><code>${escapeHtml(rawAnswer)}</code></pre>
                </div>
              `
              : `<p class="text-xs text-muted mb-2">لم يتم إرفاق إجابة نصية أو كود (تم تسليم ملف فقط).</p>`
          }
          ${
            submission.fileUrl
              ? `
                <div class="submitted-file-row mt-2">
                  <span class="text-xs font-bold">الملف المرفق للحل:</span>
                  <a
                    href="${escapeHtml(submission.fileUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-outline btn-sm font-bold"
                  >
                    <span>فتح ومعاينة الملف ↗</span>
                    <span aria-hidden="true">📥</span>
                  </a>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  } else if (isExpired) {
    submissionAreaHtml = `
      <div class="assignment-submission-panel is-expired text-center py-4">
        <div style="font-size:2.5rem;margin-bottom:0.5rem;" aria-hidden="true">⌛</div>
        <h4 class="font-bold text-danger mb-1">انتهى موعد تسليم هذا الواجب</h4>
        <p class="text-xs text-muted mb-0">لقد تجاوز هذا التاسك الموعد المحدد للتسليم (${formatDate(assignment.deadline)}). لا يمكن إرسال حلول جديدة.</p>
      </div>
    `;
  } else {
    // Active Submission Form
    submissionAreaHtml = `
      <form id="taskDetailsSubmissionForm" onsubmit="return false;" class="assignment-submission-form">
        <input type="hidden" id="detailsAssignmentId" value="${escapeHtml(assignment.id)}" />

        <div class="form-group mb-3">
          <label for="detailsTaskAnswerText" class="form-label font-bold text-sm">
            <span>إجابتك / الكود البرمجي / الروابط</span>
            <span class="text-xs text-muted font-normal">(مطلوب كتابة إجابة أو رفع ملف)</span>
          </label>
          <textarea
            id="detailsTaskAnswerText"
            class="form-textarea"
            rows="5"
            placeholder="اكتب كود الـ Python، رابط مشروعك على GitHub، أو خطوات الحل هنا..."
          ></textarea>
        </div>

        <div class="mb-4">
          <label class="form-label font-bold text-sm mb-1 d-block">الملف المرفق للحل (اختياري)</label>
          ${renderFileUploadZone({
            id: "detailsTaskUploadZone",
            inputId: "detailsTaskSubmissionFile",
            label: "اسحب وأفلت ملف الحل هنا (PDF, ZIP, Code, Images)",
            sublabel: "أو اضغط لتصفح واختيار الملف من جهازك",
            accept: ".pdf,.zip,.rar,.png,.jpg,.jpeg,.py,.txt,.docx,.doc",
            hint: "الحد الأقصى لحجم الملف: 20 ميجابايت"
          })}
        </div>

        <div class="submission-actions mt-4">
          <button
            type="submit"
            id="detailsSubmitBtn"
            class="btn btn-primary btn-lg w-full ${isSubmitting ? 'is-loading' : ''}"
            ${isSubmitting ? "disabled" : ""}
          >
            <span>${isSubmitting ? "جاري رفع الحل والتسليم... ⏳" : "تسليم التاسك 🚀"}</span>
          </button>
        </div>
      </form>
    `;
  }

  return `
    <div class="assignment-details-view" dir="rtl">
      <!-- Top Navigation -->
      <div class="assignment-details-top-bar mb-3">
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          data-modal-close="${ASSIGNMENT_DETAILS_MODAL_ID}"
          aria-label="العودة إلى قائمة التاسكات"
        >
          <span aria-hidden="true">←</span>
          <span>العودة إلى التاسكات</span>
        </button>
      </div>

      <!-- Header -->
      <div class="assignment-details-header mb-4">
        <div class="d-flex items-center gap-2 flex-wrap mb-2">
          ${statusBadgeHtml}
          <span class="badge badge-secondary">${safeGroup}</span>
        </div>
        <h2 class="assignment-details-title mb-2">${safeTitle}</h2>
        <div class="assignment-details-meta text-xs text-muted d-flex items-center gap-2 flex-wrap">
          <span class="meta-item">
            <span aria-hidden="true">⏰</span>
            <strong>${deadlineInfo.text}</strong>
          </span>
          <span class="meta-separator" aria-hidden="true">·</span>
          <span class="meta-item">
            <span aria-hidden="true">👥</span>
            <span>${safeGroup}</span>
          </span>
        </div>
      </div>

      <hr class="assignment-details-divider my-3" />

      <!-- Description / Requirements -->
      <div class="assignment-detail-section mb-4">
        <h4 class="assignment-section-title">
          <span aria-hidden="true">📋</span>
          <span>المطلوب وتنفيذ التاسك</span>
        </h4>
        <div class="assignment-description-box">
          ${safeDesc}
        </div>
      </div>

      ${referenceFileHtml}

      <hr class="assignment-details-divider my-3" />

      <!-- Submission Section -->
      <div class="assignment-detail-section">
        <h4 class="assignment-section-title">
          <span aria-hidden="true">📤</span>
          <span>تسليم الحل والتقييم</span>
        </h4>
        ${submissionAreaHtml}
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for the modal container.
 * @returns {string}
 */
export function renderAssignmentDetailsModal() {
  return renderModal({
    id: ASSIGNMENT_DETAILS_MODAL_ID,
    title: `<span id="assignmentDetailsModalTitle">تفاصيل التاسك</span>`,
    bodyHtml: `<div id="assignmentDetailsModalBody" class="py-2"><div class="spinner"></div></div>`,
    maxWidth: "680px"
  });
}
