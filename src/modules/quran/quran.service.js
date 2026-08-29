import { getQuranEncChapter, listQuranEncTranslations } from "../../providers/quranenc/quranenc.provider.js";
import { getTanzilChapter, listTanzilChapters } from "../../providers/tanzil/tanzil.provider.js";
import { QuranIntegrityError } from "./quran.errors.js";

export function listChapters() {
  return listTanzilChapters();
}

export async function listTranslations(language = "bn", fetcher = fetch) {
  if (language !== "bn") return [];
  return listQuranEncTranslations(fetcher);
}

function validateTranslation(chapter, records) {
  if (records.length !== chapter.versesCount) throw new QuranIntegrityError("QuranEnc translation count mismatch");
  records.forEach((item, index) => {
    if (item.chapterId !== chapter.id || item.verseNumber !== index + 1 || typeof item.text !== "string" || item.text.length === 0) throw new QuranIntegrityError("QuranEnc translation integrity failure");
    if (typeof item.footnotes !== "string") throw new QuranIntegrityError("QuranEnc footnote integrity failure");
  });
}

export async function getChapterContent(chapterId, translationId, fetcher = fetch) {
  const local = getTanzilChapter(chapterId);
  let translationResource = null;
  let translationRecords = null;

  if (translationId) {
    const resources = await listTranslations("bn", fetcher);
    translationResource = resources.find((resource) => resource.key === translationId);
    if (!translationResource) {
      const error = new Error("Select a current QuranEnc Bengali resource");
      error.status = 400;
      error.code = "INVALID_TRANSLATION_RESOURCE";
      throw error;
    }
    translationRecords = await getQuranEncChapter(translationResource, chapterId, fetcher);
    validateTranslation(local.chapter, translationRecords);
  }

  return {
    chapter: local.chapter,
    arabicSource: { name: "Tanzil Project", textType: "Uthmani Quran Text", version: "1.1", url: "https://tanzil.net/" },
    translationResource,
    verses: local.verses.map((verse, index) => ({
      ...verse,
      translation: translationResource ? {
        resourceId: translationResource.key,
        resourceName: translationResource.title,
        resourceVersion: translationResource.version,
        source: "QuranEnc",
        text: translationRecords[index].text,
        footnotes: translationRecords[index].footnotes,
      } : null,
    })),
  };
}
