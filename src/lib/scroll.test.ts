import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrollToElementSettled } from "./scroll";

/**
 * scrollToElementSettled のテスト。
 *
 * 「すべての連絡先」(#contact) クリック時、スクロール中に WritingFeed の
 * 次の batch が描画されてページが伸び、ターゲットの手前で止まるバグの回帰テスト。
 * スクロール静止後にターゲット位置を検証し、ずれていれば再スクロールすること。
 */

const FRAME = 16;
/** スクロール静止判定（STABLE_FRAMES = 10 フレーム）を超えるだけ進める */
function advanceUntilStable() {
  vi.advanceTimersByTime(FRAME * 15);
}

describe("scrollToElementSettled", () => {
  let element: HTMLElement;
  let top: number;
  let scrollIntoView: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    element = document.createElement("section");
    document.body.appendChild(element);

    // ページ全体は 5000px、ビューポートは 768px（jsdom デフォルト）
    Object.defineProperty(document.documentElement, "scrollHeight", {
      value: 5000,
      configurable: true,
    });
    Object.defineProperty(window, "scrollY", {
      value: 0,
      writable: true,
      configurable: true,
    });

    top = 0;
    element.getBoundingClientRect = () =>
      ({ top }) as DOMRect;
    scrollIntoView = vi.fn();
    element.scrollIntoView = scrollIntoView as unknown as typeof element.scrollIntoView;
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("ターゲットに到達していればそのまま完了する", () => {
    const onDone = vi.fn();
    scrollToElementSettled(element, { onDone });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    advanceUntilStable();

    expect(onDone).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it("スクロール中にレイアウトが伸びて手前で止まったら再スクロールする", () => {
    // 初回スクロールは手前で停止（ターゲットはまだ 1400px 下にある）
    top = 1400;
    // 2 回目の scrollIntoView（nudge）で到達する
    scrollIntoView.mockImplementation(() => {
      if (scrollIntoView.mock.calls.length >= 2) top = 0;
    });

    const onDone = vi.fn();
    scrollToElementSettled(element, { onDone });

    advanceUntilStable(); // 静止検知 → ずれ検出 → nudge
    advanceUntilStable(); // 再度静止 → 到達確認 → 完了

    expect(scrollIntoView).toHaveBeenCalledTimes(2);
    expect(onDone).toHaveBeenCalledTimes(1);
    // 補正は即時ジャンプ（smooth だと nudge ごとに数百 ms かかる）
    expect(scrollIntoView).toHaveBeenNthCalledWith(2, {
      behavior: "auto",
      block: "start",
    });
  });

  it("nudge は maxNudges 回までで打ち切る", () => {
    top = 1400; // 何度スクロールしても到達しない
    const onDone = vi.fn();
    scrollToElementSettled(element, { maxNudges: 2, onDone });

    for (let i = 0; i < 5; i++) advanceUntilStable();

    expect(scrollIntoView).toHaveBeenCalledTimes(3); // 初回 + nudge 2 回
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("ページ下端に達して近づけない場合は再スクロールしない", () => {
    top = 1400;
    // maxY = 5000 - 768 = 4232 に到達済み
    (window as { scrollY: number }).scrollY = 4232;

    const onDone = vi.fn();
    scrollToElementSettled(element, { onDone });

    advanceUntilStable();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("ユーザー入力（wheel）で追従を中断する", () => {
    top = 1400;
    const onDone = vi.fn();
    scrollToElementSettled(element, { onDone });

    window.dispatchEvent(new Event("wheel"));
    for (let i = 0; i < 5; i++) advanceUntilStable();

    expect(scrollIntoView).toHaveBeenCalledTimes(1); // nudge しない
    expect(onDone).not.toHaveBeenCalled();
  });

  it("cancel 関数で追従を止められる", () => {
    top = 1400;
    const onDone = vi.fn();
    const cancel = scrollToElementSettled(element, { onDone });

    cancel();
    for (let i = 0; i < 5; i++) advanceUntilStable();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(onDone).not.toHaveBeenCalled();
  });
});
