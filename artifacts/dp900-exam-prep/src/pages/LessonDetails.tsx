import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import {
  CheckCircle2, AlertTriangle, Lightbulb, HelpCircle,
  ChevronLeft, ChevronRight, Clock, ArrowRight, Check, X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import lessonsRaw from "@/data/dp900_lessons.json";
import type { Lesson, MiniQuizQuestion } from "@/types/study";

const lessons = lessonsRaw as Lesson[];

export default function LessonDetails() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [, setLocation] = useLocation();
  const lesson = lessons.find((l) => l.id === lessonId);

  const [completed, setCompleted] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizRevealed, setQuizRevealed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("dp900_lesson_completed");
      if (raw) setCompleted(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    setQuizAnswers({});
    setQuizRevealed({});
  }, [lessonId]);

  if (!lesson) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <Navbar />
        <p className="text-muted-foreground">الدرس غير موجود.</p>
      </div>
    );
  }

  const isDone = completed.includes(lesson.id);
  const lessonIdx = lessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = lessons[lessonIdx - 1];
  const nextLesson = lessons[lessonIdx + 1];

  function markComplete() {
    const next = isDone
      ? completed.filter((id) => id !== lesson!.id)
      : [...completed, lesson!.id];
    setCompleted(next);
    localStorage.setItem("dp900_lesson_completed", JSON.stringify(next));
  }

  function selectAnswer(qIdx: number, option: string) {
    if (quizRevealed[qIdx]) return;
    setQuizAnswers((prev) => ({ ...prev, [qIdx]: option }));
  }

  function revealAnswer(qIdx: number) {
    if (!quizAnswers[qIdx]) return;
    setQuizRevealed((prev) => ({ ...prev, [qIdx]: true }));
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => setLocation("/study")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowRight className="w-4 h-4" />
          مركز المذاكرة
        </button>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {lesson.moduleName}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {lesson.estimatedMinutes} دقيقة
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{lesson.titleAr}</h1>
          <p className="text-muted-foreground text-sm font-mono mt-1">{lesson.title}</p>
        </div>

        {/* 1. Concept */}
        <Section icon={<Lightbulb className="w-5 h-5 text-yellow-400" />} title="الفكرة ببساطة">
          <p className="text-foreground leading-relaxed">{lesson.concept}</p>
        </Section>

        {/* 2. Keywords */}
        <Section icon={<HelpCircle className="w-5 h-5 text-blue-400" />} title="كلمات مفتاحية في الامتحان">
          <p className="text-xs text-muted-foreground mb-3">لما تشوف هذه الكلمات في سؤال، اعرف الإجابة فوراً:</p>
          <div className="flex flex-wrap gap-2">
            {lesson.keywords.map((kw) => (
              <span
                key={kw}
                className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20 font-mono"
              >
                {kw}
              </span>
            ))}
          </div>
        </Section>

        {/* 3. Comparison Table */}
        {lesson.comparison && (
          <Section icon={<ChevronRight className="w-5 h-5 text-purple-400" />} title="مقارنة مهمة">
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    {lesson.comparison.headers.map((h) => (
                      <th key={h} className="px-4 py-2.5 text-right font-semibold text-foreground border-b border-border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lesson.comparison.rows.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-card" : "bg-muted/20"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-2.5 border-b border-border/50 ${ci === 0 ? "font-semibold text-primary" : "text-foreground"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* 4. Traps */}
        {lesson.traps && lesson.traps.length > 0 && (
          <Section icon={<AlertTriangle className="w-5 h-5 text-red-400" />} title="فخاخ الامتحان">
            <div className="flex flex-col gap-3">
              {lesson.traps.map((trap, i) => (
                <div key={i} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-400 text-sm mb-1">⚠️ {trap.title}</p>
                      <p className="text-sm text-foreground leading-relaxed">{trap.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 5. Exam Rule */}
        <Section icon={<CheckCircle2 className="w-5 h-5 text-green-400" />} title="قاعدة الحل">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-green-300 font-mono text-sm leading-relaxed">{lesson.examRule}</p>
          </div>
        </Section>

        {/* 6. Mini Quiz */}
        {lesson.miniQuiz && lesson.miniQuiz.length > 0 && (
          <Section icon={<HelpCircle className="w-5 h-5 text-cyan-400" />} title="اختبر نفسك">
            <div className="flex flex-col gap-6">
              {lesson.miniQuiz.map((q: MiniQuizQuestion, qi) => {
                const selected = quizAnswers[qi];
                const revealed = quizRevealed[qi];
                const isCorrect = selected === q.correctAnswer;
                return (
                  <div key={qi} className="rounded-xl border border-border bg-card/50 p-5">
                    <p className="font-medium text-foreground mb-4 leading-relaxed">
                      <span className="text-muted-foreground text-sm ml-2">س{qi + 1}.</span>
                      {q.question}
                    </p>
                    <div className="flex flex-col gap-2 mb-4">
                      {q.options.map((opt) => {
                        let cls = "border border-border bg-muted/30 text-foreground hover:border-primary/40";
                        if (selected === opt && !revealed) cls = "border border-primary bg-primary/10 text-primary";
                        if (revealed && opt === q.correctAnswer) cls = "border border-green-500 bg-green-500/10 text-green-300";
                        if (revealed && selected === opt && opt !== q.correctAnswer) cls = "border border-red-500 bg-red-500/10 text-red-300";
                        return (
                          <button
                            key={opt}
                            onClick={() => selectAnswer(qi, opt)}
                            className={`w-full text-right px-4 py-2.5 rounded-lg text-sm transition-colors ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {!revealed ? (
                      <button
                        onClick={() => revealAnswer(qi)}
                        disabled={!selected}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
                      >
                        تحقق من الإجابة
                      </button>
                    ) : (
                      <div className={`flex items-start gap-2 p-3 rounded-lg ${isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                        {isCorrect
                          ? <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          : <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        }
                        <div>
                          <p className={`text-sm font-medium mb-1 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
                            {isCorrect ? "صح! 🎉" : `خطأ — الإجابة الصحيحة: ${q.correctAnswer}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{q.explanation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Mark complete + navigation */}
        <div className="border-t border-border pt-6 mt-8 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={markComplete}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
              isDone
                ? "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isDone ? "✅ تمت المراجعة" : "تمت المراجعة"}
          </button>

          <div className="flex items-center gap-2 mr-auto">
            {prevLesson && (
              <button
                onClick={() => setLocation(`/study/${prevLesson.id}`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>
            )}
            {nextLesson && (
              <button
                onClick={() => setLocation(`/study/${nextLesson.id}`)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2.5 mb-4">
        {icon}
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
