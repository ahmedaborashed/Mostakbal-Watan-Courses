// src/features/notifications/components/student-interactive-banner.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";

const STORAGE_COLLAPSED_KEY = "mw_student_alert_collapsed";
const STORAGE_ACTIVE_TAB_KEY = "mw_student_alert_active_topic";

/**
 * Renders the Interactive Smart Notification Banner for the Student Portal.
 * Allows interactive switching between Python Valley Challenge, Lecture Appointments, and Tasks.
 * @param {object} options
 * @param {object} [options.student]
 * @param {string} [options.activeTopic="python-challenge"]
 * @param {boolean} [options.isCollapsed=false]
 * @returns {string}
 */
export function renderStudentInteractiveBanner({
  student = {},
  activeTopic = "python-challenge",
  isCollapsed = false
} = {}) {
  const safeName = escapeHtml(student.name || student.studentName || "يا بطل");
  const rawGroup = student.group || student.studentGroup || "جميع المجموعات";
  const safeGroup = escapeHtml(rawGroup === "ALL" ? "جميع المجموعات" : rawGroup);

  if (isCollapsed) {
    return `
      <aside class="student-interactive-banner is-collapsed" aria-label="شريط الإشعارات والتنبيهات التفاعلية">
        <div class="banner-collapsed-inner">
          <div class="collapsed-lead">
            <span class="collapsed-pulse-icon" aria-hidden="true">🔔</span>
            <strong class="collapsed-title">تنبيهات تفاعلية هامة:</strong>
            <span class="collapsed-summary">تحدي وادي بايثون 🐍 | مواعيد المحاضرات 📅 | تسليم التاسكات 📋</span>
          </div>
          <button type="button" id="expandInteractiveBannerBtn" class="btn btn-primary btn-xs expand-banner-btn">
            <span>عرض التفاصيل</span>
            <span aria-hidden="true">▾</span>
          </button>
        </div>
      </aside>
    `;
  }

  // Topics Configuration
  const topics = [
    {
      id: "python-challenge",
      title: "🐍 تحدي وادي بايثون",
      badge: "🔥 تحدي برمجي تفاعلي",
      badgeClass: "badge-success",
      heading: `أهلاً ${safeName}! تحدي وادي بايثون بانتظارك 🐍`,
      body: "خض مغامرة وادي المتغيرات والمنطق البرمجي! حل التحديات الشيقة مباشرة داخل المتصفح، واجمع نقاط الخبرة XP والأوسمة لتتصدر لوحة الشرف بين زملائك.",
      stat1: { icon: "⚡", label: "المكافأة:", value: "+50 XP لكل مستوى تجتازه" },
      stat2: { icon: "🏆", label: "التحدي:", value: "وادي المتغيرات (Variables Valley)" },
      primaryAction: { label: "خوض تحدي وادي بايثون الآن 🚀", targetTab: "python-adventure" },
      secondaryAction: { label: "عرض قائمة المتصدرين 🏅", targetTab: "python-adventure" }
    },
    {
      id: "lecture-reminder",
      title: "📅 مواعيد المحاضرات",
      badge: "📚 الجلسات الأسبوعية",
      badgeClass: "badge-gold",
      heading: "مواعيد المحاضرات والدروس المرفوعة 📖",
      body: `تابع شروحات دروس بايثون المسجلة الخاصة بمجموعتك (${safeGroup})، وحمل ملفات الأكواد والمصادر التعليمية لتكون دائماً في الصدارة.`,
      stat1: { icon: "👥", label: "المجموعة الدراسية:", value: safeGroup },
      stat2: { icon: "🎥", label: "المحتوى المتاح:", value: "شروحات فيديو + ملفات PDF" },
      primaryAction: { label: "استعراض الدروس والمحاضرات 📚", targetTab: "videos" },
      secondaryAction: { label: "سجل الحضور والغياب 📊", targetTab: "attendance" }
    },
    {
      id: "task-reminder",
      title: "📋 التاسكات والواجبات",
      badge: "✍️ مهام التطبيق العملي",
      badgeClass: "badge-primary",
      heading: "تاسكات بايثون العملية بانتظار تسليمك 💻",
      body: "التطبيق العملي هو مفتاح احتراف البرمجة. اكتب كود الحل وارفعه مباشرة لتلقي تقييم المعلم من 10 درجات مع ملاحظات فورية على كودك.",
      stat1: { icon: "⭐", label: "التقييم الأكاديمي:", value: "درجات محسوبة من 10" },
      stat2: { icon: "💡", label: "الملاحظات:", value: "تصحيح مباشر وتوجيهات للمعلم" },
      primaryAction: { label: "تسليم التاسك ومتابعة الدرجات 📋", targetTab: "tasks" },
      secondaryAction: { label: "مراجعة المهام السابقة 📝", targetTab: "tasks" }
    }
  ];

  const currentTopic = topics.find((t) => t.id === activeTopic) || topics[0];

  return `
    <aside class="student-interactive-banner" aria-label="لوحة التنبيهات والتحديات التفاعلية">
      <!-- Top Controls: Tabs + Dismiss Button -->
      <div class="banner-top-bar">
        <div class="banner-topic-tabs" role="tablist" aria-label="أقسام الإشعار التفاعلي">
          ${topics
            .map(
              (t) => `
            <button
              type="button"
              role="tab"
              class="banner-tab-pill ${t.id === currentTopic.id ? 'is-active' : ''}"
              data-banner-topic="${t.id}"
              aria-selected="${t.id === currentTopic.id}"
            >
              <span>${t.title}</span>
              ${t.id === 'python-challenge' ? '<span class="pulse-indicator" aria-hidden="true"></span>' : ''}
            </button>
          `
            )
            .join("")}
        </div>

        <button
          type="button"
          id="collapseInteractiveBannerBtn"
          class="banner-dismiss-btn"
          aria-label="طي الإشعار التفاعلي"
          title="طي الإشعار"
        >
          <span>إخفاء مؤقت</span>
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      <!-- Main Banner Body -->
      <div class="banner-body-card">
        <div class="banner-content-lead">
          <div class="banner-badge-strip">
            <span class="badge ${currentTopic.badgeClass} banner-theme-badge">${currentTopic.badge}</span>
            <span class="banner-interactive-hint">⚡ إشعار تفاعلي مباشر</span>
          </div>

          <h3 class="banner-headline">
            ${currentTopic.heading}
          </h3>

          <p class="banner-description">
            ${currentTopic.body}
          </p>

          <!-- Highlights / Stats Strip -->
          <div class="banner-stats-strip">
            <div class="banner-stat-chip">
              <span class="stat-icon" aria-hidden="true">${currentTopic.stat1.icon}</span>
              <span class="stat-label">${currentTopic.stat1.label}</span>
              <strong class="stat-value">${currentTopic.stat1.value}</strong>
            </div>

            <div class="banner-stat-chip">
              <span class="stat-icon" aria-hidden="true">${currentTopic.stat2.icon}</span>
              <span class="stat-label">${currentTopic.stat2.label}</span>
              <strong class="stat-value">${currentTopic.stat2.value}</strong>
            </div>
          </div>
        </div>

        <!-- Interactive Action Buttons -->
        <div class="banner-action-buttons">
          <button
            type="button"
            class="btn btn-primary banner-primary-action-btn"
            data-interactive-navigate="${currentTopic.primaryAction.targetTab}"
          >
            <span>${currentTopic.primaryAction.label}</span>
          </button>

          ${
            currentTopic.secondaryAction
              ? `
            <button
              type="button"
              class="btn btn-secondary banner-secondary-action-btn"
              data-interactive-navigate="${currentTopic.secondaryAction.targetTab}"
            >
              <span>${currentTopic.secondaryAction.label}</span>
            </button>
          `
              : ""
          }
        </div>
      </div>
    </aside>
  `;
}

