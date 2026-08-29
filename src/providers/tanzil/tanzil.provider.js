import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QuranIntegrityError } from "../../modules/quran/quran.errors.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const sourcePath = path.join(root, "data/source/tanzil/quran-uthmani-1.1.xml");
const manifestPath = path.join(root, "data/source/tanzil/source-manifest.json");
const generatedDir = path.join(root, "data/generated/quran");
let chapters;

function readJson(filename) {
  return JSON.parse(fs.readFileSync(path.join(generatedDir, filename), "utf8"));
}

export function verifyTanzilSource() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const actual = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
  if (actual !== manifest.sha256) throw new QuranIntegrityError("Canonical Tanzil source checksum mismatch");
  return manifest;
}

export function listTanzilChapters() {
  verifyTanzilSource();
  chapters ??= readJson("chapters.json");
  if (chapters.length !== 114 || chapters.some((chapter, index) => chapter.id !== index + 1)) throw new QuranIntegrityError();
  return chapters;
}

export function getTanzilChapter(chapterId) {
  const numericId = Number(chapterId);
  const chapter = readJson(`${numericId}.json`);
  if (chapter.chapter.id !== numericId || chapter.verses.length !== chapter.chapter.versesCount) throw new QuranIntegrityError();
  const keys = new Set();
  chapter.verses.forEach((verse, index) => {
    const expected = `${numericId}:${index + 1}`;
    if (verse.verseKey !== expected || verse.verseNumber !== index + 1 || verse.chapterId !== numericId || keys.has(expected) || typeof verse.textUthmani !== "string" || verse.textUthmani.length === 0) throw new QuranIntegrityError();
    keys.add(expected);
  });
  return chapter;
}
