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
 * prefers-reduced-motion のときは exitMs を 0 として即座にアンマウントする
 * （閉じアニメ自体を再生しないので待つ意味が無い）。
 */
export function useExitTransition(
  open: boolean,
  opts: { exitMs?: number } = {},
): UseExitTransitionResult {
  const reduced = usePrefersReducedMotion();
  const exitMs = reduced ? 0 : (opts.exitMs ?? 180);

  const [mounted, setMounted] = useState(open);
  const [state, setState] = useState<ExitState>(open ? "entering" : "exiting");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (open) {
      setMounted(true);
      setState("entering");
      return;
    }

    setState("exiting");
    if (!mounted) return;
    if (exitMs === 0) {
      setMounted(false);
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      setMounted(false);
    }, exitMs);

    return () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    // `mounted` は「閉じ待ちを始めるべきか」の判定にだけ使う。依存に入れると
    // アンマウント確定後にもう一度 effect が走るが、その回は open=false かつ
    // mounted=false で即 return するので副作用は無い。
  }, [open, exitMs, mounted]);

  return { mounted, state };
}
