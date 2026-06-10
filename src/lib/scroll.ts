/**
 * レイアウト変動に強いページ内アンカースクロール。
 *
 * スムーズスクロール中に下方の遅延コンテンツ（WritingFeed の batch 表示など）が
 * 描画されると、クリック時に計算されたスクロール先がずれてターゲットの手前で
 * 止まる。これを防ぐため、スクロールが静止したらターゲット位置を検証し、
 * ずれていれば再スクロール（nudge）する。
 *
 * ユーザーの入力（ホイール / タッチ / キー操作）を検知したら即座に追従を
 * やめ、スクロールの主導権を奪わない。
 */

/** スクロール静止とみなす連続フレーム数（~160ms） */
const STABLE_FRAMES = 10;
/** ターゲットとの許容ずれ（px） */
const TOLERANCE = 2;

export function scrollToElementSettled(
  element: HTMLElement,
  options?: {
    maxNudges?: number;
    /** ターゲットに到達（または打ち切り）して自然終了したとき */
    onDone?: () => void;
    /** ユーザー入力または外部 cancel で中断されたとき */
    onCancel?: () => void;
  }
): () => void {
  // nudge 1 回ごとに遅延コンテンツがさらに伸びることがある（WritingFeed は
  // batch 単位で伸びる）ため、有限のコンテンツなら確実に収束する回数にする。
  const maxNudges = options?.maxNudges ?? 10;
  const behavior: ScrollBehavior =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

  let cancelled = false;
  let rafId = 0;
  let lastY: number | null = null;
  let stableFrames = 0;
  let nudges = 0;

  const removeListeners = () => {
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("keydown", cancel);
  };

  const end = (settled: boolean) => {
    if (cancelled) return;
    cancelled = true;
    cancelAnimationFrame(rafId);
    removeListeners();
    if (settled) {
      options?.onDone?.();
    } else {
      options?.onCancel?.();
    }
  };

  const cancel = () => end(false);
  const finish = () => end(true);

  const tick = () => {
    if (cancelled) return;

    const y = window.scrollY;
    stableFrames = lastY !== null && Math.abs(y - lastY) < 1 ? stableFrames + 1 : 0;
    lastY = y;

    if (stableFrames >= STABLE_FRAMES) {
      const top = element.getBoundingClientRect().top;
      const maxY =
        document.documentElement.scrollHeight - window.innerHeight;
      // これ以上近づけない（下端到達 / 上端到達）場合は打ち切る
      const canScrollCloser = top > TOLERANCE ? y < maxY - 1 : y > 1;

      if (Math.abs(top) > TOLERANCE && canScrollCloser && nudges < maxNudges) {
        nudges += 1;
        stableFrames = 0;
        // 初回のスムーズスクロールで移動の演出は済んでいるので、補正は即時
        // ジャンプにする（smooth だと nudge のたびに数百 ms かかり、その間に
        // さらにコンテンツが伸びて何秒も這うような追従になる）
        element.scrollIntoView({ behavior: "auto", block: "start" });
      } else {
        finish();
        return;
      }
    }

    rafId = requestAnimationFrame(tick);
  };

  element.scrollIntoView({ behavior, block: "start" });
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("keydown", cancel);
  rafId = requestAnimationFrame(tick);

  return cancel;
}
