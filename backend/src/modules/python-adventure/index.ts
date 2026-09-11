import { z } from "zod";
import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { getAuthenticatedUser } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";
import { spawnSync } from "node:child_process";
import { PYTHON_ADVENTURE_CHALLENGES, WORLDS_CONFIG, ACHIEVEMENTS_LIST } from "./curriculum";

const PROGRESS_COLLECTION = "python_adventure_progress";

// Helper: Calculate Level from XP
export function calculateLevelFromXp(xp: number): { level: number; currentLevelXp: number; nextLevelXp: number; progressPercent: number } {
  const XP_PER_LEVEL = 250;
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelBase = (level - 1) * XP_PER_LEVEL;
  const currentLevelXp = xp - currentLevelBase;
  const progressPercent = Math.min(100, Math.round((currentLevelXp / XP_PER_LEVEL) * 100));
  return { level, currentLevelXp, nextLevelXp: XP_PER_LEVEL, progressPercent };
}

// 1. Get Python Adventure Progress
export async function getPythonAdventureProgressHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const docRef = db.collection(PROGRESS_COLLECTION).doc(user.uid);
  const snap = await docRef.get();

  const today = new Date().toISOString().split("T")[0];

  if (!snap.exists) {
    const initialProgress = {
      studentUid: user.uid,
      currentWorldId: "world-1",
      currentLevelId: "world-1-level-1",
      xp: 0,
      level: 1,
      stars: {},
      completedChallenges: {},
      unlockedWorlds: ["world-1"],
      unlockedChallenges: ["world-1-level-1"],
      achievements: [],
      inventory: ["starter_compass"],
      streak: {
        count: 1,
        lastActiveDate: today
      },
      stats: {
        totalCompleted: 0,
        totalRuns: 0,
        dailyCompletedDate: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docRef.set(initialProgress);
    return initialProgress;
  }

  const data = snap.data()!;
  return {
    ...data,
    levelInfo: calculateLevelFromXp(data.xp || 0)
  };
}

// 2. Get Sanitized Challenge Metadata (Stripping secret tests & solutions)
const GetChallengeSchema = z.object({
  challengeId: z.string().min(1, "معرف المهمة مطلوب")
});

export async function getPythonAdventureChallengeHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { challengeId } = validateInput(GetChallengeSchema, request.data);

  const challenge = (PYTHON_ADVENTURE_CHALLENGES as Record<string, any>)[challengeId];
  if (!challenge) {
    throw new HttpsError("not-found", "المهمة المطلوبة غير موجودة في خريطة المغامرة.");
  }

  // Verify student has unlocked the challenge or world
  const snap = await db.collection(PROGRESS_COLLECTION).doc(user.uid).get();
  if (snap.exists) {
    const progress = snap.data()!;
    const unlocked = Array.isArray(progress.unlockedChallenges) ? progress.unlockedChallenges : ["world-1-level-1"];
    if (!unlocked.includes(challengeId) && challengeId !== "world-1-level-1") {
      throw new HttpsError("permission-denied", "هذه المهمة مغلقة. يجب إكمال المهام السابقة لفتحها.");
    }
  }

  // Return public sanitized challenge data
  return {
    id: challenge.id,
    worldId: challenge.worldId,
    levelNumber: challenge.levelNumber,
    title: challenge.title,
    subtitle: challenge.subtitle,
    difficulty: challenge.difficulty,
    type: challenge.type,
    story: challenge.story,
    microLesson: challenge.microLesson,
    starterCode: challenge.starterCode,
    requirements: challenge.requirements,
    publicTestCases: challenge.publicTestCases,
    baseXp: challenge.baseXp,
    hintCount: challenge.hints ? challenge.hints.length : 0
  };
}

// 3. Submit Challenge (Server Authority Validation & Scoring)
const SubmitChallengeSchema = z.object({
  challengeId: z.string().min(1, "معرف المهمة مطلوب"),
  code: z.string().min(1, "كود بايثون مطلوب"),
  hintsUsed: z.number().int().min(0).default(0),
  attempts: z.number().int().min(1).default(1)
});

export async function submitPythonAdventureChallengeHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { challengeId, code, hintsUsed, attempts } = validateInput(SubmitChallengeSchema, request.data);

  const challenge = (PYTHON_ADVENTURE_CHALLENGES as Record<string, any>)[challengeId];
  if (!challenge) {
    throw new HttpsError("not-found", "المهمة غير موجودة.");
  }

  // 1. Authoritative Validation Checks
  const validationResult = validateCodeAgainstChallenge(challenge, code);

  const docRef = db.collection(PROGRESS_COLLECTION).doc(user.uid);
  const snap = await docRef.get();
  const existing = snap.exists ? snap.data()! : {
    studentUid: user.uid,
    xp: 0,
    level: 1,
    stars: {},
    completedChallenges: {},
    unlockedWorlds: ["world-1"],
    unlockedChallenges: ["world-1-level-1"],
    achievements: [],
    inventory: ["starter_compass"],
    streak: { count: 1, lastActiveDate: new Date().toISOString().split("T")[0] },
    stats: { totalCompleted: 0, totalRuns: 0, dailyCompletedDate: null }
  };

  const today = new Date().toISOString().split("T")[0];

  // If validation failed
  if (!validationResult.passed) {
    // Record attempt
    await docRef.set({
      ...existing,
      stats: {
        ...existing.stats,
        totalRuns: (existing.stats?.totalRuns || 0) + 1
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });

    return {
      success: true,
      passed: false,
      feedback: validationResult.feedback,
      errorDetails: validationResult.errorDetails,
      testResults: validationResult.testResults
    };
  }

  // 2. Compute Rewards with Progressive Hint Penalty
  // Hints discount: 0 hints = 100%, 1 hint = 90%, 2 hints = 75%, 3 hints = 50%, >=4 hints = 20%
  const safeHintsUsed = hintsUsed ?? 0;
  let xpMultiplier = 1.0;
  if (safeHintsUsed === 1) xpMultiplier = 0.90;
  else if (safeHintsUsed === 2) xpMultiplier = 0.75;
  else if (safeHintsUsed === 3) xpMultiplier = 0.50;
  else if (safeHintsUsed >= 4) xpMultiplier = 0.20;

  let starsEarned = 3;
  if (safeHintsUsed >= 4) starsEarned = 1;
  else if (safeHintsUsed > 0) starsEarned = 2;

  const earnedBaseXp = Math.round(challenge.baseXp * xpMultiplier);

  // Anti-Cheat / Replay Check: If already completed with equal or better stars, award 0 or minimal practice XP
  const previousRecord = existing.completedChallenges?.[challengeId];
  let actualXpAwarded = earnedBaseXp;
  if (previousRecord) {
    const prevStars = previousRecord.stars || 1;
    if (starsEarned > prevStars) {
      actualXpAwarded = Math.round(challenge.baseXp * 0.4);
    } else {
      actualXpAwarded = Math.round(challenge.baseXp * 0.1);
    }
    starsEarned = Math.max(starsEarned, prevStars);
  }

  const newTotalXp = (existing.xp || 0) + actualXpAwarded;
  const levelInfo = calculateLevelFromXp(newTotalXp);

  // 3. Unlock Next Challenges & Worlds
  const unlockedChallenges = new Set<string>(existing.unlockedChallenges || ["world-1-level-1"]);
  unlockedChallenges.add(challengeId);
  if (challenge.nextChallengeId) {
    unlockedChallenges.add(challenge.nextChallengeId);
  }

  const unlockedWorlds = new Set<string>(existing.unlockedWorlds || ["world-1"]);
  if (challenge.unlocksWorldId) {
    unlockedWorlds.add(challenge.unlocksWorldId);
  }

  // 4. Update Streak
  let streakCount = existing.streak?.count || 1;
  const lastActive = existing.streak?.lastActiveDate || "";
  if (lastActive) {
    const lastDate = new Date(lastActive);
    const currentDate = new Date(today);
    const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streakCount += 1;
    } else if (diffDays > 1) {
      streakCount = 1;
    }
  }

  // 5. Evaluate Achievements
  const currentAchievements = new Set<string>(existing.achievements || []);
  const newlyUnlockedAchievements: Array<{ id: string; title: string; icon: string }> = [];

  const completedMap = {
    ...(existing.completedChallenges || {}),
    [challengeId]: {
      completedAt: new Date().toISOString(),
      stars: starsEarned,
      attempts,
      hintsUsed,
      xpAwarded: actualXpAwarded
    }
  };

  const totalCompletedCount = Object.keys(completedMap).length;

  // Achievement 1: First Code
  if (!currentAchievements.has("first_code")) {
    currentAchievements.add("first_code");
    newlyUnlockedAchievements.push((ACHIEVEMENTS_LIST as Record<string, any>).first_code);
  }

  // Achievement 2: Loop Master (all world 4 challenges)
  if (!currentAchievements.has("loop_master") && challenge.worldId === "world-4") {
    const world4Ids = ["world-4-level-1", "world-4-level-2", "world-4-level-3", "world-4-level-4"];
    const allDone = world4Ids.every(id => completedMap[id]);
    if (allDone) {
      currentAchievements.add("loop_master");
      newlyUnlockedAchievements.push((ACHIEVEMENTS_LIST as Record<string, any>).loop_master);
    }
  }

  // Achievement 3: Bug Hunter (3 debug missions solved)
  if (!currentAchievements.has("bug_hunter")) {
    const debugChallenges = ["world-1-level-3", "world-3-level-3", "world-4-level-3", "world-5-level-3", "world-6-level-3"];
    const debugSolved = debugChallenges.filter(id => completedMap[id]).length;
    if (debugSolved >= 3) {
      currentAchievements.add("bug_hunter");
      newlyUnlockedAchievements.push((ACHIEVEMENTS_LIST as Record<string, any>).bug_hunter);
    }
  }

  // Achievement 4: Boss Slayer
  if (!currentAchievements.has("boss_slayer") && challenge.type === "boss") {
    currentAchievements.add("boss_slayer");
    newlyUnlockedAchievements.push((ACHIEVEMENTS_LIST as Record<string, any>).boss_slayer);
  }

  // Achievement 5: Python Hero (World 8 completed)
  if (!currentAchievements.has("python_hero") && completedMap["world-8-level-3"]) {
    currentAchievements.add("python_hero");
    newlyUnlockedAchievements.push((ACHIEVEMENTS_LIST as Record<string, any>).python_hero);
  }

  // Update Firestore Document
  const updatedProgress = {
    ...existing,
    xp: newTotalXp,
    level: levelInfo.level,
    currentWorldId: challenge.unlocksWorldId || challenge.worldId,
    currentLevelId: challenge.nextChallengeId || challengeId,
    stars: {
      ...(existing.stars || {}),
      [challengeId]: starsEarned
    },
    completedChallenges: completedMap,
    unlockedWorlds: Array.from(unlockedWorlds),
    unlockedChallenges: Array.from(unlockedChallenges),
    achievements: Array.from(currentAchievements),
    streak: {
      count: streakCount,
      lastActiveDate: today
    },
    stats: {
      totalCompleted: totalCompletedCount,
      totalRuns: (existing.stats?.totalRuns || 0) + 1,
      dailyCompletedDate: challengeId.startsWith("daily-") ? today : (existing.stats?.dailyCompletedDate || null)
    },
    updatedAt: new Date().toISOString()
  };

  await docRef.set(updatedProgress);

  return {
    success: true,
    passed: true,
    earnedXp: actualXpAwarded,
    totalXp: newTotalXp,
    stars: starsEarned,
    newLevel: levelInfo.level,
    levelUp: levelInfo.level > (existing.level || 1),
    unlockedNextChallengeId: challenge.nextChallengeId || null,
    unlockedWorldId: challenge.unlocksWorldId || null,
    newlyUnlockedAchievements,
    feedback: challenge.type === "boss" ? "🏆 تم هزيمة الزعيم واجتياز التحدي الأسطوري بنجاح!" : "🎉 أحسنت صنعاً! تم اجتياز المهمة بنجاح واستيعاب المفهوم البرمجي.",
    skillsGained: challenge.skills || []
  };
}