/**
 * Mounts and wires up the interactive notification banner in the target container.
 * @param {string|HTMLElement} containerId
 * @param {object} options
 * @param {object} options.student
 * @param {function} options.onNavigate
 */
export function mountStudentInteractiveBanner(containerId, { student = {}, onNavigate = null } = {}) {
  const container = typeof containerId === "string" ? document.getElementById(containerId) : containerId;
  if (!container) return;

  let activeTopic = sessionStorage.getItem(STORAGE_ACTIVE_TAB_KEY) || "python-challenge";
  let isCollapsed = sessionStorage.getItem(STORAGE_COLLAPSED_KEY) === "true";

  function render() {
    container.innerHTML = renderStudentInteractiveBanner({
      student,
      activeTopic,
      isCollapsed
    });

    // Wire events
    if (isCollapsed) {
      container.querySelector("#expandInteractiveBannerBtn")?.addEventListener("click", () => {
        isCollapsed = false;
        sessionStorage.setItem(STORAGE_COLLAPSED_KEY, "false");
        render();
      });
      return;
    }

    // Collapse button
    container.querySelector("#collapseInteractiveBannerBtn")?.addEventListener("click", () => {
      isCollapsed = true;
      sessionStorage.setItem(STORAGE_COLLAPSED_KEY, "true");
      render();
    });

    // Topic Tab buttons
    container.querySelectorAll("[data-banner-topic]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextTopic = btn.getAttribute("data-banner-topic");
        if (nextTopic && nextTopic !== activeTopic) {
          activeTopic = nextTopic;
          sessionStorage.setItem(STORAGE_ACTIVE_TAB_KEY, activeTopic);
          render();
        }
      });
    });

    // Interactive Navigation Actions
    container.querySelectorAll("[data-interactive-navigate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-interactive-navigate");
        if (typeof onNavigate === "function") {
          onNavigate(targetTab);
        } else {
          // Fallback direct click
          const tabEl = document.querySelector(`[data-section="${targetTab}"]`);
          if (tabEl) tabEl.click();
        }
      });
    });
  }

  render();

  return {
    updateStudent(newStudent) {
      student = { ...student, ...newStudent };
      render();
    },
    switchTopic(topicId) {
      activeTopic = topicId;
      isCollapsed = false;
      render();
    }
  };
}
