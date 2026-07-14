import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { BarChart3, Target, TrendingUp, TrendingDown, BookOpen, AlertCircle, ExternalLink, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import {
  STORAGE_KEYS, EXAM_OBJECTIVES, getExamObjective, getAllQuestionsIncludingDump, MS_LEARN_LINKS,
  loadStats, loadStreak
} from "@/lib/loadQuestions";
import type { QuizProgress, MistakeEntry } from "@/types/quiz";

interface TopicStat {
  topic: string;
  correct: number;
  wrong: number;
  accuracy: number;
  objective: 1 | 2 | 3 | 4;
}

export default function Analytics() {
  const [, setLocation] = useLocation();
  const [topicStats, setTopicStats] = useState<TopicStat[]>([]);
  const [objStats, setObjStats] = useState<Record<number, { correct: number; total: number }>>({});
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [streak] = useState(() => loadStreak());
  const [examBest, setExamBest] = useState<number | null>(null);

  useEffect(() => {
    const allQuestions = getAllQuestionsIncludingDump();
    const questionMap = new Map(allQuestions.map((q) => [String(q.id), q]));

    // Build per-topic stats from localStorage progress
    const topicMap: Record<string, { correct: number; wrong: number }> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) {
        const allProgress: Record<string, QuizProgress> = JSON.parse(raw);
        for (const prog of Object.values(allProgress)) {
          for (const [qId, answer] of Object.entries(prog.answers)) {
            const q = questionMap.get(String(qId));
            if (!q) continue;
            const topic = q.topic;
            if (!topicMap[topic]) topicMap[topic] = { correct: 0, wrong: 0 };
            if (answer.isCorrect) topicMap[topic].correct++;
            else topicMap[topic].wrong++;
          }
        }
      }
    } catch {}

    // Build topic stats array
    const statsArr: TopicStat[] = Object.entries(topicMap).map(([topic, s]) => {
      const total = s.correct + s.wrong;
      return {
        topic,
        correct: s.correct,
        wrong: s.wrong,
        accuracy: total > 0 ? Math.round((s.correct / total) * 100) : 0,
        objective: getExamObjective(topic),
      };
    }).sort((a, b) => a.accuracy - b.accuracy);
    setTopicStats(statsArr);

    // Per-objective stats
    const objMap: Record<number, { correct: number; total: number }> = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } };
    statsArr.forEach((s) => {
      const t = s.correct + s.wrong;
      objMap[s.objective].correct += s.correct;
      objMap[s.objective].total += t;
    });
    setObjStats(objMap);

    const gs = loadStats();
    setTotalAnswered(gs.totalAnswered);
    setTotalCorrect(gs.totalCorrect);

    // Exam history best score
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
      if (raw) {
        const h = JSON.parse(raw) as { score: number }[];
        if (h.length > 0) setExamBest(Math.max(...h.map((r) => r.score)));
      }
    } catch {}
  }, []);

  const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const weakTopics = topicStats.filter((s) => s.accuracy < 60 && s.correct + s.wrong >= 3);
  const strongTopics = topicStats.filter((s) => s.accuracy >= 80 && s.correct + s.wrong >= 3);

  // Mistaken topics from mistakes list
  const mistakeTopics: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
    if (raw) {
      const mistakes: MistakeEntry[] = JSON.parse(raw);
      mistakes.forEach((m) => {
        const t = m.question?.topic ?? "Unknown";
        mistakeTopics[t] = (mistakeTopics[t] ?? 0) + 1;
      });
    }
  } catch {}

  const mistakeTopicsSorted = Object.entries(mistakeTopics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const hasData = totalAnswered > 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">تحليل الأداء</h1>
            <p className="text-xs text-muted-foreground">نقاط القوة والضعف — خريطة أهداف الامتحان</p>
          </div>
        </div>

        {!hasData ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-border">
            <Brain className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-foreground mb-2">لا توجد بيانات كافية</h2>
            <p className="text-muted-foreground text-sm mb-6">أجب على بعض الأسئلة أولاً لرؤية التحليل</p>
            <button onClick={() => setLocation("/")} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">ابدأ التدريب</button>
          </div>
        ) : (
          <>
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatMini label="أُجيب" value={String(totalAnswered)} color="text-foreground" />
              <StatMini label="الدقة الكلية" value={`${overallAccuracy}%`} color={overallAccuracy >= 70 ? "text-green-400" : "text-red-400"} />
              <StatMini label="أفضل امتحان" value={examBest ? `${examBest}/1000` : "—"} color="text-orange-400" />
              <StatMini label="أيام المذاكرة" value={`${streak.totalDays}`} color="text-yellow-400" sub={streak.currentStreak > 1 ? `🔥 ${streak.currentStreak} أيام متتالية` : undefined} />
            </div>

            {/* Exam Objectives Coverage Map */}
            <section className="rounded-xl border border-border bg-card p-5 mb-6">
              <h2 className="font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                خريطة أهداف الامتحان الرسمية
              </h2>
              <div className="flex flex-col gap-4">
                {EXAM_OBJECTIVES.map((obj) => {
                  const s = objStats[obj.id] ?? { correct: 0, total: 0 };
                  const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
                  const color = acc >= 70 ? "hsl(142 71% 45%)" : acc >= 50 ? "hsl(217 91% 60%)" : "hsl(0 72% 51%)";
                  const label = acc >= 70 ? "قوي ✓" : acc >= 50 ? "متوسط" : s.total === 0 ? "لم يُدرس" : "ضعيف ⚠";
                  return (
                    <div key={obj.id}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <div>
                          <span className="font-semibold text-foreground">{obj.nameAr}</span>
                          <span className="text-xs text-muted-foreground mr-2">({obj.weight})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color }}>{label}</span>
                          <span className="font-bold text-sm" style={{ color }}>{acc}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${acc}%`, background: color }} />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{s.correct} صحيح / {s.total} سؤال</span>
                        <a href={MS_LEARN_LINKS[obj.id]} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                          Microsoft Learn <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Weak areas */}
            {weakTopics.length > 0 && (
              <section className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 mb-6">
                <h2 className="font-bold text-red-400 text-sm mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  نقاط الضعف — يُنصح بالمراجعة
                </h2>
                <div className="flex flex-col gap-2">
                  {weakTopics.slice(0, 6).map((s) => (
                    <div key={s.topic} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-foreground">{s.topic}</span>
                        <span className="text-xs text-muted-foreground mr-2">({s.correct + s.wrong} سؤال)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-red-500" style={{ width: `${s.accuracy}%` }} />
                        </div>
                        <span className="text-xs font-bold text-red-400 w-8 text-left">{s.accuracy}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setLocation("/spaced-review")}
                  className="mt-4 w-full py-2.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors"
                >
                  تدريب على نقاط الضعف ←
                </button>
              </section>
            )}

            {/* Strong areas */}
            {strongTopics.length > 0 && (
              <section className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 mb-6">
                <h2 className="font-bold text-green-400 text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  نقاط القوة ✓
                </h2>
                <div className="flex flex-wrap gap-2">
                  {strongTopics.slice(0, 8).map((s) => (
                    <span key={s.topic} className="text-xs px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                      {s.topic} — {s.accuracy}%
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Most mistakes by topic */}
            {mistakeTopicsSorted.length > 0 && (
              <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-6">
                <h2 className="font-bold text-amber-400 text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  أكثر المواضيع التي أخطأت فيها
                </h2>
                <div className="flex flex-col gap-2">
                  {mistakeTopicsSorted.map(([topic, count]) => (
                    <div key={topic} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{topic}</span>
                      <span className="text-amber-400 font-bold">{count} خطأ</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* All topics table */}
            {topicStats.length > 0 && (
              <section className="rounded-xl border border-border bg-card p-5 mb-6">
                <h2 className="font-bold text-foreground text-sm mb-4">كل المواضيع مُرتبة حسب الأداء</h2>
                <div className="flex flex-col gap-2 max-h-80 overflow-y-auto scrollbar-hide">
                  {topicStats.map((s) => {
                    const total = s.correct + s.wrong;
                    const color = s.accuracy >= 70 ? "text-green-400" : s.accuracy >= 50 ? "text-amber-400" : "text-red-400";
                    return (
                      <div key={s.topic} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{s.topic}</p>
                          <p className="text-[10px] text-muted-foreground">{s.correct}/{total} صحيح</p>
                        </div>
                        <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                          <div className="h-full rounded-full" style={{
                            width: `${s.accuracy}%`,
                            background: s.accuracy >= 70 ? "hsl(142 71% 45%)" : s.accuracy >= 50 ? "hsl(45 93% 47%)" : "hsl(0 72% 51%)"
                          }} />
                        </div>
                        <span className={`text-xs font-bold w-8 text-left ${color}`}>{s.accuracy}%</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setLocation("/exam-sim")} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500/15 border border-orange-500/20 text-orange-400 font-semibold text-sm hover:bg-orange-500/20">
                <Target className="w-4 h-4" />محاكي الامتحان
              </button>
              <button onClick={() => setLocation("/spaced-review")} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500/15 border border-purple-500/20 text-purple-400 font-semibold text-sm hover:bg-purple-500/20">
                <Brain className="w-4 h-4" />مراجعة ذكية
              </button>
              <button onClick={() => setLocation("/study")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50">
                <BookOpen className="w-4 h-4" />مذاكرة المفاهيم
              </button>
              <button onClick={() => setLocation("/mistakes")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50">
                <AlertCircle className="w-4 h-4" />الأخطاء المحفوظة
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatMini({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}
