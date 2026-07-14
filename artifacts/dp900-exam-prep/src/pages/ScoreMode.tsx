import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Target, CheckSquare, Square, Trophy, BookOpen, HelpCircle, Layers, GitBranch, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { STORAGE_KEYS, loadStats } from "@/lib/loadQuestions";
import lessonsRaw from "@/data/dp900_lessons.json";
import flashcardsRaw from "@/data/dp900_flashcards.json";

const TOTAL_LESSONS = (lessonsRaw as { id: string }[]).length;
const TOTAL_FLASHCARDS = (flashcardsRaw as { id: string }[]).length;
const TOTAL_QUESTIONS = 306;

const CHECKLIST = [
  { id: "data-types", label: "فهمت أنواع البيانات (Structured / Semi / Unstructured)" },
  { id: "oltp-olap", label: "فرقت بين OLTP و OLAP" },
  { id: "batch-stream", label: "فرقت بين Batch و Streaming" },
  { id: "etl-elt", label: "فرقت بين ETL و ELT" },
  { id: "sql-cats", label: "حفظت DDL / DML / DCL" },
  { id: "azure-sql", label: "فهمت Azure SQL Options (Database, MI, VM)" },
  { id: "storage", label: "فهمت خدمات التخزين (Blob, Files, Table, ADLS)" },
  { id: "cosmos", label: "فهمت Cosmos DB APIs" },
  { id: "powerbi", label: "فهمت Power BI (Desktop vs Service, Dashboard vs Report)" },
  { id: "adf-synapse", label: "فهمت ADF / Synapse / Databricks / Stream Analytics" },
  { id: "mock", label: "خلصت Full Mock Exam (306 سؤال)" },
];

const STORAGE_CHECKLIST_KEY = "dp900_score_checklist";

