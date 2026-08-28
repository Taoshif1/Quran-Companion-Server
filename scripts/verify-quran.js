import { environment } from "../src/config/environment.js";
import { getQuranFoundationClient } from "../src/config/quranFoundation.js";
import { getChapterContent, listTranslations } from "../src/modules/quran/quran.service.js";
import { validateChapterCollection } from "../src/modules/quran/quran.integrity.js";

if (!environment.isQuranConfigured) {
  console.error("Quran Foundation credentials are required for live verification.");
  process.exit(1);
}

const samples = [1, 2, 112, 114];

try {
  const client = getQuranFoundationClient();
  const chapters = await client.content.v4.chapters.list({ language: "en" });
  try {
    validateChapterCollection(chapters);
    console.log("Chapters: 114 unique IDs spanning 1-114 — PASS");
  } catch {
    console.log(`Chapters: ${chapters.length} discovered; 114 required — FAIL`);
    process.exitCode = 1;
  }

  const resources = await listTranslations("bn", client);
  if (!resources.length) throw new Error("No official Bengali resources discovered");
  console.log(`Bengali translation resources: ${resources.length} — PASS`);
  resources.forEach(({ id, name, authorName, languageName }) => {
    console.log(JSON.stringify({ id, name, authorName, languageName }));
  });

  const translationId = resources[0].id;
  for (const chapterId of samples) {
    try {
      const result = await getChapterContent(chapterId, translationId, client);
      const first = result.verses[0]?.verseKey;
      const last = result.verses.at(-1)?.verseKey;
      const hasRequiredVerse = chapterId !== 2 || result.verses.some((verse) => verse.verseKey === "2:255");
      const passed = result.verses.length === result.chapter.versesCount && hasRequiredVerse;
      console.log(JSON.stringify({ chapter: chapterId, name: result.chapter.nameSimple, returnedCount: result.verses.length, expectedCount: result.chapter.versesCount, firstVerseKey: first, lastVerseKey: last, requiredVerseFound: chapterId === 2 ? hasRequiredVerse : undefined, status: passed ? "PASS" : "FAIL" }));
      if (!passed) process.exitCode = 1;
    } catch (error) {
      console.log(JSON.stringify({ chapter: chapterId, status: "FAIL", reason: error.code || "OFFICIAL_SOURCE_UNAVAILABLE" }));
      process.exitCode = 1;
    }
  }
} catch (error) {
  console.error(`Live verification failed safely: ${error.code || error.message}`);
  process.exitCode = 1;
}
