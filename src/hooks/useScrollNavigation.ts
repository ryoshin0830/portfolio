"use client";

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const SECTION_ORDER = ['', 'about', 'research', 'skills', 'projects', 'gallery'];

export function useScrollNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [overScrollState, setOverScrollState] = useState({
    isVisible: false,
    progress: 0,
    direction: 'down' as 'up' | 'down',
    isNavigating: false,
  });

  const getCurrentSection = useCallback((): string => {
    const segments = pathname.split('/').filter(Boolean);
    // segments[0] = locale, segments[1] = section
    const routeSegment = segments.length > 1 ? segments[1] : '';
    return routeSegment;
  }, [pathname]);

  const getNextSection = useCallback((current: string): string | undefined => {
    const currentIndex = SECTION_ORDER.indexOf(current);
    return currentIndex !== -1 && currentIndex < SECTION_ORDER.length - 1 
      ? SECTION_ORDER[currentIndex + 1]
      : undefined;
  }, []);

  const getPreviousSection = useCallback((current: string): string | undefined => {
    const currentIndex = SECTION_ORDER.indexOf(current);
    return currentIndex > 0 
      ? SECTION_ORDER[currentIndex - 1]
      : undefined;
  }, []);

  const navigateToSection = useCallback((section: string) => {
    // パスからロケールを直接抽出（より確実な方法）
    const segments = pathname.split('/').filter(Boolean);
    const currentLocale = segments[0] || 'ja'; // デフォルトは日本語
    
    // パスから抽出したロケールを使用
    const newPath = `/${currentLocale}${section ? `/${section}` : ''}`;
    router.push(newPath);
  }, [router, pathname]);

  useEffect(() => {
    let isNavigating = false;
    let navigationTimeout: NodeJS.Timeout;
    let isAtBottom = false;
    let isAtTop = false;
    let wheelDeltaY = 0;
    let lastTouchY = 0;
    let touchStartY = 0;

    const handleScroll = () => {
      if (isNavigating) return;

      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      
      // ページ底部に到達したかチェック（1px の余裕を持たせる）
      const isCurrentlyAtBottom = scrollY + innerHeight >= scrollHeight - 1;
      // ページ上部に到達したかチェック
      const isCurrentlyAtTop = scrollY <= 1;
      
      if (isCurrentlyAtBottom && !isAtBottom) {
        isAtBottom = true;
        isAtTop = false;
        console.log('Reached bottom of page');
      } else if (isCurrentlyAtTop && !isAtTop) {
        isAtTop = true;
        isAtBottom = false;
        console.log('Reached top of page');
      } else if (!isCurrentlyAtBottom && !isCurrentlyAtTop) {
        isAtBottom = false;
        isAtTop = false;
        wheelDeltaY = 0; // リセット
        setOverScrollState({ isVisible: false, progress: 0, direction: 'down', isNavigating: false });
      }
    };

    // PC用のwheelイベントハンドラ
    const handleWheel = (event: WheelEvent) => {
      handleScrollGesture(event.deltaY);
    };

    // モバイル用のtouchイベントハンドラ
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        touchStartY = event.touches[0].clientY;
        lastTouchY = touchStartY;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isNavigating || event.touches.length !== 1) return;

      const currentTouchY = event.touches[0].clientY;
      const deltaY = lastTouchY - currentTouchY; // 正数で下向き、負数で上向き
      lastTouchY = currentTouchY;

      // モバイルでのオーバースクロール検知強化
      const { scrollY, innerHeight } = window;
      const { scrollHeight } = document.documentElement;
      
      const isCurrentlyAtBottom = scrollY + innerHeight >= scrollHeight - 5;
      const isCurrentlyAtTop = scrollY <= 5;

      // ページの境界でのタッチジェスチャーのみ処理
      if ((isCurrentlyAtBottom && deltaY > 0) || (isCurrentlyAtTop && deltaY < 0)) {
        // タッチの移動量が十分な場合のみ処理（モバイル用に感度調整）
        if (Math.abs(deltaY) > 1) {
          handleScrollGesture(deltaY * 2); // モバイル用に係数を調整
        }
      }
    };

    const handleTouchEnd = () => {
      // タッチ終了時にリセット
      lastTouchY = 0;
      touchStartY = 0;
    };

    // 共通のスクロールジェスチャー処理
    const handleScrollGesture = (deltaY: number) => {
      if (isNavigating) return;

      // 底部での下スクロール（次のセクション）
      if (isAtBottom && deltaY > 0) {
        const currentSection = getCurrentSection();
        const nextSection = getNextSection(currentSection);
        
        // 次のセクションが存在する場合のみ処理
        if (nextSection !== undefined) {
          wheelDeltaY += deltaY;
          const progress = Math.min(wheelDeltaY / 300, 1);
          
          setOverScrollState({
            isVisible: true,
            progress: progress,
            direction: 'down',
            isNavigating: false,
          });
          
          console.log('Down scroll - delta:', wheelDeltaY, 'Progress:', progress);
          
          if (wheelDeltaY > 300) {
            isNavigating = true;
            
            setOverScrollState({
              isVisible: true,
              progress: 1,
              direction: 'down',
              isNavigating: true,
            });
            
            console.log('Navigating to next:', nextSection);
            
            clearTimeout(navigationTimeout);
            navigationTimeout = setTimeout(() => {
              navigateToSection(nextSection);
              
              setTimeout(() => {
                isNavigating = false;
                isAtBottom = false;
                wheelDeltaY = 0;
                setOverScrollState({ isVisible: false, progress: 0, direction: 'down', isNavigating: false });
              }, 1000);
            }, 800);
          }
        }
      }
      // 上部での上スクロール（前のセクション）
      else if (isAtTop && deltaY < 0) {
        const currentSection = getCurrentSection();
        const previousSection = getPreviousSection(currentSection);
        
        // 前のセクションが存在する場合のみ処理
        if (previousSection !== undefined) {
          wheelDeltaY += Math.abs(deltaY);
          const progress = Math.min(wheelDeltaY / 300, 1);
          
          setOverScrollState({
            isVisible: true,
            progress: progress,
            direction: 'up',
            isNavigating: false,
          });
          
          console.log('Up scroll - delta:', wheelDeltaY, 'Progress:', progress);
          
          if (wheelDeltaY > 300) {
            isNavigating = true;
            
            setOverScrollState({
              isVisible: true,
              progress: 1,
              direction: 'up',
              isNavigating: true,
            });
            
            console.log('Navigating to previous:', previousSection);
            
            clearTimeout(navigationTimeout);
            navigationTimeout = setTimeout(() => {
              navigateToSection(previousSection);
              
              setTimeout(() => {
                isNavigating = false;
                isAtTop = false;
                wheelDeltaY = 0;
                setOverScrollState({ isVisible: false, progress: 0, direction: 'up', isNavigating: false });
              }, 1000);
            }, 800);
          }
        }
      }
    };

    // スクロールイベントの最適化（throttle処理）
    let ticking = false;
    const optimizedScrollHandler = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    // PC用イベントリスナー
    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    // モバイル用タッチイベントリスナー
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', optimizedScrollHandler);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      clearTimeout(navigationTimeout);
    };
  }, [getCurrentSection, getNextSection, getPreviousSection, navigateToSection]);

  return {
    currentSection: getCurrentSection(),
    nextSection: getNextSection(getCurrentSection()),
    previousSection: getPreviousSection(getCurrentSection()),
    navigateToSection,
    overScrollState,
  };
}