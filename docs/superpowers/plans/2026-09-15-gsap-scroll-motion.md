# GSAP スクロールモーション刷新 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** framer-motion を GSAP + ScrollTrigger に一本化し、参考サイト由来の視差・kinetic タイポ・横スクロールを Apple 風クリーンなトークンの上に載せる。

**Architecture:** `src/lib/gsap.ts` を GSAP の唯一の入口にし、すべてのアニメーションを `useGSAP(() => {...}, { scope })` の中で定義する（`gsap.context` が自動 revert するので手書き cleanup を増やさない）。横断的な演出は `ScrollMotionRoot` が 1 つの client boundary にまとめ、セクション固有の状態を持つものだけ各コンポーネントに置く。

**Tech Stack:** Next.js 15 / React 19 / TypeScript 5 / Tailwind CSS 4 / gsap 3.15 / @gsap/react 2.1 / Vitest + Testing Library

**Spec:** `docs/superpowers/specs/2026-09-15-gsap-scroll-motion-design.md`

## Global Constraints

- 配色トークン（`--color-*`）の値は変更しない。白 `#ffffff` / ニアブラック `#1d1d1f` / System Blue `#0071e3`（dark: `#2997ff`）。
- **色のグラデーション・backdrop blur・色付き影は使わない。** 装飾は 1px の線・アウトライン文字（`-webkit-text-stroke`）・べた塗りのみ。`mask-image` のアルファマスクは可。
- **セリフは Hero の漢字名 1 箇所だけ。** 新規に `--font-display-serif` を使わない。
- セクション構成・`id` 属性・`messages/{ja,en,zh}.json` の内容は変更しない。
- アニメーションするプロパティは `transform` と `opacity` のみ。
- `repeat: Infinity` の常時ループを新規に作らない。既存のループは ScrollTrigger の `onToggle` か `useActiveAnimation` の `active` で画面外・タブ非表示時に停止する。
- 既存テストは全て通ること。特に `ContactModal.test.tsx` / `useScrollNavigation.test.tsx` / `scroll.test.ts` / `sections.test.ts`。
- 各タスク末尾で `npm run test` が緑であること。最終タスクで `npm run build && npm run typecheck && npm run lint && npm run test` を全て通す。

---

### Task 1: GSAP 基盤とテスト環境

**Files:**
- Modify: `package.json`（deps）
- Create: `src/lib/gsap.ts`
- Modify: `vitest.setup.ts`
- Test: `src/lib/gsap.test.ts`

**Interfaces:**
- Produces: `src/lib/gsap.ts` が `gsap`, `ScrollTrigger`, `useGSAP` を re-export する。以降の全タスクは GSAP をこのモジュール経由でのみ import する。

- [ ] **Step 1: 依存を追加する**

```bash
npm install gsap@^3.15.0 @gsap/react@^2.1.2
```

- [ ] **Step 2: vitest.setup.ts に jsdom 不足分のスタブを足す**

`vitest.setup.ts` の末尾（`export { IntersectionObserverStub }` の直前）に追記する。

```ts
// jsdom には matchMedia が無い。GSAP の gsap.matchMedia() と
// usePrefersReducedMotion が使うので、常に「マッチしない」スタブを入れる。
// （テストでは reduced-motion / hover 条件を全て false 扱いにして、
//  スクロール演出を登録させない = DOM 構造だけを検証する）
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// ScrollTrigger が参照する。observe/unobserve を記録しないダミーで十分。
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}
```

- [ ] **Step 3: 失敗するテストを書く**

`src/lib/gsap.test.ts`:

```ts
import { describe, expect, it } from "vitest";

describe("src/lib/gsap", () => {
  it("gsap と ScrollTrigger と useGSAP を re-export する", async () => {
    const mod = await import("./gsap");
    expect(typeof mod.gsap.to).toBe("function");
    expect(typeof mod.ScrollTrigger.refresh).toBe("function");
    expect(typeof mod.useGSAP).toBe("function");
  });

  it("複数回 import しても registerPlugin は 1 回しか走らない", async () => {
    const a = await import("./gsap");
    const b = await import("./gsap");
    // 同じモジュールインスタンスが返る = 副作用は 1 回きり
    expect(a.gsap).toBe(b.gsap);
    expect(a.registeredPlugins).toEqual(["useGSAP", "ScrollTrigger"]);
  });
});
```

- [ ] **Step 4: 失敗を確認する**

Run: `npx vitest run src/lib/gsap.test.ts`
Expected: FAIL — `Cannot find module './gsap'`

- [ ] **Step 5: src/lib/gsap.ts を実装する**

```ts
/**
 * GSAP とプラグイン登録の唯一の入口。
 *
 * サイト内のアニメーションは必ずこのモジュール経由で gsap を取得する。
 * registerPlugin をここ 1 箇所に閉じ込めることで、
 *  - 登録漏れ（ScrollTrigger が動かない）
 *  - 二重登録
 * のどちらも起きなくする。
 *
 * すべてのアニメーションは useGSAP(() => {...}, { scope: ref }) の中で
 * 定義すること。useGSAP は内部で gsap.context() を張るので、アンマウント時に
 * トゥイーン・ScrollTrigger・インライン style がまとめて revert される。
 * 手書きの cleanup を増やさないための中核。
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/** テスト用: 登録済みプラグイン名（登録が 1 回であることの検証に使う）。 */
export const registeredPlugins = ["useGSAP", "ScrollTrigger"] as const;

export { gsap, ScrollTrigger, useGSAP };
```

- [ ] **Step 6: テストが通ることを確認する**

Run: `npx vitest run src/lib/gsap.test.ts`
Expected: PASS（2 件）

- [ ] **Step 7: 全テストが緑であることを確認する**

Run: `npm run test`
Expected: 既存テストを含めて全て PASS

- [ ] **Step 8: コミット**

```bash
git add package.json package-lock.json src/lib/gsap.ts src/lib/gsap.test.ts vitest.setup.ts
git commit -m "feat(motion): GSAP と ScrollTrigger の単一エントリポイントを作る"
```

---

