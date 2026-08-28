import { describe, expect, it, vi } from "vitest";
import { getChapterContent } from "../src/modules/quran/quran.service.js";

describe("Quran service translation validation", () => {
  it("rejects a translation outside the discovered Bengali resources", async () => {
    const client = {
      content: { v4: {
        chapters: { get: vi.fn().mockResolvedValue({ id: 1, versesCount: 1 }) },
        resources: { translations: { list: vi.fn().mockResolvedValue([{ id: 161, name: "Official", languageName: "bengali" }]) } },
        verses: { byChapter: vi.fn() },
      } },
    };
    await expect(getChapterContent(1, 999, client)).rejects.toMatchObject({
      code: "INVALID_TRANSLATION_RESOURCE",
      status: 400,
    });
    expect(client.content.v4.verses.byChapter).not.toHaveBeenCalled();
  });
});

