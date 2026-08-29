import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { chapterContentController, chaptersController, translationsController } from "./quran.controller.js";

export const quranRouter = Router();

function validateChapter(request, response, next) {
  const chapterId = Number(request.params.chapterId);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) {
    return response.status(400).json({ error: { code: "INVALID_CHAPTER", message: "Chapter ID must be an integer from 1 to 114" } });
  }
  return next();
}

quranRouter.get("/chapters", asyncHandler(chaptersController));
quranRouter.get("/translations", asyncHandler(translationsController));
quranRouter.get("/chapters/:chapterId", validateChapter, asyncHandler(chapterContentController));
