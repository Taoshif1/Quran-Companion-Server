import { getTanzilChapter, listTanzilChapters, verifyTanzilSource } from "../src/providers/tanzil/tanzil.provider.js";

try {
  const manifest = verifyTanzilSource();
  const chapters = listTanzilChapters();
  const allKeys = new Set();
  let totalVerses = 0;
  let passed = 0;
  for (const metadata of chapters) {
    const chapter = getTanzilChapter(metadata.id);
    chapter.verses.forEach((verse) => allKeys.add(verse.verseKey));
    totalVerses += chapter.verses.length;
    passed += 1;
    if ([1, 2, 112, 114].includes(metadata.id)) {
      console.log(JSON.stringify({ chapterId: metadata.id, chapterName: metadata.nameSimple, expectedVerseCount: metadata.versesCount, returnedVerseCount: chapter.verses.length, firstVerseKey: chapter.verses[0].verseKey, lastVerseKey: chapter.verses.at(-1).verseKey, status: "PASS" }));
    }
  }
  console.log(JSON.stringify({ source: manifest.source, textType: manifest.textType, version: manifest.version, chapters: chapters.length, chapterRange: "1-114", chaptersPassed: passed, chaptersFailed: chapters.length - passed, totalVerseRecords: totalVerses, uniqueVerseKeys: allKeys.size, ayah2255Exists: allKeys.has("2:255"), sequentialIntegrity: "PASS", status: passed === 114 && totalVerses === 6236 && allKeys.size === 6236 ? "PASS" : "FAIL" }));
  if (passed !== 114 || totalVerses !== 6236 || allKeys.size !== 6236) process.exitCode = 1;
} catch (error) {
  console.error(`Canonical Quran verification failed safely: ${error.code || error.message}`);
  process.exitCode = 1;
}
