export interface MiniQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Trap {
  title: string;
  explanation: string;
}

export interface Comparison {
  headers: string[];
  rows: string[][];
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleName: string;
  title: string;
  titleAr: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedMinutes: number;
  concept: string;
  keywords: string[];
  examRule: string;
  comparison?: Comparison;
  traps?: Trap[];
  miniQuiz?: MiniQuizQuestion[];
  relatedTopics: string[];
}
