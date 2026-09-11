import { db } from "../../config/firebase";
import { Competition, LeaderboardEntry } from "./types";
import { maskPhone } from "./leaderboard";

const COMPETITIONS_COLLECTION = "competitions";
const STUDENTS_COLLECTION = "students";

// Predefined official platform competitions
export const DEFAULT_COMPETITIONS: Competition[] = [
  {
    id: "comp_python_autumn_2026",
    title: "تحدي بايثون الخريفي 2026 🐍",
    description: "حل أكبر عدد من التحديات البرمجية في مغامرة بايثون خلال شهر سبتمبر واجمع نقاط التنافس واعتلِ صدارة الترتيب!",
    category: "python",
    status: "active",
    startAt: "2026-09-01T00:00:00.000Z",
    endAt: "2026-09-30T23:59:59.999Z",
    rules: [
      "تحتسب نقاط التحديات المكتملة في مغامرة بايثون فقط خلال فترة المسابقة.",
      "الحل بدون استخدام تلميحات يمنح النقاط كاملة.",
      "تحديات الزعماء (Boss) تمنح أعلى عائد من نقاط التنافس.",
      "يتم الترتيب حسب إجمالي نقاط المسابقة مع كسر التعادل بالأسبقية."
    ],
    scoringPolicy: {
      easyPoints: 10,
      mediumPoints: 20,
      hardPoints: 40,
      bossPoints: 100,
      dailyPoints: 20,
      specialRules: "نقاط مضاعفة للتحديات المكتملة في المحاولة الأولى"
    },
    rewards: {
      firstPlacePoints: 500,
      secondPlacePoints: 300,
      thirdPlacePoints: 200,
      top10Points: 100,
      participantPoints: 30,
      badgeName: "وسام بطل بايثون الخريفي 🏆"
    },
    participantsCount: 84,
    featured: true
  },
  {
    id: "comp_algorithm_sprint_2026",
    title: "ماراثون حل المشكلات السريع ⚡",
    description: "تحدٍ مكثف يركز على مهارات التفكير المنطقي وكتابة كود بايثون سريع ونظيف في أقل عدد من الأسطر.",
    category: "weekly",
    status: "upcoming",
    startAt: "2026-10-01T00:00:00.000Z",
    endAt: "2026-10-07T23:59:59.999Z",
    rules: [
      "تفتح التحديات يومياً طوال أسبوع المسابقة.",
      "سرعة التسليم وجودة الكود تحدد نقاط المكافأة الإضافية."
    ],
    scoringPolicy: {
      easyPoints: 15,
      mediumPoints: 30,
      hardPoints: 60,
      bossPoints: 150,
      dailyPoints: 30
    },
    rewards: {
      firstPlacePoints: 400,
      secondPlacePoints: 250,
      thirdPlacePoints: 150,
      top10Points: 80,
      participantPoints: 25,
      badgeName: "درع المبرمج السريع ⚡"
    },
    participantsCount: 42,
    featured: false
  },
  {
    id: "comp_summer_prep_2026",
    title: "بطولة المبتدئين الصيفية 🏅",
    description: "البطولة التمهيدية لأساسيات لغة بايثون والمتغيرات والشروط البرمجية.",
    category: "special",
    status: "results_published",
    startAt: "2026-08-01T00:00:00.000Z",
    endAt: "2026-08-25T23:59:59.999Z",
    rules: [
      "انتهت المسابقة وتم اعتماد وتكريم الفائزين رسمياً."
    ],
    scoringPolicy: {
      easyPoints: 10,
      mediumPoints: 20,
      hardPoints: 40,
      bossPoints: 100,
      dailyPoints: 20
    },
    rewards: {
      firstPlacePoints: 300,
      secondPlacePoints: 200,
      thirdPlacePoints: 100,
      top10Points: 50,
      participantPoints: 20,
      badgeName: "وسام الرواد الأوائل 🏅"
    },
    participantsCount: 110,
    featured: false
  }
];

/**
 * Derives current dynamic status of a competition based on authoritative current time.
 */
export function deriveCompetitionStatus(comp: Competition): "upcoming" | "active" | "ended" | "results_published" {
  if (comp.status === "results_published") return "results_published";
  const now = Date.now();
  const startTime = new Date(comp.startAt).getTime();
  const endTime = new Date(comp.endAt).getTime();

  if (now < startTime) return "upcoming";
  if (now > endTime) return "ended";
  return "active";
}

/**
 * Ensures default competitions are seeded in Firestore if not already present.
 */
export async function ensureDefaultCompetitionsSeeded(): Promise<void> {
  for (const comp of DEFAULT_COMPETITIONS) {
    const ref = db.collection(COMPETITIONS_COLLECTION).doc(comp.id);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        ...comp,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }
}

/**
 * Fetches all competitions and computes student's enrollment and points.
 */
