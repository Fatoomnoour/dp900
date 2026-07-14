import type { Question, QuizProgress, UserAnswer } from "@/types/quiz";

/** Grade a saved answer against the current answer key. */
export function gradeAnswer(question: Question, answer: UserAnswer): boolean {
  if (question.type !== answer.type) return false;

  switch (question.type) {
    case "single_choice":
      return answer.type === "single_choice" && answer.selected === question.correctAnswer;

    case "multiple_choice":
      return answer.type === "multiple_choice" &&
        answer.selected.length === question.correctAnswers.length &&
        answer.selected.every((value) => question.correctAnswers.includes(value));

    case "true_false_table":
      return answer.type === "true_false_table" &&
        question.statements.every((statement, index) => answer.selected[index] === statement.correctAnswer);

    case "matching":
      return answer.type === "matching" &&
        question.pairs.every((pair, index) => answer.selected[index] === pair.correctAnswer);

    case "visual_review":
      return answer.type === "visual_review" && answer.selected === "correct";
  }
}

function withGrade(answer: UserAnswer, isCorrect: boolean): UserAnswer {
  return { ...answer, isCorrect } as UserAnswer;
}

/**
 * Re-grade saved progress whenever the answer key changes.
 * This repairs previously stored false negatives without deleting user progress.
 */
export function repairSavedProgress(
  moduleId: string,
  questions: Question[],
): QuizProgress | null {
  try {
    const progressKey = "dp900_progress";
    const statsKey = "dp900_stats";
    const mistakesKey = "dp900_mistakes";

    const raw = localStorage.getItem(progressKey);
    if (!raw) return null;

    const allProgress: Record<string, QuizProgress> = JSON.parse(raw);
    const saved = allProgress[moduleId];
    if (!saved) return null;

    const questionById = new Map(questions.map((question) => [String(question.id), question]));
    const repairedAnswers: Record<string | number, UserAnswer> = {};

    for (const [questionId, answer] of Object.entries(saved.answers)) {
      const question = questionById.get(String(questionId));
      repairedAnswers[questionId] = question
        ? withGrade(answer, gradeAnswer(question, answer))
        : answer;
    }

    const correctCount = Object.values(repairedAnswers).filter((answer) => answer.isCorrect).length;
    const wrongCount = Object.values(repairedAnswers).filter((answer) => !answer.isCorrect).length;
    const repaired: QuizProgress = {
      ...saved,
      answers: repairedAnswers,
      correctCount,
      wrongCount,
      completed: Object.keys(repairedAnswers).length >= questions.length,
    };

    allProgress[moduleId] = repaired;
    localStorage.setItem(progressKey, JSON.stringify(allProgress));

    // Keep the global dashboard totals in sync with the repaired module.
    const statsRaw = localStorage.getItem(statsKey);
    const stats = statsRaw
      ? JSON.parse(statsRaw)
      : { totalCorrect: 0, totalWrong: 0, totalAnswered: 0, moduleProgress: {} };
    stats.moduleProgress ??= {};
    stats.moduleProgress[moduleId] = {
      correct: correctCount,
      wrong: wrongCount,
      total: questions.length,
      completed: repaired.completed,
    };
    const modules = Object.values(stats.moduleProgress) as Array<{ correct: number; wrong: number }>;
    stats.totalCorrect = modules.reduce((sum, item) => sum + item.correct, 0);
    stats.totalWrong = modules.reduce((sum, item) => sum + item.wrong, 0);
    stats.totalAnswered = stats.totalCorrect + stats.totalWrong;
    localStorage.setItem(statsKey, JSON.stringify(stats));

    // Remove questions that are no longer mistakes after the answer-key repair.
    const mistakesRaw = localStorage.getItem(mistakesKey);
    if (mistakesRaw) {
      const mistakes = JSON.parse(mistakesRaw) as Array<{ moduleId: string; questionId: string | number }>;
      const repairedMistakes = mistakes.filter((mistake) => {
        if (mistake.moduleId !== moduleId) return true;
        const answer = repairedAnswers[String(mistake.questionId)];
        return !answer?.isCorrect;
      });
      localStorage.setItem(mistakesKey, JSON.stringify(repairedMistakes));
    }

    return repaired;
  } catch {
    return null;
  }
}
