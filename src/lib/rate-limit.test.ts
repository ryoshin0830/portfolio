import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit, clientIp } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("窓内は limit 回まで許可し、超過で false", () => {
    expect(rateLimit("a", 3, 1000)).toBe(true);
    expect(rateLimit("a", 3, 1000)).toBe(true);
    expect(rateLimit("a", 3, 1000)).toBe(true);
    expect(rateLimit("a", 3, 1000)).toBe(false);
    expect(rateLimit("a", 3, 1000)).toBe(false);
  });

  it("窓が過ぎると回復する", () => {
    expect(rateLimit("b", 2, 1000)).toBe(true);
    expect(rateLimit("b", 2, 1000)).toBe(true);
    expect(rateLimit("b", 2, 1000)).toBe(false);
    vi.setSystemTime(1000); // 窓の境界 = resetAt 到達
    expect(rateLimit("b", 2, 1000)).toBe(true);
  });

  it("キーごとに独立してカウントする", () => {
    expect(rateLimit("k1", 1, 1000)).toBe(true);
    expect(rateLimit("k1", 1, 1000)).toBe(false);
    expect(rateLimit("k2", 1, 1000)).toBe(true); // 別キーは影響を受けない
  });
});

describe("clientIp", () => {
  const reqWith = (headers: Record<string, string>) =>
    new Request("http://x", { headers });

  it("x-forwarded-for の先頭IPを使う", () => {
    expect(clientIp(reqWith({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("空白も除去する", () => {
    expect(clientIp(reqWith({ "x-forwarded-for": "  9.9.9.9 ,1.1.1.1" }))).toBe("9.9.9.9");
  });
  it("x-forwarded-for が無ければ x-real-ip", () => {
    expect(clientIp(reqWith({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });
  it("どちらも無ければ unknown", () => {
    expect(clientIp(reqWith({}))).toBe("unknown");
  });
});
