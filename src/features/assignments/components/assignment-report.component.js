// src/features/assignments/components/assignment-report.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { formatDate, formatDateTime } from "../../../shared/utils/date.utils.js";

/**
 * Generates print-ready HTML for an assignment submissions & status report.
 * Clearly presents eligible students, who submitted, who did not submit, and grades /10.
 * @param {object} options
 * @param {object} options.assignment
 * @param {Array<object>} options.roster
 * @param {number} options.totalEligible
 * @param {number} options.submittedCount
 * @param {number} options.notSubmittedCount
 * @param {number} options.gradedCount
 * @returns {string}
 */
export function renderAssignmentPrintableReport({
  assignment,
  roster = [],
  totalEligible = 0,
  submittedCount = 0,
  notSubmittedCount = 0,
  gradedCount = 0
}) {
  const safeTitle = escapeHtml(assignment?.title || "واجب تطبيقي");
  const targetGroup = assignment?.group === "ALL" ? "جميع المجموعات" : (assignment?.group || "عام");
  const safeGroup = escapeHtml(targetGroup);
  const deadlineStr = assignment?.deadline ? formatDate(assignment.deadline) : "بدون موعد محدد";
  const nowFormatted = formatDate(new Date());

  const submissionRate = totalEligible > 0 ? Math.round((submittedCount / totalEligible) * 100) : 0;

  return `
    <div class="print-report-container" style="direction:rtl;text-align:right;font-family:'Cairo',sans-serif;padding:10px;">
      <!-- Header with branding -->
      <div class="print-report-header">
        <div>
          <h1 class="print-report-title">تقرير تسليمات ونتائج الواجب الأكاديمي</h1>
          <div class="print-report-meta">
            <strong>الواجب:</strong> ${safeTitle} | <strong>المجموعة المستهدفة:</strong> ${safeGroup} | <strong>الموعد النهائي:</strong> ${escapeHtml(deadlineStr)}
          </div>
        </div>
        <div style="text-align:left;">
          <div class="print-report-meta">حزب مستقبل وطن - المنصة التعليمية</div>
          <div class="print-report-meta">تاريخ استخراج التقرير: ${nowFormatted}</div>
        </div>
      </div>

      <!-- KPIs Summary Grid -->
      <div class="print-summary-grid">
        <div class="print-summary-box">
          <span class="print-summary-label">إجمالي الطلاب المستهدفين</span>
          <span class="print-summary-val">${totalEligible}</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">تم التسليم</span>
          <span class="print-summary-val" style="color:#166534;">${submittedCount} (${submissionRate}%)</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">لم يتم التسليم</span>
          <span class="print-summary-val" style="color:#991b1b;">${notSubmittedCount}</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">تم التصحيح والتقييم</span>
          <span class="print-summary-val">${gradedCount} / ${submittedCount}</span>
        </div>
      </div>

      <!-- Roster Table (Submitted vs Not Submitted) -->
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:35px;">#</th>
            <th>اسم الطالب</th>
            <th>رقم الهاتف</th>
            <th>المجموعة</th>
            <th style="text-align:center;">حالة التسليم</th>
            <th style="text-align:center;">الدرجة (من 10)</th>
            <th style="text-align:center;">تاريخ التسليم</th>
            <th>ملاحظات المعلم</th>
          </tr>
        </thead>
        <tbody>
          ${
            roster.length === 0
              ? `<tr><td colspan="8" style="text-align:center;padding:20px;">لا يوجد طلاب مستهدفون لهذا الواجب.</td></tr>`
              : roster
                  .map((item, idx) => {
                    const badgeClass = item.hasSubmitted
                      ? (item.status === "graded" ? "print-badge-success" : "print-badge-warning")
                      : "print-badge-danger";

                    const submittedDateStr = item.submittedAt
                      ? formatDateTime(item.submittedAt)
                      : "—";

                    return `
                      <tr>
                        <td style="text-align:center;">${idx + 1}</td>
                        <td><strong>${escapeHtml(item.studentName)}</strong></td>
                        <td style="direction:ltr;text-align:right;">${escapeHtml(item.studentPhone || "—")}</td>
                        <td>${escapeHtml(item.group)}</td>
                        <td style="text-align:center;">
                          <span class="print-badge ${badgeClass}">${escapeHtml(item.statusLabel)}</span>
                        </td>
                        <td style="text-align:center;font-weight:bold;">
                          ${item.status === "graded" ? `${item.grade} / 10` : "—"}
                        </td>
                        <td style="text-align:center;font-size:8.5pt;">${escapeHtml(submittedDateStr)}</td>
                        <td style="font-size:8.5pt;">${item.feedback ? escapeHtml(item.feedback) : "—"}</td>
                      </tr>
                    `;
                  })
                  .join("")
          }
        </tbody>
      </table>

      <div style="margin-top:20px;border-top:1px solid #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;font-size:9pt;color:#64748b;">
        <span>المنصة التعليمية - حزب مستقبل وطن © تقرير تسليمات الواجبات</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  `;
}
