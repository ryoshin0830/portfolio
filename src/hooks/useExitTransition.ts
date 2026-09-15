"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type ExitState = "entering" | "exiting";

export type UseExitTransitionResult = {
  /** DOM に描画してよいか。閉じアニメの間も true のまま。 */
  mounted: boolean;
  /** 現在の向き。GSAP 側がこれを見て開き／閉じのタイムラインを選ぶ。 */
  state: ExitState;
};

/**
 * framer-motion の AnimatePresence を置き換える最小フック。
 *
 * AnimatePresence は「exit アニメが終わるまで子を DOM に残す」ためだけに
 * 使われていた。GSAP には同等の仕組みが無いので、閉じアニメの尺だけ
 * アンマウントを遅らせる責務をここに切り出す。
 *
 * `closing` は **effect ではなくレンダー中に**更新する（React の派生 state
 * パターン）。effect で更新すると open が false になったレンダーで一度
 * mounted=false が commit され、DOM が消えてから閉じアニメ用に再生成される
 * ——つまり一瞬消えて戻る。レンダー中に更新すれば React はその場で
 * 再レンダーしてから commit するので、DOM は消えずに残る。
 *
 * prefers-reduced-motion のときは exitMs を 0 として即座にアンマウントする
 * （閉じアニメ自体を再生しないので待つ意味が無い）。
 */
export function useExitTransition(
  open: boolean,
  opts: { exitMs?: number } = {},
): UseExitTransitionResult {
  const reduced = usePrefersReducedMotion();
  const exitMs = reduced ? 0 : (opts.exitMs ?? 180);

  const [closing, setClosing] = useState(false);
  const prevOpen = useRef(open);
  if (prevOpen.current !== open) {
    prevOpen.current = open;
    // 開いた → 閉じ待ちを取り消す / 閉じた → 閉じアニメの間だけ残す
    setClosing(!open);
  }

  useEffect(() => {
    if (!closing) return;
    if (exitMs === 0) {
      setClosing(false);
      return;
    }
    const id = setTimeout(() => setClosing(false), exitMs);
    return () => clearTimeout(id);
  }, [closing, exitMs]);

  return {
    mounted: open || closing,
    state: open ? "entering" : "exiting",
  };
}
