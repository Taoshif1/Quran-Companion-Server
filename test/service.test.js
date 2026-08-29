import { describe, expect, it, vi } from "vitest";
import { getChapterContent } from "../src/modules/quran/quran.service.js";

describe("canonical Quran service", () => {
  it("serves Arabic without any external request", async () => {
    const fetcher = vi.fn();
    const content = await getChapterContent(1, null, fetcher);
    expect(fetcher).not.toHaveBeenCalled();
    expect(content.verses).toHaveLength(7);
    expect(content.translationResource).toBeNull();
    expect(content.arabicSource.name).toBe("Tanzil Project");
  });

  it("rejects a translation outside the verified direct-resource registry", async () => {
    const fetcher = vi.fn();
    await expect(getChapterContent(1, "different", fetcher)).rejects.toMatchObject({ code: "INVALID_TRANSLATION_RESOURCE", status: 400 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("preserves QuranEnc text, footnotes, key, and version exactly", async () => {
    const translation = "  exact Bengali wording  ";
    const footnotes = "<p>exact footnote</p>";
    const records = Array.from({ length: 7 }, (_, index) => ({ sura: 1, aya: index + 1, translation, footnotes }));
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => records });
    const content = await getChapterContent(1, "bengali_zakaria", fetcher);
    expect(content.translationResource.key).toBe("bengali_zakaria");
    expect(content.translationResource.version).toBe("api-2026-08-29");
    expect(content.verses[0].translation.text).toBe(translation);
    expect(content.verses[0].translation.footnotes).toBe(footnotes);
  });

  it("keeps English and Bengali resource identities isolated", async () => {
    const records = Array.from({ length: 7 }, (_, index) => ({ sura: 1, aya: index + 1, translation: "exact", footnotes: "" }));
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => records });
    const english = await getChapterContent(1, "english_saheeh", fetcher);
    const bangla = await getChapterContent(1, "bengali_rwwad", fetcher);
    expect(english.translationResource.language).toBe("en");
    expect(bangla.translationResource.language).toBe("bn");
    expect(english.translationResource.key).not.toBe(bangla.translationResource.key);
  });

  it("classifies Al-Mukhtasar as tafsir, never as an ordinary translation", async () => {
    const records = Array.from({ length: 7 }, (_, index) => ({ sura: 1, aya: index + 1, translation: "exact", footnotes: "" }));
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => records });
    const content = await getChapterContent(1, "bengali_mokhtasar", fetcher);
    expect(content.translationResource.classification).toBe("tafsir");
  });
});
