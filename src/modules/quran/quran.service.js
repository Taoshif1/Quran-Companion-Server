import { getQuranFoundationClient } from "../../config/quranFoundation.js";
import { mapChapter, mapTranslationResource, mapVerse } from "./quran.mapper.js";

const BENGALI_LANGUAGE_NAMES = new Set(["bengali", "bangla", "বাংলা"]);

export async function listChapters(client = getQuranFoundationClient()) {
  const chapters = await client.content.v4.chapters.list({ language: "en" });
  return chapters.map(mapChapter);
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

  const verses = await client.content.v4.verses.byChapter(String(chapterId), {
    translations: [allowedTranslation.id],
    fields: { textUthmani: true },
    translationFields: { resourceName: true },
    perPage: 300,
  });

  return {
    chapter: mapChapter(chapter),
    translationResource: allowedTranslation,
    verses: verses.map((verse) => mapVerse(verse, allowedTranslation.id)),
  };
}

