// src/shared/layouts/StudentLayout/student-layout.component.js
import { escapeHtml } from "../../utils/dom.utils.js";
import { renderAvatar } from "../../components/Avatar/avatar.component.js";
import { renderBadge } from "../../components/Badge/badge.component.js";

/**
 * Mounts the complete modern Student Application Shell Layout into a root container.
 */
export function mountStudentLayout(container, { onLogout, onTabChange }) {
  if (!container) return;

  const isSubdir = window.location.pathname.includes("/pages/");
  const logoSrc = isSubdir ? "../assets/images/logo.jpeg" : "assets/images/logo.jpeg";

  container.innerHTML = `
    <!-- Mobile Top Header Bar -->
    <header class="mobile-header">
      <div class="d-flex items-center gap-3">
        <div class="brand-mark" style="width:36px;height:36px;">
          <img src="${logoSrc}" alt="شعار مستقبل وطن" />
        </div>
        <div>
          <strong id="mobileStudentName" class="text-sm d-block font-extrabold">الطالب</strong>
          <span class="text-xs text-muted">بوابة الطالب</span>
        </div>
      </div>
      <button type="button" id="mobileMenuToggle" class="mobile-menu-btn" aria-label="فتح القائمة الجانبية">
        ☰
      </button>
    </header>

    <div id="mobileOverlay" class="mobile-overlay"></div>

    <div class="app-shell">
      <!-- Sidebar Navigation -->
      <aside id="appSidebar" class="sidebar" aria-label="القائمة الجانبية">
        <div class="brand">
          <div class="brand-mark">
            <img src="${logoSrc}" alt="شعار مستقبل وطن" />
          </div>
          <div class="brand-info">
            <h1>مستقبل وطن</h1>
            <p>منصة التعليم الرقمية</p>
          </div>
        </div>

        <!-- Student Profile Box -->
        <div class="sidebar-user-box">
          <div id="sidebarAvatarSlot">
            ${renderAvatar({ name: "ط", size: "md" })}
          </div>
          <div class="sidebar-user-info">
            <strong id="sidebarName">الطالب</strong>
            <small id="sidebarPhone">—</small>
          </div>
        </div>

        <div class="sidebar-menu-title">المحتوى الأكاديمي</div>
        <nav class="sidebar-menu" id="sidebarNav" role="navigation">
          <button type="button" class="sidebar-item active" data-section="videos">
            <span class="side-icon" aria-hidden="true">📚</span>
            <span>الداتا والدروس</span>
          </button>

          <button type="button" class="sidebar-item" data-section="exams">
            <span class="side-icon" aria-hidden="true">📝</span>
            <span>الامتحانات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="tasks">
            <span class="side-icon" aria-hidden="true">📋</span>
            <span>التاسكات والواجبات</span>
          </button>

          <button type="button" class="sidebar-item" data-section="attendance">
            <span class="side-icon" aria-hidden="true">📊</span>
            <span>الغياب والحضور</span>
          </button>

          <button type="button" class="sidebar-item" data-section="python-adventure">
            <span class="side-icon" aria-hidden="true">🐍</span>
            <span>مغامرة بايثون</span>
          </button>

          <div class="sidebar-menu-title">الحساب والتفضيلات</div>

          <button type="button" class="sidebar-item" data-section="profile">
            <span class="side-icon" aria-hidden="true">👤</span>
            <span>حسابي الشخصي</span>
          </button>

          <button type="button" class="sidebar-item" data-section="settings">
            <span class="side-icon" aria-hidden="true">⚙️</span>
            <span>الإعدادات والمظهر</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <button type="button" class="sidebar-item text-danger" id="sidebarLogoutBtn">
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
            <span>منصة مستقبل وطن</span>
            <span>/</span>
            <strong id="topbarCurrentTab">📚 الداتا والدروس</strong>
          </div>
          <div class="topbar-actions">
            <div id="studentNotificationBellSlot"></div>
            <span id="topbarStudentBadge">${renderBadge({ text: "طالب مسجل", variant: "primary", icon: "🎓" })}</span>
            <div id="topbarUserInitial" class="avatar avatar-sm">ط</div>
          </div>
        </header>

        <main class="main-view" role="main">
          <!-- Lectures Section -->
          <section id="sec-videos" class="tab-content active" aria-labelledby="heading-videos">
            <div class="page-header student-lessons-header">
              <div>
                <h2 id="heading-videos" class="page-title">الدروس والمحاضرات</h2>
                <p class="page-subtitle">استكشف المحاضرات والمواد التعليمية الخاصة بمجموعتك.</p>
              </div>
            </div>
            <div id="attendanceDashboardWidgetContainer"></div>
            <div id="videoListContainer"></div>
          </section>

          <!-- Exams Section -->
          <section id="sec-exams" class="tab-content" aria-labelledby="heading-exams">
            <div class="page-header" id="studentExamsPageHeader">
              <div>
                <h2 id="heading-exams" class="page-title">📝 الامتحانات</h2>
                <p class="page-subtitle">الامتحانات المتاحة لك</p>
              </div>
            </div>
            <div id="examListContainer"></div>
            <div id="activeExamContainer" class="d-none"></div>
          </section>

          <!-- Tasks Section -->
          <section id="sec-tasks" class="tab-content" aria-labelledby="heading-tasks">
            <div class="page-header">
              <div>
                <h2 id="heading-tasks" class="page-title">📋 التاسكات والواجبات العملية</h2>
                <p class="page-subtitle">قم برفع وتسليم حلول المهام البرمجية لمتابعة تقييم المعلم.</p>
              </div>
            </div>
            <div id="taskListContainer"></div>
          </section>

          <!-- Attendance Section -->
          <section id="sec-attendance" class="tab-content" aria-label="سجل الحضور والغياب">
            <div id="attendanceContainer"></div>
          </section>

          <!-- Python Adventure Section -->
          <section id="sec-python-adventure" class="tab-content" aria-labelledby="heading-python-adventure">
            <div id="pythonAdventureContainer"></div>
          </section>

          <!-- Profile Section -->
          <section id="sec-profile" class="tab-content" aria-labelledby="heading-profile">
            <div class="page-header">
              <div>
                <h2 id="heading-profile" class="page-title">👤 الملف التعريفي للطالب</h2>
                <p class="page-subtitle">بيانات الحساب الشخصي، المجموعة الدراسية، وإدارة كلمة المرور.</p>
              </div>
            </div>
            <div id="profileContainer"></div>
            <div id="profileAttendanceContainer" class="mt-6"></div>
          </section>

          <!-- Settings Section -->
          <section id="sec-settings" class="tab-content" aria-labelledby="heading-settings">
            <div class="page-header">
              <div>
                <h2 id="heading-settings" class="page-title">⚙️ تخصيص المنصة والمظهر</h2>
                <p class="page-subtitle">اختيار لون الواجهة المميز، تكبير أو تصغير الخط، وتغيير اللغة.</p>
              </div>
            </div>
            <div id="settingsContainer"></div>
          </section>
        </main>
      </div>
    </div>
  `;

  // Wire up sidebar switching and mobile drawer
  const sidebar = document.getElementById("appSidebar");
  const overlay = document.getElementById("mobileOverlay");
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const navItems = container.querySelectorAll(".sidebar-item[data-section]");
  const topbarBreadcrumb = document.getElementById("topbarCurrentTab");

  const tabLabels = {
    videos: "📚 الداتا والدروس",
    exams: "📝 الامتحانات",
    tasks: "📋 التاسكات والواجبات",
    attendance: "📊 الغياب والحضور",
    "python-adventure": "🐍 مغامرة بايثون",
    profile: "👤 حسابي الشخصي",
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

  document.getElementById("sidebarLogoutBtn")?.addEventListener("click", () => {
    if (typeof onLogout === "function") {
      onLogout();
    }
  });

  return {
    switchTab: setActiveTab,
    updateProfile({ name, phone }) {
      const nameEl = document.getElementById("sidebarName");
      const phoneEl = document.getElementById("sidebarPhone");
      const mobileNameEl = document.getElementById("mobileStudentName");
      const avatarSlot = document.getElementById("sidebarAvatarSlot");
      const topbarAvatar = document.getElementById("topbarUserInitial");
      const topbarBadge = document.getElementById("topbarStudentBadge");

      if (name) {
        if (nameEl) nameEl.textContent = name;
        if (mobileNameEl) mobileNameEl.textContent = name;
        if (avatarSlot) avatarSlot.innerHTML = renderAvatar({ name, size: "md" });
        if (topbarAvatar) topbarAvatar.textContent = name.trim().charAt(0);
        if (topbarBadge && name !== "طالب مسجل") {
          topbarBadge.innerHTML = renderBadge({ text: name, variant: "primary", icon: "🎓" });
        }
      }
      if (phone && phoneEl) {
        phoneEl.textContent = phone;
      }
    }
  };
}
