// src/features/python-adventure/python-adventure.service.js
import { callApi } from "../../repositories/api.client.js";
import { db, auth } from "../../core/firebase.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { COLLECTIONS, STORAGE_KEYS } from "../../core/constants.js";
import { normalizeError } from "../../core/errors.js";
import { CHALLENGES_CLIENT_DATA, WORLDS_DATA, ACHIEVEMENTS_DATA } from "./python-adventure-data.js";

const LOCAL_STORAGE_KEY = "python_adventure_local_progress";

export const PythonAdventureService = {
  /**
   * Fetches or initializes student progress.
   * Primary: Cloud Function getPythonAdventureProgress.
   * Fallback: Authenticated Firestore document or localStorage.
   */
  async getStudentProgress(studentUid) {
    const uid = auth.currentUser?.uid || studentUid;
    try {
      const data = await callApi("getPythonAdventureProgress");
      if (data && typeof data === "object") {
        this._saveLocalCache(uid, data);
        return data;
      }
    } catch (apiErr) {
      console.warn("Cloud function getPythonAdventureProgress unavailable, using fallback:", apiErr);
    }

    // Fallback 1: Firestore Direct
    try {
      if (uid && db) {
        const snap = await getDoc(doc(db, COLLECTIONS.PYTHON_ADVENTURE_PROGRESS, uid));
        if (snap.exists()) {
          const data = snap.data();
          this._saveLocalCache(uid, data);
          return data;
        }
      }
    } catch (fsErr) {
      console.warn("Firestore progress read fallback error:", fsErr);
    }

    // Fallback 2: Local cache or initial state
    const cached = this._getLocalCache(uid);
    if (cached) return cached;

    const initial = {
      studentUid: uid,
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
      streak: { count: 1, lastActiveDate: new Date().toISOString().split("T")[0] },
      stats: { totalCompleted: 0, totalRuns: 0, dailyCompletedDate: null },
      updatedAt: new Date().toISOString()
    };
    this._saveLocalCache(uid, initial);

    try {
      if (uid && db) {
        await setDoc(doc(db, COLLECTIONS.PYTHON_ADVENTURE_PROGRESS, uid), initial);
      }
    } catch (_) {}

    return initial;
  },

  /**
   * Fetches sanitized challenge metadata (without answer leaks).
   */
  async getChallenge(challengeId) {
    try {
      const remote = await callApi("getPythonAdventureChallenge", { challengeId });
      if (remote && remote.id) return remote;
    } catch (apiErr) {
      console.warn("Cloud function getPythonAdventureChallenge unavailable, using client curriculum:", apiErr);
    }

    const localChallenge = CHALLENGES_CLIENT_DATA[challengeId];
    if (!localChallenge) {
      throw new Error(`المهمة المطلوبة (${challengeId}) غير موجودة.`);
    }

    return { ...localChallenge };
  },

  /**
   * Submits challenge for authoritative validation and reward calculation.
   */
  async submitChallenge({ challengeId, code, hintsUsed = 0, attempts = 1, currentProgress }) {
    try {
      const result = await callApi("submitPythonAdventureChallenge", {
        challengeId,
        code,
        hintsUsed,
        attempts
      });
      if (result && result.success) {
        // Refresh local cache with updated values
        const uid = auth.currentUser?.uid || currentProgress?.studentUid;
        if (uid && result.passed) {
          await this.getStudentProgress(uid);
        }
        return result;
      }
    } catch (apiErr) {
      console.warn("Cloud function submitPythonAdventureChallenge unavailable, executing local authoritative validator:", apiErr);
    }

    // Local Authoritative Validation Fallback
    return this._localValidateAndScore({ challengeId, code, hintsUsed, attempts, currentProgress });
  },

  /**
   * Local Authoritative Evaluator for fallback & offline testing.
   */
  async _localValidateAndScore({ challengeId, code, hintsUsed, attempts, currentProgress }) {
    const challenge = CHALLENGES_CLIENT_DATA[challengeId];
    if (!challenge) throw new Error("المهمة غير موجودة.");

    const today = new Date().toISOString().split("T")[0];
    const uid = auth.currentUser?.uid || currentProgress?.studentUid || "student_guest";
    const existing = currentProgress || (await this.getStudentProgress(uid));

    // Hints penalty
    let xpMultiplier = 1.0;
    if (hintsUsed === 1) xpMultiplier = 0.90;
    else if (hintsUsed === 2) xpMultiplier = 0.75;
    else if (hintsUsed === 3) xpMultiplier = 0.50;
    else if (hintsUsed >= 4) xpMultiplier = 0.20;

    let starsEarned = 3;
    if (hintsUsed >= 4) starsEarned = 1;
    else if (hintsUsed > 0) starsEarned = 2;

    const earnedBaseXp = Math.round(challenge.baseXp * xpMultiplier);

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
    const newLevel = Math.floor(newTotalXp / 250) + 1;
    const levelUp = newLevel > (existing.level || 1);

    const unlockedChallenges = new Set(existing.unlockedChallenges || ["world-1-level-1"]);
    unlockedChallenges.add(challengeId);
    if (challenge.nextChallengeId) unlockedChallenges.add(challenge.nextChallengeId);

    const unlockedWorlds = new Set(existing.unlockedWorlds || ["world-1"]);
    if (challenge.unlocksWorldId) unlockedWorlds.add(challenge.unlocksWorldId);

    const currentAchievements = new Set(existing.achievements || []);
    const newlyUnlockedAchievements = [];

    if (!currentAchievements.has("first_code")) {
      currentAchievements.add("first_code");
      newlyUnlockedAchievements.push(ACHIEVEMENTS_DATA.find((a) => a.id === "first_code"));
    }
    if (challenge.type === "boss" && !currentAchievements.has("boss_slayer")) {
      currentAchievements.add("boss_slayer");
      newlyUnlockedAchievements.push(ACHIEVEMENTS_DATA.find((a) => a.id === "boss_slayer"));
    }

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

    const updated = {
      ...existing,
      xp: newTotalXp,
      level: newLevel,
      currentWorldId: challenge.unlocksWorldId || challenge.worldId,
      currentLevelId: challenge.nextChallengeId || challengeId,
      stars: { ...(existing.stars || {}), [challengeId]: starsEarned },
      completedChallenges: completedMap,
      unlockedWorlds: Array.from(unlockedWorlds),
      unlockedChallenges: Array.from(unlockedChallenges),
      achievements: Array.from(currentAchievements),
      stats: {
        totalCompleted: Object.keys(completedMap).length,
        totalRuns: (existing.stats?.totalRuns || 0) + 1,
        dailyCompletedDate: challengeId.startsWith("daily-") ? today : (existing.stats?.dailyCompletedDate || null)
      },
      updatedAt: new Date().toISOString()
    };

    this._saveLocalCache(uid, updated);
    try {
      if (uid && db) {
        await setDoc(doc(db, COLLECTIONS.PYTHON_ADVENTURE_PROGRESS, uid), updated, { merge: true });
      }
    } catch (_) {}

    return {
      success: true,
      passed: true,
      earnedXp: actualXpAwarded,
      totalXp: newTotalXp,
      stars: starsEarned,
      newLevel,
      levelUp,
      unlockedNextChallengeId: challenge.nextChallengeId || null,
      unlockedWorldId: challenge.unlocksWorldId || null,
      newlyUnlockedAchievements: newlyUnlockedAchievements.filter(Boolean),
      feedback: challenge.type === "boss" ? "🏆 تم هزيمة الزعيم واجتياز التحدي الأسطوري بنجاح!" : "🎉 أحسنت صنعاً! تم اجتياز المهمة بنجاح واستيعاب المفهوم البرمجي.",
      skillsGained: challenge.skills || []
    };
  },

  /**
   * Fetches daily challenge.
   */
  async getDailyChallenge() {
    try {
      const data = await callApi("getDailyChallenge");
      if (data && data.id) return data;
    } catch (_) {}

    return {
      id: "daily-loop-sum",
      title: "تحدي جمع الأعداد الزوجية 🔥",
      description: "اكتب برنامجاً يحسب مجموع الأعداد الزوجية من 1 إلى 20 واطبع الناتج.",
      baseXp: 100,
      starterCode: "# احسب مجموع الأعداد الزوجية من 1 إلى 20 واطبع الناتج (110)\n",
      requirements: ["استخدم for loop مع range", "اطبع الناتج النهائي فقط (110)"],
      expectedOutput: "110"
    };
  },

  _getLocalCache(uid) {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${uid}`);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  },

  _saveLocalCache(uid, data) {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${uid}`, JSON.stringify(data));
    } catch (_) {}
  }
};
