// scripts/test-student-lessons-redesign.js
import assert from "node:assert";
import { renderStudentLessonCard } from "../src/features/lectures/components/lesson-card.component.js";
import { renderLessonDetailsContent } from "../src/features/lectures/components/lesson-details-modal.component.js";
import { renderStudentLessonSkeletonGrid } from "../src/features/lectures/components/lesson-skeleton.component.js";
import { renderStudentLessonFilters } from "../src/features/lectures/components/lesson-filters.component.js";

console.log("🧪 Starting Student Lessons Redesign Unit Tests...\n");

// ========================================================
// 1. Test renderStudentLessonCard
// ========================================================
{
  console.log("  1. Testing renderStudentLessonCard...");

  // Scenario A: Standard lesson with YouTube video, file, description, resources (unwatched)
  const lessonA = {
    id: "lec-101",
    title: "مقدمة في بايثون - Session 1",
    description: "شرح المتغيرات والأنواع الأساسية والتعامل مع جمل الطباعة والدوال.",
    sessionDate: "10 سبتمبر 2026",
    group: "A",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    fileUrl: "https://drive.google.com/file/d/abc123xyz/view",
    fileName: "Session1_Notes.pdf",
    resources: [{ title: "Cheat Sheet", url: "https://python.org" }]
  };

  const htmlA = renderStudentLessonCard({ lesson: lessonA, isWatched: false });

  // Assert Title & Hierarchy
  assert.ok(htmlA.includes("مقدمة في بايثون - Session 1"), "Must display lesson title");
  assert.ok(htmlA.includes("student-lesson-title"), "Must use student-lesson-title class");

  // Assert Description
  assert.ok(htmlA.includes("شرح المتغيرات والأنواع الأساسية"), "Must display teacher description");
  assert.ok(!htmlA.includes("is-fallback"), "Must NOT have is-fallback class when description is provided");

  // Assert Media
  assert.ok(htmlA.includes("img.youtube.com/vi/dQw4w9WgXcQ"), "Must use YouTube thumbnail when ytId exists");
  assert.ok(htmlA.includes("student-lesson-play-pill"), "Must include play pill overlay");

  // Assert Availability Chips
  assert.ok(htmlA.includes("فيديو"), "Must have video availability chip");
  assert.ok(htmlA.includes("ملف متاح"), "Must have file availability chip");
  assert.ok(htmlA.includes("1 مصادر"), "Must have resource count chip");

  // Assert Metadata
  assert.ok(htmlA.includes("10 سبتمبر 2026"), "Must display session date");
  assert.ok(htmlA.includes("المجموعة A"), "Must display group name cleanly");

  // Assert Status
  assert.ok(htmlA.includes("لم تتم المشاهدة"), "Must show unwatched status");
  assert.ok(!htmlA.includes("تمت المشاهدة"), "Must NOT show watched status for unwatched lesson");

  // Assert Primary Action
  assert.ok(htmlA.includes("فتح المحاضرة"), "Must have dominant 'فتح المحاضرة' button");
  assert.ok(htmlA.includes('data-open-student-lesson="lec-101"'), "Must include data attribute for opening lesson");

  console.log("    ✓ Scenario A passed: Full lesson card renders correctly");

  // Scenario B: Watched status toggle
  const htmlB = renderStudentLessonCard({ lesson: lessonA, isWatched: true });
  assert.ok(htmlB.includes("تمت المشاهدة"), "Must show watched status when isWatched is true");
  assert.ok(htmlB.includes("is-watched"), "Must have is-watched class");

  console.log("    ✓ Scenario B passed: Watched badge toggles accurately");

  // Scenario C: Non-YouTube video (e.g. Google Drive video or direct link)
  const lessonC = {
    id: "lec-102",
    title: "محاضرة مسجلة على درايف",
    videoUrl: "https://drive.google.com/file/d/xyz987/view",
    group: "ALL"
  };
  const htmlC = renderStudentLessonCard({ lesson: lessonC, isWatched: false });
  assert.ok(htmlC.includes("student-lesson-media-strip"), "Must show compact media strip when video is not YouTube");
  assert.ok(!htmlC.includes("student-lesson-thumb"), "Must NOT render image thumbnail for non-YouTube video");

  console.log("    ✓ Scenario C passed: Non-YouTube video uses compact media strip");

  // Scenario D: Lesson with NO video
  const lessonD = {
    id: "lec-103",
    title: "جلسة مراجعة عملية",
    group: "B"
  };
  const htmlD = renderStudentLessonCard({ lesson: lessonD, isWatched: false });
  assert.ok(htmlD.includes("student-lesson-no-video"), "Must show compact no-video notice");
  assert.ok(htmlD.includes("لا يوجد فيديو لهذه المحاضرة"), "Must state no video politely without wasting space");
  assert.ok(!htmlD.includes("student-lesson-thumb"), "Must NOT show fake video placeholder");

  console.log("    ✓ Scenario D passed: Lesson without video stays compact");

  // Scenario E: Missing description fallback
  const htmlE = renderStudentLessonCard({ lesson: lessonD, isWatched: false });
  assert.ok(htmlE.includes("لا يوجد وصف مضاف لهذه المحاضرة."), "Must show subtle description fallback");
  assert.ok(htmlE.includes("is-fallback"), "Must mark fallback description with is-fallback class");

  console.log("    ✓ Scenario E passed: Missing description uses subtle fallback");

  // Scenario F: Missing file
  assert.ok(!htmlD.includes("has-file"), "Must NOT include file chip when no file is present");
  assert.ok(!htmlD.includes("lesson-file-status"), "Must NOT include file status when no file is present");

  console.log("    ✓ Scenario F passed: Card without file focuses only on available content");
}

