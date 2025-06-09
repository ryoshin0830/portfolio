"use client";

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

interface SectionConfig {
  current: string;
  next?: string;
}

const SECTION_ORDER = ['', 'about', 'research', 'skills', 'projects', 'gallery'];

export function useScrollNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [overScrollState, setOverScrollState] = useState({
    isVisible: false,
    progress: 0,
    direction: 'down' as 'up' | 'down',
  });

  const getCurrentSection = useCallback((): string => {
    const segments = pathname.split('/').filter(Boolean);
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
    const newPath = `/${locale}${section ? `/${section}` : ''}`;
    router.push(newPath);
  }, [router, locale]);

  useEffect(() => {
    let isNavigating = false;
    let navigationTimeout: NodeJS.Timeout;
    let isAtBottom = false;
    let isAtTop = false;
    let wheelDeltaY = 0;

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
        setOverScrollState({ isVisible: false, progress: 0, direction: 'down' });
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (isNavigating) return;

      // 底部での下スクロール（次のセクション）
      if (isAtBottom && event.deltaY > 0) {
        wheelDeltaY += event.deltaY;
        const progress = Math.min(wheelDeltaY / 300, 1);
        
        setOverScrollState({
          isVisible: true,
          progress: progress,
          direction: 'down',
        });
        
        console.log('Down scroll - delta:', wheelDeltaY, 'Progress:', progress);
        
        if (wheelDeltaY > 300) {
          const currentSection = getCurrentSection();
          const nextSection = getNextSection(currentSection);
          
          if (nextSection !== undefined) {
            isNavigating = true;
            console.log('Navigating to next:', nextSection);
            
            clearTimeout(navigationTimeout);
            navigationTimeout = setTimeout(() => {
              navigateToSection(nextSection);
              
              setTimeout(() => {
                isNavigating = false;
                isAtBottom = false;
                wheelDeltaY = 0;
                setOverScrollState({ isVisible: false, progress: 0, direction: 'down' });
              }, 1000);
            }, 500);
          }
        }
      }
      // 上部での上スクロール（前のセクション）
      else if (isAtTop && event.deltaY < 0) {
        wheelDeltaY += Math.abs(event.deltaY);
        const progress = Math.min(wheelDeltaY / 300, 1);
        
        setOverScrollState({
          isVisible: true,
          progress: progress,
          direction: 'up',
        });
        
        console.log('Up scroll - delta:', wheelDeltaY, 'Progress:', progress);
        
        if (wheelDeltaY > 300) {
          const currentSection = getCurrentSection();
          const previousSection = getPreviousSection(currentSection);
          
          if (previousSection !== undefined) {
            isNavigating = true;
            console.log('Navigating to previous:', previousSection);
            
            clearTimeout(navigationTimeout);
            navigationTimeout = setTimeout(() => {
              navigateToSection(previousSection);
              
              setTimeout(() => {
                isNavigating = false;
                isAtTop = false;
                wheelDeltaY = 0;
                setOverScrollState({ isVisible: false, progress: 0, direction: 'up' });
              }, 1000);
            }, 500);
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

    window.addEventListener('scroll', optimizedScrollHandler, { passive: true });
    window.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', optimizedScrollHandler);
      window.removeEventListener('wheel', handleWheel);
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