// src/features/exams/components/exam-report.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { formatDate } from "../../../shared/utils/date.utils.js";

/**
 * Triggers clean A4 printing of the given report HTML.
 * Injects into #printableReportArea, applies .printing-report to body, and opens print dialog.
 * @param {string} reportHtml
 */
export function triggerPrintReport(reportHtml) {
  let printContainer = document.getElementById("printableReportArea");
  if (!printContainer) {
    printContainer = document.createElement("div");
    printContainer.id = "printableReportArea";
    document.body.appendChild(printContainer);
  }

  printContainer.innerHTML = reportHtml;
  document.body.classList.add("printing-report");

  const cleanup = () => {
    document.body.classList.remove("printing-report");
    if (printContainer) {
      printContainer.innerHTML = "";
    }
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);

  // Allow browser time to render styles before printing
  setTimeout(() => {
    window.print();
    // Fallback cleanup if afterprint doesn't fire
    setTimeout(cleanup, 2000);
  }, 150);
}

/**
 * Generates print-ready HTML for a single exam report.
 * @param {object} options
 * @param {object} options.exam
 * @param {Array} options.results
 * @returns {string}
 */
export function renderSingleExamPrintableReport({ exam, results = [] }) {
  const safeExamTitle = escapeHtml(exam?.title || "امتحان بدون عنوان");
  const safeGroup = escapeHtml(exam?.group || "جميع المجموعات");
  const duration = Number(exam?.duration) || 30;
  const questions = Array.isArray(exam?.questions) ? exam.questions : [];
  const totalScore = questions.reduce((sum, q) => sum + (Number(q.degree) || 1), 0) || Number(exam?.totalScore) || 100;
  const passDegree = Number(exam?.passDegree) || totalScore * 0.5;

  const totalAttempts = results.length;
  let avgScoreDisplay = "—";
  let highestScore = 0;
  let passCount = 0;

  if (totalAttempts > 0) {
    const scores = results.map((r) => Number(r.score || r.total || 0));
    const sum = scores.reduce((a, b) => a + b, 0);
    avgScoreDisplay = (sum / totalAttempts).toFixed(1);
    highestScore = Math.max(...scores);
    passCount = scores.filter((s) => s >= passDegree).length;
  }

  const passRate = totalAttempts > 0 ? Math.round((passCount / totalAttempts) * 100) : 0;
  const nowFormatted = formatDate(new Date());

  return `
    <div class="print-report-container" style="direction:rtl;text-align:right;font-family:'Cairo',sans-serif;padding:10px;">
      <!-- Header with branding -->
      <div class="print-report-header">
        <div>
          <h1 class="print-report-title">تقرير نتائج الاختبار الأكاديمي</h1>
          <div class="print-report-meta">
            <strong>الامتحان:</strong> ${safeExamTitle} | <strong>المجموعة:</strong> ${safeGroup}
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
          <span class="print-summary-label">إجمالي الطلاب المختبرين</span>
          <span class="print-summary-val">${totalAttempts}</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">متوسط درجات الطلاب</span>
          <span class="print-summary-val">${avgScoreDisplay} / ${totalScore}</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">نسبة النجاح العامة</span>
          <span class="print-summary-val">${passRate}%</span>
        </div>
        <div class="print-summary-box">
          <span class="print-summary-label">أعلى درجة مسجلة</span>
          <span class="print-summary-val">${highestScore} / ${totalScore}</span>
        </div>
      </div>

      <!-- Results Table -->
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>اسم الطالب</th>
            <th>رقم الهاتف</th>
            <th>المجموعة</th>
            <th style="text-align:center;">الدرجة</th>
            <th style="text-align:center;">النسبة</th>
            <th style="text-align:center;">الحالة</th>
            <th style="text-align:center;">وقت التسليم</th>
          </tr>
        </thead>
        <tbody>
          ${
            results.length === 0
              ? `<tr><td colspan="8" style="text-align:center;padding:20px;">لا توجد أي نتائج مسجلة لهذا الامتحان حتى الآن.</td></tr>`
              : results
                  .map((r, idx) => {
                    const score = Number(r.score || r.total || 0);
                    const percent = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
                    const isPassed = score >= passDegree;
                    const isPendingEssay = r.status === "pending_essay";
                    const statusText = isPendingEssay ? "قيد تصحيح المقالي" : isPassed ? "ناجح" : "راسب";

                    return `
                      <tr>
                        <td style="text-align:center;">${idx + 1}</td>
                        <td><strong>${escapeHtml(r.studentName || "طالب")}</strong></td>
                        <td style="direction:ltr;text-align:right;">${escapeHtml(r.studentPhone || r.studentUid || "—")}</td>
                        <td>${escapeHtml(r.group || safeGroup)}</td>
                        <td style="text-align:center;font-weight:bold;">${score} / ${totalScore}</td>
                        <td style="text-align:center;">${percent}%</td>
                        <td style="text-align:center;font-weight:bold;">${statusText}</td>
                        <td style="text-align:center;font-size:8.5pt;">${r.submittedAt ? formatDate(r.submittedAt) : "—"}</td>
                      </tr>
                    `;
                  })
                  .join("")
          }
        </tbody>
      </table>

      <div style="margin-top:20px;border-top:1px solid #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;font-size:9pt;color:#64748b;">
        <span>المنصة التعليمية - حزب مستقبل وطن © جميع الحقوق محفوظة</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  `;
}

