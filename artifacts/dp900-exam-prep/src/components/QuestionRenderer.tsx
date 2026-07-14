import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";
import type { Question, UserAnswer } from "@/types/quiz";

interface Props {
  question: Question;
  submitted: boolean;
  onAnswer: (answer: UserAnswer) => void;
  userAnswer?: UserAnswer;
}

export default function QuestionRenderer({ question, submitted, onAnswer, userAnswer }: Props) {
  if (question.type === "single_choice") {
    return (
      <SingleChoiceQuestion
        question={question}
        submitted={submitted}
        onAnswer={onAnswer}
        userAnswer={userAnswer as Extract<UserAnswer, { type: "single_choice" }> | undefined}
      />
    );
  }
  if (question.type === "multiple_choice") {
    return (
      <MultipleChoiceQuestion
        question={question}
        submitted={submitted}
        onAnswer={onAnswer}
        userAnswer={userAnswer as Extract<UserAnswer, { type: "multiple_choice" }> | undefined}
      />
    );
  }
  if (question.type === "true_false_table") {
    return (
      <TrueFalseTableQuestion
        question={question}
        submitted={submitted}
        onAnswer={onAnswer}
        userAnswer={userAnswer as Extract<UserAnswer, { type: "true_false_table" }> | undefined}
      />
    );
  }
  if (question.type === "matching") {
    return (
      <MatchingQuestion
        question={question}
        submitted={submitted}
        onAnswer={onAnswer}
        userAnswer={userAnswer?.type === "matching" ? userAnswer : undefined}
      />
    );
  }
  if (question.type === "visual_review") {
    return (
      <VisualReviewQuestion
        question={question}
        submitted={submitted}
        onAnswer={onAnswer}
        userAnswer={userAnswer as Extract<UserAnswer, { type: "visual_review" }> | undefined}
      />
    );
  }
  return null;
}

function SourceImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) return null;
  return (
    <div className="rounded-xl border border-border bg-white p-2 overflow-hidden" dir="ltr">
      <img src={src} alt={alt} className="w-full h-auto object-contain rounded-lg" loading="lazy" />
    </div>
  );
}

function SourceImages({ sources, alt }: { sources?: string[]; alt: string }) {
  if (!sources?.length) return null;
  return (
    <div className="space-y-3">
      {sources.map((src, index) => <SourceImage key={src} src={src} alt={`${alt} ${index + 1}`} />)}
    </div>
  );
}