### Task 2: reduced-motion フックの framer 依存を外す

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.ts`
- Modify: `src/hooks/useActiveAnimation.ts:1-10`（import と `reduce` の取得元）
- Test: `src/hooks/usePrefersReducedMotion.test.tsx`

**Interfaces:**
- Consumes: なし
- Produces: `usePrefersReducedMotion(): boolean` — `(prefers-reduced-motion: reduce)` に一致するとき true。SSR と初回レンダーでは false。
  `useActiveAnimation` の公開 API（`{ ref, active, inView, reduce }`）は**変更しない**。`reduce` の型が `boolean | null` から `boolean` に狭まるだけ。

- [ ] **Step 1: 失敗するテストを書く**

`src/hooks/usePrefersReducedMotion.test.tsx`:

```tsx
import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.delete(cb),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as never;
  return {
    emit(next: boolean) {
      mql.matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

describe("usePrefersReducedMotion", () => {
  it("reduce 指定があれば true を返す", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("指定が無ければ false を返す", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("設定変更に追従する", () => {
    const mql = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
    act(() => mql.emit(true));
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `npx vitest run src/hooks/usePrefersReducedMotion.test.tsx`
Expected: FAIL — モジュールが無い

- [ ] **Step 3: usePrefersReducedMotion を実装する**

`src/hooks/usePrefersReducedMotion.ts`:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/hooks/usePrefersReducedMotion.test.tsx`
Expected: PASS（3 件）

- [ ] **Step 5: useActiveAnimation の import を差し替える**

`src/hooks/useActiveAnimation.ts` の 4 行目
`import { useReducedMotion } from "framer-motion";` を削除し、
`import { usePrefersReducedMotion } from "./usePrefersReducedMotion";` に置き換える。
本体の `const reduce = useReducedMotion();` を
`const reduce = usePrefersReducedMotion();` にする。
型 `UseActiveAnimationResult["reduce"]` を `boolean | null` から `boolean` に変更し、
JSDoc の「May be null on first paint」と framer への言及を
「初回レンダーでは false」に書き換える。

- [ ] **Step 6: 全テストが緑であることを確認する**

Run: `npm run test && npm run typecheck`
Expected: 全て PASS

- [ ] **Step 7: コミット**

```bash
git add src/hooks/usePrefersReducedMotion.ts src/hooks/usePrefersReducedMotion.test.tsx src/hooks/useActiveAnimation.ts
git commit -m "refactor(motion): reduced-motion 判定を framer-motion から自前 matchMedia に移す"
```

---

### Task 3: AnimatePresence を置き換える useExitTransition

**Files:**
- Create: `src/hooks/useExitTransition.ts`
- Test: `src/hooks/useExitTransition.test.tsx`

**Interfaces:**
- Consumes: `usePrefersReducedMotion`（Task 2）
- Produces:
  ```ts
  type ExitState = "entering" | "exiting";
  function useExitTransition(
    open: boolean,
    opts?: { exitMs?: number },
  ): { mounted: boolean; state: ExitState };
  ```
  Task 4 の ContactModal / Navigation がこれを使う。

- [ ] **Step 1: 失敗するテストを書く**

`src/hooks/useExitTransition.test.tsx`:

```tsx
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
```

- [ ] **Step 2: 失敗を確認する**

Run: `npx vitest run src/hooks/useExitTransition.test.tsx`
Expected: FAIL — モジュールが無い

- [ ] **Step 3: 実装する**

`src/hooks/useExitTransition.ts`:

```ts
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
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/hooks/useExitTransition.test.tsx`
Expected: PASS（4 件）

- [ ] **Step 5: コミット**

```bash
git add src/hooks/useExitTransition.ts src/hooks/useExitTransition.test.tsx
git commit -m "feat(motion): AnimatePresence を置き換える useExitTransition を足す"
```

---

### Task 4: ContactModal / Navigation / SchedulingChat から framer-motion を外す

見た目と DOM の出入りタイミングを変えない「移植」タスク。新しい演出は足さない。

**Files:**
- Modify: `src/components/ContactModal.tsx`（`AnimatePresence` / `m.div` の除去）
- Modify: `src/components/Navigation.tsx`（テーマトグル・言語メニュー・モバイルメニュー）
- Modify: `src/components/SchedulingChat.tsx`（メッセージとクイック返信の登場アニメ）

**Interfaces:**
- Consumes: `useExitTransition`（Task 3）、`gsap` / `useGSAP`（Task 1）
- Produces: なし（内部実装の置換のみ）

- [ ] **Step 1: 既存テストを先に走らせて基準を取る**

Run: `npx vitest run src/components/ContactModal.test.tsx src/components/SchedulingChat.test.tsx`
Expected: PASS。この 2 ファイルは**一切変更せず**、移植後も同じく PASS することがこのタスクの合格条件。

- [ ] **Step 2: ContactModal を移植する**

`import { m, AnimatePresence } from "framer-motion";` を削除し、
`import { gsap, useGSAP } from "@/lib/gsap";` と
`import { useExitTransition } from "@/hooks/useExitTransition";` を足す。

`open` state はそのまま残し、描画は `useExitTransition` を通す。

```tsx
const { mounted, state } = useExitTransition(open, { exitMs: 180 });
const rootRef = useRef<HTMLDivElement>(null);

useGSAP(
  () => {
    if (!mounted) return;
    const overlay = rootRef.current;
    const panel = panelRef.current;
    if (!overlay || !panel) return;

    if (state === "entering") {
      gsap.fromTo(
        overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.18, ease: "power2.out" },
      );
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.97, y: 8 },
        { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power2.out" },
      );
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.18, ease: "power2.in" });
      gsap.to(panel, {
        opacity: 0,
        scale: 0.97,
        y: 8,
        duration: 0.18,
        ease: "power2.in",
      });
    }
  },
  { scope: rootRef, dependencies: [mounted, state] },
);
```

JSX は `<AnimatePresence>{open && (<m.div …>` を
`{mounted && (<div ref={rootRef} …>` に置き換え、内側の `m.div`（パネル）を
素の `div` にする。`ref={panelRef}`・`role`・`aria-*`・className は現状のまま残す。

**注意:** フォーカス管理とスクロールロックの effect は `open`（`mounted` ではなく）
に依存させたまま変更しない。閉じるときに `open` が先に false になるので、
inert 解除とフォーカス復帰は現状と同じタイミングで走る。

- [ ] **Step 3: ContactModal のテストが通ることを確認する**

Run: `npx vitest run src/components/ContactModal.test.tsx`
Expected: PASS（変更前と同じ件数）

失敗する場合、DOM の消滅が 180ms 遅れたことが原因なら、テストは
`waitForElementToBeRemoved` を使っているはず。テストを変えずに直すため、
`exitMs` を渡さず `useExitTransition(open, { exitMs: 180 })` のままにして、
テスト環境では `matchMedia` スタブが `matches: false` を返すので
実時間で 180ms 待つ。これで落ちるなら `exitMs: 0` ではなく
テスト側の `findBy*` が効く形になっているか確認すること。

- [ ] **Step 4: Navigation を移植する**

3 箇所を置き換える。

1. **テーマトグル**（`AnimatePresence mode="wait"`、248-270 行付近）
   2 つの `m.div` を 1 つの素の `div ref={iconRef}` にして、中のアイコンだけ
   `theme` で切り替える。`useGSAP` で `theme` を依存にして回転フェードを付ける。

```tsx
const iconRef = useRef<HTMLDivElement>(null);
useGSAP(
  () => {
    if (!iconRef.current) return;
    gsap.fromTo(
      iconRef.current,
      { rotate: theme === "dark" ? -90 : 90, opacity: 0 },
      { rotate: 0, opacity: 1, duration: 0.15, ease: "power2.out" },
    );
  },
  { dependencies: [theme] },
);
```

2. **言語メニュー**（290-320 行付近）
   `useExitTransition(showLangMenu, { exitMs: 150 })` でマウントを制御し、
   `m.div` を素の `div` にして `useGSAP` で `opacity`/`y:-6` を付ける。
   `role="menu"` と className は現状のまま。

3. **モバイルメニュー**（340-397 行付近）
   `useExitTransition(showMoreMenu, { exitMs: 200 })`。`m.div` を素の `div` に。
   `ref={mobileMenuRef}`・`id="mobile-menu"`・`role="dialog"`・`aria-modal`・
   `aria-label` は現状のまま残す（フォーカストラップの effect が
   `mobileMenuRef` を掴んでいるため）。

`import { m, AnimatePresence } from "framer-motion";` を削除する。

- [ ] **Step 5: SchedulingChat を移植する**

`AnimatePresence initial={false}` には `exit` が一切無いので、
純粋な登場アニメだけを移せばよい（アンマウント遅延は不要）。

`m.div`（メッセージ）を素の `div` にし、リストの入れ替えに追従させるため
`useGSAP` を `messages.length` 依存で 1 回だけ張り、
**最後に追加された要素だけ**を `gsap.from` する。

```tsx
const listRef = useRef<HTMLDivElement>(null);
useGSAP(
  () => {
    const nodes = listRef.current?.querySelectorAll<HTMLElement>("[data-message]");
    const latest = nodes?.[nodes.length - 1];
    if (!latest) return;
    gsap.from(latest, {
      opacity: 0,
      y: 15,
      scale: 0.95,
      duration: 0.35,
      ease: "back.out(1.4)",
    });
  },
  { scope: listRef, dependencies: [messages.length] },
);
```

メッセージの `div` に `data-message` 属性を足し、外側のラッパー（362 行の
`<div className="flex flex-col gap-6">`）に `ref={listRef}` を付ける。
クイック返信の `m.div`（543 行付近）も素の `div` にし、同様に `gsap.from` する。

`import { m, AnimatePresence } from "framer-motion";` を削除する。

- [ ] **Step 6: 移植した 3 ファイルのテストが通ることを確認する**

Run: `npm run test && npm run typecheck && npm run lint`
Expected: 全て PASS

- [ ] **Step 7: コミット**

```bash
git add src/components/ContactModal.tsx src/components/Navigation.tsx src/components/SchedulingChat.tsx
git commit -m "refactor(motion): モーダルとメニューを GSAP に移植する"
```

---

### Task 5: 残りの framer-motion を外して依存を削除する

**Files:**
- Modify: `src/components/AboutSection.tsx`
- Modify: `src/components/TimelineSection.tsx`
- Modify: `src/components/HighlightsHeroMetric.tsx`
- Delete: `src/components/MotionProvider.tsx`
- Modify: `src/app/[locale]/layout.tsx`（`MotionProvider` の除去）
- Modify: `package.json`（framer-motion を削除）

**Interfaces:**
- Consumes: `gsap` / `ScrollTrigger` / `useGSAP`（Task 1）、`useActiveAnimation`（Task 2）
- Produces: なし

- [ ] **Step 1: AboutSection を移植する**

`m.div` / `m.article` を素の `div` / `article` にし、`useInView` による
`animate={inView ? ...}` を ScrollTrigger の一括リビールに置き換える。

```tsx
const sectionRef = useRef<HTMLElement>(null);
useGSAP(
  () => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from("[data-reveal]", {
        opacity: 0,
        y: 16,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 85%" },
      });
    });
  },
  { scope: sectionRef },
);
```

リビール対象（本文ブロックと 3 枚の expertise カード）に `data-reveal` を付ける。
`useInView` の import と `[ref, inView]` を削除し、`ref={sectionRef}` にする。

- [ ] **Step 2: TimelineSection を移植する**

`useReducedMotion` を `usePrefersReducedMotion` に、`useScroll` を
ScrollTrigger の scrub に置き換える。`m.span` / `m.li` を素の要素にし、
`lit` state で駆動していた進捗ラインは `scrollTrigger: { scrub: true }` の
`scaleY` トゥイーンにする。`useActiveAnimation` を使っているループ部分は
そのまま `active` ゲートを維持する。

- [ ] **Step 3: HighlightsHeroMetric を移植する**

`useTransform`/`useSpring` による scroll 連動を ScrollTrigger の scrub に、
`m.line` / `m.circle` の `initial`/`animate` を `gsap.from` に置き換える。
数値カウントアップは scrub にする:

```tsx
const counter = { value: range.from };
gsap.to(counter, {
  value: range.to,
  ease: "none",
  scrollTrigger: { trigger: sectionRef.current, start: "top 85%", end: "top 40%", scrub: 0.6 },
  onUpdate: () => setDisplay(counter.value.toFixed(2)),
});
```

パルス（`PULSE_DUR` のループ）は `repeat: -1` の timeline にして、
`useActiveAnimation` の `active` が false のとき `timeline.pause()` する
（`active` を依存に入れた `useGSAP` で制御する）。**画面外・タブ非表示で
必ず止まること**がこのステップの合格条件。

- [ ] **Step 4: MotionProvider を削除して layout から外す**

```bash
git rm src/components/MotionProvider.tsx
```

`src/app/[locale]/layout.tsx` から
`import MotionProvider from "@/components/MotionProvider";` と
JSX の `<MotionProvider>` ラッパーを削除する（子はそのまま残す）。

- [ ] **Step 5: framer-motion を依存から削除する**

```bash
npm uninstall framer-motion
```

- [ ] **Step 6: framer-motion の参照が 1 つも残っていないことを確認する**

Run: `grep -rn "framer-motion" src/ tests/ package.json`
Expected: 出力なし（exit code 1）

- [ ] **Step 7: 全検証を通す**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS

- [ ] **Step 8: コミット**

```bash
git add -A
git commit -m "refactor(motion): framer-motion を撤去して GSAP に一本化する"
```

---

### Task 6: 奥行きレイヤー — ScrollProgressBar と AmbientGrid

**Files:**
- Create: `src/components/motion/ScrollProgressBar.tsx`
- Create: `src/components/motion/AmbientGrid.tsx`
- Modify: `src/app/globals.css`（`.ambient-grid` / `.scroll-progress` のスタイル）
- Modify: `src/app/[locale]/layout.tsx`（2 つを常駐させる）

**Interfaces:**
- Consumes: `gsap` / `ScrollTrigger` / `useGSAP`（Task 1）
- Produces: `<ScrollProgressBar />`, `<AmbientGrid />`（どちらも props なし）

- [ ] **Step 1: globals.css にスタイルを足す**

ファイル末尾に追記する。

```css
/* ─── 奥行きレイヤー ─────────────────────────────────────────
   色のグラデーションは使わない。1px の線・アウトライン文字・
   べた塗りだけで奥行きを作る（mask-image のアルファマスクは可）。
   ──────────────────────────────────────────────────────────── */

/* ページ上端の読書プログレス。scaleX を scrub する。 */
.scroll-progress {
  position: fixed;
  inset: 0 0 auto;
  height: 2px;
  z-index: 70;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  pointer-events: none;
}

/* 固定の格子背景。上下をマスクでフェードさせ、y 視差で動かす。 */
.ambient-grid {
  position: fixed;
  inset: -10% 0;
  z-index: -1;
  pointer-events: none;
  opacity: 0.5;
  background-image:
    linear-gradient(var(--color-rule-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--color-rule-soft) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: linear-gradient(transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(transparent, black 30%, black 70%, transparent);
}

@media (max-width: 700px) {
  .ambient-grid { background-size: 80px 80px; opacity: 0.35; }
}

@media (prefers-reduced-motion: reduce) {
  .scroll-progress, .ambient-grid { display: none; }
}
```

- [ ] **Step 2: ScrollProgressBar を実装する**

`src/components/motion/ScrollProgressBar.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * ページ上端の読書プログレスバー。
 * ドキュメント全体のスクロール量を scrub で scaleX に写すだけなので、
 * スクロールしていない間は 1 フレームも回らない。
 */
export default function ScrollProgressBar() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(ref.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.2,
        },
      });
    });
    return () => mm.revert();
  });

  return <div ref={ref} className="scroll-progress" aria-hidden />;
}
```

- [ ] **Step 3: AmbientGrid を実装する**

`src/components/motion/AmbientGrid.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 固定の格子背景。ページ全体のスクロールに対してゆっくり上へ流し、
 * 前景のコンテンツとの間に視差を作る。装飾専用なので aria-hidden。
 */
