import request from "supertest";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("../src/modules/quran/quran.service.js", () => ({
  listChapters: vi.fn().mockRejectedValue(new Error("secret upstream detail")),
  listTranslations: vi.fn(),
  getChapterContent: vi.fn(),
}));

let app;

beforeAll(async () => {
  ({ app } = await import("../src/app.js"));
});

describe("upstream failures", () => {
  it("returns a controlled 502 without leaking details", async () => {
    const response = await request(app).get("/api/quran/chapters");
    expect(response.status).toBe(502);
    expect(response.body.error.message).toBe("Quran content is temporarily unavailable");
    expect(JSON.stringify(response.body)).not.toContain("secret upstream detail");
  });
});

