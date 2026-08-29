import { describe, expect, it } from "vitest";
import { validateChapterVerses } from "../src/modules/quran/quran.integrity.js";

const chapter = { id: 1, versesCount: 3 };
const makeVerse = (number) => ({
  id: number,
  chapterId: 1,
  verseKey: `1:${number}`,
  verseNumber: number,
  textUthmani: `official-source-${number}`,
  translations: [{ resourceId: 161, text: `official-translation-${number}` }],
});
const validVerses = () => [1, 2, 3].map(makeVerse);

describe("chapter integrity validation", () => {
  it("accepts a complete valid mocked chapter", () => {
    expect(validateChapterVerses({ chapter, verses: validVerses(), translationId: 161 })).toHaveLength(3);
  });

  it("detects duplicate verse keys", () => {
    const verses = validVerses();
    verses[2].verseKey = "1:2";
    verses[2].verseNumber = 2;
    expect(() => validateChapterVerses({ chapter, verses, translationId: 161 })).toThrow(/integrity/i);
  });

  it("detects a missing verse", () => {
    const verses = [makeVerse(1), makeVerse(3)];
    expect(() => validateChapterVerses({ chapter, verses, translationId: 161 })).toThrow(/integrity/i);
  });

  it("detects a verse key from the wrong chapter", () => {
    const verses = validVerses();
    verses[1].chapterId = 2;
    verses[1].verseKey = "2:2";
    expect(() => validateChapterVerses({ chapter, verses, translationId: 161 })).toThrow(/integrity/i);
  });

  it("detects returned count mismatch", () => {
    expect(() => validateChapterVerses({ chapter: { ...chapter, versesCount: 4 }, verses: validVerses(), translationId: 161 })).toThrow(/integrity/i);
  });

  it("rejects an absent selected translation", () => {
    expect(() => validateChapterVerses({ chapter, verses: validVerses(), translationId: 999 })).toThrow(/integrity/i);
  });
});