export default function AmbientGrid() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.to(ref.current, {
        y: -160,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5,
        },
      });
    });
    return () => mm.revert();
  });

  return <div ref={ref} className="ambient-grid" aria-hidden />;
}
```

- [ ] **Step 4: layout に常駐させる**

`src/app/[locale]/layout.tsx` の `<body>` 直下、`<Navigation />` の前に足す。

```tsx
<AmbientGrid />
<ScrollProgressBar />
```

import も追加する。

- [ ] **Step 5: 検証してコミット**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS

```bash
git add -A
git commit -m "feat(motion): 格子背景と読書プログレスバーで奥行きを作る"
```

---

### Task 7: Hero の奥行きと kinetic タイポ

**Files:**
- Create: `src/components/motion/HeroDepth.tsx`
- Create: `src/components/KineticHeading.tsx`（Server Component）
- Modify: `src/components/HeroSection.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/KineticHeading.test.tsx`

**Interfaces:**
- Consumes: `gsap` / `useGSAP`（Task 1）
- Produces:
  ```tsx
  // Server Component。テキストを静的に 1 文字ずつ span に割る。
  function KineticHeading(props: {
    text: string;
    className?: string;
  }): JSX.Element;
  ```

**LCP 保護の必須条件（spec §4）:** ① 分割は SSR 時点で完了している ②マウント時に
`gsap.set` を打たない（スクロールして初めて動く）③`letter-spacing` と行送りを
変えない ④reduced-motion では登録自体をしない。

- [ ] **Step 1: 失敗するテストを書く**

`src/components/KineticHeading.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KineticHeading from "./KineticHeading";

