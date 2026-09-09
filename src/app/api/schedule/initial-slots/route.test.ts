import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 初回表示用の空き枠エンドポイント。LLM を一切通らない経路であることが要点。
 *
 * ページは revalidate=60 の SSG なので Server Component で枠を焼き込むと
 * 古い候補が静的 HTML に入る。ここを force-dynamic の API にして常に取り直す。
 */

const { findSlotsInRangeMock, pickInitialSlotsMock, isGoogleConfiguredMock, rateLimitMock, clientIpMock } =
  vi.hoisted(() => ({
    findSlotsInRangeMock: vi.fn(),
    pickInitialSlotsMock: vi.fn(),
    isGoogleConfiguredMock: vi.fn(),
    rateLimitMock: vi.fn(),
    clientIpMock: vi.fn(),
  }));

vi.mock("@/lib/google-calendar", () => ({
  isGoogleConfigured: isGoogleConfiguredMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: rateLimitMock,
  clientIp: clientIpMock,
}));

vi.mock("@/lib/scheduling", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/scheduling")>();
  return {
    ...actual,
    findSlotsInRange: findSlotsInRangeMock,
    pickInitialSlots: pickInitialSlotsMock,
  };
});

import { GET, dynamic, runtime } from "./route";

function request() {
  return new Request("http://localhost/api/schedule/initial-slots");
}

const SLOT = {
  start: "2026-09-09T10:00:00+09:00",
  end: "2026-09-09T11:00:00+09:00",
  label: "10:00",
};

describe("GET /api/schedule/initial-slots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isGoogleConfiguredMock.mockReturnValue(true);
    rateLimitMock.mockReturnValue(true);
    clientIpMock.mockReturnValue("1.2.3.4");
    findSlotsInRangeMock.mockResolvedValue({
      timezone: "Asia/Tokyo",
      busy: [{ start: "x", end: "y" }],
      slots: [SLOT],
    });
    pickInitialSlotsMock.mockReturnValue([SLOT]);
  });

  it("Node ランタイムかつ常に動的（キャッシュされた古い枠を返さない）", () => {
    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
  });

  it("timezone と間引いた枠を返す", async () => {
    const res = await GET(request());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ timezone: "Asia/Tokyo", slots: [SLOT] });
  });

  it("busy 区間（予定のある時間帯）は返さない", async () => {
    const res = await GET(request());
    const body = (await res.json()) as Record<string, unknown>;

    expect(body).not.toHaveProperty("busy");
  });

  it("findSlotsInRange の結果を pickInitialSlots に渡す", async () => {
    await GET(request());

    expect(pickInitialSlotsMock).toHaveBeenCalledWith([SLOT]);
  });

  it("Google 未設定なら 503", async () => {
    isGoogleConfiguredMock.mockReturnValue(false);

    const res = await GET(request());

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "not_configured" });
    expect(findSlotsInRangeMock).not.toHaveBeenCalled();
  });

  it("レート制限に当たったら 429", async () => {
    rateLimitMock.mockReturnValue(false);

    const res = await GET(request());

    expect(res.status).toBe(429);
    expect(findSlotsInRangeMock).not.toHaveBeenCalled();
  });

  it("カレンダー取得が落ちたら 502 で、例外を投げない", async () => {
    findSlotsInRangeMock.mockRejectedValue(new Error("calendar unavailable"));

    const res = await GET(request());

    expect(res.status).toBe(502);
    await expect(res.json()).resolves.toEqual({ ok: false, error: "upstream_error" });
  });
});
