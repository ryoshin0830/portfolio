"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useInView } from "react-intersection-observer";

/**
 * Single source of truth for "may this animation run right now?".
 *
 * Composes three gates so every animated section is high-performance by default:
 *   • prefers-reduced-motion  — never animate when the user opted out
 *   • in-view                 — pause looping work when scrolled off-screen
 *   • document visible        — pause when the tab is backgrounded
 *
 * Attach the returned `ref` to the element whose viewport presence gates the
 * animation, then drive looping framer-motion / setInterval / RAF work off
 * `active`: when `active` is false render a static frame and clear timers.
 *
 * SSR-safe: `document` is only read inside an effect, `tabVisible` defaults to
 * true (so SSR === first client render), and a null `reduce` (framer-motion's
 * first-paint value) is treated as "not reduced" to match existing components.
 */
export type UseActiveAnimationOptions = {
  /** IntersectionObserver threshold(s). Default 0 (pause once fully off-screen). */
  threshold?: number | number[];
  /** IntersectionObserver rootMargin passthrough. */
  rootMargin?: string;
  /** Skip the tab-visibility gate (rare). Default false. */
  ignoreTabVisibility?: boolean;
};

export type UseActiveAnimationResult = {
  /** Attach to the element whose viewport presence gates the animation. */
  ref: (node?: Element | null) => void;
  /** True only when motion is allowed AND element is in view AND tab is visible. */
  active: boolean;
  /** Element currently intersecting the viewport (independent of reduced-motion). */
  inView: boolean;
  /** prefers-reduced-motion. May be null on first paint. */
  reduce: boolean | null;
};

export function useActiveAnimation(
  opts: UseActiveAnimationOptions = {},
): UseActiveAnimationResult {
  const { threshold = 0, rootMargin, ignoreTabVisibility = false } = opts;

  const reduce = useReducedMotion();

  // triggerOnce is intentionally omitted — we want a continuous gate that can
  // flip back to false when the element leaves the viewport.
  const [ref, inView] = useInView({ threshold, rootMargin });

  const [tabVisible, setTabVisible] = useState(true);
  useEffect(() => {
    if (ignoreTabVisibility) return;
    const onVisibility = () =>
      setTabVisible(document.visibilityState === "visible");
    onVisibility(); // sync the real state after mount
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [ignoreTabVisibility]);

  const active = !reduce && inView && (ignoreTabVisibility || tabVisible);

  return { ref, active, inView, reduce };
}