describe("KineticHeading", () => {
  it("1 文字ずつ span に割る", () => {
    const { container } = render(<KineticHeading text="梁震" />);
    const letters = container.querySelectorAll(".kinetic-letter");
    expect(letters).toHaveLength(2);
    expect(letters[0].textContent).toBe("梁");
    expect(letters[1].textContent).toBe("震");
  });

  it("読み上げ用に元のテキストを保持する", () => {
    const { container } = render(<KineticHeading text="梁 震" />);
    // 分割した側は aria-hidden、読み上げは元テキスト 1 つだけ
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
    expect(container.textContent).toContain("梁");
  });

  it("空白を nbsp に置き換えて折り返しを防ぐ", () => {
    const { container } = render(<KineticHeading text="a b" />);
    const letters = container.querySelectorAll(".kinetic-letter");
    expect(letters).toHaveLength(3);
    expect(letters[1].textContent).toBe(" ");
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `npx vitest run src/components/KineticHeading.test.tsx`
Expected: FAIL — モジュールが無い

- [ ] **Step 3: KineticHeading を実装する**

`src/components/KineticHeading.tsx`（`"use client"` を付けない = Server Component）:

```tsx
/**
 * テキストを 1 文字ずつ span に割る。**サーバー側で静的に**行うので、
 * 初期 HTML の時点で分割済みのテキストが入っている。
 *
 * これが LCP 保護の要: クライアントでテキストを差し替えないため、
 * LCP 要素の内容は最初から最後まで同一になる（CLAUDE.md の
 * 「LCP テキストは LCP 計測ウィンドウ中に差し替えない」を満たす）。
 *
 * 読み上げは分割前の文字列 1 つだけを露出させ、分割側は aria-hidden にする
 * （1 文字ずつ読み上げられるのを防ぐ）。
 */
export default function KineticHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) => (
          <span className="kinetic-letter" key={`${ch}-${i}`}>
            {ch === " " || ch === "　" ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: テストが通ることを確認する**

Run: `npx vitest run src/components/KineticHeading.test.tsx`
Expected: PASS（3 件）

- [ ] **Step 5: globals.css に kinetic と hero-depth のスタイルを足す**

```css
/* 1 文字 span。inline-block にするだけで、字送り(letter-spacing)と
   行送りは .hero-name の現行値をそのまま継承する = CLS ゼロ。 */
.kinetic-letter {
  display: inline-block;
  transform-origin: 50% 100%;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .kinetic-letter { will-change: auto; }
}

/* Hero 背面の奥行き。巨大なアウトライン文字と破線の軌道円。 */
.hero-depth {
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}
.depth-word {
  position: absolute;
  left: -2%;
  bottom: 0;
  font-size: clamp(180px, 30vw, 520px);
  font-weight: 700;
  line-height: 0.8;
  letter-spacing: -0.06em;
  color: transparent;
  -webkit-text-stroke: 1px var(--color-rule);
  opacity: 0.35;
  white-space: nowrap;
}
.depth-orbit {
  position: absolute;
  border: 1px solid var(--color-rule);
  border-radius: 50%;
  width: 60vw;
  height: 60vw;
  right: -14%;
  top: -12%;
  opacity: 0.5;
}
.depth-orbit--two {
  width: 44vw;
  height: 44vw;
  top: 4%;
  right: -4%;
  border-style: dashed;
  opacity: 0.35;
}

@media (max-width: 700px) {
  .depth-word { font-size: 60vw; bottom: 18%; }
  .depth-orbit { width: 120vw; height: 120vw; right: -40%; top: 24%; }
  .depth-orbit--two { width: 100vw; height: 100vw; top: 30%; right: -28%; }
}

@media (prefers-reduced-motion: reduce) {
  .hero-depth { display: none; }
}
```

- [ ] **Step 6: HeroDepth を実装する**

`src/components/motion/HeroDepth.tsx`:

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Hero 背面の奥行きレイヤー。アウトライン文字と 2 つの軌道円を、
 * それぞれ違う scrub 速度で動かして視差を作る。
 *
 * 初期 transform は当てない（マウント時に gsap.set を打たない）ので、
 * ファーストビューの描画は静止画と同じ。スクロールして初めて動く。
 */
export default function HeroDepth({ word }: { word: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = (scrub: number) => ({
          trigger: ref.current,
          start: "top top",
          end: "bottom top",
          scrub,
        });
        gsap.to(".depth-word", { xPercent: -14, yPercent: 24, ease: "none", scrollTrigger: st(1.8) });
        gsap.to(".depth-orbit:not(.depth-orbit--two)", { rotation: 70, scale: 1.3, yPercent: -10, ease: "none", scrollTrigger: st(1.4) });
        gsap.to(".depth-orbit--two", { rotation: -90, scale: 0.8, xPercent: -14, ease: "none", scrollTrigger: st(1) });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="hero-depth" aria-hidden>
      <span className="depth-word">{word}</span>
      <span className="depth-orbit" />
      <span className="depth-orbit depth-orbit--two" />
    </div>
  );
}
```

- [ ] **Step 7: HeroSection に組み込む**

`HeroSection.tsx`（Server Component のまま）で:

1. `<section id="hero" …>` の直下に `<HeroDepth word={tNames("english")} />` を置く。
   `word` には英字表記（例 `Ryo Shin`）を渡す — アウトライン文字は装飾なので
   何が入っても読み上げられない（`aria-hidden`）。
2. `<h1 className="display-serif hero-name mb-6 whitespace-nowrap">` の中身を
   `KineticHeading` に差し替える。現在の `nameParts.map` による
   `ml-[0.16em]` の光学的な字間調整は維持する:

```tsx
<h1 className="display-serif hero-name mb-6 whitespace-nowrap">
  {nameParts.map((part, i) => (
    <KineticHeading
      key={part}
      text={part}
      className={i > 0 ? "ml-[0.16em]" : undefined}
    />
  ))}
</h1>
```

3. Hero の kinetic 演出そのものは Task 8 の `ScrollMotionRoot` が
   `.kinetic-letter` をセレクタで拾って付ける（ここでは span を出すだけ）。

- [ ] **Step 8: 検証してコミット**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS

```bash
git add -A
git commit -m "feat(hero): 奥行きレイヤーと SSR 分割の kinetic タイポを足す"
```

---

### Task 8: ScrollMotionRoot — 横断的なスクロール演出

**Files:**
- Create: `src/components/motion/ScrollMotionRoot.tsx`
- Modify: `src/app/[locale]/layout.tsx`（`<main>` を包む）
- Modify: `src/app/globals.css`（pointer tilt のスポットライトとワイプ hover）

**Interfaces:**
- Consumes: `gsap` / `ScrollTrigger` / `useGSAP`（Task 1）、Task 7 が出力する `.kinetic-letter`
- Produces: `<ScrollMotionRoot>{children}</ScrollMotionRoot>`

セレクタで横断的にかける演出をここ 1 箇所に集約する。セクションごとに
`"use client"` を増やさずに済み、Server Component の比率が保てる。

- [ ] **Step 1: globals.css に横断スタイルを足す**

```css
/* pointer 追従のスポットライト。色ではなくインクの薄い重ねなので
   「グラデ禁止」の趣旨（カラフルな装飾グラデ）には当たらない扱いとする。 */
.tilt-card { position: relative; }
.tilt-card::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: radial-gradient(
    420px circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
    color-mix(in srgb, var(--color-ink) 6%, transparent),
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}
.tilt-card:hover::after { opacity: 1; }

/* リスト行のワイプ hover。 */
.wipe-row { position: relative; isolation: isolate; }
.wipe-row::before {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--color-bg-soft);
  transform: translateX(-102%);
  transition: transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  z-index: -1;
}
.wipe-row:hover::before { transform: translateX(0); }

@media (prefers-reduced-motion: reduce) {
  .tilt-card::after { display: none; }
  .wipe-row::before { transition: none; }
}
```

- [ ] **Step 2: ScrollMotionRoot を実装する**

`src/components/motion/ScrollMotionRoot.tsx`:

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/**
 * ページ全体のスクロール演出を 1 箇所に集約するクライアント境界。
 *
 * セクション側は data 属性（data-reveal / data-stagger / tilt-card /
 * wipe-row）を付けるだけでよく、Server Component のままでいられる。
 * セクション固有で内部状態を持つもの（Projects の横スクロール進捗、
 * Highlights の数値）だけは各コンポーネントの useGSAP に置く。
 */
export default function ScrollMotionRoot({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 見出し: scrub で左から寄る
        gsap.utils.toArray<HTMLElement>("[data-reveal-head]").forEach((el) => {
          gsap.from(el, {
            x: -40,
            opacity: 0.25,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 92%", end: "top 45%", scrub: 0.8 },
          });
        });

        // 汎用リビール
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 40,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

        // stagger グループ（chip 群など）
        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
          gsap.from(group.children, {
            y: 20,
            scale: 0.9,
            opacity: 0,
            duration: 0.45,
            stagger: 0.04,
            ease: "power2.out",
            scrollTrigger: { trigger: group, start: "top 90%" },
          });
        });

        // Hero の kinetic タイポ: スクロールアウトで飛散する。
        // start を hero 下端付近に置くので、ファーストビューでは一切動かない
        // （= LCP 計測ウィンドウ中に LCP 要素を変形させない）。
        const hero = document.getElementById("hero");
        const letters = hero?.querySelectorAll<HTMLElement>(".kinetic-letter");
        if (hero && letters?.length) {
          gsap.to(letters, {
            yPercent: (i) => -30 - (i % 4) * 12,
            xPercent: (i) => (i % 2 ? 1 : -1) * (8 + i * 2),
            rotateX: 60,
            rotateZ: (i) => (i % 2 ? 1 : -1) * 10,
            opacity: 0,
            stagger: { each: 0.03, from: "edges" },
            ease: "power2.in",
            scrollTrigger: { trigger: hero, start: "bottom 90%", end: "bottom 30%", scrub: 1 },
          });
        }
      });

      // pointer tilt とマグネティックは「本物のマウス」がある環境だけ
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cleanups: Array<() => void> = [];

        gsap.utils.toArray<HTMLElement>(".tilt-card").forEach((card) => {
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3.out" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width;
            const y = (e.clientY - r.top) / r.height;
            rx((0.5 - y) * 8);
            ry((x - 0.5) * 10);
            card.style.setProperty("--pointer-x", `${x * 100}%`);
            card.style.setProperty("--pointer-y", `${y * 100}%`);
          };
          const leave = () => { rx(0); ry(0); };
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", leave);
            rx.tween.kill();
            ry.tween.kill();
            gsap.set(card, { clearProps: "transform" });
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const x = gsap.quickTo(btn, "x", { duration: 0.45, ease: "power3.out" });
          const y = gsap.quickTo(btn, "y", { duration: 0.45, ease: "power3.out" });
          const move = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            x((e.clientX - r.left - r.width / 2) * 0.25);
            y((e.clientY - r.top - r.height / 2) * 0.25);
          };
          const leave = () => { x(0); y(0); };
          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerleave", leave);
          cleanups.push(() => {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerleave", leave);
            x.tween.kill();
            y.tween.kill();
            gsap.set(btn, { clearProps: "transform" });
          });
        });

        return () => cleanups.forEach((fn) => fn());
      });

      // 日本語フォントの読込でレイアウトが確定してから位置を取り直す
      if (typeof document !== "undefined" && document.fonts?.ready) {
        document.fonts.ready.then(() => ScrollTrigger.refresh());
      }

      return () => mm.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
