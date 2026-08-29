const CHAPTER_URL = "https://quranenc.com/api/v1/translation/sura";

// Direct official API resources verified against all 114 chapters on 2026-08-29.
// The endpoint has no revision field, so version is an explicit verification
// snapshot and is never represented as a QuranEnc-published release number.
export const QURANENC_RESOURCES = Object.freeze([
  { key: "bengali_zakaria", title: "Bengali Translation - Abu Bakr Zakaria", language: "bn", languageName: "Bengali", classification: "translation", version: "api-2026-08-29", lastVerified: "2026-08-29" },
  { key: "bengali_rwwad", title: "Bengali Translation - Rowwad Translation Center", language: "bn", languageName: "Bengali", classification: "translation", version: "api-2026-08-29", lastVerified: "2026-08-29" },
  { key: "bengali_mokhtasar", title: "Bengali Translation of Al-Mukhtasar in Interpreting the Noble Quran", language: "bn", languageName: "Bengali", classification: "tafsir", version: "api-2026-08-29", lastVerified: "2026-08-29" },
  { key: "english_saheeh", title: "English Translation - Noor International Center", language: "en", languageName: "English", classification: "translation", version: "api-2026-08-29", lastVerified: "2026-08-29" },
]);

export function listQuranEncTranslations(language) {
  return QURANENC_RESOURCES.filter((resource) => resource.language === language).map((resource) => ({
    ...resource,
    id: resource.key,
    name: resource.title,
    source: "QuranEnc",
    sourceUrl: "https://quranenc.com/en/browse/" + resource.key,
    versionKind: "verified-api-snapshot",
  }));
}

export async function getQuranEncChapter(resource, chapterId, fetcher = fetch) {
  const response = await fetcher(CHAPTER_URL + "/" + encodeURIComponent(resource.key) + "/" + chapterId, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("QuranEnc translation unavailable: " + response.status);
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : payload.result || payload.translations;
  if (!Array.isArray(records)) throw new Error("QuranEnc chapter response is invalid");
  return records.map((item) => ({ chapterId: Number(item.sura), verseNumber: Number(item.aya), text: item.translation, footnotes: item.footnotes ?? "" }));
}
