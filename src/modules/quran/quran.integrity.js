import { QuranIntegrityError } from "./quran.errors.js";

function fail() {
  throw new QuranIntegrityError();
}

export function validateChapterCollection(chapters) {
  if (!Array.isArray(chapters) || chapters.length !== 114) fail();
  const ids = chapters.map((chapter) => chapter.id);
  if (new Set(ids).size !== 114) fail();
  if (ids.some((id) => !Number.isInteger(id) || id < 1 || id > 114)) fail();
  if ([...ids].sort((a, b) => a - b).some((id, index) => id !== index + 1)) fail();
  return chapters;
}

export function validateChapterVerses({ chapter, verses, translationId }) {
  const requestedChapterId = Number(chapter.id);
  if (!Number.isInteger(requestedChapterId) || !Number.isInteger(chapter.versesCount)) fail();
  if (!Array.isArray(verses) || verses.length !== chapter.versesCount) fail();

  const keys = new Set();
  verses.forEach((verse, index) => {
    const expectedVerseNumber = index + 1;
    const [keyChapter, keyVerse] = String(verse.verseKey || "").split(":").map(Number);
    if (Number(verse.chapterId) !== requestedChapterId) fail();
    if (keyChapter !== requestedChapterId || keyVerse !== expectedVerseNumber) fail();
    if (!Number.isInteger(verse.verseNumber) || verse.verseNumber !== expectedVerseNumber) fail();
    if (keys.has(verse.verseKey)) fail();
    keys.add(verse.verseKey);
    if (typeof verse.textUthmani !== "string" || verse.textUthmani.trim() === "") fail();

    const translation = verse.translations?.find(
      (item) => Number(item.resourceId) === Number(translationId),
    );
    if (!translation || typeof translation.text !== "string" || translation.text.trim() === "") fail();
  });

  return verses;
}