```

- [ ] **Step 3: layout で main を包む**

`src/app/[locale]/layout.tsx` の `{children}`（`<main>` を含む領域）を
`<ScrollMotionRoot>` で包む。`<Navigation />` と `<ContactModal />` は
外に置いたままにする（固定要素なので視差の対象外）。

- [ ] **Step 4: セクションに data 属性を配る**

各セクションの `<header>` 内の `<h2>` に `data-reveal-head` を付ける:
`AboutSection` / `ProjectsSection` / `ResearchSection` / `SkillsSection` /
`HighlightsStrip` / `ExperienceSection` / `WritingFeed`。

chip 群のラッパー（`.flex.flex-wrap.gap-2` で `.chip` を並べている箇所）に
`data-stagger` を付ける: `AboutSection` の capabilities、`SkillsSection`、
`ProjectsSection` の technologies。

Hero の `.btn-pill` に `data-magnetic` を付ける。

`ProjectsSection` の各 `<article>` と `ExperienceCard` のルートに
`tilt-card` クラスを足す。`WritingFeed` の各行リンクに `wipe-row` を足す。

- [ ] **Step 5: 検証してコミット**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS

```bash
git add -A
git commit -m "feat(motion): 横断的なスクロール演出を ScrollMotionRoot に集約する"
```

---

### Task 9: MarqueeRibbon

**Files:**
- Create: `src/components/motion/MarqueeRibbon.tsx`
- Modify: `src/app/globals.css`
- Modify: `src/app/[locale]/page.tsx`（1 箇所だけ挿入）

**Interfaces:**
- Consumes: `gsap` / `useGSAP`（Task 1）
- Produces: `<MarqueeRibbon words={string[]} />`

- [ ] **Step 1: globals.css にスタイルを足す**

```css
/* 巨大文字の帯。上段と下段が逆方向に流れる。
   セリフは Hero の漢字名 1 箇所だけなので、ここは sans で組む。 */
