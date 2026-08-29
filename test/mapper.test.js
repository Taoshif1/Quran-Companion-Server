import { describe, expect, it } from "vitest";
import { mapChapter, mapVerse } from "../src/modules/quran/quran.mapper.js";

describe("Quran response mapper", () => {
  it("normalizes source chapter metadata without fabricating fields", () => {
    expect(
      mapChapter({
        id: 1,
        nameArabic: "source-arabic",
        nameSimple: "Al-Fatihah",
        transliteratedName: "Al-Fatihah",
        translatedName: { name: "The Opener", languageName: "english" },
        revelationPlace: "makkah",
        revelationOrder: 5,
        versesCount: 7,
        pages: [1, 1],
      }),
    ).toEqual({
      id: 1,
      nameArabic: "source-arabic",
      nameSimple: "Al-Fatihah",
      transliteratedName: "Al-Fatihah",
      translatedName: "The Opener",
      translatedNameLanguage: "english",
      revelationPlace: "makkah",
      revelationOrder: 5,
      versesCount: 7,
      pages: [1, 1],
    });
  });

  it("preserves Quran and translation strings exactly", () => {
    const source = {
      id: 10,
      verseKey: "2:3",
      verseNumber: 3,
      chapterId: 2,
      pageNumber: 2,
      juzNumber: 1,
      textUthmani: "  exact source text  ",
      translations: [{ resourceId: 42, resourceName: "Vetted", text: "<sup>Exact</sup> source" }],
    };
    const mapped = mapVerse(source, 42);
    expect(mapped.textUthmani).toBe(source.textUthmani);
    expect(mapped.translation.text).toBe(source.translations[0].text);
  });

  it("does not trim, normalize, remove diacritics, or change punctuation", () => {
    const arabic = "  وَٱلضُّحَىٰ\u00a0۝  ";
    const translation = "  বাংলা—পাঠ … <sup foot_note=\"12\">১</sup>\nপরের লাইন  ";
    const mapped = mapVerse({
      id: 1,
      verseKey: "93:1",
      verseNumber: 1,
      chapterId: 93,
      pageNumber: 596,
      juzNumber: 30,
      textUthmani: arabic,
      translations: [{ resourceId: 161, text: translation }],
    }, 161);
    expect(mapped.textUthmani).toBe(arabic);
    expect(mapped.translation.text).toBe(translation);
    expect([...mapped.textUthmani]).toEqual([...arabic]);
    expect([...mapped.translation.text]).toEqual([...translation]);
  });
});
