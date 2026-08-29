import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getTanzilChapter, listTanzilChapters, verifyTanzilSource } from "../src/providers/tanzil/tanzil.provider.js";

const sourcePath = path.resolve("data/source/tanzil/quran-uthmani-1.1.xml");

describe("Tanzil canonical source", () => {
  it("validates the source manifest checksum", () => {
    const manifest = verifyTanzilSource();
    const actual = crypto.createHash("sha256").update(fs.readFileSync(sourcePath)).digest("hex");
    expect(actual).toBe(manifest.sha256);
  });

  it("contains exactly 114 sequential Surahs", () => {
    const chapters = listTanzilChapters();
    expect(chapters).toHaveLength(114);
    expect(chapters.map((chapter) => chapter.id)).toEqual(Array.from({ length: 114 }, (_, index) => index + 1));
    expect(new Set(chapters.map((chapter) => chapter.id)).size).toBe(114);
  });

  it("validates every sequential verse key and critical count", () => {
    const all = listTanzilChapters().map((chapter) => getTanzilChapter(chapter.id));
    const keys = all.flatMap((chapter) => chapter.verses.map((verse) => verse.verseKey));
    expect(keys).toHaveLength(6236);
    expect(new Set(keys).size).toBe(6236);
    expect(all[0].verses).toHaveLength(7);
    expect(all[1].verses).toHaveLength(286);
    expect(keys).toContain("2:255");
    expect(all[111].verses).toHaveLength(4);
    expect(all[113].verses).toHaveLength(6);
  });

  it("preserves every Arabic attribute string exactly in generated data", () => {
    const xml = fs.readFileSync(sourcePath, "utf8");
    const sourceTexts = [...xml.matchAll(/<aya\s+[^>]*text="([^"]*)"[^>]*\/>/g)].map((match) => match[1]);
    const generatedTexts = listTanzilChapters().flatMap((chapter) => getTanzilChapter(chapter.id).verses.map((verse) => verse.textUthmani));
    expect(generatedTexts).toEqual(sourceTexts);
  });
});
