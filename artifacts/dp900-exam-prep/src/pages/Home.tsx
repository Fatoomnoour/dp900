import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  BookOpen, Brain, AlertCircle, BarChart3, Trophy,
  RotateCcw, Play, Target, Layers, GitBranch, CheckCircle2, ArrowLeft,
  Clock, Flame, Zap, Table2
} from "lucide-react";
import { getModules, STORAGE_KEYS, loadStats, loadStreak } from "@/lib/loadQuestions";
import Navbar from "@/components/Navbar";
import type { GlobalStats, QuizProgress } from "@/types/quiz";
import lessonsRaw from "@/data/dp900_lessons.json";
import flashcardsRaw from "@/data/dp900_flashcards.json";

const TOTAL_LESSONS = (lessonsRaw as { id: string }[]).length;
const TOTAL_FLASHCARDS = (flashcardsRaw as { id: string }[]).length;

export default function Home() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<GlobalStats>(() => loadStats());
  const [progress, setProgress] = useState<Record<string, QuizProgress>>({});
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [streak, setStreak] = useState(() => loadStreak());
  const modules = getModules();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) setProgress(JSON.parse(raw));
      const lc = localStorage.getItem("dp900_lesson_completed");
      if (lc) setCompletedLessons(JSON.parse(lc));
    } catch {}
    setStats(loadStats());
    setStreak(loadStreak());
  }, []);

  useEffect(() => {
    const onStorage = () => { setStats(loadStats()); setStreak(loadStreak()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function resetAll() {
    if (!confirm("هل تريد إعادة ضبط كل التقدم والإجابات؟ لا يمكن التراجع عن هذا.")) return;
    localStorage.removeItem(STORAGE_KEYS.PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.MISTAKES);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    setStats({ totalCorrect: 0, totalWrong: 0, totalAnswered: 0, moduleProgress: {} });
    setProgress({});
  }

  const fullMod = modules.find((m) => m.id === "module-full");
  const totalQ = fullMod?.questions.length ?? 306;
  const answeredPct = totalQ > 0 ? Math.round((stats.totalAnswered / totalQ) * 100) : 0;
  const accuracy = stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) : 0;
  const lessonPct = TOTAL_LESSONS > 0 ? Math.round((completedLessons.length / TOTAL_LESSONS) * 100) : 0;

  // Readiness score (simple)
  const quizAccuracy = stats.totalAnswered > 0 ? stats.totalCorrect / stats.totalAnswered : 0;
  const lessonRatio = completedLessons.length / TOTAL_LESSONS;
  const readiness = Math.round(quizAccuracy * 50 + lessonRatio * 30 + Math.min(answeredPct / 100, 1) * 20);

  const mistakesCount = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (raw) return (JSON.parse(raw) as unknown[]).length;
    } catch {}
    return 0;
  })();

  const readinessColor = readiness >= 80 ? "text-green-400" : readiness >= 50 ? "text-amber-400" : "text-red-400";
  const readinessBarColor = readiness >= 80 ? "bg-green-500" : readiness >= 50 ? "bg-amber-500" : "bg-red-500";
  const readinessLabel = readiness >= 80 ? "جاهز للامتحان 🎉" : readiness >= 50 ? "قريب من الجاهزية 📖" : "استمر في المذاكرة 💪";

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
              مرحباً في <span className="text-primary">DP-900 Prep</span>
            </h1>
            <p className="text-muted-foreground text-sm">افهم المفاهيم، تدرب على الأسئلة، وحقق الـ 100% 🎯</p>
          </div>
          {/* Streak badge */}
          {streak.currentStreak > 0 && (
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="font-bold text-sm">{streak.currentStreak}</span>
              <span className="text-xs">يوم</span>
            </div>
          )}
        </div>

        {/* Readiness Bar */}
        {stats.totalAnswered > 0 && (
          <div className="rounded-xl border border-border bg-card p-4 mb-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">مستوى الجاهزية للامتحان</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${readinessColor}`}>{readiness}%</span>
                <button onClick={() => setLocation("/score-mode")} className="text-xs text-muted-foreground hover:text-foreground underline">تفاصيل</button>
              </div>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden mb-1.5">
              <div className={`h-full rounded-full transition-all duration-700 ${readinessBarColor}`} style={{ width: `${readiness}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{readinessLabel}</span>
              <button onClick={() => setLocation("/analytics")} className="text-blue-400 hover:text-blue-300 flex items-center gap-1">
                تحليل مفصل ←
              </button>
            </div>
          </div>
        )}

        {/* Two Tracks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <TrackCard
            icon={<BookOpen className="w-5 h-5 text-blue-400" />}
            badge="Study Mode"
            title="ابدأ مذاكرة المفاهيم"
            desc="افهم كل مفهوم مع المقارنات وفخاخ الامتحان والكلمات المفتاحية"
            stat={`${completedLessons.length} / ${TOTAL_LESSONS} درس مكتمل`}
            pct={lessonPct}
            barColor="bg-blue-400"
            borderColor="border-blue-500/30 hover:border-blue-500/60 bg-gradient-to-br from-blue-500/8 to-transparent"
            btnColor="bg-blue-600 hover:bg-blue-500 text-white"
            onClick={() => setLocation("/study")}
            cta="ابدأ المذاكرة"
          />
          <TrackCard
            icon={<Brain className="w-5 h-5 text-primary" />}
            badge="Practice Mode"
            title="ابدأ تدريب الأسئلة"
            desc="تدرب على 306 سؤالًا مرقمة من 1 إلى 304، مع نسختي 217 و276، وبنص الـPDF الكامل"
            stat={`${stats.totalAnswered} / ${totalQ} سؤال مكتمل`}
            pct={answeredPct}
            barColor="bg-primary"
            borderColor="border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/8 to-transparent"
            btnColor="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => setLocation("/quiz/module-1")}
            cta="ابدأ التدريب"
          />
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard icon={<BarChart3 className="w-4 h-4 text-primary" />} label="التقدم الكلي" value={`${answeredPct}%`} sub={`أجبت ${stats.totalAnswered} / ${totalQ}`} subLtr />
          <StatCard icon={<Trophy className="w-4 h-4 text-green-400" />} label="الدقة" value={`${accuracy}%`} sub={`${stats.totalCorrect} صحيح`} />
          <StatCard icon={<AlertCircle className="w-4 h-4 text-red-400" />} label="الأخطاء" value={`${mistakesCount}`} sub="إجابات خاطئة" />
          <StatCard icon={<Flame className="w-4 h-4 text-orange-400" />} label="المذاكرة" value={`${streak.totalDays} يوم`} sub={streak.currentStreak > 1 ? `🔥 ${streak.currentStreak} متتالي` : "استمر!"} />
        </div>

        {/* Quick Links — all tools */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <QuickLink icon={<Clock className="w-4 h-4" />} label="محاكي الامتحان" sub="45 دق / 40 سؤال" onClick={() => setLocation("/exam-sim")} color="orange" />
          <QuickLink icon={<BarChart3 className="w-4 h-4" />} label="تحليل الأداء" sub="نقاط القوة والضعف" onClick={() => setLocation("/analytics")} color="blue" />
          <QuickLink icon={<Brain className="w-4 h-4" />} label="مراجعة ذكية" sub={`${mistakesCount} أخطاء للمراجعة`} onClick={() => setLocation("/spaced-review")} color="purple" />
          <QuickLink icon={<Target className="w-4 h-4" />} label="100 Score Mode" sub="خطة النجاح" onClick={() => setLocation("/score-mode")} highlight />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <QuickLink icon={<Layers className="w-4 h-4" />} label="فلاش كاردز" sub={`${TOTAL_FLASHCARDS} بطاقة`} onClick={() => setLocation("/flashcards")} />
          <QuickLink icon={<GitBranch className="w-4 h-4" />} label="شجرة القرار" sub="6 أشجار" onClick={() => setLocation("/decision-trees")} />
          <QuickLink icon={<CheckCircle2 className="w-4 h-4" />} label="ورقة القواعد" sub="12 موضوع" onClick={() => setLocation("/cheatsheet")} />
          <QuickLink icon={<Zap className="w-4 h-4" />} label="DUMP Quiz" sub="82 سؤال حقيقي" onClick={() => setLocation("/dump")} color="green" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <QuickLink icon={<Zap className="w-4 h-4" />} label="الكويز السريع ⚡" sub="10 أسئلة × 5 دقائق" onClick={() => setLocation("/quick-quiz")} color="yellow" />
          <QuickLink icon={<Table2 className="w-4 h-4" />} label="مقارنة الخدمات" sub="14 خدمة Azure" onClick={() => setLocation("/compare")} color="teal" />
        </div>

        {/* Module grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">الوحدات الدراسية</h2>
          {stats.totalAnswered > 0 && (
            <button
              onClick={resetAll}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">إعادة الضبط</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {modules.filter((m) => m.id !== "module-full" && m.id !== "module-dump").map((mod) => {
            const modProgress = stats.moduleProgress[mod.id];
            const modPct = modProgress
              ? Math.round(((modProgress.correct + modProgress.wrong) / mod.questions.length) * 100)
              : 0;
            const modAcc =
              modProgress && modProgress.correct + modProgress.wrong > 0
                ? Math.round((modProgress.correct / (modProgress.correct + modProgress.wrong)) * 100)
                : null;
            const inProgress = progress[mod.id] && !progress[mod.id].completed;
            const completed = modProgress?.completed;

            return (
              <div
                key={mod.id}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all cursor-pointer group"
                onClick={() => setLocation(`/quiz/${mod.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{mod.nameEn}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 mr-2">
                    {completed && <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">✓</span>}
                    {inProgress && !completed && <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">جارٍ</span>}
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">{mod.questions.length} سؤال</span>
                  </div>
                </div>
                {modPct > 0 ? (
                  <>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${modPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{modPct}% مكتمل</span>
                      {modAcc !== null && <span className={modAcc >= 70 ? "text-green-400" : "text-red-400"}>{modAcc}% دقة</span>}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                    <Play className="w-3 h-3" />
                    <span>أسئلة {mod.range}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Full mock exam */}
        {fullMod && (
          <div
            className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-5 cursor-pointer hover:border-primary/60 transition-all"
            onClick={() => setLocation("/quiz/module-full")}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground">{fullMod.name}</h3>
                <p className="text-sm text-muted-foreground">{fullMod.questions.length} سؤال من جميع المجالات</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shrink-0">
                <Play className="w-4 h-4" />ابدأ
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function TrackCard({ icon, badge, title, desc, stat, pct, barColor, borderColor, btnColor, onClick, cta }: {
  icon: React.ReactNode; badge: string; title: string; desc: string;
  stat: string; pct: number; barColor: string; borderColor: string; btnColor: string;
  onClick: () => void; cta: string;
}) {
  return (
    <div onClick={onClick} className={`rounded-xl border p-5 cursor-pointer transition-all ${borderColor}`}>
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{badge}</span></div>
      <h3 className="font-bold text-foreground text-base mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{desc}</p>
      {pct > 0 && (
        <div className="mb-4">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1"><div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} /></div>
          <p className="text-xs text-muted-foreground">{stat}</p>
        </div>
      )}
      <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${btnColor}`}>{cta}<ArrowLeft className="w-3.5 h-3.5" /></div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, subLtr }: { icon: React.ReactNode; label: string; value: string; sub: string; subLtr?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2 mb-1.5">{icon}<span className="text-xs text-muted-foreground">{label}</span></div>
      <div className="text-xl font-bold text-foreground" dir={subLtr ? "ltr" : undefined}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
    </div>
  );
}

function QuickLink({ icon, label, sub, onClick, highlight, color }: {
  icon: React.ReactNode; label: string; sub: string; onClick: () => void; highlight?: boolean; color?: string;
}) {
  const colorMap: Record<string, string> = {
    orange: "border-orange-500/30 bg-orange-500/5 hover:border-orange-500/50",
    blue: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",
    purple: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",
    green: "border-green-500/30 bg-green-500/5 hover:border-green-500/50",
  };
  const iconColorMap: Record<string, string> = {
    orange: "text-orange-400", blue: "text-blue-400", purple: "text-purple-400", green: "text-green-400",
  };
  const cls = highlight
    ? "border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50"
    : color ? colorMap[color] : "border-border bg-card";
  const iconCls = highlight ? "text-yellow-400" : color ? iconColorMap[color] : "text-muted-foreground";

  return (
    <button onClick={onClick} className={`rounded-xl border p-3.5 text-right transition-all hover:border-primary/40 w-full ${cls}`}>
      <div className={`mb-2 ${iconCls}`}>{icon}</div>
      <p className="text-sm font-semibold text-foreground leading-tight">{label}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </button>
  );
}
