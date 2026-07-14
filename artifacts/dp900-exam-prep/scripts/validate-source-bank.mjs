import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(here, "../src/data");
const files = [
  "dp900_001_050.json",
  "dp900_051_100.json",
  "dp900_101_150.json",
  "dp900_151_200.json",
  "dp900_201_250.json",
  "dp900_251_304.json",
];
const questions = files.flatMap((name) => JSON.parse(fs.readFileSync(path.join(dataDir, name), "utf8")).questions);
const errors = [];
const ids = new Set();

if (questions.length !== 306) errors.push(`Expected 306 source-bank entries, found ${questions.length}.`);

for (const q of questions) {
  const id = String(q.id);
  if (ids.has(id)) errors.push(`${id}: duplicate id.`);
  ids.add(id);
  if (q.type === "visual_review") errors.push(`${id}: visual_review is not allowed; source questions must be auto-graded.`);
  if (q.answerImages?.length) errors.push(`${id}: answerImages should not be displayed after interactive conversion.`);

  if (q.type === "single_choice") {
    if (!Array.isArray(q.options) || !q.options.includes(q.correctAnswer)) errors.push(`${id}: invalid single-choice answer key.`);
  } else if (q.type === "multiple_choice") {
    for (const a of q.correctAnswers ?? []) if (!q.options?.includes(a)) errors.push(`${id}: missing multiple-choice option ${a}.`);
  } else if (q.type === "true_false_table") {
    if (!q.statements?.length) errors.push(`${id}: missing true/false statements.`);
    for (const [i,s] of (q.statements ?? []).entries()) if (!["Yes","No"].includes(s.correctAnswer)) errors.push(`${id}/${i+1}: invalid Yes/No key.`);
  } else if (q.type === "matching") {
    if (!q.pairs?.length) errors.push(`${id}: missing matching pairs.`);
    const globalOptions = q.options ?? [];
    for (const [i,p] of (q.pairs ?? []).entries()) {
      const options = p.options ?? globalOptions;
      if (!p.correctAnswer) errors.push(`${id}/${i+1}: missing correct match.`);
      if (options.length && !options.includes(p.correctAnswer)) errors.push(`${id}/${i+1}: correct match is absent from options.`);
    }
  } else if (!['single_choice','multiple_choice','true_false_table','matching'].includes(q.type)) {
    errors.push(`${id}: unknown type ${q.type}.`);
  }
}

const byId = new Map(questions.map(q => [String(q.id), q]));
const expected = {
  "12": ["Yes","Yes","Yes"],
  "35": ["Yes","No","Yes"],
  "40": ["Yes","No","No"],
  "51": ["Yes","No","Yes"],
  "153": ["Yes","No","Yes"],
  "174": ["Yes","No","Yes"],
  "202": ["Yes","No","Yes"],
  "224": ["Yes","No","No"],
  "236": ["No","No","Yes"],
  "237": ["Yes","No","Yes"],
  "298": ["No","Yes","No"],
};
for (const [id, answers] of Object.entries(expected)) {
  const q = byId.get(id);
  const actual = q?.statements?.map(s => s.correctAnswer);
  if (JSON.stringify(actual) !== JSON.stringify(answers)) errors.push(`${id}: corrected key mismatch; got ${JSON.stringify(actual)}.`);
}
const exact = {
  "116": "as nodes and edges by using the Gremlin language.",
  "129": "key/value",
  "201": "stores data without a fixed schema",
  "205": "database administrator",
  "209": "report",
  "213": "semi-structured data.",
  "217B": "simple analytics with short",
  "244": "a target data store powerful enough to transform data",
  "256": "dimension",
  "292": "Azure SQL Edge",
};
for (const [id, answer] of Object.entries(exact)) {
  if (byId.get(id)?.correctAnswer !== answer) errors.push(`${id}: expected ${answer}, got ${byId.get(id)?.correctAnswer}.`);
}

if (errors.length) {
  console.error("DP-900 source-bank validation failed:\n- " + errors.join("\n- "));
  process.exit(1);
}
console.log(`Validated ${questions.length} source-bank entries: all are interactive and auto-graded.`);