/**
 * Generates print-ready HTML for the Cross-Exams Summary Matrix Report.
 * @param {object} options
 * @param {Array} options.exams
 * @param {Array} options.matrix
 * @returns {string}
 */
export function renderAllExamsSummaryPrintableReport({ exams = [], matrix = [] }) {
  const nowFormatted = formatDate(new Date());

  return `
    <div class="print-report-container" style="direction:rtl;text-align:right;font-family:'Cairo',sans-serif;padding:10px;">
      <!-- Header -->
      <div class="print-report-header">
        <div>
          <h1 class="print-report-title">تقرير الأداء العام لجميع الامتحانات</h1>
          <div class="print-report-meta">
            مصفوفة الدرجات التراكمية لجميع الطلاب عبر كافة الامتحانات المعتمدة
          </div>
        </div>
        <div style="text-align:left;">
          <div class="print-report-meta">حزب مستقبل وطن - المنصة التعليمية</div>
          <div class="print-report-meta">تاريخ الاستخراج: ${nowFormatted}</div>
        </div>
      </div>

      <!-- Matrix Table -->
      <table class="print-table">
        <thead>
          <tr>
            <th style="width:35px;">#</th>
            <th>اسم الطالب</th>
            <th>المجموعة</th>
            ${exams.map((e) => `<th style="text-align:center;font-size:8.5pt;">${escapeHtml(e.title || "امتحان")}</th>`).join("")}
            <th style="text-align:center;background:#e2e8f0;">متوسط النسبة</th>
            <th style="text-align:center;background:#e2e8f0;">الامتحانات المكتملة</th>
          </tr>
        </thead>
        <tbody>
          ${
            matrix.length === 0
              ? `<tr><td colspan="${exams.length + 5}" style="text-align:center;padding:20px;">لا توجد بيانات متاحة.</td></tr>`
              : matrix
                  .map((row, idx) => {
                    return `
                      <tr>
                        <td style="text-align:center;">${idx + 1}</td>
                        <td><strong>${escapeHtml(row.studentName || "طالب")}</strong></td>
                        <td>${escapeHtml(row.group || "—")}</td>
                        ${exams
                          .map((e) => {
                            const res = row.examsMap?.[e.id];
                            if (!res) return `<td style="text-align:center;color:#94a3b8;">—</td>`;
                            return `<td style="text-align:center;font-weight:bold;">${res.score}</td>`;
                          })
                          .join("")}
                        <td style="text-align:center;font-weight:extrabold;background:#f8fafc;">${row.averagePercentage}%</td>
                        <td style="text-align:center;font-weight:bold;background:#f8fafc;">${row.completedExamsCount} / ${exams.length}</td>
                      </tr>
                    `;
                  })
                  .join("")
          }
        </tbody>
      </table>

      <div style="margin-top:20px;border-top:1px solid #cbd5e1;padding-top:10px;display:flex;justify-content:space-between;font-size:9pt;color:#64748b;">
        <span>المنصة التعليمية - حزب مستقبل وطن © جميع الحقوق محفوظة</span>
        <span>تقرير الامتحانات التراكمي الشامل</span>
      </div>
    </div>
  `;
}
