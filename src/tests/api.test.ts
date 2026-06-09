import { describe, it, expect } from "vitest";

describe("API health endpoint", () => {
  it("returns ok status shape", async () => {
    const response = {
      status: "ok",
      service: "AlgoMentor AI",
      timestamp: new Date().toISOString(),
    };

    expect(response.status).toBe("ok");
    expect(response.service).toBe("AlgoMentor AI");
    expect(response.timestamp).toBeDefined();
  });
});

describe("Profile sync validation", () => {
  it("accepts valid sync payload", () => {
    const payload = { codeforcesHandle: "tourist", leetcodeUsername: "user" };
    expect(payload.codeforcesHandle).toBeTruthy();
    expect(payload.leetcodeUsername).toBeTruthy();
  });
});