/* -------- Single Choice -------- */
function SingleChoiceQuestion({ question, submitted, onAnswer, userAnswer }: {
  question: Extract<Question, { type: "single_choice" }>;
  submitted: boolean;
  onAnswer: (a: UserAnswer) => void;
  userAnswer?: Extract<UserAnswer, { type: "single_choice" }>;
}) {
  const [selected, setSelected] = useState<string>(userAnswer?.selected ?? "");

  useEffect(() => { if (userAnswer?.selected) setSelected(userAnswer.selected); }, [userAnswer]);

  function pick(opt: string) {
    if (submitted) return;
    setSelected(opt);
    const isCorrect = opt === question.correctAnswer;
    onAnswer({ type: "single_choice", selected: opt, isCorrect });
  }

  return (
    <div className="space-y-3">
      <SourceImages sources={question.promptImages} alt={`Question ${question.id} source graphic`} />
      {question.options.map((opt, i) => {
        const isSelected = selected === opt;
        const isCorrect = opt === question.correctAnswer;
        let cls = "w-full text-right px-4 py-3 rounded-lg border text-sm transition-all cursor-pointer ";
        if (!submitted) {
          cls += isSelected
            ? "border-primary bg-primary/15 text-foreground"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5";
        } else {
          if (isCorrect) cls += "border-green-500 bg-green-500/15 text-green-300";
          else if (isSelected && !isCorrect) cls += "border-red-500 bg-red-500/15 text-red-300";
          else cls += "border-border bg-card text-muted-foreground";
        }

        return (
          <button
            key={i}
            data-testid={`option-${i}`}
            onClick={() => pick(opt)}
            disabled={submitted}
            className={cls + " flex items-center justify-between gap-3"}
          >
            <span className="flex-1 text-right">{opt}</span>
            {submitted && isCorrect && <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />}
            {submitted && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
          </button>
        );
      })}
      {submitted && question.explanation && (
        <ExplanationBox text={question.explanation} isCorrect={selected === question.correctAnswer} />
      )}
      {submitted && <SourceImages sources={question.answerImages} alt={`Question ${question.id} answer graphic`} />}
    </div>
  );
}

/* -------- Multiple Choice -------- */
function MultipleChoiceQuestion({ question, submitted, onAnswer, userAnswer }: {
  question: Extract<Question, { type: "multiple_choice" }>;
  submitted: boolean;
  onAnswer: (a: UserAnswer) => void;
  userAnswer?: Extract<UserAnswer, { type: "multiple_choice" }>;
}) {
  const [selected, setSelected] = useState<string[]>(userAnswer?.selected ?? []);

  useEffect(() => { if (userAnswer?.selected) setSelected(userAnswer.selected); }, [userAnswer]);

  function toggle(opt: string) {
    if (submitted) return;
    const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt];
    setSelected(next);
    const isCorrect =
      next.length === question.correctAnswers.length &&
      next.every((x) => question.correctAnswers.includes(x));
    onAnswer({ type: "multiple_choice", selected: next, isCorrect });
  }

  return (
    <div className="space-y-3">
      <SourceImages sources={question.promptImages} alt={`Question ${question.id} source graphic`} />
      <p className="text-xs text-muted-foreground mb-1">اختر إجابات متعددة</p>
      {question.options.map((opt, i) => {
        const isSelected = selected.includes(opt);
        const isCorrect = question.correctAnswers.includes(opt);
        let cls = "w-full text-right px-4 py-3 rounded-lg border text-sm transition-all cursor-pointer flex items-center justify-between gap-3 ";
        if (!submitted) {
          cls += isSelected
            ? "border-primary bg-primary/15 text-foreground"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5";
        } else {
          if (isCorrect) cls += "border-green-500 bg-green-500/15 text-green-300";
          else if (isSelected && !isCorrect) cls += "border-red-500 bg-red-500/15 text-red-300";
          else cls += "border-border bg-card text-muted-foreground";
        }

        return (
          <button
            key={i}
            data-testid={`option-${i}`}
            onClick={() => toggle(opt)}
            disabled={submitted}
            className={cls}
          >
            <span className="flex-1 text-right">{opt}</span>
            <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground"}`}>
              {isSelected && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
            </span>
          </button>
        );
      })}
      {submitted && question.explanation && (
        <ExplanationBox
          text={question.explanation}
          isCorrect={
            selected.length === question.correctAnswers.length &&
            selected.every((x) => question.correctAnswers.includes(x))
          }
        />
      )}
      {submitted && <SourceImages sources={question.answerImages} alt={`Question ${question.id} answer graphic`} />}
    </div>
  );
}

/* -------- Source visual / hotspot self-review -------- */
function VisualReviewQuestion({ question, submitted, onAnswer, userAnswer }: {
  question: Extract<Question, { type: "visual_review" }>;
  submitted: boolean;
  onAnswer: (a: UserAnswer) => void;
  userAnswer?: Extract<UserAnswer, { type: "visual_review" }>;
}) {
  const [selected, setSelected] = useState<"correct" | "wrong" | "">(userAnswer?.selected ?? "");

  useEffect(() => {
    setSelected(userAnswer?.selected ?? "");
  }, [question.id, userAnswer]);

  function pick(value: "correct" | "wrong") {
    if (submitted) return;
    setSelected(value);
    onAnswer({ type: "visual_review", selected: value, isCorrect: value === "correct" });
  }

  return (
    <div className="space-y-4">
      <SourceImages sources={question.promptImages} alt={`Question ${question.id} answer area`} />
      <p className="text-sm text-muted-foreground">حلّي السؤال أولًا، ثم اختاري تقييم إجابتك بعد مراجعة الحل.</p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled={submitted}
          onClick={() => pick("correct")}
          className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${selected === "correct" ? "border-green-500 bg-green-500/15 text-green-300" : "border-border bg-card hover:border-green-500/50"}`}
        >
          إجابتي صحيحة
        </button>
        <button
          type="button"
          disabled={submitted}
          onClick={() => pick("wrong")}
          className={`rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${selected === "wrong" ? "border-red-500 bg-red-500/15 text-red-300" : "border-border bg-card hover:border-red-500/50"}`}
        >
          إجابتي خاطئة
        </button>
      </div>
      {submitted && (
        <>
          <SourceImages sources={question.answerImages} alt={`Question ${question.id} correct answer`} />
          {question.explanation && <ExplanationBox text={question.explanation} isCorrect={selected === "correct"} />}
        </>
      )}
    </div>
  );
}

/* -------- True/False Table -------- */
function TrueFalseTableQuestion({ question, submitted, onAnswer, userAnswer }: {
  question: Extract<Question, { type: "true_false_table" }>;
  submitted: boolean;
  onAnswer: (a: UserAnswer) => void;
  userAnswer?: Extract<UserAnswer, { type: "true_false_table" }>;
}) {
  const [selected, setSelected] = useState<Record<number, "Yes" | "No">>(userAnswer?.selected ?? {});

  useEffect(() => { if (userAnswer?.selected) setSelected(userAnswer.selected); }, [userAnswer]);

  function pick(idx: number, val: "Yes" | "No") {
    if (submitted) return;
    const next = { ...selected, [idx]: val };
    setSelected(next);
    const allAnswered = question.statements.every((_, i) => next[i] !== undefined);
    const isCorrect = allAnswered && question.statements.every((s, i) => next[i] === s.correctAnswer);
    onAnswer({ type: "true_false_table", selected: next, isCorrect });
  }

  return (
    <div className="space-y-3">
      <SourceImages sources={question.promptImages} alt={`Question ${question.id} source graphic`} />
      {question.statements.map((stmt, i) => {
        const picked = selected[i];
        const correct = stmt.correctAnswer;
        return (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground mb-3 leading-relaxed">{stmt.text}</p>
            <div className="flex items-center gap-3">
              {(["Yes", "No"] as const).map((val) => {
                const isThis = picked === val;
                const isCorrectVal = correct === val;
                let cls = "flex-1 py-2 rounded-lg text-sm font-medium border transition-all ";
                if (!submitted) {
                  cls += isThis
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-border bg-muted text-muted-foreground hover:border-primary/40";
                } else {
                  if (isCorrectVal) cls += "border-green-500 bg-green-500/15 text-green-300";
                  else if (isThis && !isCorrectVal) cls += "border-red-500 bg-red-500/15 text-red-300";
                  else cls += "border-border bg-muted text-muted-foreground";
                }
                return (
                  <button
                    key={val}
                    data-testid={`stmt-${i}-${val}`}
                    onClick={() => pick(i, val)}
                    disabled={submitted}
                    className={cls}
                  >
                    {val === "Yes" ? "نعم" : "لا"}
                  </button>
                );
              })}
            </div>
            {submitted && (
              <div className={`mt-2 flex items-start gap-2 text-xs rounded p-2 ${picked === correct ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                {picked === correct ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>{stmt.explanation}</span>
              </div>
            )}
          </div>
        );
      })}
      {submitted && question.explanation && (
        <ExplanationBox
          text={question.explanation}
          isCorrect={question.statements.every((statement, index) => selected[index] === statement.correctAnswer)}
        />
      )}
    </div>
  );
}

