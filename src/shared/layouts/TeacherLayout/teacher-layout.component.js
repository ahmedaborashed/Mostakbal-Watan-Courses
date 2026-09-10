// src/shared/layouts/TeacherLayout/teacher-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";
import { renderAvatar } from "../../components/Avatar/avatar.component.js";
import { renderBadge } from "../../components/Badge/badge.component.js";

/**
 * Mounts the complete Teacher Application Shell Layout into a root container.
 */
export function mountTeacherLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  const isSubdir = window.location.pathname.includes("/pages/");
  const logoSrc = isSubdir ? "../assets/images/logo.jpeg" : "assets/images/logo.jpeg";

  container.innerHTML = `
    <!-- Mobile Header -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-3">
        <div class="brand-mark" style="width:36px;height:36px;">
          <img src="${logoSrc}" alt="شعار مستقبل وطن" />
        </div>
        <div>
          <strong id="mobileTeacherName" class="text-sm d-block font-extrabold">المعلم</strong>
          <span class="text-xs text-muted">لوحة إدارة الكورس</span>
        </div>
      </div>
      <button type="button" id="mobileTeacherMenuToggle" class="mobile-menu-btn" aria-label="فتح القائمة">
        ☰
      </button>
    </header>

    <div id="mobileTeacherOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar -->
      <aside id="teacherSidebar" class="sidebar" aria-label="القائمة الجانبية للمعلم">
        <div class="brand">
          <div class="brand-mark">
            <img src="${logoSrc}" alt="شعار مستقبل وطن" />
          </div>
          <div class="brand-info">
            <h1>مستقبل وطن</h1>
            <p>لوحة التحكم التعليمية</p>
          </div>
        </div>

        <div class="sidebar-user-box">
          <div id="teacherAvatarSlot">
            ${renderAvatar({ name: "م", size: "md", className: "bg-gold text-inverse" })}
          </div>
          <div class="sidebar-user-info">
            <strong id="teacherSidebarName">المعلم الأكاديمي</strong>
            <small id="teacherSidebarEmail">إدارة الكورس والطلاب</small>
          </div>
        </div>

        <div class="sidebar-menu-title">الإدارة الأكاديمية</div>
        <nav class="sidebar-menu" id="teacherSidebarNav" role="navigation">
          <button type="button" class="sidebar-item active" data-section="data">
            <span class="side-icon" aria-hidden="true">📚</span>
            <span>الداتا والدروس</span>
          </button>

          <button type="button" class="sidebar-item" data-section="exams">
            <span class="side-icon" aria-hidden="true">📝</span>
            <span>الامتحانات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="assignments">
            <span class="side-icon" aria-hidden="true">📋</span>
            <span>التاسكات والواجبات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="students">
            <span class="side-icon" aria-hidden="true">👥</span>
            <span>شؤون الطلاب</span>
          </button>

          <button type="button" class="sidebar-item" data-section="attendance">
            <span class="side-icon" aria-hidden="true">📊</span>
            <span>تسجيل الغياب والحضور</span>
          </button>

          <div class="sidebar-menu-title">تخصيص النظام</div>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon" aria-hidden="true">⚙️</span>
            <span>الإعدادات والمظهر</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="teacherLogoutBtn">
            <span class="side-icon" aria-hidden="true">🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <!-- Main Content Area -->
      <div class="main-wrapper">
        <!-- Desktop Topbar -->
        <header class="topbar">
          <div class="topbar-breadcrumb">
            <span>لوحة المعلم</span>
            <span>/</span>
            <strong id="teacherTopbarCurrentTab">📚 الداتا والدروس</strong>
          </div>
          <div class="topbar-actions">
            ${renderBadge({ text: "معلم معتمد", variant: "gold", icon: "👨‍🏫" })}
            <div id="teacherTopbarUserInitial" class="avatar avatar-sm">م</div>
          </div>
        </header>

        <main class="main-view" role="main">
          <section id="sec-data" class="tab-content active" aria-labelledby="heading-t-data">
            <div class="page-header">
              <div>
                <h2 id="heading-t-data" class="page-title">📚 إدارة المحاضرات والداتا</h2>
                <p class="page-subtitle">نشر وإدارة شروحات وفيديوهات دروس Python حسب المجموعات الدراسية.</p>
              </div>
            </div>
            <div id="teacherDataContainer"></div>
          </section>

          <section id="sec-exams" class="tab-content" aria-labelledby="heading-t-exams">
            <div class="page-header">
              <div>
                <h2 id="heading-t-exams" class="page-title">📝 إدارة الاختبارات والنتائج</h2>
                <p class="page-subtitle">تفعيل وتعطيل الامتحانات ومتابعة نتائج الطلاب وتقييماتهم.</p>
              </div>
            </div>
            <div id="teacherExamsContainer"></div>
          </section>

          <section id="sec-assignments" class="tab-content" aria-labelledby="heading-t-assignments">
            <div class="page-header">
              <div>
                <h2 id="heading-t-assignments" class="page-title">📋 إدارة التاسكات والواجبات</h2>
                <p class="page-subtitle">استعراض ملفات الحلول المرفوعة من الطلاب وتقييمها وإضافة الملاحظات.</p>
              </div>
            </div>
            <div id="teacherAssignmentsContainer"></div>
          </section>

          <section id="sec-students" class="tab-content" aria-labelledby="heading-t-students">
            <div class="page-header">
              <div>
                <h2 id="heading-t-students" class="page-title">👥 دليل وقائمة الطلاب</h2>
                <p class="page-subtitle">البحث في سجلات الطلاب المسجلين، إدارة كلمات المرور وتوليد الحسابات.</p>
              </div>
            </div>
            <div id="teacherStudentsContainer"></div>
          </section>

          <section id="sec-attendance" class="tab-content" aria-labelledby="heading-t-attendance">
            <div class="page-header">
              <div>
                <h2 id="heading-t-attendance" class="page-title">📊 إدارة الغياب والحضور</h2>
                <p class="page-subtitle">إنشاء جلسة سيشن جديدة وتسجيل حضور الطلاب بشكل جماعي ومنظم.</p>
              </div>
            </div>
            <div id="teacherAttendanceContainer"></div>
          </section>

          <section id="sec-settings" class="tab-content" aria-labelledby="heading-t-settings">
            <div class="page-header">
              <div>
                <h2 id="heading-t-settings" class="page-title">⚙️ إعدادات النظام والمظهر</h2>
                <p class="page-subtitle">تخصيص نمط العرض، الخطوط والألوان في المنصة.</p>
              </div>
            </div>
            <div id="teacherSettingsContainer"></div>
          </section>
        </main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById("teacherSidebar");
  const overlay = document.getElementById("mobileTeacherOverlay");
  const toggleBtn = document.getElementById("mobileTeacherMenuToggle");
  const navItems = container.querySelectorAll(".sidebar-item[data-section]");
  const topbarBreadcrumb = document.getElementById("teacherTopbarCurrentTab");

  const tabLabels = {
    data: "📚 الداتا والدروس",
    exams: "📝 الامتحانات",
    assignments: "📋 التاسكات والواجبات",
    students: "👥 شؤون الطلاب",
    attendance: "📊 الغياب والحضور",
    settings: "⚙️ الإعدادات والمظهر"
  };

  function closeMobile() {
    sidebar?.classList.remove("mobile-open");
    overlay?.classList.remove("active");
  }

  toggleBtn?.addEventListener("click", () => {
    sidebar?.classList.toggle("mobile-open");
    overlay?.classList.toggle("active");
  });

  overlay?.addEventListener("click", closeMobile);

  function setActiveTab(sectionId) {
    navItems.forEach((btn) => {
      const match = btn.getAttribute("data-section") === sectionId;
      btn.classList.toggle("active", match);
    });

    const allSections = container.querySelectorAll(".tab-content");
    allSections.forEach((sec) => sec.classList.remove("active"));

    const target = document.getElementById(`sec-${sectionId}`);
    if (target) {
      target.classList.add("active");
    }

    if (topbarBreadcrumb && tabLabels[sectionId]) {
      topbarBreadcrumb.textContent = tabLabels[sectionId];
    }

    closeMobile();
    if (typeof onTabChange === "function") {
      onTabChange(sectionId);
    }
  }

  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      setActiveTab(section);
    });
  });

  document.getElementById("teacherLogoutBtn")?.addEventListener("click", () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
  });

  return {
    switchTab: setActiveTab,
    updateProfile({ name, email }) {
      const nameEl = document.getElementById("teacherSidebarName");
      const emailEl = document.getElementById("teacherSidebarEmail");
      const avatarSlot = document.getElementById("teacherAvatarSlot");
      const topbarAvatar = document.getElementById("teacherTopbarUserInitial");

      if (name) {
        if (nameEl) nameEl.textContent = name;
        if (avatarSlot) avatarSlot.innerHTML = renderAvatar({ name, size: "md" });
        if (topbarAvatar) topbarAvatar.textContent = name.trim().charAt(0);
      }
      if (email && emailEl) {
        emailEl.textContent = email;
      }
    }
  };
}
