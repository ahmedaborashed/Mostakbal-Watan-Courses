import { db } from "../../config/firebase";
import { LeaderboardEntry, StudentGamificationProfile } from "./types";
import { checkAndNotifyRankChange } from "./notifications";

const GAMIFICATION_COLLECTION = "student_gamification";
const STUDENTS_COLLECTION = "students";

export interface LeaderboardResult {
  scope: "group" | "course" | "global";
  groupName?: string;
  totalStudents: number;
  topStudents: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  currentUserRank: number;
  percentile: number; // e.g. 72 means ahead of 72% of students
  rankChange: number; // e.g. +4 (advanced 4 positions) or -2 (dropped 2)
  previousRank: number;
}

/**
 * Masks a phone number for student privacy on shared leaderboards.
 * E.g., "01012345678" -> "010****5678"
 */
export function maskPhone(phone: string): string {
  if (!phone) return "—";
  const clean = String(phone).trim();
  if (clean.length <= 6) return clean;
  return `${clean.substring(0, 3)}****${clean.substring(clean.length - 4)}`;
}

/**
 * Deterministically sorts students for fair, reproducible leaderboard ranking.
 */
export function sortStudentsDeterministically(a: any, b: any): number {
  // 1. Competition Points descending
  const pointsA = Number(a.competitionPoints || 0);
  const pointsB = Number(b.competitionPoints || 0);
  if (pointsB !== pointsA) {
    return pointsB - pointsA;
  }

  // 2. Level descending
  const levelA = Number(a.level || 1);
  const levelB = Number(b.level || 1);
  if (levelB !== levelA) {
    return levelB - levelA;
  }

  // 3. Earlier achievement date (createdAt or updatedAt) ascending
  const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
  const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
  if (timeA !== timeB) {
    return timeA - timeB;
  }

  // 4. Stable tie-breaker: UID string comparison
  return String(a.studentUid || a.id || "").localeCompare(String(b.studentUid || b.id || ""));
}

/**
 * Fetches the scoped leaderboard and calculates the authenticated student's rank & percentile.
 */
export async function getScopedLeaderboard(
  currentStudentUid: string,
  scope: "group" | "course" | "global" = "group",
  limitCount: number = 10
): Promise<LeaderboardResult> {
  // 1. Get current student's data & group
  let studentGroup = "ALL";
  const currentStudentDoc = await db.collection(STUDENTS_COLLECTION).doc(currentStudentUid).get();
  if (currentStudentDoc.exists) {
    const sData = currentStudentDoc.data()!;
    studentGroup = sData.group || sData.studentGroup || "ALL";
  }

  // 2. Query gamification profiles based on scope
  let queryRef = db.collection(GAMIFICATION_COLLECTION);
  let allProfilesSnap: FirebaseFirestore.QuerySnapshot;

  if (scope === "group" && studentGroup && studentGroup !== "ALL") {
    allProfilesSnap = await queryRef.where("group", "==", studentGroup).get();
  } else {
    allProfilesSnap = await queryRef.get();
  }

  const allProfiles: any[] = allProfilesSnap.docs.map(doc => ({
    id: doc.id,
    studentUid: doc.id,
    ...doc.data()
  }));

  // Ensure current user is in the list even if not initialized yet
  let userInList = allProfiles.find(p => p.studentUid === currentStudentUid);
  if (!userInList) {
    const freshDoc = await db.collection(GAMIFICATION_COLLECTION).doc(currentStudentUid).get();
    if (freshDoc.exists) {
      userInList = { id: currentStudentUid, studentUid: currentStudentUid, ...freshDoc.data() };
      allProfiles.push(userInList);
    } else {
      userInList = {
        id: currentStudentUid,
        studentUid: currentStudentUid,
        studentName: currentStudentDoc.exists ? (currentStudentDoc.data()?.name || "طالب") : "طالب",
        studentPhone: currentStudentDoc.exists ? (currentStudentDoc.data()?.studentPhone || "") : "",
        group: studentGroup,
        competitionPoints: 0,
        xp: 0,
        level: 1,
        rank: allProfiles.length + 1,
        previousRank: allProfiles.length + 1,
        rankChange: 0
      };
      allProfiles.push(userInList);
    }
  }

  // 3. Deterministic Sort
  allProfiles.sort(sortStudentsDeterministically);

  // 4. Assign dynamic ranks
  let currentUserRank = 1;
  let previousUserRank = userInList.previousRank || 0;
  let currentUserPoints = userInList.competitionPoints || 0;

  const rankedEntries: LeaderboardEntry[] = allProfiles.map((p, index) => {
    const rank = index + 1;
    const isCurrentUser = p.studentUid === currentStudentUid;
    if (isCurrentUser) {
      currentUserRank = rank;
      currentUserPoints = p.competitionPoints || 0;
      previousUserRank = p.previousRank || rank;
    }

    const name = p.studentName || "طالب مسجل";
    const avatarInitial = name.trim().charAt(0) || "ط";

    return {
      rank,
      studentUid: p.studentUid,
      studentName: name,
      studentPhoneMasked: maskPhone(p.studentPhone || ""),
      group: p.group || "ALL",
      competitionPoints: Number(p.competitionPoints || 0),
      level: Number(p.level || 1),
      xp: Number(p.xp || 0),
      avatarInitial,
      isCurrentUser
    };
  });

  const totalStudents = rankedEntries.length;

  // 5. Calculate real percentile: ahead of X% of students
  // If total is 1, percentile is 100%. Otherwise, (totalStudents - rank) / totalStudents * 100
  let percentile = 0;
  if (totalStudents > 1) {
    percentile = Math.max(0, Math.min(100, Math.round(((totalStudents - currentUserRank) / (totalStudents - 1)) * 100)));
  } else {
    percentile = 100;
  }

  // 6. Calculate rank change
  const rankChange = previousUserRank > 0 ? (previousUserRank - currentUserRank) : 0;

  // Asynchronously update student's rank cache and check notifications if needed
  if (userInList.rank !== currentUserRank) {
    db.collection(GAMIFICATION_COLLECTION).doc(currentStudentUid).update({
      rank: currentUserRank,
      previousRank: userInList.rank || currentUserRank,
      rankChange,
      updatedAt: new Date().toISOString()
    }).catch(err => console.warn("Rank cache update warning:", err));

    // Check rank change notification triggers
    checkAndNotifyRankChange(currentStudentUid, currentUserRank, previousUserRank, currentUserPoints).catch(
      err => console.warn("Rank notification trigger error:", err)
    );
  }

  // 7. Extract Top N
  const topStudents = rankedEntries.slice(0, limitCount);

  // 8. Find current user entry
  const currentUserEntry = rankedEntries.find(e => e.studentUid === currentStudentUid) || null;

  return {
    scope,
    groupName: studentGroup,
    totalStudents,
    topStudents,
    currentUserEntry,
    currentUserRank,
    percentile,
    rankChange,
    previousRank: previousUserRank
  };
}
