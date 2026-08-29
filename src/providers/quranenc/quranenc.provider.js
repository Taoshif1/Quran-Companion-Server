const CATALOG_URL = "https://quranenc.com/api/v1/translations/list/bn?localization=en";
const CHAPTER_URL = "https://quranenc.com/api/v1/translation/sura";

function classify(resource) {
  const description = `${resource.title || ""} ${resource.description || ""}`.toLowerCase();
  return /tafsir|tafseer|تفسير|তাফসীর/.test(description) ? "tafsir" : "translation";
}

export function mapQuranEncResource(resource) {
  return {
    id: resource.key,
    key: resource.key,
    name: resource.title,
    title: resource.title,
    description: resource.description || null,
    authorName: null,
    languageName: "Bengali",
    language: resource.language_iso_code,
    version: resource.version,
    lastUpdate: resource.last_update,
    classification: classify(resource),
    source: "QuranEnc",
  };
}

export async function listQuranEncTranslations(fetcher = fetch) {
  const response = await fetcher(CATALOG_URL, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`QuranEnc catalog unavailable: ${response.status}`);
  const payload = await response.json();
  const resources = Array.isArray(payload) ? payload : payload.translations;
  if (!Array.isArray(resources)) throw new Error("QuranEnc catalog response is invalid");
  return resources.filter((resource) => resource.language_iso_code === "bn" && resource.key && resource.version).map(mapQuranEncResource);
}

export async function getQuranEncChapter(resource, chapterId, fetcher = fetch) {
  const response = await fetcher(`${CHAPTER_URL}/${encodeURIComponent(resource.key)}/${chapterId}`, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`QuranEnc translation unavailable: ${response.status}`);
  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : payload.result || payload.translations;
  if (!Array.isArray(records)) throw new Error("QuranEnc chapter response is invalid");
  return records.map((item) => ({ chapterId: Number(item.sura), verseNumber: Number(item.aya), text: item.translation, footnotes: item.footnotes ?? "" }));
}
