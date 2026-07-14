import type { Question, Module, GlobalStats, BookmarkEntry } from "../types/quiz";

import data001 from "../data/dp900_001_050.json";
import data051 from "../data/dp900_051_100.json";
import data101 from "../data/dp900_101_150.json";
import data151 from "../data/dp900_151_200.json";
import data201 from "../data/dp900_201_250.json";
import data251 from "../data/dp900_251_304.json";
import dataDump from "../data/dp900_dump.json";

const allFiles = [data001, data051, data101, data151, data201, data251];

export const MODULES: Omit<Module, "questions">[] = [
  { id: "module-1", name: "Core Data Concepts", nameEn: "Core Data Concepts", range: "001-050", startId: 1, endId: 50 },
  { id: "module-2", name: "Relational Data", nameEn: "Relational Data in Azure", range: "051-100", startId: 51, endId: 100 },
  { id: "module-3", name: "Non-Relational Data", nameEn: "Non-Relational Data in Azure", range: "101-150", startId: 101, endId: 150 },
  { id: "module-4", name: "Analytics on Azure", nameEn: "Analytics Workloads in Azure", range: "151-200", startId: 151, endId: 200 },
  { id: "module-5", name: "Azure Services Review", nameEn: "Azure Data Services Review", range: "201-250", startId: 201, endId: 250 },
  { id: "module-6", name: "Final Review", nameEn: "Final Review & Mixed Topics", range: "251-304", startId: 251, endId: 304 },
  { id: "module-full", name: "Full Mock Exam", nameEn: "Full Mock Exam (306 entries, Q1-Q304)", range: "001-304", startId: 1, endId: 304 },
  { id: "module-dump", name: "DUMP Questions", nameEn: "Real Exam Dump (82 Questions)", range: "dump", startId: 0, endId: 0 },
];

function getAllRawQuestions(): Question[] {
  return allFiles.flatMap((file) => file.questions as unknown as Question[]);
}

export function getDumpQuestions(): Question[] {
  return (dataDump as { questions: unknown[] }).questions as Question[];
}

export function getAllQuestions(): Question[] {
  return getAllRawQuestions();
}

export function getAllQuestionsIncludingDump(): Question[] {
  return [...getAllRawQuestions(), ...getDumpQuestions()];
}

export function getModules(): Module[] {
  const all = getAllRawQuestions();
  return MODULES.map((m) => {
    if (m.id === "module-full") return { ...m, questions: all };
    if (m.id === "module-dump") return { ...m, questions: getDumpQuestions() };
    const qs = all.filter((q) => {
      const numId = typeof q.id === "string" ? parseFloat(q.id) : q.id;
      return numId >= m.startId && numId <= m.endId;
    });
    return { ...m, questions: qs };
  });
}

export function getQuestionsByModule(moduleId: string): Question[] {
  const mod = getModules().find((m) => m.id === moduleId);
  return mod?.questions ?? [];
}

export function getQuestionStats(progress: Record<string, { correct: number; wrong: number; total: number; completed: boolean }>) {
  let totalCorrect = 0, totalWrong = 0, totalAnswered = 0;
  for (const mod of Object.values(progress)) {
    totalCorrect += mod.correct;
    totalWrong += mod.wrong;
    totalAnswered += mod.correct + mod.wrong;
  }
  const totalQuestions = getAllQuestions().length;
  return { totalCorrect, totalWrong, totalAnswered, totalQuestions };
}

// ── Exam Objectives ─────────────────────────────────────────────────────────

export const EXAM_OBJECTIVES = [
  { id: 1, name: "Core Data Concepts", nameAr: "مفاهيم البيانات الأساسية", weight: "25-30%" },
  { id: 2, name: "Relational Data on Azure", nameAr: "البيانات العلائقية في Azure", weight: "25-30%" },
  { id: 3, name: "Non-Relational Data on Azure", nameAr: "البيانات غير العلائقية في Azure", weight: "25-30%" },
  { id: 4, name: "Analytics Workloads on Azure", nameAr: "أعباء عمل التحليلات في Azure", weight: "25-30%" },
] as const;

