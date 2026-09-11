import { CallableRequest, HttpsError } from "firebase-functions/v2/https";
import { db } from "../../config/firebase";
import { getAuthenticatedUser } from "../../middleware/auth";
import { validateInput } from "../../middleware/validator";
import {
  GetLeaderboardSchema,
  GetCompetitionsSchema,
  GetCompetitionDetailsSchema,
  JoinCompetitionSchema,
  GetNotificationsSchema,
  MarkNotificationReadSchema,
  StudentGamificationProfile
} from "./types";
import { getScopedLeaderboard } from "./leaderboard";
import { getCompetitionsList, getCompetitionDetails, joinCompetition } from "./competitions";
import {
  getStudentNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "./notifications";

const GAMIFICATION_COLLECTION = "student_gamification";
const STUDENTS_COLLECTION = "students";
const PYTHON_PROGRESS_COLLECTION = "python_adventure_progress";

/**
 * 1. Get Student Gamification Profile
 */
export async function getStudentGamificationProfileHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const docRef = db.collection(GAMIFICATION_COLLECTION).doc(user.uid);
  const snap = await docRef.get();

  const today = new Date().toISOString().split("T")[0];

  // Fetch Python adventure progress to sync XP/Level
  let adventureXp = 0;
  let adventureLevel = 1;
  let challengesCompleted = 0;
  const adventureSnap = await db.collection(PYTHON_PROGRESS_COLLECTION).doc(user.uid).get();
  if (adventureSnap.exists) {
    const advData = adventureSnap.data()!;
    adventureXp = Number(advData.xp || 0);
    adventureLevel = Number(advData.level || 1);
    challengesCompleted = Object.keys(advData.completedChallenges || {}).length;
  }

  if (!snap.exists) {
    // Fetch student info
    const studentSnap = await db.collection(STUDENTS_COLLECTION).doc(user.uid).get();
    const studentInfo = studentSnap.exists ? studentSnap.data()! : {};

    const initialProfile: StudentGamificationProfile = {
      studentUid: user.uid,
      studentName: studentInfo.name || studentInfo.studentName || "طالب",
      studentPhone: studentInfo.phone || studentInfo.studentPhone || "",
      group: studentInfo.group || studentInfo.studentGroup || "ALL",
      xp: adventureXp,
      level: adventureLevel,
      competitionPoints: 0,
      rank: 0,
      previousRank: 0,
      rankChange: 0,
      achievements: [],
      currentStreak: 1,
      challengesCompleted,
      competitionsWon: 0,
      competitionsParticipated: 0,
      rankingHistory: [
        { date: today, rank: 0, points: 0 }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docRef.set(initialProfile);
    return initialProfile;
  }

  const data = snap.data() as StudentGamificationProfile;

  // Keep XP/level synced if adventure progress is ahead
  if (adventureXp > (data.xp || 0) || challengesCompleted > (data.challengesCompleted || 0)) {
    const updated = {
      xp: Math.max(adventureXp, data.xp || 0),
      level: Math.max(adventureLevel, data.level || 1),
      challengesCompleted: Math.max(challengesCompleted, data.challengesCompleted || 0),
      updatedAt: new Date().toISOString()
    };
    await docRef.update(updated);
    return { ...data, ...updated };
  }

  return data;
}

/**
 * 2. Get Scoped Leaderboard
 */
export async function getLeaderboardHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { scope, limit } = validateInput(GetLeaderboardSchema, request.data);

  return await getScopedLeaderboard(user.uid, scope, limit);
}

/**
 * 3. Get Competitions List
 */
export async function getCompetitionsHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { filter } = validateInput(GetCompetitionsSchema, request.data);

  return await getCompetitionsList(user.uid, filter);
}

/**
 * 4. Get Single Competition Details & Leaderboard
 */
export async function getCompetitionDetailsHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { competitionId } = validateInput(GetCompetitionDetailsSchema, request.data);

  try {
    return await getCompetitionDetails(user.uid, competitionId);
  } catch (err: any) {
    throw new HttpsError("not-found", err.message || "المسابقة غير موجودة.");
  }
}

/**
 * 5. Join Competition
 */
export async function joinCompetitionHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { competitionId } = validateInput(JoinCompetitionSchema, request.data);

  try {
    return await joinCompetition(user.uid, competitionId);
  } catch (err: any) {
    throw new HttpsError("failed-precondition", err.message || "تعذر الانضمام للمسابقة.");
  }
}

/**
 * 6. Get Notifications
 */
export async function getNotificationsHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { limit, unreadOnly } = validateInput(GetNotificationsSchema, request.data);

  return await getStudentNotifications(user.uid, limit, unreadOnly);
}

/**
 * 7. Mark Single Notification as Read
 */
export async function markNotificationAsReadHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const { notificationId } = validateInput(MarkNotificationReadSchema, request.data);

  const success = await markNotificationAsRead(user.uid, notificationId);
  return { success };
}

/**
 * 8. Mark All Notifications as Read
 */
export async function markAllNotificationsAsReadHandler(request: CallableRequest) {
  const user = getAuthenticatedUser(request);
  const count = await markAllNotificationsAsRead(user.uid);

  return { success: true, count };
}
