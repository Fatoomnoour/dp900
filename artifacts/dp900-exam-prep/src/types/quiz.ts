export type QuestionType = "single_choice" | "multiple_choice" | "true_false_table" | "matching" | "visual_review";

export interface BaseQuestion {
  id: string | number;
  topic: string;
  type: QuestionType;
  question: string;
  explanation?: string;
  statusNote?: string;
  difficulty?: string;
  sourceNumber?: number;
  sourcePage?: number;
  promptImages?: string[];
  answerImages?: string[];
}

export interface SingleChoiceQuestion extends BaseQuestion {
  type: "single_choice";
  options: string[];
  correctAnswer: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: string[];
  correctAnswers: string[];
}

export interface TrueFalseStatement {
  text: string;
  correctAnswer: "Yes" | "No";
  explanation: string;
}

export interface TrueFalseTableQuestion extends BaseQuestion {
  type: "true_false_table";
  statements: TrueFalseStatement[];
}

export interface MatchingPair {
  prompt: string;
  correctAnswer: string;
  explanation: string;
  options?: string[];
}

export interface MatchingQuestion extends BaseQuestion {
  type: "matching";
  pairs: MatchingPair[];
  options?: string[];
}

export interface VisualReviewQuestion extends BaseQuestion {
  type: "visual_review";
  answerText: string;
}

export type Question = SingleChoiceQuestion | MultipleChoiceQuestion | TrueFalseTableQuestion | MatchingQuestion | VisualReviewQuestion;

export interface Module {
  id: string;
  name: string;
  nameEn: string;
  range: string;
  startId: number;
  endId: number;
  questions: Question[];
}

export interface QuizProgress {
  moduleId: string;
  currentIndex: number;
  answers: Record<string | number, UserAnswer>;
  correctCount: number;
  wrongCount: number;
  startedAt: number;
  completed: boolean;
}

export type UserAnswer =
  | { type: "single_choice"; selected: string; isCorrect: boolean }
  | { type: "multiple_choice"; selected: string[]; isCorrect: boolean }
  | { type: "true_false_table"; selected: Record<number, "Yes" | "No">; isCorrect: boolean }
  | { type: "matching"; selected: Record<number, string>; isCorrect: boolean }
  | { type: "visual_review"; selected: "correct" | "wrong"; isCorrect: boolean };

export interface MistakeEntry {
  questionId: string | number;
  moduleId: string;
  question: Question;
  userAnswer: UserAnswer;
  savedAt: number;
}

export interface BookmarkEntry {
  questionId: string | number;
  moduleId: string;
  questionText: string;
  topic: string;
  savedAt: number;
}

export interface GlobalStats {
  totalCorrect: number;
  totalWrong: number;
  totalAnswered: number;
  moduleProgress: Record<string, { correct: number; wrong: number; total: number; completed: boolean }>;
}
