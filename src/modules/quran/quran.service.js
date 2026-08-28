import { getQuranFoundationClient } from "../../config/quranFoundation.js";
import { mapChapter, mapTranslationResource, mapVerse } from "./quran.mapper.js";
import { QuranIntegrityError } from "./quran.errors.js";
import { validateChapterCollection, validateChapterVerses } from "./quran.integrity.js";

const BENGALI_LANGUAGE_NAMES = new Set(["bengali", "bangla", "বাংলা"]);

export async function listChapters(client = getQuranFoundationClient()) {
  const chapters = await client.content.v4.chapters.list({ language: "en" });
  return validateChapterCollection(chapters).map(mapChapter);
}

export async function listTranslations(language = "bn", client = getQuranFoundationClient()) {
  const resources = await client.content.v4.resources.translations.list({ language });
  return resources
    .filter((resource) => {
      const name = resource.languageName?.toLowerCase();
      return language === "bn" ? BENGALI_LANGUAGE_NAMES.has(name) : true;
    })
    .map(mapTranslationResource)
    .filter((resource) => Number.isInteger(resource.id));
}

export async function getChapterContent(
  chapterId,
  translationId,
  client = getQuranFoundationClient(),
) {
  const [chapter, translations] = await Promise.all([
    client.content.v4.chapters.get(String(chapterId), { language: "en" }),
    listTranslations("bn", client),
  ]);
  const allowedTranslation = translations.find(
    (resource) => resource.id === Number(translationId),
  );

  if (!allowedTranslation) {
    const error = new Error("Select a valid Bengali translation resource");
    error.status = 400;
    error.code = "INVALID_TRANSLATION_RESOURCE";
    throw error;
  }

  if (Number(chapter.id) !== Number(chapterId)) {
    throw new QuranIntegrityError();
  }

  const pageSize = 50;
  const pageCount = Math.ceil(chapter.versesCount / pageSize);
  const pages = await Promise.all(
    Array.from({ length: pageCount }, (_, index) =>
      client.content.v4.verses.byChapter(String(chapterId), {
        translations: [allowedTranslation.id],
        fields: { chapterId: true, textUthmani: true },
        translationFields: { resourceName: true },
        page: index + 1,
        perPage: pageSize,
      }),
    ),
  );
  const verses = pages.flat();
  validateChapterVerses({ chapter, verses, translationId: allowedTranslation.id });

  return {
    chapter: mapChapter(chapter),
    translationResource: allowedTranslation,
    verses: verses.map((verse) => mapVerse(verse, allowedTranslation.id)),
  };
}