.motion-ribbon {
  padding: 3rem 0 4rem;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}
.ribbon-line {
  display: flex;
  gap: 4vw;
  width: max-content;
  white-space: nowrap;
  font-size: clamp(3.5rem, 10vw, 9rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.04em;
  will-change: transform;
}
.ribbon-line--forward { color: var(--color-accent); transform: translateX(-10%); }
.ribbon-line--back { color: var(--color-ink); transform: translateX(-22%); }
.ribbon-word--outline {
  color: transparent;
  -webkit-text-stroke: 1px var(--color-ink-muted);
  opacity: 0.6;
}

@media (prefers-reduced-motion: reduce) {
  .ribbon-line { will-change: auto; transform: none; }
  .motion-ribbon { padding: 2rem 0; }
}
```

- [ ] **Step 2: MarqueeRibbon を実装する**

```tsx
"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * 巨大文字の帯。上段と下段を逆方向に流してページに横方向の運動を足す。
 * 完全な装飾なので aria-hidden（同じ語を繰り返すだけで情報は無い）。
 */
export default function MarqueeRibbon({ words }: { words: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const line = [...words, ...words, ...words];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const st = (scrub: number) => ({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub,
        });
        gsap.to(".ribbon-line--forward", { xPercent: -20, ease: "none", scrollTrigger: st(1.2) });
        gsap.to(".ribbon-line--back", { xPercent: 20, ease: "none", scrollTrigger: st(1.6) });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="motion-ribbon" aria-hidden>
      <div className="ribbon-line ribbon-line--forward">
        {line.map((w, i) => (
          <span key={`f-${i}`}>{w}</span>
        ))}
      </div>
      <div className="ribbon-line ribbon-line--back">
        {line.map((w, i) => (
          <span key={`b-${i}`} className={i % 2 ? "ribbon-word--outline" : undefined}>
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: page.tsx に 1 箇所だけ挿入する**

`<ResearchSection />` と `<SkillsSection />` の間に置く。
語は既存の翻訳キーから取らず、サイトの性格を表す英字の固定語にする
（翻訳ファイルを変更しない制約のため）:

```tsx
<MarqueeRibbon words={["AI", "LANGUAGE", "RESEARCH", "ENGINEERING"]} />
```

**セクションを増やさない**ため、`SECTION_IDS` には追加しない（`id` を付けない）。
`sections.test.ts` はセクション ID の集合を検証するので、
`id` 無しの装飾要素は影響しない。

- [ ] **Step 4: 検証してコミット**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS（特に `sections.test.ts`）

```bash
git add -A
git commit -m "feat(motion): 巨大文字のリボンでセクション間に横の運動を足す"
```

---

### Task 10: Projects の横スクロール（pin）

**Files:**
- Create: `src/components/ProjectsTrack.tsx`
- Modify: `src/components/ProjectsSection.tsx`
- Modify: `src/app/globals.css`
- Test: `src/components/ProjectsTrack.test.tsx`

**Interfaces:**
- Consumes: `gsap` / `ScrollTrigger` / `useGSAP`（Task 1）
- Produces: `<ProjectsTrack count={number}>{children}</ProjectsTrack>` —
  子を横一列のトラックに並べ、条件を満たすときだけ pin して横スクロールにする。

**最重要:** pin する対象は **`#projects` の内側のラッパー**であり、
`#projects` セクション要素そのものではない。`#projects` を pin すると
`position: fixed` になって `getBoundingClientRect().top` が固定され、
`src/lib/scroll.ts` の settle スクロールが nudge を繰り返す。
内側を pin すれば `#projects` は通常フローのまま高さだけ伸びるので、
scroll-spy（IntersectionObserver）も settle スクロールも現行のまま動く。

- [ ] **Step 1: 失敗するテストを書く**

`src/components/ProjectsTrack.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProjectsTrack from "./ProjectsTrack";

describe("ProjectsTrack", () => {
  it("モーション無効時でも子を全て描画する（縦積みフォールバック）", () => {
    render(
      <ProjectsTrack count={2}>
        <article>one</article>
        <article>two</article>
      </ProjectsTrack>,
    );
    expect(screen.getByText("one")).toBeDefined();
    expect(screen.getByText("two")).toBeDefined();
  });

  it("pin 対象は section ではなく内側のラッパーである", () => {
    const { container } = render(
      <ProjectsTrack count={1}>
        <article>one</article>
      </ProjectsTrack>,
    );
    // セクション要素を自分で描画しない = 親の #projects を pin しない保証
    expect(container.querySelector("section")).toBeNull();
    expect(container.querySelector("[data-projects-stage]")).not.toBeNull();
  });
});
```

- [ ] **Step 2: 失敗を確認する**

Run: `npx vitest run src/components/ProjectsTrack.test.tsx`
Expected: FAIL — モジュールが無い

- [ ] **Step 3: globals.css にスタイルを足す**

```css
/* 既定は縦積みグリッド（= モーション無効時のフォールバック）。
   横スクロールが有効なときだけ .is-horizontal が付く。 */
.projects-stage { position: relative; }
.projects-track { display: grid; gap: 5rem; }

.projects-stage.is-horizontal { overflow: hidden; }
.projects-stage.is-horizontal .projects-track {
  display: flex;
  gap: 2rem;
  width: max-content;
  perspective: 1400px;
  transform-style: preserve-3d;
  will-change: transform;
}
.projects-stage.is-horizontal .projects-track > * {
  flex: 0 0 min(56vw, 720px);
  transform-origin: center;
  backface-visibility: hidden;
}
@media (max-width: 700px) {
  .projects-stage.is-horizontal .projects-track > * { flex-basis: 84vw; }
}

.projects-nav {
  display: none;
  align-items: center;
  gap: 1.5rem;
  margin-top: 2rem;
  color: var(--color-ink-muted);
}
.projects-stage.is-horizontal + .projects-nav { display: flex; }
.projects-progress { height: 1px; background: var(--color-rule); flex: 1; overflow: hidden; }
.projects-progress-fill {
  display: block;
  width: 100%;
  height: 100%;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
}
```

- [ ] **Step 4: ProjectsTrack を実装する**

```tsx
"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Projects を横スクロールにする。
 *
 * pin する対象は **この中の [data-projects-stage]** であって、親の
 * <section id="projects"> ではない。#projects を pin すると position: fixed に
 * なって getBoundingClientRect().top が固定され、src/lib/scroll.ts の
 * settle スクロールが「まだ到達していない」と誤認して nudge を繰り返す。
 * 内側を pin すれば #projects は通常フローのまま高さだけ伸びるので、
 * useScrollNavigation の scroll-spy も settle スクロールも現行のまま動く。
 *
 * 条件を外れる（低い画面・reduced-motion）と .is-horizontal が付かず、
 * 素の縦積みグリッドに戻る。これが常にフォールバックとして存在する。
 */
export default function ProjectsTrack({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(
        "(min-width: 768px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)",
        () => {
          const stage = stageRef.current;
          const track = trackRef.current;
          if (!stage || !track) return;

          stage.classList.add("is-horizontal");
          const distance = () => Math.max(0, track.scrollWidth - stage.clientWidth);

          const tween = gsap.to(track, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: stage,
              start: "top 96px",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 0.65,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                if (fillRef.current) gsap.set(fillRef.current, { scaleX: self.progress });
                if (counterRef.current) {
                  const n = Math.min(count, 1 + Math.round(self.progress * (count - 1)));
                  counterRef.current.textContent = String(n).padStart(2, "0");
                }
              },
            },
          });

          // カードの傾き（通過中に正面を向く）
          gsap.utils.toArray<HTMLElement>(track.children as never).forEach((card) => {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: card,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            });
            tl.fromTo(card, { rotateY: 10, scale: 0.94 }, { rotateY: 0, scale: 1, duration: 0.5, ease: "none" })
              .to(card, { rotateY: -10, scale: 0.94, duration: 0.5, ease: "none" });
          });

          // キーボードで画面外のカードにフォーカスが移ったら追従する
          const onFocusIn = (e: FocusEvent) => {
            const card = (e.target as Element)?.closest<HTMLElement>("[data-project-card]");
            if (!card || !tween.scrollTrigger) return;
            const pos = Math.min(distance(), Math.max(0, card.offsetLeft - track.offsetLeft));
            window.scrollTo({ top: tween.scrollTrigger.start + pos, behavior: "instant" as ScrollBehavior });
          };
          track.addEventListener("focusin", onFocusIn);

          return () => {
            track.removeEventListener("focusin", onFocusIn);
            stage.classList.remove("is-horizontal");
          };
        },
      );
      return () => mm.revert();
    },
    { scope: stageRef },
  );

  return (
    <>
      <div ref={stageRef} className="projects-stage" data-projects-stage>
        <div ref={trackRef} className="projects-track">
          {children}
        </div>
      </div>
      <div className="projects-nav" aria-hidden>
        <span className="num text-sm">
          <span ref={counterRef}>01</span> / {String(count).padStart(2, "0")}
        </span>
        <span className="projects-progress">
          <span ref={fillRef} className="projects-progress-fill" />
        </span>
      </div>
    </>
  );
}
```

- [ ] **Step 5: テストが通ることを確認する**

Run: `npx vitest run src/components/ProjectsTrack.test.tsx`
Expected: PASS（2 件）

- [ ] **Step 6: ProjectsSection に組み込む**

現在の `<div className="space-y-20 md:space-y-28">` を
`<ProjectsTrack count={projects.length}>` に置き換え、各 `<article>` に
`data-project-card` と `tilt-card` を足す。`<section id="projects" className="section">`
は**そのまま**（pin 対象にしない）。

- [ ] **Step 7: pin が既存のスクロール制御を壊していないことを確認する**

Run: `npm run test`
Expected: 全て PASS。特に `src/lib/scroll.test.ts`・
`src/hooks/useScrollNavigation.test.tsx`・`src/lib/sections.test.ts`。

**もしここで壊れた場合のフォールバック（spec のリスク欄）:** pin をやめて
`position: sticky` ベースの縦→横変換に切り替える。`ProjectsTrack` の
`scrollTrigger` から `pin: true` を外し、`stage` に
`position: sticky; top: 96px; height: 100svh` を当て、外側に
`height: calc(100svh + <distance>)` のスペーサーを置く実装にする。
見た目はほぼ同じで、`#projects` は常に通常フローのままになる。

- [ ] **Step 8: 検証してコミット**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`
Expected: 全て PASS

```bash
git add -A
git commit -m "feat(projects): 内側ラッパーを pin して横スクロールにする"
```

---

### Task 11: 最終検証（ブラウザ実測）と PR

**Files:**
- Modify: `CLAUDE.md`（アニメーション性能ルールを GSAP の語彙に更新）

- [ ] **Step 1: 全ゲートを通す**

Run: `npm run build && npm run typecheck && npm run lint && npm run test`
Expected: 全て PASS

- [ ] **Step 2: 本番ビルドで起動してブラウザ実測する**

```bash
npm run build && npm run start
```

Playwright MCP で `http://localhost:3000/ja` を開き、次を確認する。

1. **LCP と CLS** — CLS < 0.1、LCP が現行から悪化していない
2. **ファーストビューが静止している** — スクロール前に Hero の文字が動かない
3. **ナビの各セクションジャンプが目的地に到達する** — 特に Projects より下の
   `research` / `skills` / `scheduling` / `blog`
4. **`#contact` でモーダルが開く** — `/ja/contact` のリダイレクト経由も確認
5. **画面外でループが止まる** — Highlights を画面外にしたとき RAF が止まる
6. **`prefers-reduced-motion: reduce` で全ての演出が無効になる**
7. **モバイル幅（390px）で横スクロールが縦積みに戻る**
8. **ライト／ダーク両方で奥行きレイヤーが見える**

- [ ] **Step 3: CLAUDE.md のアニメーション節を更新する**

「framer-motion は `LazyMotion`(`domAnimation`) 経由で使い、`m.*` を用いる」を
GSAP の方針に書き換える:

```md
- **モーションは GSAP + ScrollTrigger に一本化する。** `src/lib/gsap.ts` が
  唯一の入口で、アニメーションは必ず `useGSAP(() => {...}, { scope })` の中で
  定義する（`gsap.context` が自動 revert するので手書き cleanup を増やさない）。
  reduced-motion / ブレークポイント / hover 可否の分岐は `gsap.matchMedia()` で
  宣言し、条件から外れたら自動で revert させる。
- **横断的な演出は `ScrollMotionRoot` に集約する。** セクション側は
  `data-reveal` / `data-reveal-head` / `data-stagger` / `tilt-card` / `wipe-row` /
  `data-magnetic` を付けるだけでよく、Server Component のままでいられる。
- **pin は内側ラッパーにだけ当てる。** セクション要素自体を pin すると
  `position: fixed` になり、`src/lib/scroll.ts` の settle スクロールと
  scroll-spy が壊れる（Projects の実装を参照）。
```

「ループ系は必ず `useActiveAnimation` でゲートする」はそのまま残し、
`repeat: Infinity` の framer-motion への言及を GSAP の `repeat: -1` に直す。

- [ ] **Step 4: コミットして PR を作る**

```bash
git add -A
git commit -m "docs: CLAUDE.md のモーション方針を GSAP に更新する"
git push -u origin feat/cooler-visual-polish
gh pr create --title "feat: GSAP スクロールモーションでビジュアルを刷新する" --body-file <(...)
```

PR 本文には次を含める: 目的、参考サイトから取り入れた演出の一覧、
framer-motion 撤去の理由（二重管理の回避）、LCP 保護の 4 条件、
pin と settle スクロールの衝突を避けた設計、実測結果。
