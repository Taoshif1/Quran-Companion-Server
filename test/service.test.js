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

  it("rejects a translation outside the live Bengali catalog", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translations: [{ key: "bengali_test", language_iso_code: "bn", version: "1.0", title: "Official test" }] }) });
    await expect(getChapterContent(1, "different", fetcher)).rejects.toMatchObject({ code: "INVALID_TRANSLATION_RESOURCE", status: 400 });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("preserves QuranEnc text, footnotes, key, and version exactly", async () => {
    const translation = "  exact Bengali wording  ";
    const footnotes = "<p>exact footnote</p>";
    const catalog = { translations: [{ key: "bengali_test", language_iso_code: "bn", version: "1.2.3", title: "Official test" }] };
    const records = Array.from({ length: 7 }, (_, index) => ({ sura: 1, aya: index + 1, translation, footnotes }));
    const fetcher = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => catalog }).mockResolvedValueOnce({ ok: true, json: async () => records });
    const content = await getChapterContent(1, "bengali_test", fetcher);
    expect(content.translationResource.key).toBe("bengali_test");
    expect(content.translationResource.version).toBe("1.2.3");
    expect(content.verses[0].translation.text).toBe(translation);
    expect(content.verses[0].translation.footnotes).toBe(footnotes);
  });
});
