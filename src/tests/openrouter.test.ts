import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateOpenRouterText } from "@/lib/openrouter";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    body: { cancel: async () => {} },
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("OpenRouter client", () => {
  it("sends requests to the OpenRouter endpoint with the server-side key", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    vi.stubEnv("OPENROUTER_MODEL", "");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const fetchMock = vi.fn(async () =>
      mockResponse(200, {
        choices: [{ finish_reason: "stop", message: { content: "hello world" } }],
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const text = await generateOpenRouterText("hi");

    expect(text).toBe("hello world");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(ENDPOINT);
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-openrouter-key"
    );
    expect(JSON.parse(options.body as string).model).toBe("anthropic/claude-haiku-5.5");
    expect(log).not.toHaveBeenCalled();
  });

  it("fails safely without calling the provider when no key is configured", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(generateOpenRouterText("hi")).rejects.toThrow(/unavailable/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("maps authentication errors to a safe message without leaking the key", async () => {
    const secret = "sk-secret-value-must-not-leak";
    vi.stubEnv("OPENROUTER_API_KEY", secret);
    const fetchMock = vi.fn(async () =>
      mockResponse(401, { error: { message: `invalid api key ${secret}` } })
    );
    vi.stubGlobal("fetch", fetchMock);

    let message = "";
    try {
      await generateOpenRouterText("hi");
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toMatch(/unavailable/i);
    expect(message).not.toContain(secret);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
