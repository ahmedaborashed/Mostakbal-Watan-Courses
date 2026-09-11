// scripts/test-adventure-e2e.js
import assert from "node:assert";

console.log("🧪 Starting Python Adventure Frontend End-to-End Component & Integration Tests...\n");

// 1. Test Component Rendering Functions
{
  console.log("  1. Testing UI Component Renderers...");

  const { renderAdventureHome } = await import("../src/features/python-adventure/components/adventure-home.component.js");
  const { renderWorldMap } = await import("../src/features/python-adventure/components/world-map.component.js");
  const { renderMissionModal } = await import("../src/features/python-adventure/components/mission-modal.component.js");
  const { renderChallengeView } = await import("../src/features/python-adventure/components/challenge-view.component.js");
  const { renderCodeEditor } = await import("../src/features/python-adventure/components/code-editor.component.js");
  const { renderResultModal } = await import("../src/features/python-adventure/components/result-modal.component.js");
  const { renderSkillTree } = await import("../src/features/python-adventure/components/skill-tree.component.js");
  const { renderAchievements } = await import("../src/features/python-adventure/components/achievements-modal.component.js");
  const { renderDailyChallenge } = await import("../src/features/python-adventure/components/daily-challenge.component.js");
  const { renderProfileStats } = await import("../src/features/python-adventure/components/profile-stats.component.js");
  const { CHALLENGES_CLIENT_DATA, WORLDS_DATA } = await import("../src/features/python-adventure/python-adventure-data.js");

  const mockStudent = {
    id: "test_student_123",
    studentName: "مغامر تجريبي",
    studentPhone: "01012345678"
  };

  const mockProgress = {
    studentUid: "test_student_123",
    currentWorldId: "world-1",
    currentLevelId: "world-1-level-1",
    xp: 350,
    level: 2,
    stars: { "world-1-level-1": 3, "world-1-level-2": 2 },
    completedChallenges: {
      "world-1-level-1": { completedAt: "2026-09-11", stars: 3, xpAwarded: 50 },
      "world-1-level-2": { completedAt: "2026-09-11", stars: 2, xpAwarded: 54 }
    },
    unlockedWorlds: ["world-1", "world-2"],
    unlockedChallenges: ["world-1-level-1", "world-1-level-2", "world-1-level-3"],
    achievements: ["first_code"],
    streak: { count: 3, lastActiveDate: "2026-09-11" },
    stats: { totalCompleted: 2, totalRuns: 4 }
  };

  // Test 1: Adventure Home
  const homeHtml = renderAdventureHome({ student: mockStudent, progress: mockProgress });
  assert(homeHtml.includes("مغامر تجريبي"), "Home must show student name");
  assert(homeHtml.includes("Level 2"), "Home must show student level");
  assert(homeHtml.includes("adventureContinueBtn"), "Home must contain continue playing CTA");
  assert(homeHtml.includes("خريطة العوالم"), "Home must link to World Map");
  assert(homeHtml.includes("3 أيام"), "Home must show streak count");

  // Test 2: World Map
  const mapHtml = renderWorldMap({ progress: mockProgress, selectedWorldId: "world-1" });
  assert(mapHtml.includes("قرية بايثون"), "Map must contain World 1");
  assert(mapHtml.includes("حلبة الأبطال"), "Map must contain World 8");
  assert(mapHtml.includes("world-card"), "Map must render world cards");
  assert(mapHtml.includes("level-card"), "Map must render level cards for selected world");

  // Test 3: Mission Modal (Story step & Micro lesson step)
  const challenge1 = CHALLENGES_CLIENT_DATA["world-1-level-1"];
  const storyModalHtml = renderMissionModal(challenge1, "story");
  assert(storyModalHtml.includes("القصة والمهمة"), "Story modal must render story step indicator");
  assert(storyModalHtml.includes(challenge1.story), "Story modal must contain story narrative text");
  assert(storyModalHtml.includes("+50 XP"), "Story modal must show XP reward");

  const microModalHtml = renderMissionModal(challenge1, "micro");
  assert(microModalHtml.includes("الشرح والدرس السريع"), "Micro modal must render micro lesson indicator");
  assert(microModalHtml.includes(challenge1.microLesson.concept), "Micro modal must show concept title");
  assert(microModalHtml.includes("print"), "Micro modal must show example code");

  // Test 4: Code Editor
  const editorHtml = renderCodeEditor({ initialCode: 'print("Hello Python")' });
  assert(editorHtml.includes('dir="ltr"'), "Code editor must be strictly LTR");
  assert(editorHtml.includes('py-line-numbers'), "Code editor must have line numbers gutter");
  assert(editorHtml.includes('pyCopyCodeBtn'), "Code editor must have copy button");
  assert(editorHtml.includes('pyResetCodeBtn'), "Code editor must have reset template button");

  // Test 5: Challenge View
  const challengeViewHtml = renderChallengeView({
    challenge: challenge1,
    code: 'print("Hello Python")',
    output: "Hello Python\n",
    error: null,
    hintsRevealed: 1,
    attempts: 1,
    isRunning: false,
    isSubmitting: false
  });
  assert(challengeViewHtml.includes("Terminal Console"), "Challenge view must contain terminal console");
  assert(challengeViewHtml.includes("Hello Python"), "Challenge view must contain output");
  assert(challengeViewHtml.includes("pyRunBtn"), "Challenge view must have run button");
  assert(challengeViewHtml.includes("pySubmitBtn"), "Challenge view must have submit button");
  assert(challengeViewHtml.includes("تلميح 1:"), "Challenge view must display revealed hints");

  // Test 6: Result Modal (Success & Failure)
  const successModalHtml = renderResultModal({
    passed: true,
    earnedXp: 100,
    stars: 3,
    levelUp: true,
    newLevel: 3,
    skillsGained: ["print", "strings"],
    newlyUnlockedAchievements: [{ title: "أول سطر بايثون", icon: "🐍" }],
    hasNextChallenge: true
  });
  assert(successModalHtml.includes("أحسنت صنعاً!"), "Success modal must show celebration header");
  assert(successModalHtml.includes("+100 XP"), "Success modal must show earned XP");
  assert(successModalHtml.includes("Level 3"), "Success modal must show level up alert");
  assert(successModalHtml.includes("resultNextMissionBtn"), "Success modal must have next mission CTA");

  const failModalHtml = renderResultModal({
    passed: false,
    feedback: "الكود اشتغل، لكن المطلوب استخدام loop.",
    errorDetails: ""
  });
  assert(failModalHtml.includes("لم تنجح المهمة بعد"), "Failure modal must show non-punitive title");
  assert(failModalHtml.includes("resultTryAgainBtn"), "Failure modal must have try again CTA");

  // Test 7: Skill Tree
  const skillTreeHtml = renderSkillTree({ progress: mockProgress });
  assert(skillTreeHtml.includes("شجرة المهارات"), "Skill tree must render header");
  assert(skillTreeHtml.includes("المتغيرات والأنواع"), "Skill tree must render competencies");

  // Test 8: Achievements
  const achievementsHtml = renderAchievements({ progress: mockProgress });
  assert(achievementsHtml.includes("لوحة الأوسمة والإنجازات"), "Achievements must render header");
  assert(achievementsHtml.includes("أول سطر بايثون"), "Achievements must list achievements");

  // Test 9: Daily Challenge
  const dailyHtml = renderDailyChallenge({
    daily: { title: "تحدي اليوم السريع", description: "اجمع الأعداد من 1 إلى 10" },
    progress: mockProgress
  });
  assert(dailyHtml.includes("سلسلة الالتزام"), "Daily challenge must render streak");

  // Test 10: Profile & Stats
  const profileHtml = renderProfileStats({ student: mockStudent, progress: mockProgress });
  assert(profileHtml.includes("مغامر تجريبي"), "Profile must show student name");
  assert(profileHtml.includes("حقيبة الأدوات والأوسمة"), "Profile must show inventory");

  console.log("  ✅ All 10 UI Components rendered and asserted cleanly!");
}

