// src/features/exams/components/exam-details.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { renderModal } from "../../../shared/components/Modal/modal.component.js";
import { renderBadge } from "../../../shared/components/Badge/badge.component.js";
import { renderButton } from "../../../shared/components/Button/button.component.js";
import { formatDate } from "../../../shared/utils/date.utils.js";
import { renderExamStatusBadge, getExamStatusInfo } from "./exam-status-badge.component.js";

export const EXAM_DETAILS_MODAL_ID = "adminExamDetailsModal";

/**
 * Returns HTML string for the inner content of the Exam Details view.
 * @param {object} options
 * @param {object} options.exam
 * @param {Array} [options.results=[]]
 * @returns {string}
 */
export function renderExamDetailsContent({ exam, results = [] }) {
  if (!exam) {
    return `<div class="p-6 text-center text-muted">لم يتم العثور على بيانات الامتحان.</div>`;
  }

  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  const totalQuestions = questions.length;
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.degree) || 1), 0);
  const duration = Number(exam.duration) || 30;
  const passDegree = Number(exam.passDegree) || 0;
  const letters = ["أ", "ب", "ج", "د", "هـ", "و"];

  // Real statistics calculation
  const attemptsCount = results.length;
  let avgScoreDisplay = "—";
  let highestScoreDisplay = "—";
  let passCount = 0;

  if (attemptsCount > 0) {
    const scores = results.map((r) => Number(r.score || r.total || 0));
    const sumScore = scores.reduce((a, b) => a + b, 0);
    avgScoreDisplay = (sumScore / attemptsCount).toFixed(1);
    highestScoreDisplay = Math.max(...scores);
    const passThreshold = passDegree > 0 ? passDegree : totalScore * 0.5;
    passCount = scores.filter((s) => s >= passThreshold).length;
  }

  const passRateDisplay = attemptsCount > 0 ? `${Math.round((passCount / attemptsCount) * 100)}%` : "—";

  // Date strings
  let dateText = "—";
  if (exam.startDate || exam.deadline) {
    const parts = [];
    if (exam.startDate) parts.push(`فتح: ${formatDate(exam.startDate)}`);
    if (exam.deadline) parts.push(`غلق: ${formatDate(exam.deadline)}`);
    dateText = parts.join(" · ");
  } else if (exam.createdAt) {
    dateText = formatDate(exam.createdAt);
  }

  return `
    <div class="exam-details-view">
      <!-- Top Overview Header -->
      <div class="card p-4 mb-4" style="background: var(--color-surface-elevated); border: 1px solid var(--color-border-primary);">
        <div class="d-flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <div class="d-flex items-center gap-2 mb-1">
              ${renderExamStatusBadge(exam)}
              <span class="badge badge-gold font-bold">المجموعة: ${escapeHtml(exam.group || "جميع المجموعات")}</span>
            </div>
            <h3 class="font-black" style="font-size: 1.35rem; color: var(--color-text-primary); margin: 0;">
              ${escapeHtml(exam.title || "امتحان بدون عنوان")}
            </h3>
          </div>
          <div class="d-flex items-center gap-2">
            ${renderButton({
              text: "🖨️ طباعة تقرير الامتحان",
              size: "sm",
              variant: "primary",
              extraAttrs: `data-details-print-exam="${escapeHtml(exam.id)}"`
            })}
            ${renderButton({
              text: "تعديل الامتحان ✏️",
              size: "sm",
              variant: "secondary",
              extraAttrs: `data-details-edit-exam="${escapeHtml(exam.id)}"`
            })}
          </div>
        </div>

        ${
          exam.description
            ? `<p class="text-muted text-xs mb-3" style="line-height: 1.6;">${escapeHtml(exam.description)}</p>`
            : ""
        }

        <!-- Key Parameters Bar -->
        <div class="grid-4 gap-2 p-3 mt-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border: 1px solid var(--color-border-subtle); font-size: var(--font-size-xs);">
          <div>
            <span class="text-muted d-block mb-1">⏱️ مدة الاختبار:</span>
            <strong style="color: var(--color-text-primary);">${duration} دقيقة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">📝 عدد الأسئلة:</span>
            <strong style="color: var(--color-text-primary);">${totalQuestions} سؤال</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">🎯 الدرجة الكلية:</span>
            <strong class="text-accent">${totalScore} درجة</strong>
          </div>
          <div>
            <span class="text-muted d-block mb-1">📅 التوقيت:</span>
            <span style="color: var(--color-text-secondary);">${escapeHtml(dateText)}</span>
          </div>
        </div>
      </div>

      <!-- Real Statistics Section -->
      <div class="mb-4">
        <h4 class="font-bold text-xs text-muted mb-2">📊 مؤشرات الأداء الحقيقية (من واقع نتائج الطلاب الفعلية):</h4>
        <div class="grid-4 gap-2">
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">إجمالي المحاولات</span>
            <span class="stat-value font-black text-primary" style="font-size: 1.4rem;">${attemptsCount}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">متوسط الدرجات</span>
            <span class="stat-value font-black text-accent" style="font-size: 1.4rem;">${avgScoreDisplay}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">أعلى درجة مرصودة</span>
            <span class="stat-value font-black text-success" style="font-size: 1.4rem;">${highestScoreDisplay}</span>
          </div>
          <div class="stat-card p-3" style="background: var(--color-bg-secondary); border: 1px solid var(--color-border-subtle); border-radius: var(--radius-sm); flex-direction: column; gap: 0.25rem;">
            <span class="stat-label text-xs">نسبة النجاح</span>
            <span class="stat-value font-black ${passRateDisplay !== "—" ? "text-success" : "text-muted"}" style="font-size: 1.4rem;">${passRateDisplay}</span>
          </div>
        </div>
      </div>

      <!-- Segmented View Tabs (Results vs Questions) -->
      <div class="academic-filter-tabs mb-3" style="margin-inline:0;">
        <button type="button" class="academic-filter-btn active" data-exam-details-tab="results">
          <span>🎓 نتائج ومحاولات الطلاب (${attemptsCount})</span>
        </button>
        <button type="button" class="academic-filter-btn" data-exam-details-tab="questions">
          <span>📝 الأسئلة والمفتاح النموذجي (${totalQuestions})</span>
        </button>
      </div>

      <!-- TAB 1: Student Results Table -->
      <div id="examDetailsTabResults" class="exam-details-tab-pane">
        <div class="d-flex items-center justify-between mb-3 flex-wrap gap-2">
          <h4 class="font-extrabold text-sm m-0" style="color: var(--color-text-primary);">
            قائمة درجات الطلاب الفعلية (${attemptsCount}):
          </h4>
          <div class="search-input-wrap" style="max-width:280px;">
            <input
              type="search"
              id="examResultsSearchInput"
              class="form-control form-control-sm"
              placeholder="🔍 بحث باسم الطالب أو الهاتف..."
              aria-label="بحث في نتائج الامتحان"
            />
          </div>
        </div>

        <div class="table-wrapper mb-4" style="border: 1px solid var(--color-border-subtle); border-radius: var(--radius-md); overflow-x: auto;">
          <table class="table-modern w-full" style="font-size: var(--font-size-xs);" id="examResultsTable">
            <thead>
              <tr>
                <th scope="col" style="width: 35px; text-align: center;">#</th>
                <th scope="col" style="text-align: start;">الطالب</th>
                <th scope="col">المجموعة</th>
                <th scope="col" style="text-align: center;">الدرجة</th>
                <th scope="col" style="text-align: center;">النسبة</th>
                <th scope="col" style="text-align: center;">الحالة</th>
                <th scope="col" style="text-align: center;">وقت التسليم</th>
                <th scope="col" style="text-align: center;">الإجراءات</th>
              </tr>
            </thead>
            <tbody id="examResultsTableBody">
              ${
                results.length === 0
                  ? `<tr><td colspan="8" class="text-center p-5 text-muted">لا توجد محاولات تسليم لهذا الامتحان حتى الآن.</td></tr>`
                  : results
                      .map((r, idx) => {
                        const score = Number(r.score || r.total || 0);
                        const percent = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
                        const isPendingEssay = r.status === "pending_essay";
                        const passThreshold = passDegree > 0 ? passDegree : totalScore * 0.5;
                        const isPassed = score >= passThreshold;
                        const statusBadge = isPendingEssay
                          ? `<span class="badge badge-warning text-xs font-bold">قيد تصحيح المقالي ⏳</span>`
                          : isPassed
                          ? `<span class="badge badge-success text-xs font-bold">ناجح ✓</span>`
                          : `<span class="badge badge-danger text-xs font-bold">راسب</span>`;

                        const hasEssay = questions.some((q) => q.type === "essay");

                        return `
                          <tr data-result-row data-student-name="${escapeHtml((r.studentName || "").toLowerCase())}" data-student-phone="${escapeHtml(r.studentPhone || r.studentUid || "")}">
                            <td style="text-align: center;">${idx + 1}</td>
                            <td>
                              <div class="d-flex flex-col">
                                <strong class="font-bold" style="color: var(--color-text-primary);">${escapeHtml(r.studentName || "طالب")}</strong>
                                <span class="text-muted text-xs font-mono">${escapeHtml(r.studentPhone || r.studentUid || "—")}</span>
                              </div>
                            </td>
                            <td>
                              <span class="badge badge-gold text-xs">${escapeHtml(r.group || exam.group || "—")}</span>
                            </td>
                            <td style="text-align: center;">
                              <strong class="text-accent font-extrabold" style="font-size: 0.95rem;">${score}</strong>
                              <span class="text-muted"> / ${totalScore}</span>
                            </td>
                            <td style="text-align: center;">
                              <span class="font-bold ${percent >= 50 ? "text-success" : "text-danger"}">${percent}%</span>
                            </td>
                            <td style="text-align: center;">
                              ${statusBadge}
                            </td>
                            <td style="text-align: center; font-size: 0.75rem; color: var(--color-text-secondary);">
                              ${r.submittedAt ? formatDate(r.submittedAt) : "—"}
                            </td>
                            <td style="text-align: center;">
                              ${
                                hasEssay
                                  ? `
                                <button
                                  type="button"
                                  class="btn btn-primary btn-sm font-bold"
                                  data-grade-essay-result="${escapeHtml(r.id)}"
                                  data-grade-exam-id="${escapeHtml(exam.id)}"
                                  title="تصحيح أو مراجعة الأسئلة المقالية"
                                >
                                  ✏️ تصحيح المقالي
                                </button>
                              `
                                  : `
                                <span class="text-muted text-xs">تصحيح تلقائي ✓</span>
                              `
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB 2: Full Questions Breakdown (Initially Hidden) -->
      <div id="examDetailsTabQuestions" class="exam-details-tab-pane" style="display:none;">
        <div class="d-flex items-center justify-between mb-3">
          <h4 class="font-extrabold text-sm" style="color: var(--color-text-primary);">
            📝 تفاصيل الأسئلة ومفاتيح الإجابات النموذجية (${totalQuestions}):
          </h4>
          <span class="badge badge-neutral text-xs">🔐 عرض مخصص للمدير والمعلم</span>
        </div>

        <div class="d-flex flex-col gap-3">
          ${
            questions.length === 0
              ? `<div class="card text-center p-6 text-muted text-xs">لا توجد أسئلة مضافة لهذا الامتحان.</div>`
              : questions
                  .map((q, idx) => {
                    const isMcq = q.type !== "essay";
                    const correctIdx = Number(q.correct) || 0;
                    const degree = Number(q.degree) || 1;
                    const options = Array.isArray(q.options) ? q.options : [];

                    return `
                    <div class="card p-4" style="border: 1px solid var(--color-border-subtle); background: var(--color-surface-elevated);">
                      <div class="d-flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div class="d-flex items-center gap-2">
                          ${renderBadge({ text: `السؤال ${idx + 1}`, variant: "gold", className: "font-bold" })}
                          ${
                            isMcq
                              ? renderBadge({ text: "اختيار من متعدد", variant: "info", className: "text-xs" })
                              : renderBadge({ text: "سؤال مقالي", variant: "neutral", className: "text-xs" })
                          }
                        </div>
                        <span class="badge badge-outline text-xs" style="color: var(--color-text-secondary);">
                          ${degree} ${degree === 1 ? "درجة" : "درجات"}
                        </span>
                      </div>

                      <h5 class="font-extrabold mb-3" style="font-size: 1.05rem; line-height: 1.5; color: var(--color-text-primary);">
                        ${escapeHtml(q.question || "")}
                      </h5>

                      ${
                        isMcq
                          ? `
                        <div class="d-flex flex-col gap-2">
                          ${options
                            .map((opt, optIdx) => {
                              const isCorrect = optIdx === correctIdx;
                              const letter = letters[optIdx] || `#${optIdx + 1}`;
                              return `
                              <div
                                class="d-flex items-center gap-2 p-2 px-3"
                                style="border-radius: var(--radius-sm); border: 1px solid ${isCorrect ? "var(--color-success)" : "var(--color-border-subtle)"}; background: ${isCorrect ? "var(--color-bg-secondary)" : "transparent"};"
                              >
                                <span class="badge ${isCorrect ? "badge-success" : "badge-neutral"}" style="min-width: 24px; text-align: center;">
                                  ${letter}
                                </span>
                                <span class="text-sm font-medium" style="flex: 1; color: var(--color-text-primary);">
                                  ${escapeHtml(opt)}
                                </span>
                                ${isCorrect ? `<span class="badge badge-success text-xs">الإجابة النموذجية الصحيحة ✓</span>` : ""}
                              </div>
                            `;
                            })
                            .join("")}
                        </div>
                      `
                          : `
                        <div class="p-3" style="background: var(--color-bg-secondary); border-radius: var(--radius-sm); border-inline-start: 3px solid var(--color-primary);">
                          <span class="text-xs text-muted font-bold d-block">إجابة مقالية يكتبها الطالب في مربع نصي حر.</span>
                        </div>
                      `
                      }
                    </div>
                  `;
                  })
                  .join("")
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Returns HTML string for the Admin Exam Details Modal shell.
 * @returns {string}
 */
export function renderExamDetailsModal() {
  return renderModal({
    id: EXAM_DETAILS_MODAL_ID,
    title: "تفاصيل الامتحان والإحصاءات",
    bodyHtml: `<div id="adminExamDetailsBodySlot" class="p-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div class="d-flex items-center justify-end w-full">
        <button type="button" class="btn btn-secondary" data-modal-close="${EXAM_DETAILS_MODAL_ID}">
          إغلاق النافذة
        </button>
      </div>
    `,
    maxWidth: "840px"
  });
}

export const STUDENT_EXAM_DETAILS_MODAL_ID = "studentExamDetailsModal";

/**
 * Returns HTML string for the Student Exam Details Modal shell.
 */
export function renderStudentExamDetailsModal() {
  return renderModal({
    id: STUDENT_EXAM_DETAILS_MODAL_ID,
    title: "تفاصيل الامتحان",
    bodyHtml: `<div id="studentExamDetailsBodySlot" class="p-2"><div class="spinner"></div></div>`,
    footerHtml: `
      <div id="studentExamDetailsFooterSlot" class="d-flex items-center justify-between w-full">
        <button type="button" class="btn btn-secondary" data-modal-close="${STUDENT_EXAM_DETAILS_MODAL_ID}">
          إغلاق
        </button>
      </div>
    `,
    size: "md"
  });
}

export const PRE_EXAM_CONFIRM_MODAL_ID = "preExamConfirmModal";

/**
 * Returns HTML string for the Pre-Exam Confirmation Modal.
 * @param {object} options
 * @param {object} options.exam
 * @returns {string}
 */
export function renderPreExamConfirmationModal(exam) {
  const duration = Number(exam?.duration) || 30;
  const questionsCount =
    exam?.totalQuestions !== undefined
      ? exam.totalQuestions
      : Array.isArray(exam?.questions)
      ? exam.questions.length
      : Number(exam?.questionCount) || "—";

  const bodyHtml = `
    <div class="pre-exam-confirm-card text-center py-2">
      <div class="confirm-icon-bubble mb-3" style="font-size: 2.75rem;" aria-hidden="true">⏱️</div>
      <h3 class="font-black text-xl mb-1" style="color: var(--text-primary);">جاهز لبدء الامتحان؟</h3>
      <p class="text-accent font-bold mb-4" style="font-size: 1.1rem;">
        ${escapeHtml(exam?.title || "الامتحان")}
      </p>

      <div class="pre-exam-summary-box mb-4 p-4 text-start" style="background: var(--surface-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <div class="d-flex items-center justify-between py-2" style="border-bottom: 1px solid var(--border-subtle);">
          <span class="text-xs text-muted font-semibold">عدد الأسئلة:</span>
          <strong class="text-sm text-primary font-bold">📝 ${questionsCount} سؤال</strong>
        </div>
        <div class="d-flex items-center justify-between py-2" style="border-bottom: 1px solid var(--border-subtle);">
          <span class="text-xs text-muted font-semibold">المدة الزمنية:</span>
          <strong class="text-sm text-primary font-bold">⏱️ ${duration} دقيقة</strong>
        </div>
        <div class="d-flex items-center justify-between py-2">
          <span class="text-xs text-muted font-semibold">عدد المحاولات:</span>
          <strong class="text-sm text-primary font-bold">🔒 محاولة واحدة رسمية</strong>
        </div>
      </div>

      <div class="alert alert-warning mb-2 text-start text-xs" style="line-height: 1.6;">
        <span class="font-bold">⚠️ تنبيه هام:</span> بمجرد الضغط على <strong>"أبدأ الآن"</strong> سيبدأ احتساب الوقت الرسمي عبر السيرفر ولن تتمكن من إيقافه.
      </div>
    </div>
  `;

  const footerHtml = `
    <div class="d-flex items-center gap-3 w-full justify-between">
      ${renderButton({
        id: "cancelPreExamBtn",
        text: "رجوع",
        variant: "secondary",
        className: "flex-1 btn-md"
      })}
      ${renderButton({
        id: "confirmStartExamOfficialBtn",
        text: "أبدأ الآن 🚀",
        variant: "primary",
        className: "flex-1 btn-md"
      })}
    </div>
  `;

  return renderModal({
    id: PRE_EXAM_CONFIRM_MODAL_ID,
    title: "تأكيد بدء الاختبار الرسمي",
    bodyHtml,
    footerHtml,
    size: "sm"
  });
}

/**
 * Returns HTML string for the inner content of the Student Exam Details modal.
 * @param {object} options
 * @param {object} options.exam
 * @param {object} [options.result]
 * @returns {string}
 */
export function renderStudentExamDetailsContent({ exam, result = null }) {
  if (!exam) {
    return `<div class="p-6 text-center text-muted">لم يتم العثور على بيانات الامتحان.</div>`;
  }

  const statusInfo = getExamStatusInfo(exam, result);
  const duration = Number(exam.duration) || 30;
  const questionsCount =
    exam.totalQuestions !== undefined
      ? exam.totalQuestions
      : Array.isArray(exam.questions)
      ? exam.questions.length
      : Number(exam.questionCount) || "—";

  const startDateText = exam.startDate || exam.startAt ? formatDate(exam.startDate || exam.startAt) : "متاح الآن";
  const deadlineText = exam.deadline || exam.endAt ? formatDate(exam.deadline || exam.endAt) : "مفتوح";

  const isCompleted =
    statusInfo.status === "graded" ||
    statusInfo.status === "pending_essay" ||
    statusInfo.status === "submitted";
  const isInProgress = statusInfo.status === "in_progress" || exam.attemptStatus === "in_progress";
  const isAvailable = statusInfo.status === "available" || statusInfo.status === "in_progress";

  return `
    <div class="student-exam-details-content py-2">
      <div class="d-flex items-center justify-between mb-3">
        ${statusInfo.html}
        <span class="text-xs text-muted font-bold d-flex items-center gap-1">
          <span>⏱️</span>
          <span>${duration} دقيقة</span>
        </span>
      </div>

      <h3 class="font-black mb-2 student-details-title" style="font-size: 1.35rem; color: var(--text-primary); line-height: 1.4;">
        ${escapeHtml(exam.title || "امتحان بدون عنوان")}
      </h3>

      ${
        exam.description
          ? `<p class="student-details-description text-muted text-xs mb-4" style="line-height: 1.7;">${escapeHtml(exam.description)}</p>`
          : ""
      }

      <!-- Section: معلومات الامتحان -->
      <div class="details-section-header mb-2">
        <h4 class="font-black text-sm text-primary m-0">معلومات الامتحان</h4>
      </div>
      <div class="exam-details-specs-grid mb-5">
        <div class="spec-card">
          <span class="spec-label">عدد الأسئلة</span>
          <strong class="spec-value">📝 ${questionsCount} سؤال</strong>
        </div>
        <div class="spec-card">
          <span class="spec-label">المدة</span>
          <strong class="spec-value">⏱️ ${duration} دقيقة</strong>
        </div>
        <div class="spec-card">
          <span class="spec-label">موعد البداية</span>
          <strong class="spec-value">🟢 ${escapeHtml(startDateText)}</strong>
        </div>
        <div class="spec-card">
          <span class="spec-label">موعد النهاية</span>
          <strong class="spec-value">🔴 ${escapeHtml(deadlineText)}</strong>
        </div>
        <div class="spec-card">
          <span class="spec-label">المحاولة المسموحة</span>
          <strong class="spec-value">🔒 محاولة واحدة رسمية</strong>
        </div>
        <div class="spec-card">
          <span class="spec-label">حالة المحاولة</span>
          <strong class="spec-value">${statusInfo.label}</strong>
        </div>
      </div>

      <!-- Section: التعليمات -->
      <div class="details-section-header mb-2">
        <h4 class="font-black text-sm text-primary m-0">تعليمات وإرشادات هامة</h4>
      </div>
      <div class="exam-instructions-card p-4 mb-4" style="background: var(--surface-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border);">
        <ul class="exam-instructions-list m-0 p-0 text-xs" style="list-style: none; display: flex; flex-direction: column; gap: 0.6rem; line-height: 1.6;">
          <li class="d-flex items-start gap-2">
            <span class="instruction-dot" style="color: var(--primary);">✓</span>
            <span>بمجرد بدء الاختبار سيبدأ احتساب الوقت الرسمي تنازلياً عبر السيرفر ولن يتوقف.</span>
          </li>
          <li class="d-flex items-start gap-2">
            <span class="instruction-dot" style="color: var(--primary);">✓</span>
            <span>يُرجى التحقق من استقرار اتصال الإنترنت والتركيز داخل نافذة الامتحان.</span>
          </li>
          <li class="d-flex items-start gap-2">
            <span class="instruction-dot" style="color: var(--primary);">✓</span>
            <span>إجاباتك تُحفظ في الذاكرة تدريجياً، ويمكنك مراجعة جميع الأسئلة قبل تأكيد التسليم.</span>
          </li>
          <li class="d-flex items-start gap-2">
            <span class="instruction-dot" style="color: var(--primary);">✓</span>
            <span>عند انتهاء الوقت المخصص، يتم اعتماد وتسليم إجاباتك تلقائياً دون فقدان.</span>
          </li>
          <li class="d-flex items-start gap-2">
            <span class="instruction-dot" style="color: var(--warning);">⚠️</span>
            <span>وفقاً لنظام المنصة، لا يُسمح بإعادة الاختبار بعد تسليمه النهائي.</span>
          </li>
        </ul>
      </div>

      ${
        isCompleted && result
          ? `
        <div class="p-4 mb-4 text-center" style="background: var(--surface-secondary); border-radius: var(--radius-lg); border: 1px solid var(--border);">
          <span class="text-xs text-muted d-block mb-1">النتيجة الرسمية المسجلة:</span>
          <strong class="text-accent font-black" style="font-size: 1.8rem;">
            ${result.score ?? "—"} <span class="text-xs text-muted">/ ${result.total || result.totalQuestions || 100}</span>
          </strong>
        </div>
      `
          : ""
      }

      <!-- Action Button Area -->
      <div class="mt-4 pt-2">
        ${
          isCompleted
            ? renderButton({
                text: "عرض النتيجة 📊",
                variant: "primary",
                className: "btn-lg w-full",
                extraAttrs: `data-action-view-result="${escapeHtml(exam.id)}"`
              })
            : isInProgress
            ? renderButton({
                text: "متابعة الامتحان ⏳",
                variant: "primary",
                className: "btn-lg w-full",
                extraAttrs: `data-action-start-exam="${escapeHtml(exam.id)}"`
              })
            : isAvailable
            ? renderButton({
                text: "بدء الامتحان 🚀",
                variant: "primary",
                className: "btn-lg w-full",
                extraAttrs: `data-action-start-exam="${escapeHtml(exam.id)}"`
              })
            : `<button type="button" class="btn btn-secondary btn-lg w-full" disabled>هذا الاختبار غير متاح للبدء حالياً</button>`
        }
      </div>
    </div>
  `;
}