export default function ScoreMode() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState<string[]>([]);
  const [stats, setStats] = useState(loadStats());
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [flashcardProgress, setFlashcardProgress] = useState<Record<string, string>>({});
  const [mistakesCount, setMistakesCount] = useState(0);

  useEffect(() => {
    try {
      const c = localStorage.getItem(STORAGE_CHECKLIST_KEY);
      if (c) setChecked(JSON.parse(c));
      const l = localStorage.getItem("dp900_lesson_completed");
      if (l) setCompletedLessons(JSON.parse(l));
      const f = localStorage.getItem("dp900_flashcard_progress");
      if (f) setFlashcardProgress(JSON.parse(f));
      const m = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (m) setMistakesCount((JSON.parse(m) as unknown[]).length);
    } catch {}
    setStats(loadStats());
  }, []);

  function toggleCheck(id: string) {
    const next = checked.includes(id) ? checked.filter((x) => x !== id) : [...checked, id];
    setChecked(next);
    localStorage.setItem(STORAGE_CHECKLIST_KEY, JSON.stringify(next));
  }

  // Readiness components
  const hasStartedQuiz = stats.totalAnswered > 0;
  const quizAccuracy = hasStartedQuiz ? stats.totalCorrect / stats.totalAnswered : 0;
  const lessonPct = TOTAL_LESSONS > 0 ? completedLessons.length / TOTAL_LESSONS : 0;
  const knownCards = Object.values(flashcardProgress).filter((s) => s === "known").length;
  const flashcardPct = TOTAL_FLASHCARDS > 0 ? knownCards / TOTAL_FLASHCARDS : 0;

  // Mistakes score: 100% when no mistakes AND has answered >10 questions, otherwise proportional
  const mistakeScore = !hasStartedQuiz
    ? 0
    : mistakesCount === 0
    ? 1
    : Math.max(0, 1 - mistakesCount / Math.max(stats.totalAnswered * 0.4, 15));

  const readinessScore = Math.round(
    quizAccuracy * 40 + lessonPct * 25 + mistakeScore * 20 + flashcardPct * 15
  );

  const readinessLabel =
    readinessScore >= 85 ? "جاهز جداً 🎉" :
    readinessScore >= 60 ? "محتاج مراجعة بسيطة 📖" :
    "محتاج مذاكرة أكتر 💪";

  const readinessBg =
    readinessScore >= 85 ? "border-green-500/30 bg-green-500/10 text-green-400" :
    readinessScore >= 60 ? "border-amber-500/30 bg-amber-500/10 text-amber-400" :
    "border-red-500/30 bg-red-500/10 text-red-400";

  const steps = [
    {
      step: "1", title: "ذاكر كل المفاهيم",
      desc: `${completedLessons.length} / ${TOTAL_LESSONS} درس مكتمل`,
      action: () => setLocation("/study"), icon: BookOpen,
      done: completedLessons.length === TOTAL_LESSONS, color: "blue",
    },
    {
      step: "2", title: "تدرب على كل موديول",
      desc: `${stats.totalAnswered} / ${TOTAL_QUESTIONS} سؤال مكتمل`,
      action: () => setLocation("/"), icon: HelpCircle,
      done: stats.totalAnswered >= TOTAL_QUESTIONS * 0.8, color: "purple",
    },
    {
      step: "3", title: "راجع الأخطاء",
      desc: mistakesCount === 0 ? "لا توجد أخطاء 🎉" : `${mistakesCount} خطأ محفوظ`,
      action: () => setLocation("/mistakes"), icon: AlertCircle,
      done: hasStartedQuiz && mistakesCount === 0, color: "red",
    },
    {
      step: "4", title: "راجع الفلاش كاردز",
      desc: `${knownCards} / ${TOTAL_FLASHCARDS} بطاقة متقنة`,
      action: () => setLocation("/flashcards"), icon: Layers,
      done: flashcardPct >= 0.8, color: "green",
    },
    {
      step: "5", title: "خذ Full Mock Exam",
      desc: "306 سؤال من كل المجالات",
      action: () => setLocation("/quiz/module-full"), icon: Target,
      done: (stats.moduleProgress?.["module-full"]?.completed) ?? false, color: "orange",
    },
    {
      step: "6", title: "راجع ورقة القواعد",
      desc: "كل القواعد في مكان واحد",
      action: () => setLocation("/cheatsheet"), icon: GitBranch,
      done: false, color: "teal",
    },
  ];

  const STEP_COLORS: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
  };

  const checkedCount = checked.length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">100 Score Mode</h1>
          </div>
          <p className="text-muted-foreground text-sm mr-13">خطوات مضمونة للوصول لـ 100% في DP-900</p>
        </div>

        {/* Readiness score */}
        <div className={`rounded-2xl border p-6 mb-8 text-center ${readinessBg}`}>
          <p className="text-5xl font-bold mb-2">{readinessScore}%</p>
          <p className="text-lg font-semibold mb-4">{readinessLabel}</p>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <ScorePill label="الكويز" value={Math.round(quizAccuracy * 100)} weight="40%" />
            <ScorePill label="الدروس" value={Math.round(lessonPct * 100)} weight="25%" />
            <ScorePill label="الأخطاء" value={Math.round(mistakeScore * 100)} weight="20%" />
            <ScorePill label="الفلاش" value={Math.round(flashcardPct * 100)} weight="15%" />
          </div>
        </div>

        {/* Steps */}
        <h2 className="text-base font-bold text-foreground mb-3">خطوات الوصول لـ 100%</h2>
        <div className="flex flex-col gap-2.5 mb-8">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <button
                key={s.step}
                onClick={s.action}
                className={`rounded-xl border p-4 flex items-center gap-3 text-right hover:border-primary/40 transition-all w-full ${
                  s.done ? "border-green-500/20 bg-green-500/5" : "border-border bg-card"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${STEP_COLORS[s.color] ?? ""}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">خطوة {s.step}</span>
                    {s.done && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                        ✓ مكتمل
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                <span className="text-muted-foreground text-sm">←</span>
              </button>
            );
          })}
        </div>

        {/* Final checklist */}
        <h2 className="text-base font-bold text-foreground mb-3">
          قائمة المراجعة النهائية
          <span className="text-muted-foreground font-normal text-sm mr-2">({checkedCount}/{CHECKLIST.length})</span>
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
          {CHECKLIST.map((item, i) => {
            const isChecked = checked.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggleCheck(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 text-right transition-colors hover:bg-muted/30 ${
                  i > 0 ? "border-t border-border/50" : ""
                }`}
              >
                {isChecked
                  ? <CheckSquare className="w-4 h-4 text-green-400 shrink-0" />
                  : <Square className="w-4 h-4 text-muted-foreground shrink-0" />
                }
                <span className={`text-sm leading-relaxed ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {checkedCount === CHECKLIST.length && (
          <div className="text-center p-5 rounded-xl bg-green-500/10 border border-green-500/20 mb-4">
            <p className="text-green-400 font-bold text-lg">🎉 أنت جاهز تماماً للامتحان!</p>
            <p className="text-green-300/70 text-sm mt-1">خلصت كل الخطوات — بالتوفيق! 💪</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ScorePill({ label, value, weight }: { label: string; value: number; weight: string }) {
  return (
    <div className="rounded-lg bg-black/20 p-2">
      <div className="text-lg font-bold">{value}%</div>
      <div className="opacity-80 text-xs">{label}</div>
      <div className="opacity-50 text-xs">({weight})</div>
    </div>
  );
}