export function getExamObjective(topic: string): 1 | 2 | 3 | 4 {
  const t = topic.toLowerCase();
  // Objective 4: Analytics
  if (t.includes("synapse") || t.includes("power bi") || t.includes("powerbi") ||
      t.includes("databricks") || t.includes("hdinsight") || t.includes("stream analytics") ||
      t.includes("data factory") || t.includes("data warehouse") || t.includes("analytics workload") ||
      t.includes("spark") || t.includes("olap") || t.includes("adf")) return 4;
  // Objective 3: Non-Relational
  if (t.includes("non-relational") || t.includes("non relational") || t.includes("nosql") ||
      t.includes("cosmos") || t.includes("blob") || t.includes("data lake") ||
      t.includes("table storage") || t.includes("azure files") || t.includes("queue storage") ||
      t.includes("redis") || (t.includes("storage") && !t.includes("sql"))) return 3;
  // Objective 2: Relational
  if ((t.includes("relational") && !t.includes("non")) ||
      t.includes("azure sql") || t.includes("sql database") || t.includes("sql server") ||
      t.includes("managed instance") || t.includes("postgresql") || t.includes("mysql") ||
      t.includes("mariadb") || t.includes("ddl") || t.includes("dml") || t.includes("normalize") ||
      (t.includes("sql") && !t.includes("cosmos"))) return 2;
  // Default: Objective 1: Core Data Concepts
  return 1;
}

export const MS_LEARN_LINKS: Record<number, string> = {
  1: "https://learn.microsoft.com/en-us/training/modules/explore-core-data-concepts/",
  2: "https://learn.microsoft.com/en-us/training/modules/explore-relational-data-offerings/",
  3: "https://learn.microsoft.com/en-us/training/modules/explore-non-relational-data-offerings-azure/",
  4: "https://learn.microsoft.com/en-us/training/modules/explore-analytics-workloads-azure/",
};

// ── Storage Keys ─────────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  PROGRESS: "dp900_progress",
  MISTAKES: "dp900_mistakes",
  STATS: "dp900_stats",
  BOOKMARKS: "dp900_bookmarks",
  STREAK: "dp900_streak",
  EXAM_HISTORY: "dp900_exam_history",
  SPACED_REVIEW: "dp900_spaced_review",
} as const;

// ── Stats ─────────────────────────────────────────────────────────────────────

export function loadStats(): GlobalStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (raw) return JSON.parse(raw) as GlobalStats;
  } catch {}
  return { totalCorrect: 0, totalWrong: 0, totalAnswered: 0, moduleProgress: {} };
}

export function saveStats(stats: GlobalStats): void {
  localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
}

// ── Bookmarks ─────────────────────────────────────────────────────────────────

export function loadBookmarks(): BookmarkEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    if (raw) return JSON.parse(raw) as BookmarkEntry[];
  } catch {}
  return [];
}

export function saveBookmarks(bookmarks: BookmarkEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
}

export function isBookmarked(questionId: string | number, moduleId: string): boolean {
  return loadBookmarks().some((b) => b.questionId === questionId && b.moduleId === moduleId);
}

export function toggleBookmark(question: Question, moduleId: string): boolean {
  const all = loadBookmarks();
  const idx = all.findIndex((b) => b.questionId === question.id && b.moduleId === moduleId);
  if (idx >= 0) {
    all.splice(idx, 1);
    saveBookmarks(all);
    return false;
  } else {
    all.push({ questionId: question.id, moduleId, questionText: question.question, topic: question.topic, savedAt: Date.now() });
    saveBookmarks(all);
    return true;
  }
}

// ── Study Streak ──────────────────────────────────────────────────────────────

export interface StudyStreak {
  lastStudyDate: string; // YYYY-MM-DD
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function loadStreak(): StudyStreak {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STREAK);
    if (raw) return JSON.parse(raw) as StudyStreak;
  } catch {}
  return { lastStudyDate: "", currentStreak: 0, longestStreak: 0, totalDays: 0 };
}

export function recordStudyActivity(): StudyStreak {
  const today = todayStr();
  const streak = loadStreak();
  if (streak.lastStudyDate === today) return streak; // already recorded today

  const yesterday = yesterdayStr();
  const newCurrentStreak = streak.lastStudyDate === yesterday ? streak.currentStreak + 1 : 1;
  const updated: StudyStreak = {
    lastStudyDate: today,
    currentStreak: newCurrentStreak,
    longestStreak: Math.max(streak.longestStreak, newCurrentStreak),
    totalDays: streak.totalDays + 1,
  };
  localStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify(updated));
  return updated;
}
