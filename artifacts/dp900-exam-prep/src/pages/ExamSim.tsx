import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Clock, Trophy, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ChevronLeft, Send, RotateCcw, Home, Flag
} from "lucide-react";
import Navbar from "@/components/Navbar";
import QuestionRenderer from "@/components/QuestionRenderer";
import {
  getAllQuestionsIncludingDump, STORAGE_KEYS, getExamObjective, EXAM_OBJECTIVES, MS_LEARN_LINKS
} from "@/lib/loadQuestions";
import type { Question, UserAnswer } from "@/types/quiz";

const EXAM_DURATION = 45 * 60; // 45 minutes in seconds
const EXAM_QUESTION_COUNT = 40;
const PASS_SCORE = 700;

interface ExamResult {
  date: string;
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  total: number;
  durationSeconds: number;
  passed: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function calcScore(correct: number, total: number): number {
  return Math.round(100 + (correct / total) * 900);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type Phase = "setup" | "exam" | "results";

export default function ExamSim() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, UserAnswer>>({});
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [flagged, setFlagged] = useState<Set<string | number>>(new Set());
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<ExamResult[]>([]);
  const [lastResult, setLastResult] = useState<ExamResult | null>(null);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EXAM_HISTORY);
      if (raw) setHistory(JSON.parse(raw) as ExamResult[]);
    } catch {}
  }, []);

  const finishExam = useCallback((currentAnswers: Record<string | number, UserAnswer>, durationSec: number) => {
    const correct = Object.values(currentAnswers).filter((a) => a.isCorrect).length;
    const wrong = Object.values(currentAnswers).filter((a) => !a.isCorrect).length;
    const unanswered = EXAM_QUESTION_COUNT - correct - wrong;
    const score = calcScore(correct, EXAM_QUESTION_COUNT);
    const result: ExamResult = {
      date: new Date().toLocaleDateString("ar-EG"),
      score, correct, wrong, unanswered,
      total: EXAM_QUESTION_COUNT,
      durationSeconds: durationSec,
      passed: score >= PASS_SCORE,
    };
    setLastResult(result);
    const newHistory = [result, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem(STORAGE_KEYS.EXAM_HISTORY, JSON.stringify(newHistory));
    setPhase("results");
  }, [history]);

  // Timer
  useEffect(() => {
    if (phase !== "exam") return;
    const id = setInterval(() => {
      const secs = Math.round((Date.now() - startedAtRef.current) / 1000);
      setElapsed(secs);
      if (secs >= EXAM_DURATION) {
        clearInterval(id);
        finishExam(answersRef.current, EXAM_DURATION);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finishExam]);

  function startExam() {
    const all = getAllQuestionsIncludingDump();
    const selected = shuffle(all).slice(0, EXAM_QUESTION_COUNT);
    setQuestions(selected);
    setAnswers({});
    setCurrentAnswer(undefined);
    setCurrentIdx(0);
    setFlagged(new Set());
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setPhase("exam");
  }

  function submitAnswer() {
    if (!currentAnswer) return;
    const q = questions[currentIdx];
    const newAnswers = { ...answersRef.current, [q.id]: currentAnswer };
    answersRef.current = newAnswers;
    setAnswers(newAnswers);
  }

  function jumpTo(i: number) {
    setCurrentIdx(i);
    setCurrentAnswer(answers[questions[i]?.id]);
  }

  function toggleFlag() {
    const q = questions[currentIdx];
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(q.id)) next.delete(q.id);
      else next.add(q.id);
      return next;
    });
  }

  function submitExam() {
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    finishExam(answersRef.current, durationSec);
  }

  // ── SETUP SCREEN ──────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">محاكي الامتحان الرسمي</h1>
            <p className="text-muted-foreground text-sm">تجربة مطابقة لامتحان DP-900 الحقيقي</p>
          </div>

          {/* Rules */}
          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4 text-base">📋 قواعد الامتحان</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              {[
                { icon: "📝", label: "عدد الأسئلة", val: "40 سؤال" },
                { icon: "⏱️", label: "الوقت المتاح", val: "45 دقيقة" },
                { icon: "✅", label: "درجة النجاح", val: "700 / 1000" },
                { icon: "🔀", label: "الأسئلة", val: "عشوائية" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-muted/30 p-4 text-center">
                  <div className="text-2xl mb-1">{item.icon}</div>
                  <div className="font-bold text-foreground text-sm">{item.val}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />لا تظهر الإجابة الصحيحة أثناء الامتحان</li>
              <li className="flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />الأسئلة من كل المجالات + DUMP مخلوطة عشوائياً</li>
              <li className="flex items-center gap-2"><Flag className="w-4 h-4 text-blue-400 shrink-0" />يمكنك وضع علامة 🚩 على الأسئلة للمراجعة لاحقاً</li>
            </ul>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 mb-6">
              <h3 className="font-semibold text-sm text-foreground mb-3">آخر المحاولات</h3>
              <div className="flex flex-col gap-2">
                {history.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{r.date}</span>
                    <span className="font-mono font-bold text-lg" style={{ color: r.passed ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)" }}>{r.score}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.passed ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                      {r.passed ? "ناجح ✓" : "لم ينجح"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={startExam}
            className="w-full py-4 rounded-xl bg-orange-500 text-white font-bold text-base hover:bg-orange-400 transition-colors flex items-center justify-center gap-3"
          >
            <Clock className="w-5 h-5" />
            ابدأ المحاكاة الآن
          </button>
        </main>
      </div>
    );
  }

  // ── EXAM SCREEN ───────────────────────────────────────────────────────────
  if (phase === "exam") {
    const q = questions[currentIdx];
    const timeLeft = Math.max(0, EXAM_DURATION - elapsed);
    const isAnswered = answers[q?.id] !== undefined;
    const isFlagged = flagged.has(q?.id);
    const answeredCount = Object.keys(answers).length;
    const unansweredCount = EXAM_QUESTION_COUNT - answeredCount;
    const urgentTime = timeLeft < 300; // less than 5 min
    const progressPct = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background" dir="rtl">
        {/* Exam top bar */}
        <header className="border-b border-border bg-card sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${urgentTime ? "bg-red-500/15 text-red-400" : "bg-muted text-foreground"}`}>
                <Clock className={`w-4 h-4 ${urgentTime ? "animate-pulse" : ""}`} />
                <span dir="ltr">{formatTime(timeLeft)}</span>
              </div>
              <span className="text-sm text-muted-foreground font-mono" dir="ltr">{currentIdx + 1} / {questions.length}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-green-400">{answeredCount} أُجيب</span>
                {unansweredCount > 0 && <span className="text-amber-400">{unansweredCount} متبقي</span>}
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6">
          {/* Question header */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-medium">
                  محاكي الامتحان
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{q?.topic}</span>
              </div>
              <button
                onClick={toggleFlag}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${isFlagged ? "bg-blue-500/15 text-blue-400 border border-blue-500/20" : "bg-muted text-muted-foreground hover:text-blue-400"}`}
              >
                <Flag className="w-3.5 h-3.5" />
                {isFlagged ? "مُعلَّم" : "علّم"}
              </button>
            </div>
            <h2 className="text-base font-semibold text-foreground leading-relaxed">{q?.question}</h2>
          </div>

          {q && (
            <QuestionRenderer
              question={q}
              submitted={false}
              onAnswer={(ans) => {
                setCurrentAnswer(ans);
                const newAnswers = { ...answersRef.current, [q.id]: ans };
                answersRef.current = newAnswers;
                setAnswers(newAnswers);
              }}
              userAnswer={answers[q.id]}
            />
          )}

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => jumpTo(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 hover:bg-muted/50"
            >
              <ChevronRight className="w-4 h-4" />
              السابق
            </button>

            {currentIdx === questions.length - 1 ? (
              <button
                onClick={submitExam}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-400 transition-colors"
              >
                <Send className="w-4 h-4" />
                إنهاء الامتحان
              </button>
            ) : (
              <button
                onClick={() => jumpTo(Math.min(questions.length - 1, currentIdx + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Jump grid */}
          <div className="mt-8 border-t border-border pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">انتقل لأي سؤال</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/40 inline-block" /> أُجيب</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500/30 border border-blue-500/40 inline-block" /> مُعلَّم</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-hide">
              {questions.map((qq, i) => {
                const answered = answers[qq.id] !== undefined;
                const isFlg = flagged.has(qq.id);
                let cls = "w-8 h-8 text-xs rounded-lg border font-mono shrink-0 transition-all relative ";
                if (i === currentIdx) cls += "bg-orange-500 text-white border-orange-500";
                else if (isFlg) cls += "bg-blue-500/15 text-blue-400 border-blue-500/30";
                else if (answered) cls += "bg-primary/15 text-primary border-primary/30";
                else cls += "bg-card text-muted-foreground border-border hover:border-primary/40";
                return (
                  <button key={qq.id} onClick={() => jumpTo(i)} className={cls}>
                    {i + 1}
                    {isFlg && <span className="absolute -top-1 -right-1 text-[8px]">🚩</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── RESULTS SCREEN ────────────────────────────────────────────────────────
  const r = lastResult;
  if (!r) return null;

  const scoreColor = r.passed ? "text-green-400" : "text-red-400";
  const scoreBg = r.passed ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10";

  // Per-objective breakdown
  const objStats: Record<number, { correct: number; total: number }> = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } };
  questions.forEach((q) => {
    const obj = getExamObjective(q.topic);
    objStats[obj].total++;
    if (answers[q.id]?.isCorrect) objStats[obj].correct++;
  });

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Score hero */}
        <div className={`rounded-2xl border p-8 mb-6 text-center ${scoreBg}`}>
          <div className={`text-6xl font-bold mb-2 ${scoreColor}`}>{r.score}</div>
          <p className="text-lg text-muted-foreground mb-1">من 1000</p>
          <div className={`inline-block px-5 py-1.5 rounded-full font-bold text-sm mt-2 ${r.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
            {r.passed ? "🎉 ناجح — أحسنت!" : "❌ لم تنجح — استمر في المذاكرة"}
          </div>
          <p className="text-xs text-muted-foreground mt-3">درجة النجاح 700 / 1000 — الوقت المستغرق: {formatTime(r.durationSeconds)}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">{r.correct}</div>
            <div className="text-xs text-muted-foreground mt-0.5">صحيح</div>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{r.wrong}</div>
            <div className="text-xs text-muted-foreground mt-0.5">خطأ</div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-amber-400">{r.unanswered}</div>
            <div className="text-xs text-muted-foreground mt-0.5">لم يُجب</div>
          </div>
        </div>

        {/* Objective breakdown */}
        <div className="rounded-xl border border-border bg-card p-5 mb-6">
          <h3 className="font-bold text-foreground mb-4 text-sm">الأداء حسب أهداف الامتحان</h3>
          <div className="flex flex-col gap-3">
            {EXAM_OBJECTIVES.map((obj) => {
              const s = objStats[obj.id];
              const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const color = acc >= 70 ? "hsl(142 71% 45%)" : acc >= 50 ? "hsl(217 91% 60%)" : "hsl(0 72% 51%)";
              return (
                <div key={obj.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-foreground font-medium">{obj.nameAr}</span>
                    <span className="font-bold" style={{ color }}>{acc}% ({s.correct}/{s.total})</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${acc}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wrong questions */}
        {r.wrong > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-400" />الأسئلة الخاطئة ({r.wrong})
            </h3>
            <div className="flex flex-col gap-2 max-h-72 overflow-y-auto scrollbar-hide">
              {questions.filter((q) => answers[q.id] && !answers[q.id].isCorrect).map((q) => (
                <div key={q.id} className="rounded-lg border border-red-500/15 bg-card p-3.5">
                  <p className="text-sm text-foreground leading-relaxed line-clamp-2 mb-1">{q.question}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{q.topic}</span>
                    <a
                      href={MS_LEARN_LINKS[getExamObjective(q.topic)]}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      راجع المفهوم ←
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={startExam} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-400 transition-colors">
            <RotateCcw className="w-4 h-4" />حاول مرة أخرى
          </button>
          <button onClick={() => setLocation("/analytics")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm font-medium">
            <Trophy className="w-4 h-4" />تحليل أدائي
          </button>
          <button onClick={() => setLocation("/mistakes")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm font-medium">
            راجع الأخطاء
          </button>
          <button onClick={() => setLocation("/")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground hover:bg-muted/50 transition-colors text-sm font-medium">
            <Home className="w-4 h-4" />الرئيسية
          </button>
        </div>
      </main>
    </div>
  );
}
