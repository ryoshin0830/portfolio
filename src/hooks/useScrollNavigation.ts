"use client";

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";

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

  // セクションのIDリスト
  // DOM order on the page (page.tsx). Must include every section the nav links
  // to, in the order they appear, so the active-highlight observer tracks them
  // all (experience & contact were missing → never highlighted).
  const sectionIds = useMemo(
    () => [
      "hero",
      "about",
      "experience",
      "projects",
      "research",
      "skills",
      "blog",
      "contact",
    ],
    []
  );

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

  // ナビゲーションクリック後の処理を管理
  const handleNavigationEnd = useCallback(() => {
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  }, []);

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

  // 特定のセクションにスクロールする関数
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      isNavigatingRef.current = true;
      currentSectionRef.current = sectionId;
      setCurrentSection(sectionId);
      
      // 即座にURLを更新
      const newPath = sectionId === "hero" ? `/${locale}` : `/${locale}/${sectionId}`;
      window.history.replaceState(
        { ...window.history.state, as: newPath, url: newPath },
        "",
        newPath
      );
      
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      handleNavigationEnd();
    }
  }, [locale, handleNavigationEnd]);

  // 直接URLアクセス時の処理
  useEffect(() => {
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