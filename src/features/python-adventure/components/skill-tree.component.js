// src/features/python-adventure/components/skill-tree.component.js
import { escapeHtml } from "../../../shared/utils/dom.utils.js";
import { CHALLENGES_CLIENT_DATA } from "../python-adventure-data.js";

/**
 * Renders the Visual Skill Tree and Topic Mastery screen.
 */
export function renderSkillTree({ progress }) {
  const completed = progress?.completedChallenges || {};

  // Compute actual percentage for each skill topic
  const topics = [
    {
      id: "basics",
      title: "الطباعة والعمليات الأساسية",
      icon: "🏠",
      challenges: ["world-1-level-1", "world-1-level-2", "world-1-level-3", "world-1-level-4"]
    },
    {
      id: "variables",
      title: "المتغيرات والأنواع (Variables & Types)",
      icon: "🔢",
      challenges: ["world-2-level-1", "world-2-level-2", "world-2-level-3", "world-2-level-4"]
    },
    {
      id: "conditions",
      title: "الجمل الشرطية والمنطق (Conditions)",
      icon: "🔀",
      challenges: ["world-3-level-1", "world-3-level-2", "world-3-level-3", "world-3-level-4"]
    },
    {
      id: "loops",
      title: "حلقات التكرار (Loops for & while)",
      icon: "🔁",
      challenges: ["world-4-level-1", "world-4-level-2", "world-4-level-3", "world-4-level-4"]
    },
    {
      id: "lists",
      title: "القوائم وهياكل البيانات (Lists)",
      icon: "📦",
      challenges: ["world-5-level-1", "world-5-level-2", "world-5-level-3", "world-5-level-4"]
    },
    {
      id: "functions",
      title: "الدوال وإعادة الاستخدام (Functions def)",
      icon: "⚙️",
      challenges: ["world-6-level-1", "world-6-level-2", "world-6-level-3", "world-6-level-4"]
    },
    {
      id: "oop",
      title: "البرمجة كائنية التوجه (OOP Classes)",
      icon: "🧱",
      challenges: ["world-7-level-1", "world-7-level-2", "world-7-level-3", "world-7-level-4"]
    },
    {
      id: "final_project",
      title: "المشاريع المتكاملة (Capstone Projects)",
      icon: "🏆",
      challenges: ["world-8-level-1", "world-8-level-2", "world-8-level-3"]
    }
  ];

  return `
    <div class="adventure-skill-tree-wrapper">
      <div class="adventure-view-header">
        <div>
          <button type="button" class="btn btn-sm btn-secondary" id="skillTreeBackBtn">
            <span>➔ العودة للرئيسية</span>
          </button>
          <h2 class="view-title">🌳 شجرة المهارات ونسب التمكن</h2>
          <p class="view-subtitle">تقييم مبني بدقة على أدائك الفعلي في حل المهمات البرمجية واجتياز التحديات.</p>
        </div>
      </div>

      <div class="skill-tree-cards-grid">
        ${topics.map((t, idx) => {
          const doneCount = t.challenges.filter((cId) => completed[cId]).length;
          const totalCount = t.challenges.length;
          const percent = Math.round((doneCount / totalCount) * 100);
          const isMastered = percent === 100;
          const isStarted = percent > 0;

          return `
            <div class="skill-topic-card ${isMastered ? "mastered" : isStarted ? "in-progress" : "locked"}">
              <div class="topic-header">
                <span class="topic-icon">${t.icon}</span>
                <div class="topic-title-box">
                  <h4>${escapeHtml(t.title)}</h4>
                  <span class="text-xs text-muted">${doneCount} من ${totalCount} مهمات مكتملة</span>
                </div>
                <div class="topic-percent-badge">${percent}%</div>
              </div>

              <div class="topic-progress-track">
                <div class="topic-progress-bar" style="width: ${percent}%;"></div>
              </div>

              <div class="topic-challenges-dots">
                ${t.challenges.map((cId, cIdx) => {
                  const isDone = !!completed[cId];
                  return `<span class="c-dot ${isDone ? "done" : ""}" title="مهمة ${cIdx + 1}: ${isDone ? "مكتملة" : "غير مكتملة"}"></span>`;
                }).join("")}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}