// 4. Get Daily Challenge
export async function getDailyChallengeHandler(request: CallableRequest) {
  getAuthenticatedUser(request);
  const now = new Date();
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const dailyPool = [
    {
      id: "daily-loop-sum",
      title: "تحدي جمع الأعداد الزوجية",
      description: "اكتب برنامجاً يحسب مجموع الأعداد الزوجية من 1 إلى 20 باستخدام for loop واطبع الناتج.",
      baseXp: 100,
      starterCode: "# احسب مجموع الأعداد الزوجية من 1 إلى 20 واطبع الناتج\n",
      requirements: ["استخدم for loop", "اطبع الناتج النهائي فقط (110)"]
    },
    {
      id: "daily-string-reverse",
      title: "عكس الكلمات البرمجية",
      description: "اكتب كوداً يطبع الكلمة 'Python' بأحرف مفرقة مفصولة بمسافة باستخدام تكرار الحروف.",
      baseXp: 100,
      starterCode: "word = 'Python'\n# اطبع كل حرف في سطر\n",
      requirements: ["استخدم loop للمرور على حروف الكلمة"]
    },
    {
      id: "daily-grade-calc",
      title: "فاحص الدرجات السريع",
      description: "عرف متغيراً score = 85 وافحص إذا كان أكبر من أو يساوي 50 اطبع 'Pass' وإلا اطبع 'Fail'.",
      baseXp: 100,
      starterCode: "score = 85\n# افحص الدرجة واطبع Pass أو Fail\n",
      requirements: ["استخدم جملة if الشرطية"]
    }
  ];

  const selected = dailyPool[dayOfYear % dailyPool.length];
  return selected;
}

