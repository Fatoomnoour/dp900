import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bookmark, Trash2, RotateCcw, ChevronRight, ChevronLeft, Send, CheckCircle, XCircle } from "lucide-react";
import { STORAGE_KEYS, loadBookmarks, saveBookmarks, getQuestionsByModule, MODULES } from "@/lib/loadQuestions";
import QuestionRenderer from "@/components/QuestionRenderer";
import Navbar from "@/components/Navbar";
import type { BookmarkEntry, UserAnswer, Question } from "@/types/quiz";

export default function Bookmarks() {
  const [, setLocation] = useLocation();
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [mode, setMode] = useState<"list" | "review">("list");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, UserAnswer>>({});
  const [practiceSubmitted, setPracticeSubmitted] = useState<Set<number>>(new Set());
  const [currentAnswer, setCurrentAnswer] = useState<UserAnswer | undefined>(undefined);
  const [filterModule, setFilterModule] = useState<string>("الكل");

  useEffect(() => {
    setBookmarks(loadBookmarks());
  }, []);

  function removeBookmark(questionId: string | number, moduleId: string) {
    const updated = bookmarks.filter((b) => !(b.questionId === questionId && b.moduleId === moduleId));
    setBookmarks(updated);
    saveBookmarks(updated);
  }

  function clearAll() {
    if (!confirm("حذف جميع المحفوظات؟")) return;
    setBookmarks([]);
    saveBookmarks([]);
  }

  // Get actual Question object from a bookmark entry
  function getQuestion(entry: BookmarkEntry): Question | null {
    const questions = getQuestionsByModule(entry.moduleId);
    return questions.find((q) => String(q.id) === String(entry.questionId)) ?? null;
  }

  const moduleNames: Record<string, string> = {
    "module-dump": "DUMP Questions",
    ...Object.fromEntries(MODULES.filter((m) => m.id !== "module-full" && m.id !== "module-dump").map((m) => [m.id, m.name])),
  };

  const modules = ["الكل", ...Array.from(new Set(bookmarks.map((b) => b.moduleId)))];
  const filtered = filterModule === "الكل" ? bookmarks : bookmarks.filter((b) => b.moduleId === filterModule);

  function startReview() {
    // Only review bookmarks that have a resolvable question
    const reviewable = filtered.filter((b) => getQuestion(b) !== null);
    if (reviewable.length === 0) return;
    setMode("review");
    setCurrentIdx(0);
    setPracticeAnswers({});
    setPracticeSubmitted(new Set());
    setCurrentAnswer(undefined);
  }

  /* ---- LIST mode ---- */
  if (mode === "list") {
    return (
      <div className="min-h-screen bg-background" dir="rtl">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Bookmark className="w-6 h-6 text-yellow-400 fill-current" />
                الأسئلة المحفوظة
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">الأسئلة التي حفظتها للمراجعة لاحقاً</p>
            </div>
            {bookmarks.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">حذف الكل</span>
              </button>
            )}
          </div>

          {bookmarks.length === 0 ? (
            <div className="text-center py-20">
              <Bookmark className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">لا توجد محفوظات بعد</h2>
              <p className="text-muted-foreground text-sm mb-6">
                اضغط على أيقونة ⭐ في أي سؤال أثناء الكويز لحفظه هنا
              </p>
              <button
                onClick={() => setLocation("/")}
                className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                ابدأ التدريب
              </button>
            </div>
          ) : (
            <>
              {/* Module filter */}
              {modules.length > 2 && (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
                  {modules.map((m) => (
                    <button
                      key={m}
                      onClick={() => setFilterModule(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                        filterModule === m
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "الكل" ? "الكل" : moduleNames[m] ?? m}
                      {m !== "الكل" && (
                        <span className="mr-1 opacity-70">({bookmarks.filter((b) => b.moduleId === m).length})</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{filtered.length}</span> محفوظ
                </p>
                {filtered.filter((b) => getQuestion(b) !== null).length > 0 && (
                  <button
                    onClick={startReview}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 font-semibold text-sm hover:bg-yellow-500/20 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    تدريب على المحفوظات
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {filtered.map((entry, i) => (
                  <div
                    key={`${entry.moduleId}-${entry.questionId}`}
                    className="rounded-xl bg-card border border-yellow-500/15 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Bookmark className="w-4 h-4 text-yellow-400 fill-current shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed line-clamp-2">
                          {entry.questionText}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {entry.topic}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {moduleNames[entry.moduleId] ?? entry.moduleId}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeBookmark(entry.questionId, entry.moduleId)}
                        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    );
  }

  /* ---- REVIEW mode ---- */
  const reviewList = filtered.filter((b) => getQuestion(b) !== null);
  if (reviewList.length === 0 || currentIdx >= reviewList.length) {
    setMode("list");
    return null;
  }

  const entry = reviewList[currentIdx];
  const question = getQuestion(entry)!;
  const isSubmitted = practiceSubmitted.has(currentIdx);
  const isLast = currentIdx === reviewList.length - 1;
  const progress = ((currentIdx + 1) / reviewList.length) * 100;
  const reviewCorrect = Object.values(practiceAnswers).filter((a) => a.isCorrect).length;

  function submitAnswer() {
    if (!currentAnswer) return;
    const newSubmitted = new Set(practiceSubmitted);
    newSubmitted.add(currentIdx);
    setPracticeSubmitted(newSubmitted);
    setPracticeAnswers({ ...practiceAnswers, [currentIdx]: currentAnswer });
  }

  function goNext() {
    if (currentIdx < reviewList.length - 1) {
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

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setMode("list")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bookmark className="w-4 h-4 fill-current text-yellow-400" />
              <span className="hidden sm:inline">المحفوظات</span>
            </button>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-green-400 font-medium">{reviewCorrect} ✓</span>
            </div>
            <span className="text-sm text-muted-foreground font-mono" dir="ltr">{currentIdx + 1} / {reviewList.length}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20 font-medium">
              مراجعة المحفوظات ⭐
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 text-black text-sm font-semibold disabled:opacity-40 hover:bg-yellow-400 transition-colors"
            >
              <Send className="w-4 h-4" />
              تأكيد
            </button>
          ) : (
            <button
              onClick={goNext}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-yellow-500 text-black text-sm font-semibold hover:bg-yellow-400 transition-colors"
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
