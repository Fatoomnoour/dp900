import fs from "node:fs";
import path from "node:path";

const [xmlPath, outputDir, assetDir] = process.argv.slice(2);
if (!xmlPath || !outputDir || !assetDir) {
  console.error("Usage: node import-dp900-pdf.mjs <pdf.xml> <data-dir> <asset-dir>");
  process.exit(1);
}

const xml = fs.readFileSync(xmlPath, "utf8");
const sourceDir = path.dirname(xmlPath);
fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(assetDir, { recursive: true });

function decode(value) {
  return value
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

const pages = [];
for (const pageMatch of xml.matchAll(/<page\s+number="(\d+)"[^>]*>([\s\S]*?)<\/page>/g)) {
  const page = Number(pageMatch[1]);
  const body = pageMatch[2];
  const items = [];

  for (const match of body.matchAll(/<text\s+top="([\d.]+)"\s+left="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g)) {
    const top = Number(match[1]);
    if (top < 85 || top > 1100) continue;
    const text = decode(match[3]);
    if (!text) continue;
    items.push({ kind: "text", top, left: Number(match[2]), text });
  }

  for (const match of body.matchAll(/<image\s+top="([\d.]+)"\s+left="([\d.]+)"\s+width="([\d.]+)"\s+height="([\d.]+)"\s+src="([^"]+)"\s*\/>/g)) {
    const top = Number(match[1]);
    const width = Number(match[3]);
    const height = Number(match[4]);
    if (top > 1080 || width < 180 || height < 70) continue;
    items.push({ kind: "image", top, left: Number(match[2]), width, height, src: match[5] });
  }

  items.sort((a, b) => a.top - b.top || a.left - b.left || (a.kind === "text" ? -1 : 1));
  pages.push({ page, items });
}

const blocks = [];
let current = null;
const occurrences = new Map();

for (const page of pages) {
  for (const item of page.items) {
    if (item.kind === "text") {
      const marker = item.text.match(/^QUESTION:\s*(\d+)/i);
      if (marker) {
        if (current) blocks.push(current);
        const number = Number(marker[1]);
        const occurrence = (occurrences.get(number) ?? 0) + 1;
        occurrences.set(number, occurrence);
        current = { number, occurrence, page: page.page, items: [] };
        continue;
      }
    }
    if (current) current.items.push({ ...item, page: page.page });
  }
}
if (current) blocks.push(current);

const duplicated = new Set([...occurrences].filter(([, count]) => count > 1).map(([number]) => number));

function joinWrapped(lines) {
  return lines
    .join(" ")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function copyAsset(src, id, index, role) {
  const absolute = path.isAbsolute(src) ? src : path.join(sourceDir, src);
  const ext = path.extname(absolute) || ".png";
  const fileName = `q${String(id).replace(/[^a-z0-9]/gi, "-")}-${role}-${index}${ext}`;
  fs.copyFileSync(absolute, path.join(assetDir, fileName));
  return `/dp900/question-assets/${fileName}`;
}

function parseBlock(block) {
  const suffix = duplicated.has(block.number) ? String.fromCharCode(64 + block.occurrence) : "";
  const id = `${block.number}${suffix}`;
  const textLines = block.items.filter((item) => item.kind === "text").map((item) => item.text);
  const answerItemIndex = block.items.findIndex((item) => item.kind === "text" && /^Answer\(s\):/i.test(item.text));
  const explanationItemIndex = block.items.findIndex((item) => item.kind === "text" && /^Explanation:/i.test(item.text));
  const promptImageItems = block.items.filter((item, index) => item.kind === "image" && (answerItemIndex < 0 || index < answerItemIndex));
  const answerBoundary = explanationItemIndex >= 0 ? explanationItemIndex : answerItemIndex;
  const answerImageItems = block.items.filter((item, index) => item.kind === "image" && answerBoundary >= 0 && index > answerBoundary);

  const answerIndex = textLines.findIndex((line) => /^Answer\(s\):/i.test(line));
  const explanationIndex = textLines.findIndex((line) => /^Explanation:/i.test(line));
  const referenceIndex = textLines.findIndex((line) => /^Reference:/i.test(line));
  const beforeAnswer = textLines.slice(0, answerIndex >= 0 ? answerIndex : textLines.length);

  let answerText = "";
  if (answerIndex >= 0) {
    answerText = textLines[answerIndex].replace(/^Answer\(s\):\s*/i, "").trim();
    if (!answerText && textLines[answerIndex + 1]) answerText = textLines[answerIndex + 1];
  }

  const optionStarts = [];
  beforeAnswer.forEach((line, index) => {
    if (/^[A-H]\.\s+/i.test(line)) optionStarts.push(index);
  });
  const firstOptionIndex = optionStarts[0] ?? -1;

  const promptLines = (firstOptionIndex >= 0 ? beforeAnswer.slice(0, firstOptionIndex) : beforeAnswer)
    .filter((line) => !/^Hot Area:$/i.test(line) && !/^Select and Place:$/i.test(line));
  const question = joinWrapped(promptLines);

  const options = [];
  if (firstOptionIndex >= 0) {
    let active = null;
    for (const line of beforeAnswer.slice(firstOptionIndex)) {
      const match = line.match(/^([A-H])\.\s+(.*)$/i);
      if (match) {
        if (active) options.push(active);
        active = { key: match[1].toUpperCase(), text: match[2].trim() };
      } else if (active) {
        active.text = `${active.text} ${line}`.trim();
      }
    }
    if (active) options.push(active);
  }

  const isVisual = /HOTSPOT|DRAG DROP/i.test(question) ||
    (options.length === 1 && /See Explanation section/i.test(options[0].text));

  const explanationStart = explanationIndex >= 0 ? explanationIndex + 1 : -1;
  const explanationEnd = referenceIndex >= 0 ? referenceIndex : textLines.length;
  const explanation = explanationStart >= 0
    ? joinWrapped(textLines.slice(explanationStart, explanationEnd))
    : "";

  const promptImages = promptImageItems.map((image, index) => copyAsset(image.src, id, index + 1, "prompt"));
  const answerImages = answerImageItems.map((image, index) => copyAsset(image.src, id, index + 1, "answer"));

  const base = {
    id,
    sourceNumber: block.number,
    sourcePage: block.page,
    topic: "DP-900 Source Bank",
    question,
    ...(promptImages.length ? { promptImages } : {}),
    ...(answerImages.length ? { answerImages } : {}),
    ...(explanation ? { explanation } : {}),
  };

  if (isVisual || options.length < 2) {
    return {
      ...base,
      type: "visual_review",
      answerText: answerText || "See the answer image and explanation.",
    };
  }

  const answerKeys = [...answerText.matchAll(/\b([A-H])\b/g)].map((match) => match[1]);
  const correctOptions = options.filter((option) => answerKeys.includes(option.key)).map((option) => option.text);
  if (correctOptions.length > 1) {
    return {
      ...base,
      type: "multiple_choice",
      options: options.map((option) => option.text),
      correctAnswers: correctOptions,
    };
  }

  return {
    ...base,
    type: "single_choice",
    options: options.map((option) => option.text),
    correctAnswer: correctOptions[0] ?? options[0].text,
    statusNote: correctOptions.length ? undefined : `Source answer: ${answerText}`,
  };
}

const questions = blocks.filter((block) => block.number >= 1 && block.number <= 304).map(parseBlock);
const ranges = [
  [1, 50, "dp900_001_050.json"],
  [51, 100, "dp900_051_100.json"],
  [101, 150, "dp900_101_150.json"],
  [151, 200, "dp900_151_200.json"],
  [201, 250, "dp900_201_250.json"],
  [251, 304, "dp900_251_304.json"],
];

for (const [start, end, file] of ranges) {
  const rangeQuestions = questions.filter((question) => question.sourceNumber >= start && question.sourceNumber <= end);
  fs.writeFileSync(
    path.join(outputDir, file),
    `${JSON.stringify({ source: "corrected200.pdf", range: `${start}-${end}`, questions: rangeQuestions }, null, 2)}\n`,
  );
}

const report = {
  total: questions.length,
  visual: questions.filter((question) => question.type === "visual_review").length,
  single: questions.filter((question) => question.type === "single_choice").length,
  multiple: questions.filter((question) => question.type === "multiple_choice").length,
  duplicates: [...duplicated],
  missingNumbers: Array.from({ length: 304 }, (_, index) => index + 1).filter((number) => !occurrences.has(number)),
};
console.log(JSON.stringify(report, null, 2));
