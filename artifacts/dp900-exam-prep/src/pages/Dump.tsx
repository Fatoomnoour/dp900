import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Trophy, Play, RotateCcw, CheckCircle, XCircle, Bookmark, Star, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { STORAGE_KEYS, loadStats, saveStats, loadBookmarks, getDumpQuestions } from "@/lib/loadQuestions";
import type { QuizProgress } from "@/types/quiz";

const DUMP_MODULE = "module-dump";

export default function Dump() {
  const [, setLocation] = useLocation();
  const [progress, setProgress] = useState<QuizProgress | null>(null);
  const [bookmarkCount, setBookmarkCount] = useState(0);

  const questions = getDumpQuestions();
  const totalQ = questions.length;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) {
        const all: Record<string, QuizProgress> = JSON.parse(raw);
        setProgress(all[DUMP_MODULE] ?? null);
      }
    } catch {}
    setBookmarkCount(loadBookmarks().filter((b) => b.moduleId === DUMP_MODULE).length);
  }, []);

  const answers = progress?.answers ?? {};
  const answered = Object.keys(answers).length;
  const correct = Object.values(answers).filter((a) => a.isCorrect).length;
  const wrong = Object.values(answers).filter((a) => !a.isCorrect).length;
  const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
  const pct = totalQ > 0 ? Math.round((answered / totalQ) * 100) : 0;
  const isCompleted = progress?.completed ?? false;
  const hasStarted = answered > 0;

  function resetDump() {
    if (!confirm("إعادة الـ DUMP Quiz من الأول؟ سيتم حذف كل إجاباتك.")) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const all: Record<string, QuizProgress> = raw ? JSON.parse(raw) : {};
      delete all[DUMP_MODULE];
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
      const stats = loadStats();
      delete stats.moduleProgress[DUMP_MODULE];
      let tc = 0, tw = 0;
      for (const m of Object.values(stats.moduleProgress)) { tc += m.correct; tw += m.wrong; }
      stats.totalCorrect = tc; stats.totalWrong = tw; stats.totalAnswered = tc + tw;
      saveStats(stats);
    } catch {}
    setProgress(null);
    setLocation(`/quiz/${DUMP_MODULE}`);
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-sm font-bold mb-4">
            🎉 GOOD NEWS &amp;&amp; GOOD LUCK
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Azure Data Fundamentals
          </h1>
          <h2 className="text-lg font-semibold text-primary mb-3">
            DP-900 Real Exam DUMP
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-md mx-auto">
            أسئلة حقيقية من امتحانات سابقة — {totalQ} سؤال مُتحقق منه. هذا الـ DUMP من أفضل المصادر للمراجعة النهائية قبل الامتحان.
          </p>
        </div>

        {/* Progress card */}
        {hasStarted ? (
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-foreground">تقدمك الحالي</h3>
              {isCompleted && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20 font-semibold">
                  ✓ مكتمل
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{answered}</div>
                <div className="text-xs text-muted-foreground mt-0.5">أُجيب</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{correct}</div>
                <div className="text-xs text-muted-foreground mt-0.5">صحيح</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{wrong}</div>
                <div className="text-xs text-muted-foreground mt-0.5">خطأ</div>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: accuracy >= 70 ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{pct}% مكتمل</span>
              <span className={accuracy >= 70 ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
                {accuracy}% دقة
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 mb-6 text-center">
            <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">لم تبدأ بعد — ابدأ الـ DUMP Quiz الآن</p>
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-xl font-bold text-foreground">{totalQ}</div>
            <div className="text-xs text-muted-foreground mt-1">سؤال</div>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-center">
            <div className="text-xl font-bold text-yellow-400">{bookmarkCount}</div>
            <div className="text-xs text-muted-foreground mt-1">محفوظ</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <div className="text-xl font-bold text-foreground">{totalQ - answered}</div>
            <div className="text-xs text-muted-foreground mt-1">متبقي</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setLocation(`/quiz/${DUMP_MODULE}`)}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 transition-colors"
          >
            {hasStarted && !isCompleted ? (
              <>
                <Play className="w-5 h-5" />
                كمّل من حيث وقفت
              </>
            ) : isCompleted ? (
              <>
                <CheckCircle className="w-5 h-5" />
                راجع الإجابات
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                ابدأ DUMP Quiz
              </>
            )}
          </button>

          {bookmarkCount > 0 && (
            <button
              onClick={() => setLocation("/bookmarks")}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-yellow-400 font-semibold hover:bg-yellow-500/10 transition-colors"
            >
              <Bookmark className="w-4 h-4 fill-current" />
              مراجعة المحفوظات ({bookmarkCount})
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            {hasStarted && (
              <button
                onClick={resetDump}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground hover:border-destructive/40 hover:text-destructive transition-colors text-sm font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                ريست وابدأ من جديد
              </button>
            )}
            <button
              onClick={() => setLocation("/mistakes")}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm font-medium ${!hasStarted ? "col-span-2" : ""}`}
            >
              <AlertCircle className="w-4 h-4" />
              الأخطاء المحفوظة
            </button>
          </div>
        </div>

        {/* Info card */}
        <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <h3 className="text-sm font-semibold text-blue-400 mb-2">📋 معلومات عن الـ DUMP</h3>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• <span className="text-foreground font-medium">82 سؤال</span> من امتحانات DP-900 حقيقية وموثقة</li>
            <li>• أنواع الأسئلة: اختيار واحد، اختيار متعدد، صح/خطأ، مطابقة</li>
            <li>• يمكنك <span className="text-yellow-400">حفظ ⭐ أي سؤال</span> للمراجعة لاحقاً</li>
            <li>• يمكنك <span className="text-blue-400">ريست الكويز</span> وحل الأسئلة من جديد في أي وقت</li>
            <li>• كل إجاباتك محفوظة تلقائياً ومتزامنة مع صفحة الأخطاء</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
