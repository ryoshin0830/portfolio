import { describe, it, expect, vi, afterEach } from "vitest";

// 重い @googleapis/calendar の実体を読み込まないようモック（env ヘルパーのみ検証）。
vi.mock("@googleapis/calendar", () => ({
  calendar: vi.fn(),
  auth: { OAuth2: class {} },
  calendar_v3: {},
}));

import { isGoogleConfigured, getCalendarId } from "./google-calendar";

const KEYS = [
  "GOOGLE_OAUTH_CLIENT_ID",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GOOGLE_OAUTH_REFRESH_TOKEN",
] as const;

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isGoogleConfigured", () => {
  it("3つの env が揃えば true", () => {
    for (const k of KEYS) vi.stubEnv(k, "x");
    expect(isGoogleConfigured()).toBe(true);
  });

  it.each(KEYS)("%s が欠けると false", (missing) => {
    for (const k of KEYS) vi.stubEnv(k, k === missing ? "" : "x");
    expect(isGoogleConfigured()).toBe(false);
  });
});

describe("getCalendarId", () => {
  it("GOOGLE_CALENDAR_ID 未設定なら 'primary'", () => {
    vi.stubEnv("GOOGLE_CALENDAR_ID", "");
    expect(getCalendarId()).toBe("primary");
  });
  it("設定があればその値", () => {
    vi.stubEnv("GOOGLE_CALENDAR_ID", "owner@gmail.com");
    expect(getCalendarId()).toBe("owner@gmail.com");
  });
});
