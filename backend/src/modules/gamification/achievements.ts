import { RankingAchievement, StudentGamificationProfile } from "./types";

export const RANKING_ACHIEVEMENTS: Record<string, RankingAchievement> = {
  first_place: {
    id: "first_place",
    title: "المركز الأول 🏆",
    description: "احتلت المركز الأول في الترتيب العام للمنصة أو مسابقة رسمية.",
    icon: "🏆",
    pointsReward: 100
  },
  top_3: {
    id: "top_3",
    title: "أفضل 3 طلاب 🥇",
    description: "وصلت بجدارة إلى منصة التتويج لأفضل 3 مراكز.",
    icon: "🥇",
    pointsReward: 50
  },
  top_10: {
    id: "top_10",
    title: "نادي العشرة الأوائل 🔥",
    description: "دخلت قائمة أفضل 10 طلاب في الترتيب.",
    icon: "🔥",
    pointsReward: 30
  },
  rising_star: {
    id: "rising_star",
    title: "نجم صاعد 📈",
    description: "حققت قفزة مميزة وتقدمت 5 مراكز أو أكثر دفعة واحدة.",
    icon: "📈",
    pointsReward: 25
  },
  competition_champion: {
    id: "competition_champion",
    title: "بطل المسابقات 🎯",
    description: "حققت الفوز بالمركز الأول في مسابقة برمجية رسمية.",
    icon: "🎯",
    pointsReward: 100
  },
  competition_veteran: {
    id: "competition_veteran",
    title: "مشارك متميز 🎖",
    description: "شاركت بفاعلية في 3 مسابقات أو أكثر.",
    icon: "🎖",
    pointsReward: 40
  },
  points_collector: {
    id: "points_collector",
    title: "جامع النقاط 💎",
    description: "جمعت أكثر من 500 نقطة تنافسية في رصيدك.",
    icon: "💎",
    pointsReward: 30
  },
  points_master: {
    id: "points_master",
    title: "سيد التنافس 👑",
    description: "تجاوزت حاجز 1,500 نقطة تنافسية في رصيدك الأكاديمي.",
    icon: "👑",
    pointsReward: 75
  },
  first_attendance: {
    id: "first_attendance",
    title: "أول حضور 📅",
    description: "تم تسجيل أول حضور رسمي لك في المحاضرات.",
    icon: "📅",
    pointsReward: 15
  },
  attendance_streak_3: {
    id: "attendance_streak_3",
    title: "التزام أكاديمي 🔥",
    description: "حافظت على الحضور لـ 3 جلسات متتالية دون انقطاع.",
    icon: "🔥",
    pointsReward: 25
  },
  attendance_streak_7: {
    id: "attendance_streak_7",
    title: "بطل المواظبة 📚",
    description: "حققت سلسلة حضور قوية لـ 7 جلسات متتالية.",
    icon: "📚",
    pointsReward: 50
  },
  perfect_attendance: {
    id: "perfect_attendance",
    title: "الحضور المثالي 🏆",
    description: "حققت نسبة حضور كاملة 100% في 5 جلسات أو أكثر.",
    icon: "🏆",
    pointsReward: 75
  }
};

/**
 * Evaluates which ranking-related achievements the student has newly earned.
 */
export function evaluateRankingAchievements(
  current: StudentGamificationProfile,
  previous?: Partial<StudentGamificationProfile>,
  attendanceData?: {
    presentCount: number;
    currentStreak: number;
    attendanceRate: number;
    totalSessions: number;
  }
): RankingAchievement[] {
  const existingUnlocked = new Set(current.achievements || []);
  const newlyUnlocked: RankingAchievement[] = [];

  // 1. First Place
  if (!existingUnlocked.has("first_place") && current.rank === 1 && current.competitionPoints > 0) {
    existingUnlocked.add("first_place");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.first_place);
  }

  // 2. Top 3
  if (!existingUnlocked.has("top_3") && current.rank >= 1 && current.rank <= 3 && current.competitionPoints > 0) {
    existingUnlocked.add("top_3");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.top_3);
  }

  // 3. Top 10
  if (!existingUnlocked.has("top_10") && current.rank >= 1 && current.rank <= 10 && current.competitionPoints > 0) {
    existingUnlocked.add("top_10");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.top_10);
  }

  // 4. Rising Star (advanced by >= 5 positions)
  if (!existingUnlocked.has("rising_star")) {
    const prevRank = previous?.rank || current.previousRank || 0;
    if (prevRank > 0 && current.rank > 0 && (prevRank - current.rank) >= 5) {
      existingUnlocked.add("rising_star");
      newlyUnlocked.push(RANKING_ACHIEVEMENTS.rising_star);
    }
  }

  // 5. Points Collector (>= 500 points)
  if (!existingUnlocked.has("points_collector") && current.competitionPoints >= 500) {
    existingUnlocked.add("points_collector");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.points_collector);
  }

  // 6. Points Master (>= 1500 points)
  if (!existingUnlocked.has("points_master") && current.competitionPoints >= 1500) {
    existingUnlocked.add("points_master");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.points_master);
  }

  // 7. Competition Veteran (>= 3 competitions)
  if (!existingUnlocked.has("competition_veteran") && current.competitionsParticipated >= 3) {
    existingUnlocked.add("competition_veteran");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.competition_veteran);
  }

  // 8. Competition Champion (>= 1 competition won)
  if (!existingUnlocked.has("competition_champion") && current.competitionsWon >= 1) {
    existingUnlocked.add("competition_champion");
    newlyUnlocked.push(RANKING_ACHIEVEMENTS.competition_champion);
  }

  // 9. Attendance Achievements
  if (attendanceData) {
    if (!existingUnlocked.has("first_attendance") && attendanceData.presentCount >= 1) {
      existingUnlocked.add("first_attendance");
      newlyUnlocked.push(RANKING_ACHIEVEMENTS.first_attendance);
    }
    if (!existingUnlocked.has("attendance_streak_3") && attendanceData.currentStreak >= 3) {
      existingUnlocked.add("attendance_streak_3");
      newlyUnlocked.push(RANKING_ACHIEVEMENTS.attendance_streak_3);
    }
    if (!existingUnlocked.has("attendance_streak_7") && attendanceData.currentStreak >= 7) {
      existingUnlocked.add("attendance_streak_7");
      newlyUnlocked.push(RANKING_ACHIEVEMENTS.attendance_streak_7);
    }
    if (!existingUnlocked.has("perfect_attendance") && attendanceData.totalSessions >= 5 && attendanceData.attendanceRate === 100) {
      existingUnlocked.add("perfect_attendance");
      newlyUnlocked.push(RANKING_ACHIEVEMENTS.perfect_attendance);
    }
  }

  return newlyUnlocked;
}
