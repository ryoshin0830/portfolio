import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useScrollNavigation } from "@/hooks/useScrollNavigation";
import { SECTION_IDS } from "@/lib/sections";
import { IntersectionObserverStub } from "../../vitest.setup";

// usePathname / useParams を可変モックにする。Next.js App Router は
// history.replaceState をパッチしていて scroll-spy の URL 書き換えでも
// usePathname() が更新されるため、その挙動を navState + rerender で再現する。
const navState = vi.hoisted(() => ({
  pathname: "/ja",
  params: { locale: "ja" } as Record<string, string>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
  useParams: () => navState.params,
}));

/** scroll-spy の IntersectionObserver コールバックを手動発火する */
function fireIntersection(sectionId: string) {
  const observer = IntersectionObserverStub.instances.at(-1);
  expect(observer).toBeDefined();
  const target = document.getElementById(sectionId)!;
  const entry = {
    isIntersecting: true,
    boundingClientRect: { top: 10 },
    target,
  } as unknown as IntersectionObserverEntry;
  act(() => {
    observer!.callback([entry], observer as unknown as IntersectionObserver);
  });
}

describe("useScrollNavigation", () => {
  let scrollIntoViewSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    navState.pathname = "/ja";
    navState.params = { locale: "ja" };
    IntersectionObserverStub.instances.length = 0;
    document.body.innerHTML = SECTION_IDS.map(
      (id) => `<section id="${id}"></section>`
    ).join("");
    window.history.replaceState({}, "", "/ja");
    scrollIntoViewSpy = vi.spyOn(Element.prototype, "scrollIntoView");
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("初回マウント時、URL のセクション（直接アクセス）へスクロールする", () => {
    navState.pathname = "/ja/skills";
    window.history.replaceState({}, "", "/ja/skills");

    const { result } = renderHook(() => useScrollNavigation());

    expect(result.current.currentSection).toBe("skills");
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(
      document.getElementById("skills")
    );
  });

  it("初回マウント時、URL ハッシュのセクションへ補正スクロールする", () => {
    navState.pathname = "/ja";
    window.history.replaceState({}, "", "/ja#scheduling");

    const { result } = renderHook(() => useScrollNavigation());

    expect(result.current.currentSection).toBe("scheduling");
    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(
      document.getElementById("scheduling")
    );
    expect(window.location.pathname).toBe("/ja/scheduling");
    expect(window.location.hash).toBe("");
  });

  it("初回ハッシュ補正中は scroll-spy が手前のセクションを現在地にしない", () => {
    navState.pathname = "/ja";
    window.history.replaceState({}, "", "/ja#scheduling");

    const { result } = renderHook(() => useScrollNavigation());

    fireIntersection("skills");
    expect(result.current.currentSection).toBe("scheduling");
    expect(window.location.pathname).toBe("/ja");
    expect(window.location.hash).toBe("#scheduling");

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.currentSection).toBe("scheduling");
    expect(window.location.pathname).toBe("/ja/scheduling");
  });

  it("scroll-spy が URL を /{locale}/{section} に書き換える", () => {
    renderHook(() => useScrollNavigation());

    fireIntersection("about");

    expect(window.location.pathname).toBe("/ja/about");
  });

  it("scrollToSection は対象セクションへスクロールし URL を即時更新する", () => {
    const { result } = renderHook(() => useScrollNavigation());

    act(() => {
      result.current.scrollToSection("skills");
    });

    expect(window.location.pathname).toBe("/ja/skills");
    expect(result.current.currentSection).toBe("skills");
    expect(scrollIntoViewSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(
      document.getElementById("skills")
    );
  });

  // 回帰テスト: ナビクリックで research に到達したのに URL が /ja/projects の
  // まま残ったバグ。settle の最終補正ジャンプ後は IntersectionObserver が
  // 再発火しないことがあるため、settle 完了時に到達セクションの URL を確定する。
  it("ナビクリック後、settle 完了時に到達セクションの URL を確定する", () => {
    const { result } = renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });

    act(() => {
      result.current.scrollToSection("research");
    });
    expect(window.location.pathname).toBe("/ja/research");

    // settle 中は scroll-spy が通過セクションで発火しても URL を書き換えない
    fireIntersection("projects");
    expect(window.location.pathname).toBe("/ja/research");

    // settle 完了（jsdom ではスクロールが即座に静止する）
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(window.location.pathname).toBe("/ja/research");
    expect(result.current.currentSection).toBe("research");

    // settle 後は scroll-spy が再開する
    fireIntersection("projects");
    expect(window.location.pathname).toBe("/ja/projects");
  });

  it("scrollToSection('hero') は URL をロケールルートに戻す", () => {
    window.history.replaceState({}, "", "/ja/about");
    const { result } = renderHook(() => useScrollNavigation());

    act(() => {
      result.current.scrollToSection("hero");
    });

    expect(window.location.pathname).toBe("/ja");
  });

  // 回帰テスト: Hero の「すべての連絡先」(#contact) クリックで about に飛ばされたバグ。
  //
  // アンカーリンクによるスムーズスクロール中、scroll-spy が通過セクション
  // （about 等）で replaceState → usePathname() が更新される。このとき
  // 「直接 URL アクセス時の処理」effect が再実行されて scrollToSection が
  // 途中のセクションへスクロールを乗っ取ってはならない（初回マウント時のみ有効）。
  it("マウント後の pathname 変化（scroll-spy 由来）でスクロールを乗っ取らない", () => {
    const { rerender } = renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollIntoViewSpy.mockClear();

    // #contact へのスムーズスクロール中に about が交差 → URL が /ja/about に
    fireIntersection("about");
    expect(window.location.pathname).toBe("/ja/about");

    // Next.js が replaceState を検知して usePathname() が更新される
    navState.pathname = "/ja/about";
    rerender();
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // 「直接アクセス」と誤認した scrollIntoView（乗っ取り）が起きないこと
    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it("scroll-spy で複数セクションを通過しても乗っ取りが起きない", () => {
    const { rerender } = renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollIntoViewSpy.mockClear();

    for (const section of ["about", "experience", "projects", "blog"]) {
      fireIntersection(section);
      navState.pathname = `/ja/${section}`;
      rerender();
      act(() => {
        vi.advanceTimersByTime(500);
      });
    }

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    // 最終的に URL は到達セクションを指す
    expect(window.location.pathname).toBe("/ja/blog");
  });

  // ページ内アンカーのクリックは hashchange を発火する。
  // SECTION_IDS 以外の実在アンカーにも settle スクロールが適用されること。
  it("hashchange で非セクションのハッシュ先要素へスクロールする", () => {
    document.body.insertAdjacentHTML("beforeend", '<section id="highlights"></section>');
    renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollIntoViewSpy.mockClear();

    act(() => {
      window.history.replaceState({}, "", "/ja#highlights");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(scrollIntoViewSpy).toHaveBeenCalled();
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(
      document.getElementById("highlights")
    );
  });

  it("セクションへの hashchange は通常ナビと同じく URL と現在地を確定する", async () => {
    const { result } = renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollIntoViewSpy.mockClear();

    await act(async () => {
      window.history.replaceState({}, "", "/ja#scheduling");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(window.location.pathname).toBe("/ja/scheduling");
    expect(window.location.hash).toBe("");
    expect(scrollIntoViewSpy.mock.instances[0]).toBe(
      document.getElementById("scheduling")
    );
    expect(result.current.currentSection).toBe("scheduling");

    fireIntersection("skills");
    expect(result.current.currentSection).toBe("scheduling");
    expect(window.location.pathname).toBe("/ja/scheduling");
  });

  // ハッシュ駆動ダイアログ（#contact = ContactModal）は対象要素が無い。
  // ハンドラが落ちたりスクロールしたりしないこと。
  it("対象要素の無いハッシュ（#contact）では何もしない", () => {
    renderHook(() => useScrollNavigation());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    scrollIntoViewSpy.mockClear();

    act(() => {
      window.history.replaceState({}, "", "/ja#contact");
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });

    expect(scrollIntoViewSpy).not.toHaveBeenCalled();
  });

  it("すべてのセクションを IntersectionObserver で監視する", () => {
    renderHook(() => useScrollNavigation());

    const observer = IntersectionObserverStub.instances.at(-1)!;
    const observedIds = observer.observed.map((el) => el.id).sort();
    expect(observedIds).toEqual([...SECTION_IDS].sort());
  });
});