/* -------- Matching -------- */
function MatchingQuestion({ question, submitted, onAnswer, userAnswer }: {
  question: Extract<Question, { type: "matching" }>;
  submitted: boolean;
  onAnswer: (a: UserAnswer) => void;
  userAnswer?: Extract<UserAnswer, { type: "matching" }>;
}) {
  const [selected, setSelected] = useState<Record<number, string>>(userAnswer?.selected ?? {});
  const defaultOptions = question.options ?? [...new Set(question.pairs.map((p) => p.correctAnswer))];

  useEffect(() => { if (userAnswer?.selected) setSelected(userAnswer.selected); }, [userAnswer]);

  function pick(idx: number, val: string) {
    if (submitted) return;
    const next = { ...selected, [idx]: val };
    setSelected(next);
    const allAnswered = question.pairs.every((_, i) => next[i] !== undefined && next[i] !== "");
    const isCorrect = allAnswered && question.pairs.every((p, i) => next[i] === p.correctAnswer);
    onAnswer({ type: "matching", selected: next, isCorrect });
  }

  return (
    <div className="space-y-3">
      <SourceImages sources={question.promptImages} alt={`Question ${question.id} source graphic`} />
      {question.pairs.map((pair, i) => {
        const picked = selected[i] ?? "";
        const isCorrect = picked === pair.correctAnswer;
        return (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-foreground mb-3 font-medium">{pair.prompt}</p>
            <select
              data-testid={`match-${i}`}
              value={picked}
              onChange={(e) => pick(i, e.target.value)}
              disabled={submitted}
              className={`w-full px-3 py-2 rounded-lg border text-sm bg-muted text-foreground focus:outline-none transition-all ${
                submitted
                  ? isCorrect
                    ? "border-green-500 bg-green-500/15 text-green-300"
                    : "border-red-500 bg-red-500/15 text-red-300"
                  : picked
                  ? "border-primary"
                  : "border-border"
              }`}
            >
              <option value="">— اختر —</option>
              {(pair.options ?? defaultOptions).map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {submitted && (
              <div className={`mt-2 flex items-start gap-2 text-xs rounded p-2 ${isCorrect ? "bg-green-500/10 text-green-300" : "bg-red-500/10 text-red-300"}`}>
                {isCorrect ? <CheckCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {!isCorrect && <span>الصحيح: {pair.correctAnswer} — </span>}
                <span>{pair.explanation}</span>
              </div>
            )}
          </div>
        );
      })}
      {submitted && question.explanation && (
        <ExplanationBox
          text={question.explanation}
          isCorrect={question.pairs.every((pair, i) => selected[i] === pair.correctAnswer)}
        />
      )}
      {submitted && <SourceImages sources={question.answerImages} alt={`Question ${question.id} corrected answer graphic`} />}
    </div>
  );
}

/* -------- Explanation Box -------- */
function ExplanationBox({ text, isCorrect }: { text: string; isCorrect: boolean }) {
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg text-sm mt-2 ${isCorrect ? "bg-green-500/10 text-green-300 border border-green-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
      <Info className="w-4 h-4 shrink-0 mt-0.5" />
      <p className="leading-relaxed">{text}</p>
    </div>
  );
}
