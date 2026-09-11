import { z } from "zod";

// ==========================================
// 1. DATA MODELS & INTERFACES
// ==========================================

export interface StudentGamificationProfile {
  studentUid: string;
  studentName: string;
  studentPhone: string;
  group: string;
  xp: number;
  level: number;
  competitionPoints: number;
  rank: number;
  previousRank: number;
  rankChange: number; // positive = advanced (e.g. +4), negative = dropped
  achievements: string[];
  currentStreak: number;
  challengesCompleted: number;
  competitionsWon: number;
  competitionsParticipated: number;
  rankingHistory: Array<{
    date: string;
    rank: number;
    points: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export type PointSourceType =
  | "python_adventure"
  | "daily_challenge"
  | "boss_challenge"
  | "exam"
  | "assignment"
  | "competition_award"
  | "attendance";

export interface PointLedgerEntry {
  id: string; // e.g. ledger_${studentUid}_${sourceType}_${sourceId}
  studentUid: string;
  sourceType: PointSourceType;
  sourceId: string;
  points: number;
  reason: string;
  createdAt: string;
  competitionId: string | null;
  metadata?: Record<string, any>;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  category: "python" | "general" | "weekly" | "monthly" | "special";
  status: "upcoming" | "active" | "ended" | "results_published";
  startAt: string; // ISO date
  endAt: string; // ISO date
  rules: string[];
  scoringPolicy: {
    easyPoints: number;
    mediumPoints: number;
    hardPoints: number;
    bossPoints: number;
    dailyPoints: number;
    specialRules?: string;
  };
  rewards: {
    firstPlacePoints: number;
    secondPlacePoints: number;
    thirdPlacePoints: number;
    top10Points: number;
    participantPoints: number;
    badgeName?: string;
  };
  participantsCount: number;
  featured?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  studentUid: string;
  studentName: string;
  studentPhoneMasked: string;
  group: string;
  competitionPoints: number;
  level: number;
  xp: number;
  avatarInitial: string;
  isCurrentUser?: boolean;
}

export type NotificationType =
  | "rank_up"
  | "rank_down"
  | "competition_started"
  | "competition_ending"
  | "competition_ended"
  | "competition_winner"
  | "top_10_entry"
  | "achievement_unlocked"
  | "points_earned"
  | "level_up";

export interface InAppNotification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionType: "ranking" | "competition" | "achievements" | "exam" | "adventure" | null;
  actionId: string | null;
  metadata?: Record<string, any>;
}

export interface RankingAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  pointsReward: number;
}

// ==========================================
// 2. ZOD VALIDATION SCHEMAS
// ==========================================

export const GetLeaderboardSchema = z.object({
  scope: z.enum(["group", "course", "global"]).default("group"),
  limit: z.number().int().min(1).max(50).default(10),
  competitionId: z.string().optional()
});

export const GetCompetitionsSchema = z.object({
  filter: z.enum(["all", "active", "ended", "upcoming"]).default("all")
});

export const GetCompetitionDetailsSchema = z.object({
  competitionId: z.string().min(1, "معرف المسابقة مطلوب")
});

export const JoinCompetitionSchema = z.object({
  competitionId: z.string().min(1, "معرف المسابقة مطلوب")
});

export const GetNotificationsSchema = z.object({
  limit: z.number().int().min(1).max(50).default(20),
  unreadOnly: z.boolean().default(false)
});

export const MarkNotificationReadSchema = z.object({
  notificationId: z.string().min(1, "معرف الإشعار مطلوب")
});
