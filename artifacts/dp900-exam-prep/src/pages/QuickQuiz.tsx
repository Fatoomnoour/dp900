import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Zap, Clock, CheckCircle, XCircle, ChevronLeft, ChevronRight, Send, RotateCcw, Trophy, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import QuestionRenderer from "@/components/QuestionRenderer";
import { getAllQuestionsIncludingDump, recordStudyActivity } from "@/lib/loadQuestions";
import { playCorrect, playWrong, playComplete } from "@/lib/sounds";
import type { Question, UserAnswer } from "@/types/quiz";

const QUICK_COUNT = 10;
const QUICK_DURATION = 5 * 60; // 5 minutes

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(s: number) {
  return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

type Phase = "setup" | "quiz" | "results";

export default function QuickQuiz() {
  const [, setLocation] = useLocation();
  const [phase, setPhase] = useState<Phase>("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, UserAnswer>>({});
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [submitted, setSubmitted] = useState<Set<string | number>>(new Set());
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [history, setHistory] = useState<{ date: string; score: number; time: number }[]>([]);

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;

  useEffect(() => {
    try {
      const r = localStorage.getItem("dp900_quick_history");
      if (r) setHistory(JSON.parse(r).slice(0, 5));
    } catch {}
  }, []);

  const finishQuiz = useCallback((currentAnswers: Record<string | number, UserAnswer>, sec: number) => {
    const correct = Object.values(currentAnswers).filter((a) => a.isCorrect).length;
    const result = { date: new Date().toLocaleDateString("ar-EG"), score: correct, time: sec };
    const newH = [result, ...history].slice(0, 10);
    setHistory(newH);
    try { localStorage.setItem("dp900_quick_history", JSON.stringify(newH)); } catch {}
    if (correct === QUICK_COUNT) playComplete(); else if (correct >= 7) playCorrect();
    setPhase("results");
  }, [history]);

  useEffect(() => {
    if (phase !== "quiz") return;
    const id = setInterval(() => {
      const s = Math.round((Date.now() - startedAtRef.current) / 1000);
      setElapsed(s);
      if (s >= QUICK_DURATION) {
        clearInterval(id);
        finishQuiz(answersRef.current, QUICK_DURATION);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, finishQuiz]);

  function start() {
    const all = getAllQuestionsIncludingDump();
    const qs = shuffle(all).slice(0, QUICK_COUNT);
    setQuestions(qs);
    setAnswers({});
    setCurrentAnswer(undefined);
    setSubmitted(new Set());
    setIdx(0);
    const now = Date.now();
    setStartedAt(now);
    setElapsed(0);
    setPhase("quiz");
  }

  function submitAnswer() {
    if (!currentAnswer) return;
    const q = questions[idx];
    const newA = { ...answersRef.current, [q.id]: currentAnswer };
    answersRef.current = newA;
    setAnswers(newA);
    const newSub = new Set(submitted); newSub.add(q.id);
    setSubmitted(newSub);
    if (currentAnswer.isCorrect) playCorrect(); else playWrong();
    recordStudyActivity();
    if (Object.keys(newA).length === QUICK_COUNT) {
      setTimeout(() => finishQuiz(newA, Math.round((Date.now() - startedAtRef.current) / 1000)), 800);
    }
  }

  function goNext() {
    if (idx < questions.length - 1) {
      const n = idx + 1;
      setIdx(n);
      setCurrentAnswer(answers[questions[n]?.id]);
    }
  }

  function goPrev() {
    if (idx > 0) {
      const p = idx - 1;
      setIdx(p);
      setCurrentAnswer(answers[questions[p]?.id]);
    }
  }

  // ── SETUP ─────────────────────────────────────────────────────────────────
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/20 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">الكويز السريع</h1>
            <p className="text-muted-foreground text-sm">10 أسئلة عشوائية في 5 دقائق — الحرارة اليومية!</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center mb-5">
              <div>
                <div className="text-2xl font-bold text-yellow-400">10</div>
                <div className="text-xs text-muted-foreground mt-0.5">سؤال</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">5</div>
                <div className="text-xs text-muted-foreground mt-0.5">دقائق</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">386</div>
                <div className="text-xs text-muted-foreground mt-0.5">مصدر</div>
              </div>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 border-t border-border pt-4">
              <li className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-400 shrink-0" />أسئلة عشوائية من كل المجالات + DUMP</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400 shrink-0" />الوقت ينتهي تلقائياً بعد 5 دقائق</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400 shrink-0" />النتائج فورية مع معرفة الخطأ</li>
            </ul>
          </div>

          {history.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4 mb-5">
              <p className="text-xs text-muted-foreground font-medium mb-2">آخر الجلسات</p>
              <div className="flex flex-col gap-1.5">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{h.date}</span>
                    <span className={`font-bold ${h.score >= 8 ? "text-green-400" : h.score >= 6 ? "text-amber-400" : "text-red-400"}`}>
                      {h.score}/{QUICK_COUNT}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">{formatTime(h.time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={start}
            className="w-full py-4 rounded-xl bg-yellow-500 text-black font-bold text-base hover:bg-yellow-400 transition-colors flex items-center justify-center gap-3"
          >
            <Zap className="w-5 h-5" />ابدأ الكويز السريع!
          </button>
        </main>
      </div>
    );
  }

  // ── QUIZ ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    const q = questions[idx];
    const isSubmitted = submitted.has(q?.id);
    const timeLeft = Math.max(0, QUICK_DURATION - elapsed);
    const urgent = timeLeft < 60;
    const answeredCount = Object.keys(answers).length;

    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${urgent ? "bg-red-500/15 text-red-400 animate-pulse" : "bg-muted text-foreground"}`}>
                <Clock className="w-4 h-4" />
                <span dir="ltr">{formatTime(timeLeft)}</span>
              </div>
              <span className="font-bold text-sm text-foreground">{answeredCount} / {QUICK_COUNT} ✓</span>
              <span className="text-sm text-muted-foreground font-mono">{idx + 1} / {questions.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-bold">⚡ سريع</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{q?.topic}</span>
            </div>
            <h2 className="text-base font-semibold text-foreground leading-relaxed">{q?.question}</h2>
          </div>

          {q && (
            <QuestionRenderer
              question={q}
              submitted={isSubmitted}
              onAnswer={(ans) => {
                setCurrentAnswer(ans);
                setAnswers((prev) => ({ ...prev, [q.id]: ans }));
                answersRef.current = { ...answersRef.current, [q.id]: ans };
              }}
              userAnswer={answers[q.id]}
            />
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={goPrev} disabled={idx === 0} className="px-4 py-2.5 rounded-lg border border-border bg-card text-sm disabled:opacity-40 hover:bg-muted/50 flex items-center gap-1">
              <ChevronRight className="w-4 h-4" />السابق
            </button>

            {!isSubmitted ? (
              <button
                onClick={submitAnswer}
                disabled={!currentAnswer}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 text-black font-bold text-sm disabled:opacity-40 hover:bg-yellow-400 transition-colors"
              >
                <Send className="w-4 h-4" />تأكيد
              </button>
            ) : (
              <button onClick={goNext} disabled={idx === questions.length - 1} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-40 flex items-center gap-1">
                التالي <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
            {questions.map((qq, i) => {
              const ans = answers[qq.id];
              let cls = "w-8 h-8 text-xs rounded-lg border font-mono transition-all ";
              if (i === idx) cls += "bg-yellow-500 text-black border-yellow-500";
              else if (ans?.isCorrect) cls += "bg-green-500/15 text-green-400 border-green-500/30";
              else if (ans !== undefined) cls += "bg-red-500/15 text-red-400 border-red-500/30";
              else cls += "bg-card text-muted-foreground border-border";
              return (
                <button key={qq.id} onClick={() => { setIdx(i); setCurrentAnswer(answers[questions[i]?.id]); }} className={cls}>
                  {i + 1}
                </button>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  // ── RESULTS ───────────────────────────────────────────────────────────────
  const correct = Object.values(answers).filter((a) => a.isCorrect).length;
  const wrong = Object.values(answers).filter((a) => !a.isCorrect).length;
  const pct = Math.round((correct / QUICK_COUNT) * 100);
  const grade = correct >= 9 ? { label: "ممتاز! 🏆", color: "text-yellow-400" } :
    correct >= 7 ? { label: "جيد جداً ✅", color: "text-green-400" } :
    correct >= 5 ? { label: "مقبول 📚", color: "text-blue-400" } :
    { label: "تحتاج مراجعة 📖", color: "text-red-400" };
  const timeTaken = Math.min(elapsed, QUICK_DURATION);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full bg-yellow-500/15 border-2 border-yellow-500/30 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <div className="text-5xl font-bold text-foreground mb-2">{pct}%</div>
          <div className={`text-lg font-bold ${grade.color}`}>{grade.label}</div>
          <p className="text-sm text-muted-foreground mt-1">وقت الجلسة: {formatTime(timeTaken)}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-400">{correct}</div>
            <div className="text-xs text-muted-foreground">صحيح</div>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
            <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-red-400">{wrong}</div>
            <div className="text-xs text-muted-foreground">خطأ</div>
          </div>
          <div className="rounded-xl bg-muted/50 border border-border p-4 text-center">
            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
            <div className="text-xl font-bold text-foreground font-mono">{formatTime(timeTaken)}</div>
            <div className="text-xs text-muted-foreground">وقت</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={start} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-yellow-500 text-black font-bold hover:bg-yellow-400 transition-colors">
            <RotateCcw className="w-4 h-4" />جلسة أخرى
          </button>
          <button onClick={() => setLocation("/")} className="flex items-center justify-center gap-2 py-3 rounded-xl border border-border bg-card text-foreground text-sm hover:bg-muted/50">
            <Home className="w-4 h-4" />الرئيسية
          </button>
        </div>
      </main>
    </div>
  );
}
