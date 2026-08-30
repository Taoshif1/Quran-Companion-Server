import cors from "cors";
import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { environment } from "./config/environment.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { quranRouter } from "./modules/quran/quran.routes.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || environment.clientOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
  }));
  app.use(express.json({ limit: "10kb" }));
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8" }));

  app.get("/", (request, response) => {
    response.json({ name: "Quran Companion API", status: "ok", health: "/api/health" });
  });
  app.get("/api/health", (request, response) => {
    response.json({ status: "ok", quranSourceConfigured: true, canonicalArabicSource: "Tanzil Project Uthmani v1.1", quranFoundationConfigured: environment.isQuranConfigured });
  });
  app.use("/api/quran", quranRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
export default app;