// ========================================================
// 2. Test renderLessonDetailsContent
// ========================================================
{
  console.log("\n  2. Testing renderLessonDetailsContent...");

  const lessonDetails = {
    id: "lec-201",
    title: "هياكل البيانات - Data Structures",
    description: "في هذه المحاضرة نقوم بدراسة القوائم المترابطة Linked Lists وتطبيقاتها في الذاكرة مع أمثلة برمجية مفصلة.",
    sessionDate: "15 سبتمبر 2026",
    group: "Python-1",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    fileUrl: "https://drive.google.com/file/d/datastructs/view",
    fileName: "LinkedLists_Summary.pdf",
    resources: [
      { title: "Visualgo Linked List Visualizer", url: "https://visualgo.net", type: "link" }
    ]
  };

  const html = renderLessonDetailsContent(lessonDetails, { isStudent: true, isWatched: true });

  // Back button
  assert.ok(html.includes("العودة إلى الدروس"), "Must include back button in modal header");
  assert.ok(html.includes('data-modal-close="lessonDetailsModal"'), "Back button must close modal");

  // Title and Full Description
  assert.ok(html.includes("هياكل البيانات - Data Structures"), "Must display lesson title");
  assert.ok(html.includes("في هذه المحاضرة نقوم بدراسة القوائم المترابطة Linked Lists"), "Must render full teacher description");

  // Video Actions
  assert.ok(html.includes("مشاهدة الفيديو في المشغل"), "Must have play in player action");
  assert.ok(html.includes("data-details-play-video"), "Must wire data-details-play-video");
  assert.ok(html.includes('target="_blank"'), "External link must open safely in new tab");
  assert.ok(html.includes('rel="noopener noreferrer"'), "External link must have rel='noopener noreferrer'");

  // File Card
  assert.ok(html.includes("LinkedLists_Summary.pdf"), "Must display file name");
  assert.ok(html.includes("فتح الملف"), "Must have open file button");
  assert.ok(html.includes("https://drive.google.com/file/d/datastructs/view"), "Must link to external Google Drive file");

  // Resources
  assert.ok(html.includes("مصادر إضافية"), "Must show resources section when resources exist");
  assert.ok(html.includes("Visualgo Linked List Visualizer"), "Must list resource item");

  // Conditional Resources Test: Lesson with NO resources
  const lessonNoRes = {
    id: "lec-202",
    title: "محاضرة تجريبية مستقلة",
    description: "وصف المحاضرة",
    resources: []
  };
  const htmlNoRes = renderLessonDetailsContent(lessonNoRes, { isStudent: true, isWatched: false });
  assert.ok(!htmlNoRes.includes("مصادر إضافية"), "Must OMIT additional resources section when empty");

  console.log("    ✓ Lesson Details renders complete session view with safe links & conditional resources");
}

// ========================================================
// 3. Test renderStudentLessonSkeletonGrid
// ========================================================
{
  console.log("\n  3. Testing renderStudentLessonSkeletonGrid...");

  const skeletonHtml = renderStudentLessonSkeletonGrid(4);
  assert.ok(skeletonHtml.includes("student-lessons-grid"), "Must use student-lessons-grid wrapper");
  assert.ok(skeletonHtml.includes("student-lesson-skeleton"), "Must generate student-lesson-skeleton cards");
  const count = (skeletonHtml.match(/student-lesson-skeleton/g) || []).length;
  assert.strictEqual(count, 4, "Must render exactly requested number of skeleton cards");

  console.log("    ✓ Skeleton loader matches student lesson library card structure");
}

// ========================================================
// 4. Test renderStudentLessonFilters
// ========================================================
{
  console.log("\n  4. Testing renderStudentLessonFilters...");

  const filtersHtml = renderStudentLessonFilters({
    searchQuery: "بايثون",
    statusFilter: "WATCHED",
    sortOrder: "newest"
  });

  assert.ok(filtersHtml.includes('id="studentLessonSearchInput"'), "Must include student search input");
  assert.ok(filtersHtml.includes('value="بايثون"'), "Must bind search query value");
  assert.ok(filtersHtml.includes('id="studentLessonStatusFilter"'), "Must include status filter select");
  assert.ok(filtersHtml.includes('id="studentLessonSortOrder"'), "Must include sort order select");
  assert.ok(filtersHtml.includes('selected>تمت المشاهدة<'), "Must reflect current status filter selection");
  assert.ok(filtersHtml.includes('selected>الأحدث أولاً<'), "Must reflect current sort order selection");

  console.log("    ✓ Student filters toolbar renders compact and accessible controls");
}

console.log("\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!\n");
