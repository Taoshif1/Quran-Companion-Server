import { getChapterContent, listChapters, listTranslations } from "./quran.service.js";

export async function chaptersController(request, response) {
  const chapters = await listChapters();
  response.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.json({ data: chapters });
}

export async function translationsController(request, response) {
  const language = String(request.query.language || "bn").toLowerCase();
  if (language !== "bn") {
    return response.status(400).json({
      error: { code: "UNSUPPORTED_LANGUAGE", message: "Only Bengali resources are available in Phase 1" },
    });
  }
  const translations = await listTranslations(language);
  response.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  return response.json({ data: translations });
}

export async function chapterContentController(request, response) {
  const chapterId = Number(request.params.chapterId);
  const translationId = request.query.translationId ? String(request.query.translationId) : null;
  const content = await getChapterContent(chapterId, translationId);
  response.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.json({ data: content });
}
