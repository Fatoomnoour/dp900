import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { ChevronRight, ChevronLeft, Home, Send, CheckCircle, XCircle, Bookmark, RotateCcw, Lightbulb, Timer, SkipForward } from "lucide-react";
import {
  getQuestionsByModule, STORAGE_KEYS, loadStats, saveStats,
  loadBookmarks, toggleBookmark as toggleBookmarkLib, recordStudyActivity
} from "@/lib/loadQuestions";
import { playCorrect, playWrong } from "@/lib/sounds";
import QuestionRenderer from "@/components/QuestionRenderer";
import type { Question, UserAnswer, QuizProgress, MistakeEntry, GlobalStats, SingleChoiceQuestion } from "@/types/quiz";

export default function Quiz() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params.moduleId;
  const [, setLocation] = useLocation();

  const questions = getQuestionsByModule(moduleId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string | number, UserAnswer>>({});
  const [submitted, setSubmitted] = useState<Set<string | number>>(new Set());
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(() =>
    new Set(loadBookmarks().filter((b) => b.moduleId === moduleId).map((b) => String(b.questionId)))
  );
  const [eliminatedOptions, setEliminatedOptions] = useState<Record<string | number, string[]>>({});
  const [hintsUsed, setHintsUsed] = useState<Set<string | number>>(new Set());

  // Elapsed timer
  const [showTimer, setShowTimer] = useState(false);
  const [sessionElapsed, setSessionElapsed] = useState(0);
  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!showTimer) return;
    const id = setInterval(() => {
      setSessionElapsed(Math.round((Date.now() - sessionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [showTimer]);

  function formatElapsed(s: number) {
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  }

  // Load saved progress
  useEffect(() => {
    if (!moduleId || questions.length === 0) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (raw) {
        const allProgress: Record<string, QuizProgress> = JSON.parse(raw);
        const saved = allProgress[moduleId];
        if (saved) {
          setCurrentIndex(saved.currentIndex);
          setAnswers(saved.answers);
          const submittedIds = new Set(Object.keys(saved.answers) as unknown as (string | number)[]);
          setSubmitted(submittedIds as Set<string | number>);
          const savedQ = questions[saved.currentIndex];
          if (savedQ) setCurrentAnswer(saved.answers[savedQ.id]);
        }
      }
    } catch {}
    setBookmarkedKeys(new Set(loadBookmarks().filter((b) => b.moduleId === moduleId).map((b) => String(b.questionId))));
  }, [moduleId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProgress = useCallback((idx: number, ans: Record<string | number, UserAnswer>) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const allProgress: Record<string, QuizProgress> = raw ? JSON.parse(raw) : {};
      const correct = Object.values(ans).filter((a) => a.isCorrect).length;
      const wrong = Object.values(ans).filter((a) => !a.isCorrect).length;
      allProgress[moduleId] = {
        moduleId, currentIndex: idx, answers: ans,
        correctCount: correct, wrongCount: wrong,
        startedAt: allProgress[moduleId]?.startedAt ?? Date.now(),
        completed: idx >= questions.length - 1 && Object.keys(ans).length >= questions.length,
      };
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(allProgress));
    } catch {}
  }, [moduleId, questions.length]);

  const updateGlobalStats = useCallback((ans: Record<string | number, UserAnswer>) => {
    const stats: GlobalStats = loadStats();
    const correct = Object.values(ans).filter((a) => a.isCorrect).length;
    const wrong = Object.values(ans).filter((a) => !a.isCorrect).length;
    stats.moduleProgress[moduleId] = { correct, wrong, total: questions.length, completed: Object.keys(ans).length >= questions.length };
    let tc = 0, tw = 0;
    for (const mod of Object.values(stats.moduleProgress)) { tc += mod.correct; tw += mod.wrong; }
    stats.totalCorrect = tc; stats.totalWrong = tw; stats.totalAnswered = tc + tw;
    saveStats(stats);
  }, [moduleId, questions.length]);

  function saveMistake(question: Question, userAnswer: UserAnswer) {
    if (userAnswer.isCorrect) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      const mistakes: MistakeEntry[] = raw ? JSON.parse(raw) : [];
      const exists = mistakes.find((m) => m.questionId === question.id && m.moduleId === moduleId);
      if (!exists) {
        mistakes.push({ questionId: question.id, moduleId, question, userAnswer, savedAt: Date.now() });
        localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(mistakes));
      }
    } catch {}
  }

  function handleToggleBookmark(q: Question) {
    const added = toggleBookmarkLib(q, moduleId);
    setBookmarkedKeys((prev) => {
      const next = new Set(prev);
      if (added) next.add(String(q.id)); else next.delete(String(q.id));
      return next;
    });
  }

  function useHint(q: Question) {
    if (q.type !== "single_choice") return;
    if (hintsUsed.has(q.id)) return;
    const sc = q as SingleChoiceQuestion;
    const wrong = sc.options.filter((o) => o !== sc.correctAnswer);
    const toEliminate = [...wrong].sort(() => Math.random() - 0.5).slice(0, 2);
    setEliminatedOptions((prev) => ({ ...prev, [q.id]: toEliminate }));
    setHintsUsed((prev) => { const n = new Set(prev); n.add(q.id); return n; });
    if (currentAnswer?.type === "single_choice" && toEliminate.includes(currentAnswer.selected)) {
      setCurrentAnswer(undefined);
    }
  }

  function jumpToNext(type: "unanswered" | "wrong") {
    for (let i = currentIndex + 1; i < questions.length; i++) {
      const q = questions[i];
      if (type === "unanswered" && answers[q.id] === undefined) { jumpTo(i); return; }
      if (type === "wrong" && answers[q.id] !== undefined && !answers[q.id].isCorrect) { jumpTo(i); return; }
    }
    // wrap from start
    for (let i = 0; i < currentIndex; i++) {
      const q = questions[i];
      if (type === "unanswered" && answers[q.id] === undefined) { jumpTo(i); return; }
      if (type === "wrong" && answers[q.id] !== undefined && !answers[q.id].isCorrect) { jumpTo(i); return; }
    }
  }

  function submitAnswer() {
    if (!currentAnswer) return;
    const q = questions[currentIndex];
    const newAnswers = { ...answers, [q.id]: currentAnswer };
    const newSubmitted = new Set(submitted); newSubmitted.add(q.id);
    setAnswers(newAnswers); setSubmitted(newSubmitted);
    saveProgress(currentIndex, newAnswers);
    updateGlobalStats(newAnswers);
    saveMistake(q, currentAnswer);
    recordStudyActivity();
    if (currentAnswer.isCorrect) playCorrect(); else playWrong();
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentAnswer(answers[questions[nextIdx]?.id]);
      saveProgress(nextIdx, answers);
    } else {
      setLocation(`/results/${moduleId}`);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      setCurrentAnswer(answers[questions[prevIdx]?.id]);
    }
  }

  function jumpTo(i: number) {
    setCurrentIndex(i);
    setCurrentAnswer(answers[questions[i]?.id]);
  }

  function resetQuiz() {
    if (!confirm("إعادة الكويز من الأول؟ سيتم حذف كل إجاباتك في هذه الوحدة.")) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      const all: Record<string, QuizProgress> = raw ? JSON.parse(raw) : {};
      delete all[moduleId];
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(all));
      const stats = loadStats();
      delete stats.moduleProgress[moduleId];
      let tc = 0, tw = 0;
      for (const m of Object.values(stats.moduleProgress)) { tc += m.correct; tw += m.wrong; }
      stats.totalCorrect = tc; stats.totalWrong = tw; stats.totalAnswered = tc + tw;
      saveStats(stats);
    } catch {}
    setCurrentIndex(0); setAnswers({}); setSubmitted(new Set()); setCurrentAnswer(undefined);
    setEliminatedOptions({}); setHintsUsed(new Set());
    sessionStartRef.current = Date.now(); setSessionElapsed(0);
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" dir="rtl">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">لا توجد أسئلة لهذه الوحدة</p>
          <button onClick={() => setLocation("/")} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">العودة</button>
        </div>
      </div>
    );
  }

  const question = questions[currentIndex];
  const isSubmitted = submitted.has(question.id);
  const isLast = currentIndex === questions.length - 1;
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const correctSoFar = Object.values(answers).filter((a) => a.isCorrect).length;
  const wrongSoFar = Object.values(answers).filter((a) => !a.isCorrect).length;
  const unansweredCount = questions.length - Object.keys(answers).length;
  const isCurrentBookmarked = bookmarkedKeys.has(String(question.id));
  const canUseHint = question.type === "single_choice" && !isSubmitted && !hintsUsed.has(question.id);
  const hintWasUsed = hintsUsed.has(question.id);

  const displayQuestion: Question = (
    question.type === "single_choice" && eliminatedOptions[question.id]?.length > 0
  ) ? {
    ...(question as SingleChoiceQuestion),
    options: (question as SingleChoiceQuestion).options.filter((o) => !eliminatedOptions[question.id].includes(o)),
  } : question;

  const badgeMap: Record<string, string> = {
    single_choice: "اختيار واحد", multiple_choice: "اختيار متعدد",
    true_false_table: "صح / خطأ", matching: "مطابقة", visual_review: "Hotspot / Drag & Drop",
  };
  const showScrollableGrid = questions.length > 50;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Home className="w-4 h-4" /><span className="hidden sm:inline">الرئيسية</span>
              </button>
              {Object.keys(answers).length > 0 && (
                <button onClick={resetQuiz} title="إعادة الكويز" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-1.5 py-1 rounded hover:bg-destructive/10">
                  <RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">ريست</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-green-400 font-medium"><CheckCircle className="w-4 h-4" />{correctSoFar}</span>
              <span className="flex items-center gap-1 text-red-400 font-medium"><XCircle className="w-4 h-4" />{wrongSoFar}</span>
            </div>
            <div className="flex items-center gap-2">
              {showTimer && (
                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{formatElapsed(sessionElapsed)}</span>
              )}
              <button
                onClick={() => { setShowTimer((t) => !t); if (!showTimer) sessionStartRef.current = Date.now(); }}
                title="مؤقت الجلسة"
                className={`p-1 rounded transition-colors ${showTimer ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Timer className="w-4 h-4" />
              </button>
              <span className="text-sm text-muted-foreground font-mono" dir="ltr">{currentIndex + 1} / {questions.length}</span>
            </div>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 pb-10">
        {/* Question header */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">
              {badgeMap[question.type] ?? question.type}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{question.topic}</span>
            {"difficulty" in question && question.difficulty && (
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                question.difficulty === "easy" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                question.difficulty === "medium" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                "bg-red-500/10 text-red-400 border-red-500/20"
              }`}>
                {question.difficulty === "easy" ? "سهل" : question.difficulty === "medium" ? "متوسط" : "صعب"}
              </span>
            )}
            <div className="flex items-center gap-1.5 mr-auto">
              <span className="text-xs text-muted-foreground">#{question.id}</span>
              {canUseHint && (
                <button
                  onClick={() => useHint(question)}
                  title="تلميح 50/50 — يحذف خيارين خاطئين"
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <Lightbulb className="w-3.5 h-3.5" />50/50
                </button>
              )}
              {hintWasUsed && !isSubmitted && <span className="text-xs text-amber-400/60">💡</span>}
              <button
                onClick={() => handleToggleBookmark(question)}
                title={isCurrentBookmarked ? "إزالة من المحفوظات" : "حفظ السؤال"}
                className={`p-1 rounded-md transition-colors ${isCurrentBookmarked ? "text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"}`}
              >
                <Bookmark className={`w-4 h-4 ${isCurrentBookmarked ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>
          <h2 className="text-base font-semibold text-foreground leading-relaxed">{question.question}</h2>
          {question.statusNote && (
            <p className="mt-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">⚠️ {question.statusNote}</p>
          )}
        </div>

        <QuestionRenderer
          question={displayQuestion}
          submitted={isSubmitted}
          onAnswer={setCurrentAnswer}
          userAnswer={answers[question.id]}
        />

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" /><span className="hidden sm:inline">السابق</span>
          </button>

          {!isSubmitted ? (
            <button
              onClick={submitAnswer}
              disabled={!currentAnswer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />تأكيد
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isLast ? "النتائج" : "التالي"}<ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Jump grid */}
        <div className="mt-8 border-t border-border pt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">انتقل إلى سؤال</p>
            <div className="flex items-center gap-2">
              {unansweredCount > 0 && (
                <button
                  onClick={() => jumpToNext("unanswered")}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <SkipForward className="w-3 h-3" />
                  التالي غير مُجاب ({unansweredCount})
                </button>
              )}
              {wrongSoFar > 0 && (
                <button
                  onClick={() => jumpToNext("wrong")}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/15 transition-colors"
                >
                  <SkipForward className="w-3 h-3" />التالي خطأ
                </button>
              )}
            </div>
          </div>

          <div className={`flex flex-wrap gap-1.5 ${showScrollableGrid ? "max-h-44 overflow-y-auto scrollbar-hide" : ""}`}>
            {questions.map((q, i) => {
              const ans = answers[q.id];
              const isBookm = bookmarkedKeys.has(String(q.id));
              const hasHint = hintsUsed.has(q.id);
              let cls = "w-8 h-8 text-xs rounded-lg border transition-all font-mono shrink-0 relative ";
              if (i === currentIndex) cls += "border-primary bg-primary text-primary-foreground";
              else if (ans?.isCorrect) cls += "border-green-500/40 bg-green-500/15 text-green-400";
              else if (ans !== undefined) cls += "border-red-500/40 bg-red-500/15 text-red-400";
              else if (isBookm) cls += "border-yellow-500/40 bg-yellow-500/15 text-yellow-400";
              else if (hasHint) cls += "border-amber-500/40 bg-amber-500/10 text-amber-400";
              else cls += "border-border bg-card text-muted-foreground hover:border-primary/40";
              return (
                <button key={q.id} onClick={() => jumpTo(i)} className={cls}>
                  {i + 1}
                  {isBookm && i !== currentIndex && <span className="absolute -top-0.5 -left-0.5 w-2 h-2 rounded-full bg-yellow-400" />}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
