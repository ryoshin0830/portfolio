"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { SECTION_IDS } from "@/lib/sections";
import { scrollToElementSettled } from "@/lib/scroll";

interface TopSection {
  entry: IntersectionObserverEntry;
  top: number;
}

export function useScrollNavigation() {
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sectionsRef = useRef<{ id: string; element: HTMLElement }[]>([]);
  const isNavigatingRef = useRef(false);
  const [currentSection, setCurrentSection] = useState("hero");
  // Observer コールバックから読む現在値のミラー。state を直接 deps に入れると
  // セクションが切り替わるたびに observer 8 個を破棄・再作成してしまう。
  const currentSectionRef = useRef("hero");

  // セクションのIDリスト（単一ソースは src/lib/sections.ts）
  const sectionIds = useMemo(() => [...SECTION_IDS] as string[], []);

  // URLを更新する関数
  const updateURL = useCallback(
    (sectionId: string) => {
      // ナビゲーションクリックによる移動中はURL更新をスキップ
      if (isNavigatingRef.current) return;

      const newPath = sectionId === "hero" ? `/${locale}` : `/${locale}/${sectionId}`;
      const currentPath = window.location.pathname;

      // 現在のパスと異なる場合のみ更新
      if (newPath !== currentPath) {
        // Next.jsの内部状態を保持しながらURLを更新
        window.history.replaceState(
          { ...window.history.state, as: newPath, url: newPath },
          "",
          newPath
        );
      }
    },
    [locale]
  );

  // Intersection Observerのセットアップ
  useEffect(() => {
    // セクション要素を収集
    sectionsRef.current = sectionIds
      .map((id) => {
        const element = document.getElementById(id);
        return element ? { id, element } : null;
      })
      .filter((item): item is { id: string; element: HTMLElement } => item !== null);

    // Observerを作成
    const observerCallback: IntersectionObserverCallback = (entries) => {
      // 現在のビューポート内で最も上にあるセクションを検出
      let topSection: TopSection | null = null;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // entry に同梱されたスナップショットを使う（getBoundingClientRect を
          // コールバック内で呼ぶと強制リフローになる）
          const top = entry.boundingClientRect.top;

          // ビューポートの上半分にあるセクションを優先
          if (top <= window.innerHeight / 2) {
            if (!topSection || top > topSection.top) {
              topSection = { entry, top };
            }
          }
        }
      });

      // 最も適切なセクションを更新
      if (topSection !== null) {
        const sectionData = topSection as TopSection;
        const targetElement = sectionData.entry.target as HTMLElement;
        if (targetElement.id && targetElement.id !== currentSectionRef.current) {
          currentSectionRef.current = targetElement.id;
          setCurrentSection(targetElement.id);
          updateURL(targetElement.id);
        }
      }
    };

    observerRef.current = new IntersectionObserver(
      observerCallback,
      {
        root: null,
        rootMargin: "-20% 0px -70% 0px", // ビューポート上部で検知
        threshold: [0, 0.1, 0.5, 1.0],
      }
    );

    // 各セクションを監視
    sectionsRef.current.forEach(({ element }) => {
      observerRef.current?.observe(element);
    });

    // クリーンアップ
    return () => {
      observerRef.current?.disconnect();
    };
  }, [sectionIds, updateURL]);

  // 進行中の settle スクロールの中断関数（新しいスクロール開始時に前回を破棄）
  const cancelSettleRef = useRef<(() => void) | null>(null);

  // 特定のセクションにスクロールする関数
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      cancelSettleRef.current?.();
      isNavigatingRef.current = true;
      currentSectionRef.current = sectionId;
      setCurrentSection(sectionId);

      const applyURL = () => {
        const newPath =
          sectionId === "hero" ? `/${locale}` : `/${locale}/${sectionId}`;
        if (window.location.pathname !== newPath) {
          window.history.replaceState(
            { ...window.history.state, as: newPath, url: newPath },
            "",
            newPath
          );
        }
      };

      // 即座にURLを更新
      applyURL();

      // スクロール中に下方の遅延コンテンツ（WritingFeed の batch 表示など）が
      // 描画されると目標位置がずれるため、静止後に再調整する settle スクロール。
      // settle 中は scroll-spy の URL 更新を止め（isNavigatingRef）、到達時に
      // 目的セクションの URL を確定させる（最後の補正ジャンプの後は
      // IntersectionObserver が再発火せず、通過途中のセクションの URL が
      // 残ることがあるため）。ユーザー入力で中断されたときは scroll-spy に
      // そのまま主導権を返す。
      cancelSettleRef.current = scrollToElementSettled(element, {
        onDone: () => {
          currentSectionRef.current = sectionId;
          setCurrentSection(sectionId);
          applyURL();
          isNavigatingRef.current = false;
        },
        onCancel: () => {
          isNavigatingRef.current = false;
        },
      });
    }
  }, [locale]);

  // ページ内アンカー（例: Hero の #contact）にも settle スクロールを適用する。
  // ネイティブのアンカースクロールはクリック時点のレイアウトを基準にするため、
  // スクロール中のコンテンツ描画で目標がずれると手前のセクションで止まる。
  useEffect(() => {
    const onHashChange = () => {
      const id = window.location.hash.slice(1);
      if (!id) return;
      const element = document.getElementById(id);
      if (!element) return;
      cancelSettleRef.current?.();
      cancelSettleRef.current = scrollToElementSettled(element);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      cancelSettleRef.current?.();
    };
  }, []);

  // 直接URLアクセス時の処理（初回マウント時のみ）。
  //
  // Next.js App Router は history.replaceState をパッチしており、scroll-spy の
  // updateURL（replaceState）でも usePathname() が更新される。この effect を
  // pathname の変化のたびに実行すると、アンカーリンク（例: Hero の #contact）で
  // スムーズスクロール中に通過セクションへ URL が書き換わり、それを「直接 URL
  // アクセス」と誤認して scrollToSection が途中のセクション（about 等）へ
  // スクロールを乗っ取るループになる。直接アクセスの復元は初回のみで十分。
  const hasHandledInitialPathRef = useRef(false);
  useEffect(() => {
    if (hasHandledInitialPathRef.current) return;
    hasHandledInitialPathRef.current = true;

    const pathParts = pathname.split("/");
    const section = pathParts[pathParts.length - 1];

    // セクションIDが存在する場合はそこにスクロール
    if (section && sectionIds.includes(section)) {
      currentSectionRef.current = section;
      setCurrentSection(section);
      // ページ読み込み完了後にスクロール
      setTimeout(() => {
        scrollToSection(section);
      }, 100);
    } else if (section === locale || !section) {
      currentSectionRef.current = "hero";
      setCurrentSection("hero");
    }
  }, [pathname, scrollToSection, sectionIds, locale]);

  return {
    currentSection,
    scrollToSection,
    sectionIds,
  };
}