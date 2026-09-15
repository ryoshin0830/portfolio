import { renderHook, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useExitTransition } from "./useExitTransition";

beforeEach(() => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    media: "",
    addEventListener: () => {},
    removeEventListener: () => {},
  }) as never;
});
afterEach(() => vi.useRealTimers());

describe("useExitTransition", () => {
  it("open が false の間はマウントしない", () => {
    const { result } = renderHook(() => useExitTransition(false));
    expect(result.current.mounted).toBe(false);
  });

  it("open が true になったら即マウントし entering になる", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useExitTransition(open),
      { initialProps: { open: false } },
    );
    rerender({ open: true });
    expect(result.current.mounted).toBe(true);
    expect(result.current.state).toBe("entering");
  });

  it("open が false に戻ったら exitMs 経過後にアンマウントする", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useExitTransition(open, { exitMs: 180 }),
      { initialProps: { open: true } },
    );
    rerender({ open: false });
    // まだ残っている（閉じアニメ中）
    expect(result.current.mounted).toBe(true);
    expect(result.current.state).toBe("exiting");

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(result.current.mounted).toBe(false);
  });

  it("再度 open になったら閉じ待ちタイマーを取り消す", () => {
    const { result, rerender } = renderHook(
      ({ open }) => useExitTransition(open, { exitMs: 180 }),
      { initialProps: { open: true } },
    );
    rerender({ open: false });
    rerender({ open: true });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.mounted).toBe(true);
    expect(result.current.state).toBe("entering");
  });
});
