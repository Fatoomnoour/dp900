import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const file = path.resolve(here, "../src/data/dp900_dump.json");
const { questions } = JSON.parse(fs.readFileSync(file, "utf8"));
const errors = [];
const ids = new Set();

if (!Array.isArray(questions) || questions.length !== 82) {
  errors.push(`Expected exactly 82 dump questions, found ${questions?.length ?? "invalid data"}.`);
}

for (const question of questions ?? []) {
  if (ids.has(question.id)) errors.push(`${question.id}: duplicate question id.`);
  ids.add(question.id);

  if (question.type === "single_choice") {
    if (!question.options.includes(question.correctAnswer)) {
      errors.push(`${question.id}: correctAnswer is not one of the displayed options.`);
    }
  } else if (question.type === "multiple_choice") {
    for (const answer of question.correctAnswers ?? []) {
      if (!question.options.includes(answer)) {
        errors.push(`${question.id}: correct answer \"${answer}\" is not one of the displayed options.`);
      }
    }
  } else if (question.type === "true_false_table") {
    for (const [index, statement] of (question.statements ?? []).entries()) {
      if (!["Yes", "No"].includes(statement.correctAnswer)) {
        errors.push(`${question.id}, statement ${index + 1}: answer must be Yes or No.`);
      }
    }
  } else if (question.type === "matching") {
    for (const [index, pair] of (question.pairs ?? []).entries()) {
      if (!pair.correctAnswer) errors.push(`${question.id}, pair ${index + 1}: missing correct answer.`);
    }
  }
}

if (errors.length) {
  console.error("DP-900 dump validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}

console.log(`Validated ${questions.length} DP-900 dump questions successfully.`);