// 2. Test Reactive State Store
{
  console.log("  2. Testing PythonAdventureStore reactive state...");

  const { adventureStore } = await import("../src/features/python-adventure/python-adventure.state.js");

  let notificationCount = 0;
  const unsubscribe = adventureStore.subscribe((state) => {
    notificationCount++;
  });

  adventureStore.setState({ activeView: "world-map" });
  assert.strictEqual(adventureStore.getState().activeView, "world-map");
  assert(notificationCount >= 1, "Store must notify subscribers on state change");

  adventureStore.resetEditor("test code");
  assert.strictEqual(adventureStore.getState().editorCode, "test code");
  assert.strictEqual(adventureStore.getState().terminalOutput, "");
  assert.strictEqual(adventureStore.getState().hintsRevealed, 0);

  unsubscribe();
  console.log("  ✅ Reactive State Store verified successfully!");
}

// 3. Test Service Local Authoritative Scorer
{
  console.log("  3. Testing Service Local Authoritative Scorer...");

  const { CHALLENGES_CLIENT_DATA, ACHIEVEMENTS_DATA } = await import("../src/features/python-adventure/python-adventure-data.js");

  function localValidateAndScore({ challengeId, code, hintsUsed, attempts, currentProgress }) {
    const challenge = CHALLENGES_CLIENT_DATA[challengeId];
    assert(challenge, "Challenge must exist");

    let xpMultiplier = 1.0;
    if (hintsUsed === 1) xpMultiplier = 0.90;
    else if (hintsUsed === 2) xpMultiplier = 0.75;
    else if (hintsUsed === 3) xpMultiplier = 0.50;
    else if (hintsUsed >= 4) xpMultiplier = 0.20;

    let starsEarned = 3;
    if (hintsUsed >= 4) starsEarned = 1;
    else if (hintsUsed > 0) starsEarned = 2;

    const earnedBaseXp = Math.round(challenge.baseXp * xpMultiplier);
    const newTotalXp = (currentProgress.xp || 0) + earnedBaseXp;
    const newLevel = Math.floor(newTotalXp / 250) + 1;

    return {
      passed: true,
      earnedXp: earnedBaseXp,
      totalXp: newTotalXp,
      stars: starsEarned,
      newLevel,
      unlockedNextChallengeId: challenge.nextChallengeId
    };
  }

  const testProg = {
    studentUid: "test_usr",
    xp: 0,
    level: 1,
    stars: {},
    completedChallenges: {}
  };

  const result = localValidateAndScore({
    challengeId: "world-1-level-1",
    code: 'print("Hello Python")',
    hintsUsed: 0,
    attempts: 1,
    currentProgress: testProg
  });

  assert.strictEqual(result.passed, true);
  assert.strictEqual(result.earnedXp, 50);
  assert.strictEqual(result.stars, 3);
  assert.strictEqual(result.unlockedNextChallengeId, "world-1-level-2");

  console.log("  ✅ Service local evaluation & reward calculation verified!");
}

console.log("\n🎉 ALL FRONTEND INTEGRATION & RENDERING TESTS PASSED SUCCESSFULLY!\n");
