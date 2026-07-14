import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { AlertCircle, Trash2, RotateCcw, ChevronRight, ChevronLeft, Send, CheckCircle, XCircle, BookOpen } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/loadQuestions";
import QuestionRenderer from "@/components/QuestionRenderer";
import Navbar from "@/components/Navbar";
import type { MistakeEntry, UserAnswer } from "@/types/quiz";
import lessonsRaw from "@/data/dp900_lessons.json";

interface LessonMeta { id: string; titleAr: string; relatedTopics: string[]; }
const lessons = lessonsRaw as LessonMeta[];

function findRelatedLesson(topic: string): LessonMeta | null {
  const t = topic.toLowerCase();
  return (
    lessons.find((l) =>
      l.relatedTopics.some((rt) => rt.toLowerCase().includes(t) || t.includes(rt.toLowerCase()))
    ) ??
    lessons.find((l) => l.titleAr.includes(topic) || l.id.includes(t.replace(/\s/g, "-"))) ??
    null
  );
}

export default function Mistakes() {
  const [, setLocation] = useLocation();
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [mode, setMode] = useState<"list" | "review">("list");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, UserAnswer>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<Set<number>>(new Set());
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [filterTopic, setFilterTopic] = useState<string>("الكل");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MISTAKES);
      if (raw) setMistakes(JSON.parse(raw));
    } catch {}
  }, []);

  const topics = ["الكل", ...Array.from(new Set(mistakes.map((m) => m.question.topic)))];
  const filtered = filterTopic === "الكل" ? mistakes : mistakes.filter((m) => m.question.topic === filterTopic);

  function clearAll() {
    if (!confirm("هل تريد حذف جميع الأخطاء المحفوظة؟")) return;
    localStorage.removeItem(STORAGE_KEYS.MISTAKES);
    setMistakes([]);
  }

  function removeMistake(questionId: string | number, moduleId: string) {
    const updated = mistakes.filter((m) => !(m.questionId === questionId && m.moduleId === moduleId));
    setMistakes(updated);
    localStorage.setItem(STORAGE_KEYS.MISTAKES, JSON.stringify(updated));
  }

  function startReview() {
    setMode("review");
    setCurrentIdx(0);
    setPracticeAnswers({});
    setPracticeSubmitted(new Set());
    setCurrentAnswer(undefined);
  }

  function submitAnswer() {
    if (!currentAnswer) return;
    const newSubmitted = new Set(practiceSubmitted);
    newSubmitted.add(currentIdx);
    setPracticeSubmitted(newSubmitted);
    setPracticeAnswers({ ...practiceAnswers, [currentIdx]: currentAnswer });
  }

  function goNext() {
    if (currentIdx < filtered.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setCurrentAnswer(practiceAnswers[nextIdx]);
    } else {
      setMode("list");
    }
  }

  function goPrev() {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      setCurrentAnswer(practiceAnswers[prevIdx]);
    }
  }

  /* ---- LIST mode ---- */
  if (mode === "list") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">الأخطاء المحفوظة</h1>
              <p className="text-sm text-muted-foreground mt-0.5">الأسئلة التي أخطأت فيها — راجعها وتعلم منها</p>
            </div>
            {mistakes.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">حذف الكل</span>
              </button>
            )}
          </div>

          {mistakes.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">لا توجد أخطاء! 🎉</h2>
              <p className="text-muted-foreground text-sm mb-6">أداؤك ممتاز. ستظهر الأسئلة التي أخطأت فيها هنا.</p>
              <button
                onClick={() => setLocation("/")}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                ابدأ التدريب
              </button>
            </div>
          ) : (
            <>
              {/* Topic filter */}
              {topics.length > 2 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTopic(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                        filterTopic === t
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                      {t !== "الكل" && (
                        <span className="mr-1 opacity-70">
                          ({mistakes.filter((m) => m.question.topic === t).length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> خطأ
                  {filterTopic !== "الكل" && ` في "${filterTopic}"`}
                </p>
                {filtered.length > 0 && (
                  <button
                    onClick={startReview}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    تدريب
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {filtered.map((entry, i) => {
                  const relatedLesson = findRelatedLesson(entry.question.topic);
                  return (
                    <div
                      key={`${entry.moduleId}-${entry.questionId}`}
                      className="rounded-xl bg-card border border-red-500/15 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                            {entry.question.question}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                              {entry.question.topic}
                            </span>
                            <span className="text-xs text-muted-foreground">#{entry.questionId}</span>
                            {relatedLesson && (
                              <button
                                onClick={() => setLocation(`/study/${relatedLesson.id}`)}
                                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                              >
                                <BookOpen className="w-3 h-3" />
                                ذاكر المفهوم المرتبط
                              </button>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => removeMistake(entry.questionId, entry.moduleId)}
                          className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  /* ---- REVIEW mode ---- */
  const reviewList = filtered;
  const entry = reviewList[currentIdx];
  if (!entry) {
    setMode("list");
    return null;
  }
  const question = entry.question;
  const isSubmitted = practiceSubmitted.has(currentIdx);
  const isLast = currentIdx === reviewList.length - 1;
  const progress = ((currentIdx + 1) / reviewList.length) * 100;
  const reviewCorrect = Object.values(practiceAnswers).filter((a) => a.isCorrect).length;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMode("list")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">قائمة الأخطاء</span>
            </button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 font-medium">{reviewCorrect} ✓</span>
            </div>
            <span className="text-sm text-muted-foreground font-mono" dir="ltr">{currentIdx + 1} / {reviewList.length}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium">
              مراجعة الأخطاء
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{question.topic}</span>
            <span className="text-xs text-muted-foreground mr-auto">#{question.id}</span>
          </div>
          <h2 className="text-base font-semibold text-foreground leading-relaxed">{question.question}</h2>
        </div>

        <QuestionRenderer
          question={question}
          submitted={isSubmitted}
          onAnswer={setCurrentAnswer}
          userAnswer={practiceAnswers[currentIdx]}
        />

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={goPrev}
            disabled={currentIdx === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card text-foreground text-sm disabled:opacity-40 hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            <span className="hidden sm:inline">السابق</span>
          </button>

          {!isSubmitted ? (
            <button
              onClick={submitAnswer}
              disabled={!currentAnswer}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              <Send className="w-4 h-4" />
              تأكيد
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              {isLast ? "إنهاء المراجعة" : "التالي"}
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
