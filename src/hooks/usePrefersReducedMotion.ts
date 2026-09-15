"use client";

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * framer-motion の useReducedMotion を置き換える最小実装。
 *
 * SSR と初回レンダーでは false を返す（SSR === 初回クライアントレンダーに
 * なりハイドレーション不一致が出ない）。実際の値は effect で同期する。
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(QUERY);
    const sync = () => setReduced(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return reduced;
}
