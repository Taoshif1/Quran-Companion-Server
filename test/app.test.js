import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../src/config/environment.js", () => ({
  environment: {
    port: 5000,
    clientOrigins: ["http://localhost:5173"],
    qfClientId: "",
    qfClientSecret: "",
    qfEnvironment: "prelive",
    isQuranConfigured: false,
  },
}));

import { app } from "../src/app.js";

describe("HTTP API", () => {
  it("GET / describes the API", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ name: "Quran Companion API", status: "ok", health: "/api/health" });
  });

  it("GET /api/health returns 200", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", quranSourceConfigured: true, canonicalArabicSource: "Tanzil Project Uthmani v1.1", quranFoundationConfigured: false });
  });

  it("rejects an invalid chapter ID", async () => {
    const response = await request(app).get("/api/quran/chapters/115?translationId=1");
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_CHAPTER");
  });

  it("serves canonical Arabic chapter metadata without OAuth configuration", async () => {
    const response = await request(app).get("/api/quran/chapters");
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(114);
  });

  it("allows exact configured origins and rejects other browser origins", async () => {
    const allowed = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(allowed.headers["access-control-allow-origin"]).toBe("http://localhost:5173");

    const rejected = await request(app).get("/api/health").set("Origin", "https://untrusted.example");
    expect(rejected.status).toBe(200);
    expect(rejected.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
