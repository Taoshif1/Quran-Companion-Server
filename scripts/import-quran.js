import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data/source/tanzil/quran-uthmani-1.1.xml");
const metadataPath = path.join(root, "data/source/tanzil/quran-data-1.0.xml");
const manifestPath = path.join(root, "data/source/tanzil/source-manifest.json");
const generatedDir = path.join(root, "data/generated/quran");
const expectedSourceSha256 = "8c5aeae20363a98f6963720d29fce040ca8b56a8e75f8b564c257fce7f6d0417";

function fail(message) {
  throw new Error(`Tanzil import failed: ${message}`);
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function attributes(source) {
  return Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

function parseSource(xml) {
  const chapters = [...xml.matchAll(/<sura\s+([^>]+)>([\s\S]*?)<\/sura>/g)].map((match) => {
    const chapterAttributes = attributes(match[1]);
    const id = Number(chapterAttributes.index);
    const verses = [...match[2].matchAll(/<aya\s+([^>]+)\/>/g)].map((ayaMatch) => {
      const aya = attributes(ayaMatch[1]);
      return { verseNumber: Number(aya.index), textUthmani: aya.text };
    });
    return { id, nameArabic: chapterAttributes.name, verses };
  });
  return chapters;
}

function parseMetadata(xml) {
  const section = xml.match(/<suras(?:\s+[^>]*)?>([\s\S]*?)<\/suras>/)?.[1];
  if (!section) fail("official metadata has no suras section");
  return new Map([...section.matchAll(/<sura\s+([^>]+)\/>/g)].map((match) => {
    const item = attributes(match[1]);
    return [Number(item.index), item];
  }));
}

function validate(chapters, metadata) {
  if (chapters.length !== 114 || metadata.size !== 114) fail("expected 114 Surahs");
  const chapterIds = new Set();
  const verseKeys = new Set();
  let totalVerses = 0;
  for (const [index, chapter] of chapters.entries()) {
    const expectedId = index + 1;
    if (chapter.id !== expectedId || chapterIds.has(chapter.id)) fail(`invalid or duplicate Surah ID at ${expectedId}`);
    chapterIds.add(chapter.id);
    const meta = metadata.get(chapter.id);
    if (!meta || Number(meta.ayas) !== chapter.verses.length) fail(`metadata mismatch for Surah ${chapter.id}`);
    for (const [verseIndex, verse] of chapter.verses.entries()) {
      const expectedVerse = verseIndex + 1;
      const key = `${chapter.id}:${expectedVerse}`;
      if (verse.verseNumber !== expectedVerse) fail(`non-sequential Ayah at ${key}`);
      if (verseKeys.has(key)) fail(`duplicate verse key ${key}`);
      if (typeof verse.textUthmani !== "string" || verse.textUthmani.length === 0) fail(`empty Arabic at ${key}`);
      verseKeys.add(key);
      totalVerses += 1;
    }
  }
  const critical = new Map([[1, 7], [2, 286], [112, 4], [114, 6]]);
  for (const [id, count] of critical) if (chapters[id - 1].verses.length !== count) fail(`critical count mismatch for Surah ${id}`);
  if (!verseKeys.has("2:255")) fail("2:255 is missing");
  if (totalVerses !== 6236) fail(`expected 6236 verse records, received ${totalVerses}`);
  return { totalVerses, verseKeys };
}

const sourceBytes = fs.readFileSync(sourcePath);
const metadataBytes = fs.readFileSync(metadataPath);
const sourceHash = sha256(sourceBytes);
if (sourceHash !== expectedSourceSha256) fail("canonical source checksum mismatch");
const sourceXml = sourceBytes.toString("utf8");
const metadataXml = metadataBytes.toString("utf8");
const parsed = parseSource(sourceXml);
const metadata = parseMetadata(metadataXml);
const { totalVerses } = validate(parsed, metadata);

fs.mkdirSync(generatedDir, { recursive: true });
const chapters = parsed.map((chapter) => {
  const meta = metadata.get(chapter.id);
  const chapterRecord = {
    id: chapter.id,
    nameArabic: chapter.nameArabic,
    nameSimple: meta.tname,
    transliteratedName: meta.tname,
    translatedName: meta.ename,
    translatedNameLanguage: "english",
    revelationPlace: meta.type === "Meccan" ? "makkah" : "madinah",
    revelationOrder: Number(meta.order),
    versesCount: chapter.verses.length,
    pages: null,
  };
  const verses = chapter.verses.map((verse) => ({
    id: `${chapter.id}:${verse.verseNumber}`,
    verseKey: `${chapter.id}:${verse.verseNumber}`,
    verseNumber: verse.verseNumber,
    chapterId: chapter.id,
    pageNumber: null,
    juzNumber: null,
    textUthmani: verse.textUthmani,
  }));
  fs.writeFileSync(path.join(generatedDir, `${chapter.id}.json`), `${JSON.stringify({ chapter: chapterRecord, verses })}\n`, "utf8");
  return chapterRecord;
});
fs.writeFileSync(path.join(generatedDir, "chapters.json"), `${JSON.stringify(chapters)}\n`, "utf8");

const manifest = {
  source: "Tanzil Project",
  textType: "Uthmani",
  version: "1.1",
  downloadDate: "2026-08-29",
  officialSourceUrl: "https://tanzil.net/download/",
  sourceFilename: path.basename(sourcePath),
  sha256: sourceHash,
  metadata: {
    source: "Tanzil Project Quran Metadata",
    version: "1.0",
    officialSourceUrl: "https://tanzil.net/res/text/metadata/quran-data.xml",
    sourceFilename: path.basename(metadataPath),
    sha256: sha256(metadataBytes),
  },
  structure: { chapters: chapters.length, verseRecords: totalVerses, verseNumbering: "Tanzil Uthmani source XML" },
};
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
fs.writeFileSync(path.join(generatedDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

for (const chapter of parsed) {
  const generated = JSON.parse(fs.readFileSync(path.join(generatedDir, `${chapter.id}.json`), "utf8"));
  for (const [index, verse] of generated.verses.entries()) {
    if (verse.textUthmani !== chapter.verses[index].textUthmani) fail(`exact-string round trip failed at ${chapter.id}:${index + 1}`);
  }
}

console.log(`Tanzil Uthmani v1.1: ${chapters.length} Surahs, ${totalVerses} verse records — PASS`);
console.log("Critical counts: 1=7, 2=286, 2:255 exists, 112=4, 114=6 — PASS");
console.log(`Canonical SHA-256: ${sourceHash.toUpperCase()} — PASS`);
