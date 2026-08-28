export function mapChapter(chapter) {
  return {
    id: chapter.id,
    nameArabic: chapter.nameArabic,
    nameSimple: chapter.nameSimple,
    transliteratedName: chapter.transliteratedName,
    translatedName: chapter.translatedName?.name || null,
    translatedNameLanguage: chapter.translatedName?.languageName || null,
    revelationPlace: chapter.revelationPlace,
    revelationOrder: chapter.revelationOrder,
    versesCount: chapter.versesCount,
    pages: chapter.pages,
  };
}

export function mapTranslationResource(resource) {
  return {
    id: resource.id,
    name: resource.name || resource.translatedName?.name || null,
    authorName: resource.authorName || null,
    languageName: resource.languageName || null,
    slug: resource.slug || null,
  };
}

export function mapVerse(verse, translationId) {
  const translation = verse.translations?.find(
    (item) => Number(item.resourceId) === Number(translationId),
  );

  return {
    id: verse.id,
    verseKey: verse.verseKey,
    verseNumber: verse.verseNumber,
    chapterId: Number(verse.chapterId || String(verse.verseKey).split(":")[0]),
    pageNumber: verse.pageNumber,
    juzNumber: verse.juzNumber,
    textUthmani: verse.textUthmani,
    translation: translation
      ? {
          resourceId: translation.resourceId,
          resourceName: translation.resourceName || null,
          text: translation.text,
        }
      : null,
  };
}

