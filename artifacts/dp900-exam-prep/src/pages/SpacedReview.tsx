import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Brain, CheckCircle, XCircle, ChevronRight, ChevronLeft, Send, RotateCcw, Trophy, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuestionRenderer from "@/components/QuestionRenderer";
import { STORAGE_KEYS, getAllQuestionsIncludingDump } from "@/lib/loadQuestions";
import type { MistakeEntry, UserAnswer, Question } from "@/types/quiz";

const SESSION_SIZE = 20;

interface ReviewItem {
  mistake: MistakeEntry;
  question: Question | null;
}

type Phase = "setup" | "review" | "done";

export default function SpacedReview() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<Record<number, UserAnswer>>({});
  const [sessionSubmitted, setSessionSubmitted] = useState<Set<number>>(new Set());
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [masteredCount, setMasteredCount] = useState(0);

  const [mistakeCount, setMistakeCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (raw) setMistakeCount((JSON.parse(raw) as unknown[]).length);
    } catch {}
  }, []);

  function buildSession() {
    const allQ = getAllQuestionsIncludingDump();
    const questionMap = new Map(allQ.map((q) => [String(q.id), q]));
    let mistakes: MistakeEntry[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (raw) mistakes = JSON.parse(raw);
    } catch {}

    // Sort: oldest savedAt first (needs most attention)
    mistakes.sort((a, b) => a.savedAt - b.savedAt);

    const session: ReviewItem[] = mistakes.slice(0, SESSION_SIZE).map((m) => ({
      mistake: m,
      question: questionMap.get(String(m.questionId)) ?? null,
    })).filter((i) => i.question !== null);

    return session;
  }

  function startSession() {
    const session = buildSession();
    setItems(session);
    setCurrentIdx(0);
    setSessionAnswers({});
    setSessionSubmitted(new Set());
    setCurrentAnswer(undefined);
    setMasteredCount(0);
    setPhase("review");
  }

  function submitAnswer() {
    if (!currentAnswer) return;
    const newSub = new Set(sessionSubmitted);
    newSub.add(currentIdx);
    setSessionSubmitted(newSub);
    setSessionAnswers({ ...sessionAnswers, [currentIdx]: currentAnswer });

    // If correct: remove from mistakes (mastered!)
    if (currentAnswer.isCorrect) {
      removeMistake(items[currentIdx].mistake);
      setMasteredCount((c) => c + 1);
    }
  }

  function removeMistake(m: MistakeEntry) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      const mistakes: MistakeEntry[] = raw ? JSON.parse(raw) : [];
      const updated = mistakes.filter(
        (x) => !(String(x.questionId) === String(m.questionId) && x.moduleId === m.moduleId)
      );
      localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(updated));
    } catch {}
  }

  function goNext() {
    if (currentIdx < items.length - 1) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      setCurrentAnswer(sessionAnswers[next]);
    } else {
      setPhase("done");
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      const prev = currentIdx - 1;
      setCurrentIdx(prev);
      setCurrentAnswer(sessionAnswers[prev]);
    }
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">المراجعة الذكية</h1>
            <p className="text-muted-foreground text-sm">يركز على الأسئلة التي أخطأت فيها بترتيب الأقدم أولاً</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-5 text-center">
              <div>
                <div className="text-2xl font-bold text-red-400">{mistakeCount}</div>
                <div className="text-xs text-muted-foreground mt-0.5">أخطاء محفوظة</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">{Math.min(mistakeCount, SESSION_SIZE)}</div>
                <div className="text-xs text-muted-foreground mt-0.5">في هذه الجلسة</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">∞</div>
                <div className="text-xs text-muted-foreground mt-0.5">تكرارات</div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2 border-t border-border pt-4">
              <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" />إجابة صحيحة = يُحذف من قائمة الأخطاء 🎉</p>
              <p className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400 shrink-0" />إجابة خاطئة = يبقى للمراجعة مرة أخرى</p>
              <p className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400 shrink-0" />أقدم الأخطاء تُعرض أولاً (الأكثر احتياجاً)</p>
            </div>
          </div>

          {mistakeCount === 0 ? (
            <div className="text-center py-6 rounded-xl border border-green-500/20 bg-green-500/10 mb-6">
              <Trophy className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-bold">ممتاز! لا توجد أخطاء للمراجعة</p>
              <p className="text-sm text-muted-foreground mt-1">تدرب على المزيد من الأسئلة لتبني قائمة المراجعة</p>
            </div>
          ) : (
            <button
              onClick={startSession}
              className="w-full py-4 rounded-xl bg-purple-500 text-white font-bold text-base hover:bg-purple-400 transition-colors flex items-center justify-center gap-3"
            >
              <Brain className="w-5 h-5" />
              ابدأ جلسة المراجعة الذكية
            </button>
          )}

          <button
            onClick={() => setLocation("/")}
            className="w-full mt-3 py-3 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            العودة للرئيسية
          </button>
        </main>
      </div>
    );
  }

  // ── REVIEW ────────────────────────────────────────────────────────────────
  if (phase === "review") {
    if (items.length === 0) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
          <div className="text-center">
            <Trophy className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-green-400 font-bold text-lg">لا توجد أخطاء للمراجعة!</p>
            <button onClick={() => setLocation("/")} className="mt-4 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">الرئيسية</button>
          </div>
        </div>
      );
    }

    const item = items[currentIdx];
    const q = item.question!;
    const isSubmitted = sessionSubmitted.has(currentIdx);
    const isCorrect = sessionAnswers[currentIdx]?.isCorrect;
    const progress = ((currentIdx + 1) / items.length) * 100;

    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-muted-foreground">مراجعة ذكية</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-400 font-medium">{masteredCount} أتقنت ✓</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono" dir="ltr">{currentIdx + 1} / {items.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {/* Question header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/20 font-medium">
                مراجعة ذكية 🧠
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{q.topic}</span>
              <span className="text-xs text-muted-foreground mr-auto">#{q.id}</span>
            </div>
            <h2 className="text-base font-semibold text-foreground leading-relaxed">{q.question}</h2>
          </div>

          <QuestionRenderer
            question={q}
            submitted={isSubmitted}
            onAnswer={setCurrentAnswer}
            userAnswer={sessionAnswers[currentIdx]}
          />

          {/* Mastered/failed feedback */}
          {isSubmitted && (
            <div className={`mt-4 rounded-xl p-3 text-center font-bold text-sm ${
              isCorrect ? "bg-green-500/10 border border-green-500/20 text-green-400" : "bg-red-500/10 border border-red-500/20 text-red-400"
            }`}>
              {isCorrect ? "🎉 أحسنت! حُذف من قائمة الأخطاء" : "⚠️ ستراه مرة أخرى في الجلسة القادمة"}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={goPrev}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 hover:bg-muted/50"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>

            {!isSubmitted ? (
              <button
                onClick={submitAnswer}
                disabled={!currentAnswer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-bold disabled:opacity-40 hover:bg-purple-400 transition-colors"
              >
                <Send className="w-4 h-4" />تأكيد
              </button>
            ) : (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500 text-white text-sm font-bold hover:bg-purple-400 transition-colors"
              >
                {currentIdx === items.length - 1 ? "إنهاء الجلسة" : "التالي"}
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  const totalInSession = items.length;
  const wrongInSession = totalInSession - masteredCount;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-purple-500/15 border-2 border-purple-500/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">انتهت جلسة المراجعة!</h2>
          <p className="text-muted-foreground text-sm">أحسنت على إتمام الجلسة</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-5 text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">{masteredCount}</div>
            <div className="text-sm text-muted-foreground">أتقنت ✓</div>
            <div className="text-xs text-muted-foreground mt-1">حُذفت من الأخطاء</div>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-center">
            <div className="text-3xl font-bold text-red-400 mb-1">{wrongInSession}</div>
            <div className="text-sm text-muted-foreground">تحتاج مراجعة</div>
            <div className="text-xs text-muted-foreground mt-1">ستظهر مجدداً</div>
          </div>
        </div>

        {masteredCount === totalInSession && (
          <div className="text-center p-5 rounded-xl bg-green-500/10 border border-green-500/20 mb-6">
            <p className="text-green-400 font-bold">🎉 أتقنت جميع أسئلة الجلسة!</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {wrongInSession > 0 && (
            <button onClick={startSession} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors">
              <RotateCcw className="w-4 h-4" />جلسة أخرى
            </button>
          )}
          <button onClick={() => setLocation("/analytics")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-muted/50 transition-colors text-sm">
            تحليل الأداء
          </button>
          <button onClick={() => setLocation("/")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground font-medium hover:bg-muted/50 transition-colors text-sm">
            الرئيسية
          </button>
        </div>
      </main>
    </div>
  );
}
