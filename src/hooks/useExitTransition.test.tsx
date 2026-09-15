import { render, renderHook, act } from "@testing-library/react";
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

  it("閉じる途中で DOM ノードが作り直されない（アンマウント点滅の防止）", () => {
    // レンダー中に state を更新すると React はその回を commit せずに
    // 再レンダーする。したがって「点滅したか」はレンダー関数の戻り値ではなく
    // 実際にコミットされた DOM で確かめる必要がある。
    function Panel({ open }: { open: boolean }) {
      const { mounted } = useExitTransition(open, { exitMs: 180 });
      return mounted ? <div data-testid="panel" /> : null;
    }

    const { rerender, queryByTestId } = render(<Panel open />);
    const before = queryByTestId("panel");
    expect(before).not.toBeNull();

    rerender(<Panel open={false} />);
    // 閉じアニメ中: 同一の DOM ノードがそのまま残っていること
    expect(queryByTestId("panel")).toBe(before);

    act(() => {
      vi.advanceTimersByTime(180);
    });
    expect(queryByTestId("panel")).toBeNull();
  });
});
