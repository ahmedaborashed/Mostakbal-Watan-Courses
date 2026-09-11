import { db } from "../../config/firebase";
import { PointLedgerEntry, PointSourceType, StudentGamificationProfile } from "./types";
import { evaluateRankingAchievements } from "./achievements";
import { checkAndNotifyRankChange, createNotification } from "./notifications";

const LEDGER_COLLECTION = "points_ledger";
const GAMIFICATION_COLLECTION = "student_gamification";
const STUDENTS_COLLECTION = "students";
const COMPETITIONS_COLLECTION = "competitions";

export interface AwardPointsOptions {
  studentUid: string;
  sourceType: PointSourceType;
  sourceId: string;
  points: number;
  reason: string;
  competitionId?: string | null;
  metadata?: Record<string, any>;
  notifyStudent?: boolean;
}

export interface AwardPointsResult {
  awarded: boolean;
  pointsAwarded: number;
  totalPoints: number;
  reason: string;
  alreadyAwarded: boolean;
  newlyUnlockedAchievements: Array<{ id: string; title: string; icon: string }>;
}

/**
 * Authoritatively and idempotently awards competition points to a student.
 * Guarantees that the exact same event cannot award points more than once.
 */
export async function awardCompetitionPoints(options: AwardPointsOptions): Promise<AwardPointsResult> {
  const {
    studentUid,
    sourceType,
    sourceId,
    points,
    reason,
    competitionId = null,
    metadata = {},
    notifyStudent = true
  } = options;

  if (points <= 0) {
    return {
      awarded: false,
      pointsAwarded: 0,
      totalPoints: 0,
      reason: "عدد النقاط يجب أن يكون أكبر من الصفر",
      alreadyAwarded: false,
      newlyUnlockedAchievements: []
    };
  }

  // Deterministic Idempotency Key
  const ledgerDocId = `ledger_${studentUid}_${sourceType}_${sourceId}`;
  const ledgerDocRef = db.collection(LEDGER_COLLECTION).doc(ledgerDocId);
  const gamificationDocRef = db.collection(GAMIFICATION_COLLECTION).doc(studentUid);

  let pointsAdded = 0;
  let newTotalCompetitionPoints = 0;
  let unlockedAchievements: Array<{ id: string; title: string; icon: string }> = [];
  let isAlreadyAwarded = false;

  await db.runTransaction(async (transaction) => {
    // 1. Check if this exact event was already processed
    const existingLedgerSnap = await transaction.get(ledgerDocRef);
    if (existingLedgerSnap.exists) {
      isAlreadyAwarded = true;
      const gamSnap = await transaction.get(gamificationDocRef);
      newTotalCompetitionPoints = gamSnap.exists ? (gamSnap.data()?.competitionPoints || 0) : 0;
      return;
    }

    // 2. Fetch or initialize student gamification document
    const gamSnap = await transaction.get(gamificationDocRef);
    let gamData: StudentGamificationProfile;

    const today = new Date().toISOString().split("T")[0];

    if (!gamSnap.exists) {
      // Fetch student info for profile denormalization
      const studentSnap = await transaction.get(db.collection(STUDENTS_COLLECTION).doc(studentUid));
      const studentInfo = studentSnap.exists ? studentSnap.data()! : {};

      gamData = {
        studentUid,
        studentName: studentInfo.name || studentInfo.studentName || "طالب",
        studentPhone: studentInfo.phone || studentInfo.studentPhone || "",
        group: studentInfo.group || studentInfo.studentGroup || "ALL",
        xp: 0,
        level: 1,
        competitionPoints: 0,
        rank: 0,
        previousRank: 0,
        rankChange: 0,
        achievements: [],
        currentStreak: 1,
        challengesCompleted: 0,
        competitionsWon: 0,
        competitionsParticipated: 0,
        rankingHistory: [
          { date: today, rank: 0, points: points }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    } else {
      gamData = gamSnap.data() as StudentGamificationProfile;
    }

    pointsAdded = points;
    newTotalCompetitionPoints = (gamData.competitionPoints || 0) + pointsAdded;

    // 3. Create Point Ledger Entry
    const ledgerEntry: PointLedgerEntry = {
      id: ledgerDocId,
      studentUid,
      sourceType,
      sourceId,
      points: pointsAdded,
      reason,
      createdAt: new Date().toISOString(),
      competitionId: competitionId || null,
      metadata
    };

    transaction.set(ledgerDocRef, ledgerEntry);

    // 4. Evaluate Ranking Achievements
    const previousState = { ...gamData };
    gamData.competitionPoints = newTotalCompetitionPoints;
    const newAchievements = evaluateRankingAchievements(gamData, previousState);
    if (newAchievements.length > 0) {
      const achievementIds = newAchievements.map(a => a.id);
      gamData.achievements = Array.from(new Set([...(gamData.achievements || []), ...achievementIds]));
      unlockedAchievements = newAchievements.map(a => ({
        id: a.id,
        title: a.title,
        icon: a.icon
      }));
    }

    // Update history entry for today
    const history = Array.isArray(gamData.rankingHistory) ? [...gamData.rankingHistory] : [];
    const todayEntryIndex = history.findIndex(h => h.date === today);
    if (todayEntryIndex >= 0) {
      history[todayEntryIndex].points = newTotalCompetitionPoints;
    } else {
      history.push({ date: today, rank: gamData.rank || 0, points: newTotalCompetitionPoints });
    }
    // Keep last 30 days of history
    if (history.length > 30) history.shift();
    gamData.rankingHistory = history;

    gamData.updatedAt = new Date().toISOString();

    transaction.set(gamificationDocRef, gamData, { merge: true });

    // 5. If linked to an active competition, record points in competition participant record
    if (competitionId) {
      const participantRef = db
        .collection(COMPETITIONS_COLLECTION)
        .doc(competitionId)
        .collection("participants")
        .doc(studentUid);

      const partSnap = await transaction.get(participantRef);
      if (partSnap.exists) {
        const currentScore = partSnap.data()?.score || 0;
        transaction.update(participantRef, {
          score: currentScore + pointsAdded,
          lastActivityAt: new Date().toISOString()
        });
      }
    }
  });

  if (isAlreadyAwarded) {
    return {
      awarded: false,
      pointsAwarded: 0,
      totalPoints: newTotalCompetitionPoints,
      reason: "تم احتساب نقاط هذا النشاط مسبقاً لحسابك",
      alreadyAwarded: true,
      newlyUnlockedAchievements: []
    };
  }

  // 6. Asynchronous Notification Triggers (Non-blocking)
  if (notifyStudent && pointsAdded > 0) {
    // Check if points warrant a notification
    if (pointsAdded >= 20) {
      await createNotification({
        recipientUid: studentUid,
        type: "points_earned",
        title: "⭐ كسبت نقاط تنافس جديدة!",
        message: `أحسنت! أضيفت +${pointsAdded} نقطة تنافسية إلى رصيدك (${reason}).`,
        actionType: "ranking",
        actionId: "global"
      });
    }

    for (const ach of unlockedAchievements) {
      await createNotification({
        recipientUid: studentUid,
        type: "achievement_unlocked",
        title: "🏆 إنجاز تنافسي جديد!",
        message: `تهانينا! حصلت على إنجاز "${ach.title}".`,
        actionType: "achievements",
        actionId: ach.id
      });
    }
  }

  return {
    awarded: true,
    pointsAwarded: pointsAdded,
    totalPoints: newTotalCompetitionPoints,
    reason,
    alreadyAwarded: false,
    newlyUnlockedAchievements: unlockedAchievements
  };
}

/**
 * Synchronizes XP and level from Python Adventure or student profile into gamification document.
 */
export async function syncStudentXpAndLevel(studentUid: string, xp: number, level: number): Promise<void> {
  const docRef = db.collection(GAMIFICATION_COLLECTION).doc(studentUid);
  await docRef.set({
    studentUid,
    xp,
    level,
    updatedAt: new Date().toISOString()
  }, { merge: true });
}