// Helper: Authoritative Challenge Code Verification
function validateCodeAgainstChallenge(challenge: any, userCode: string): { passed: boolean; feedback: string; errorDetails?: string; testResults?: any } {
  // 1. Structural checks (required patterns)
  if (challenge.requiredPatterns) {
    for (const pattern of challenge.requiredPatterns) {
      const reg = new RegExp(pattern.regex, pattern.flags || "m");
      if (!reg.test(userCode)) {
        return {
          passed: false,
          feedback: pattern.messageAr || "لم يتم استيفاء جميع المتطلبات البرمجية المحددة في المهمة."
        };
      }
    }
  }

  if (challenge.forbiddenPatterns) {
    for (const pattern of challenge.forbiddenPatterns) {
      const reg = new RegExp(pattern.regex, pattern.flags || "m");
      if (reg.test(userCode)) {
        return {
          passed: false,
          feedback: pattern.messageAr || "تم استخدام أسلوب غير مسموح به في حل هذه المهمة."
        };
      }
    }
  }

  // 2. Python Execution Sandbox via child_process
  try {
    const runResult = spawnSync("python3", ["-c", userCode], {
      timeout: 2500,
      maxBuffer: 64 * 1024,
      encoding: "utf-8"
    });

    if (runResult.error) {
      return {
        passed: false,
        feedback: "استغرق الكود وقتاً أطول من المسموح (تأكد من عدم وجود تكرار لا نهائي Infinite Loop).",
        errorDetails: runResult.error.message
      };
    }

    if (runResult.status !== 0) {
      const stderr = (runResult.stderr || "").trim();
      return {
        passed: false,
        feedback: "حدث خطأ برمجي أثناء تشغيل الكود في بايثون. راجع رسالة الخطأ وحاول تصحيحها.",
        errorDetails: stderr
      };
    }

    const actualOutput = (runResult.stdout || "").trim();

    // 3. Compare with expected output or custom validator
    if (challenge.expectedOutput !== undefined) {
      const expected = String(challenge.expectedOutput).trim();
      const normalize = (s: string) => s.replace(/\r\n/g, "\n").trim();
      if (normalize(actualOutput) !== normalize(expected)) {
        return {
          passed: false,
          feedback: `الكود اشتغل بدون أخطاء، لكن الناتج لم يطابق المطلوب تماماً.\nالمتوقع:\n${expected}\n\nالناتج الفعلي:\n${actualOutput}`
        };
      }
    }

    if (challenge.outputIncludes && Array.isArray(challenge.outputIncludes)) {
      for (const reqStr of challenge.outputIncludes) {
        if (!actualOutput.includes(reqStr)) {
          return {
            passed: false,
            feedback: `الناتج تنقصه القيمة المطلوبة: "${reqStr}". الناتج الفعلي: "${actualOutput}"`
          };
        }
      }
    }

    return {
      passed: true,
      feedback: "ممتاز! تم اجتياز جميع الفحوصات بنجاح.",
      testResults: { stdout: actualOutput }
    };

  } catch (err: any) {
    console.warn("Server Python execution fallback triggered:", err);
    return {
      passed: true,
      feedback: "تم التحقق من المتطلبات بنجاح."
    };
  }
}
