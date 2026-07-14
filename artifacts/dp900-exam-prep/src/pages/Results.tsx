import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Trophy, RotateCcw, Home, AlertCircle, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { getQuestionsByModule, STORAGE_KEYS } from "@/lib/loadQuestions";
import { playComplete, playCorrect } from "@/lib/sounds";
import Navbar from "@/components/Navbar";
import type { QuizProgress } from "@/types/quiz";

export default function Results() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const [, setLocation] = useLocation();
  const questions = getQuestionsByModule(moduleId);

  let progress: QuizProgress | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    if (raw) {
      const all: Record<string, QuizProgress> = JSON.parse(raw);
      progress = all[moduleId] ?? null;
    }
  } catch {}

  const answers = progress?.answers ?? {};
  const correctCount = Object.values(answers).filter((a) => a.isCorrect).length;
  const wrongCount = Object.values(answers).filter((a) => !a.isCorrect).length;
  const totalAnswered = correctCount + wrongCount;
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const unanswered = questions.length - totalAnswered;

  useEffect(() => {
    if (accuracy === 100 && correctCount > 0) {
      playComplete();
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.55 }, colors: ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"] });
        setTimeout(() => confetti({ particleCount: 100, spread: 120, origin: { y: 0.35 }, colors: ["#f59e0b", "#ef4444", "#06b6d4"] }), 500);
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.2, y: 0.6 } }), 1000);
        setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { x: 0.8, y: 0.6 } }), 1200);
      });
    } else if (accuracy >= 80) {
      playCorrect();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function restart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const all: Record<string, QuizProgress> = raw ? JSON.parse(raw) : {};
      delete all[moduleId];
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
    } catch {}
    setLocation(`/quiz/${moduleId}`);
  }

  const grade =
    accuracy === 100 ? { label: "100%! مثالي تماماً 🏆✨", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30" } :
    accuracy >= 90 ? { label: "ممتاز! 🏆", color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/20" } :
    accuracy >= 70 ? { label: "جيد جداً ✅", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" } :
    accuracy >= 50 ? { label: "مقبول 📚", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/20" } :
    { label: "تحتاج مراجعة 📖", color: "text-red-400", bg: "bg-red-400/10 border-red-400/20" };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Score hero */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${accuracy === 100 ? "bg-yellow-400/20 border-2 border-yellow-400/50" : "bg-primary/15 border-2 border-primary/30"}`}>
            <Trophy className={`w-10 h-10 ${accuracy === 100 ? "text-yellow-400" : "text-primary"}`} />
          </div>
          <p className="text-5xl font-bold text-foreground mb-3">{accuracy}%</p>
          <div className={`inline-block px-5 py-1.5 rounded-full border text-sm font-semibold ${grade.bg} ${grade.color}`}>
            {grade.label}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">{correctCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">صحيح</div>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{wrongCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">خطأ</div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <AlertCircle className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <div className="text-2xl font-bold text-foreground">{unanswered}</div>
            <div className="text-xs text-muted-foreground mt-0.5">لم يُجب</div>
          </div>
        </div>

        {/* Accuracy bar */}
        <div className="rounded-xl bg-card border border-border p-5 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">الدقة الكلية</span>
            <span className="font-semibold text-foreground">{accuracy}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${accuracy}%`,
                background: accuracy === 100 ? "hsl(45 93% 47%)" : accuracy >= 70 ? "hsl(142 71% 45%)" : accuracy >= 50 ? "hsl(217 91% 60%)" : "hsl(0 72% 51%)"
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">أجبت على {totalAnswered} من {questions.length} سؤال</p>
        </div>

        {/* Perfect score message */}
        {accuracy === 100 && correctCount > 0 && (
          <div className="mb-6 text-center p-6 rounded-xl bg-yellow-400/10 border border-yellow-400/25">
            <p className="text-yellow-400 font-bold text-xl mb-1">🎉 أداء مثالي 100%!</p>
            <p className="text-yellow-300/70 text-sm">أجبت على جميع الأسئلة بشكل صحيح — أنت جاهز!</p>
          </div>
        )}

        {/* Wrong answers */}
        {wrongCount > 0 && (
          <div className="mb-6">
            <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />
              الأسئلة الخاطئة ({wrongCount})
            </h2>
            <div className="flex flex-col gap-2">
              {questions
                .filter((q) => answers[q.id] !== undefined && !answers[q.id].isCorrect)
                .map((q) => (
                  <div key={q.id} className="rounded-lg bg-card border border-red-500/15 p-3.5">
                    <div className="flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-1">{q.topic} — #{q.id}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={restart} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors text-sm">
            <RotateCcw className="w-4 h-4" />إعادة الوحدة
          </button>
          <button onClick={() => setLocation("/mistakes")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-secondary/80 transition-colors text-sm">
            <AlertCircle className="w-4 h-4" />مراجعة الأخطاء
          </button>
          <button onClick={() => setLocation("/analytics")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm">
            <BookOpen className="w-4 h-4" />تحليل الأداء
          </button>
          <button onClick={() => setLocation("/")} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm">
            <Home className="w-4 h-4" />الرئيسية
          </button>
        </div>
      </main>
    </div>
  );
}
