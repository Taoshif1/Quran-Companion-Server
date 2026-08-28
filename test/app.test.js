import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/environment.js", () => ({
  environment: {
    port: 5000,
    clientOrigin: "http://localhost:5173",
    qfClientId: "",
    qfClientSecret: "",
    qfEnvironment: "prelive",
    isQuranConfigured: false,
  },
}));

import { app } from "../src/app.js";

describe("HTTP API", () => {
  it("GET /api/health returns 200", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", quranSourceConfigured: false });
  });

  it("rejects an invalid chapter ID", async () => {
    const response = await request(app).get("/api/quran/chapters/115?translationId=1");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_CHAPTER");
  });

  it("returns a controlled response when configuration is missing", async () => {
    const response = await request(app).get("/api/quran/chapters");
    expect(response.status).toBe(503);
    expect(response.body.error).toEqual({
      code: "QURAN_SOURCE_NOT_CONFIGURED",
      message: "Quran content source is not configured",
    });
  });
});