export async function getCompetitionsList(
  studentUid: string,
  filter: "all" | "active" | "ended" | "upcoming" = "all"
): Promise<Array<Competition & { isEnrolled: boolean; studentScore: number; studentRank: number }>> {
  await ensureDefaultCompetitionsSeeded();

  const snap = await db.collection(COMPETITIONS_COLLECTION).get();
  const competitions: Competition[] = snap.docs.map(d => ({
    id: d.id,
    ...(d.data() as any)
  }));

  const results = await Promise.all(
    competitions.map(async (comp) => {
      const dynamicStatus = deriveCompetitionStatus(comp);
      const computedComp = { ...comp, status: dynamicStatus };

      if (filter !== "all" && computedComp.status !== filter) {
        return null;
      }

      // Check enrollment
      const partDoc = await db
        .collection(COMPETITIONS_COLLECTION)
        .doc(comp.id)
        .collection("participants")
        .doc(studentUid)
        .get();

      let isEnrolled = false;
      let studentScore = 0;
      let studentRank = 0;

      if (partDoc.exists) {
        isEnrolled = true;
        const pData = partDoc.data()!;
        studentScore = Number(pData.score || 0);
        studentRank = Number(pData.rank || 0);
      }

      return {
        ...computedComp,
        isEnrolled,
        studentScore,
        studentRank
      };
    })
  );

  return results.filter(Boolean) as any[];
}

/**
 * Fetches single competition details with its event leaderboard.
 */
export async function getCompetitionDetails(studentUid: string, competitionId: string) {
  const compDoc = await db.collection(COMPETITIONS_COLLECTION).doc(competitionId).get();
  if (!compDoc.exists) {
    throw new Error("المسابقة غير موجودة.");
  }

  const compData = compDoc.data() as Competition;
  const dynamicStatus = deriveCompetitionStatus(compData);

  // Fetch participants
  const partSnap = await db
    .collection(COMPETITIONS_COLLECTION)
    .doc(competitionId)
    .collection("participants")
    .orderBy("score", "desc")
    .limit(20)
    .get();

  const participants: LeaderboardEntry[] = partSnap.docs.map((d, index) => {
    const data = d.data();
    return {
      rank: index + 1,
      studentUid: d.id,
      studentName: data.name || "طالب مشارك",
      studentPhoneMasked: maskPhone(data.phone || ""),
      group: data.group || "ALL",
      competitionPoints: Number(data.score || 0),
      level: Number(data.level || 1),
      xp: Number(data.xp || 0),
      avatarInitial: (data.name || "ط").trim().charAt(0),
      isCurrentUser: d.id === studentUid
    };
  });

  // Current student status
  const currentPartDoc = await db
    .collection(COMPETITIONS_COLLECTION)
    .doc(competitionId)
    .collection("participants")
    .doc(studentUid)
    .get();

  const isEnrolled = currentPartDoc.exists;
  const studentScore = currentPartDoc.exists ? (currentPartDoc.data()?.score || 0) : 0;
  const currentParticipantIndex = participants.findIndex(p => p.studentUid === studentUid);
  const studentRank = currentParticipantIndex >= 0 ? currentParticipantIndex + 1 : (isEnrolled ? participants.length + 1 : 0);

  return {
    competition: {
      ...compData,
      status: dynamicStatus
    },
    isEnrolled,
    studentScore,
    studentRank,
    leaderboard: participants
  };
}

/**
 * Enrolls a student into a competition.
 */
export async function joinCompetition(studentUid: string, competitionId: string) {
  const compDoc = await db.collection(COMPETITIONS_COLLECTION).doc(competitionId).get();
  if (!compDoc.exists) {
    throw new Error("المسابقة غير موجودة.");
  }

  const compData = compDoc.data() as Competition;
  const status = deriveCompetitionStatus(compData);
  if (status === "ended" || status === "results_published") {
    throw new Error("لا يمكن الانضمام لهذه المسابقة لأنها انتهت بالفعل.");
  }

  const studentDoc = await db.collection(STUDENTS_COLLECTION).doc(studentUid).get();
  const sData = studentDoc.exists ? studentDoc.data()! : {};

  const partRef = db
    .collection(COMPETITIONS_COLLECTION)
    .doc(competitionId)
    .collection("participants")
    .doc(studentUid);

  const existing = await partRef.get();
  if (!existing.exists) {
    await partRef.set({
      studentUid,
      name: sData.name || "طالب",
      phone: sData.studentPhone || "",
      group: sData.group || sData.studentGroup || "ALL",
      score: 0,
      joinedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    });

    // Increment count on competition
    await db.collection(COMPETITIONS_COLLECTION).doc(competitionId).update({
      participantsCount: (compData.participantsCount || 0) + 1
    });
  }

  return {
    success: true,
    message: "تم الانضمام للمسابقة بنجاح! حظاً موفقاً 🎯"
  };
}
