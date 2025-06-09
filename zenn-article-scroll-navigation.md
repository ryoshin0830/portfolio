# Next.jsでSEO対応しながらスクロール連動ページ遷移を実装する

## はじめに

モダンなWebサイトでは、ユーザー体験を向上させるために様々なナビゲーション手法が採用されています。その中でも「スクロール連動でのページ遷移」は、ユーザーにとって直感的で自然な操作感を提供できる優れた手法です。

しかし、SEO対策を考慮すると、各セクションが独立したURLを持つ必要があり、これとスクロール連動ナビゲーションを両立させることは技術的な課題となります。

本記事では、Next.jsとFramer Motionを使用して、**SEOに配慮しながらスクロール連動ページ遷移**を実装する方法を詳しく解説します。

## 要件整理

### 📋 基本要件

1. **SEO対策**: 各セクションが独立したURL（`/about`, `/projects`等）を持つ
2. **国際化対応**: 多言語サイトでの動作（`/ja/about`, `/en/projects`等）
3. **オーバースクロール検知**: ページ最下部到達後の追加スクロールで次のセクションに遷移
4. **双方向ナビゲーション**: 上下両方向のスクロールでページ遷移
5. **視覚的フィードバック**: ユーザーに分かりやすいUIアニメーション

### 🎯 技術的課題

- **ハッシュルーティングとSEOの両立**: 通常のハッシュ（`#section`）では検索エンジンに適切にインデックスされない
- **オーバースクロール検知**: ブラウザによって異なるスクロール挙動への対応
- **パフォーマンス**: 頻繁なスクロールイベントの最適化
- **UX**: ユーザーが意図しない遷移を防ぐ仕組み

## 技術選定

### 🛠️ 使用技術

- **Next.js 15**: App Routerとi18n対応
- **Framer Motion**: スムーズなアニメーション
- **TypeScript**: 型安全性の確保
- **next-intl**: 国際化対応

### 📦 主要なライブラリ

```json
{
  "next": "^15.3.3",
  "framer-motion": "^11.x",
  "next-intl": "^3.x",
  "lucide-react": "^0.x"
}
```

## 実装アーキテクチャ

### 🏗️ ディレクトリ構造

```
src/
├── app/
│   └── [locale]/
│       ├── layout.tsx          # 共通レイアウト
│       ├── page.tsx            # ホームページ
│       ├── about/page.tsx      # Aboutページ
│       ├── projects/page.tsx   # Projectsページ
│       └── ...
├── components/
│   ├── ScrollableLayout.tsx    # スクロール機能を提供
│   └── OverScrollIndicator.tsx # UI表示コンポーネント
├── hooks/
│   └── useScrollNavigation.ts  # スクロール検知ロジック
└── messages/
    ├── ja.json                 # 日本語翻訳
    ├── en.json                 # 英語翻訳
    └── zh.json                 # 中国語翻訳
```

## 核心実装

### 1. スクロール検知フック

```typescript
// src/hooks/useScrollNavigation.ts
"use client";

import { useEffect, useCallback, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

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
      
      // ページ底部・上部の検知
      const isCurrentlyAtBottom = scrollY + innerHeight >= scrollHeight - 1;
      const isCurrentlyAtTop = scrollY <= 1;
      
      if (isCurrentlyAtBottom && !isAtBottom) {
        isAtBottom = true;
        isAtTop = false;
      } else if (isCurrentlyAtTop && !isAtTop) {
        isAtTop = true;
        isAtBottom = false;
      } else if (!isCurrentlyAtBottom && !isCurrentlyAtTop) {
        isAtBottom = false;
        isAtTop = false;
        wheelDeltaY = 0;
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
        
        if (wheelDeltaY > 300) {
          const currentSection = getCurrentSection();
          const nextSection = getNextSection(currentSection);
          
          if (nextSection !== undefined) {
            isNavigating = true;
            
            setTimeout(() => {
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
        
        if (wheelDeltaY > 300) {
          const currentSection = getCurrentSection();
          const previousSection = getPreviousSection(currentSection);
          
          if (previousSection !== undefined) {
            isNavigating = true;
            
            setTimeout(() => {
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

    // パフォーマンス最適化
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
```

### 2. 視覚的フィードバックコンポーネント

```typescript
// src/components/OverScrollIndicator.tsx
"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OverScrollIndicatorProps {
  isVisible: boolean;
  progress: number;
  direction: 'up' | 'down';
  targetSectionName?: string;
}

const OverScrollIndicator = ({ 
  isVisible, 
  progress, 
  direction, 
  targetSectionName 
}: OverScrollIndicatorProps) => {
  const t = useTranslations('nav');
  
  const isGoingUp = direction === 'up';
  const ArrowIcon = isGoingUp ? ChevronUp : ArrowRight;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* プログレスバー */}
          <motion.div
            className={`fixed left-0 right-0 z-50 ${
              isGoingUp ? 'top-0' : 'bottom-0'
            }`}
            initial={{ opacity: 0, y: isGoingUp ? -20 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isGoingUp ? -20 : 20 }}
            transition={{ duration: 0.3 }}
          >
            <div className={`relative h-2 bg-gradient-to-r ${
              isGoingUp 
                ? 'from-green-500/20 to-emerald-500/20' 
                : 'from-blue-500/20 to-purple-500/20'
            } backdrop-blur-sm`}>
              <motion.div
                className={`h-full shadow-lg ${
                  isGoingUp 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}
                style={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
          </motion.div>

          {/* 中央メッセージ */}
          <motion.div
            className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${
              isGoingUp ? 'top-20' : 'bottom-20'
            }`}
            initial={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: isGoingUp ? -20 : 20 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
          >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ 
                    y: isGoingUp ? [0, 8, 0] : [0, -8, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <ArrowIcon size={24} className={isGoingUp ? "text-green-500" : "text-blue-500"} />
                </motion.div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {targetSectionName ? (
                      <>
                        {isGoingUp ? t('scrollToPrevious') : t('scrollToNext')} 
                        <span className={`font-semibold ${
                          isGoingUp ? 'text-green-500' : 'text-blue-500'
                        }`}>
                          {t(targetSectionName)}
                        </span>
                      </>
                    ) : (
                      isGoingUp ? 'Going back...' : 'Continue scrolling...'
                    )}
                  </p>
                  {/* パルス効果 */}
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          isGoingUp ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1, repeat: Infinity, delay }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 完了時のバースト効果 */}
          {progress >= 1 && (
            <motion.div className="fixed inset-0 pointer-events-none z-40">
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute w-4 h-4 rounded-full ${
                    isGoingUp 
                      ? 'bg-gradient-to-r from-green-400 to-emerald-400' 
                      : 'bg-gradient-to-r from-blue-400 to-purple-400'
                  }`}
                  style={{ left: '50%', top: '50%' }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 8) * 100,
                    y: Math.sin((i * Math.PI * 2) / 8) * 100,
                  }}
                  transition={{
                    duration: 0.8,
                    ease: "easeOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default OverScrollIndicator;
```

### 3. レイアウト統合

```typescript
// src/components/ScrollableLayout.tsx
"use client";

import { ReactNode } from 'react';
import { useScrollNavigation } from '@/hooks/useScrollNavigation';
import OverScrollIndicator from './OverScrollIndicator';

interface ScrollableLayoutProps {
  children: ReactNode;
}

const ScrollableLayout = ({ children }: ScrollableLayoutProps) => {
  const { overScrollState, nextSection, previousSection } = useScrollNavigation();

  const targetSection = overScrollState.direction === 'up' ? previousSection : nextSection;

  return (
    <div className="relative min-h-screen">
      {children}
      <OverScrollIndicator 
        isVisible={overScrollState.isVisible}
        progress={overScrollState.progress}
        direction={overScrollState.direction}
        targetSectionName={targetSection}
      />
    </div>
  );
};

export default ScrollableLayout;
```

### 4. ページでの使用

```typescript
// src/app/[locale]/about/page.tsx
import dynamic from "next/dynamic";
import ScrollableLayout from "@/components/ScrollableLayout";

const AboutSection = dynamic(() => import("@/components/AboutSection"), {
  loading: () => <div />,
});

export default function AboutPage() {
  return (
    <ScrollableLayout>
      <AboutSection />
    </ScrollableLayout>
  );
}
```

## SEO対策

### 🔍 メタデータの動的生成

```typescript
// src/app/[locale]/layout.tsx
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const lang = ["en", "zh"].includes(locale) ? locale : "ja";

  const metaByLocale: Record<string, { title: string; description: string }> = {
    ja: {
      title: "梁震（りょう しん）| AI研究者・起業家・日本語教師",
      description: "京都大学博士課程・株式会社EastLinker代表取締役。外国語教育学とAI技術を融合した研究と開発を行っています。",
    },
    en: {
      title: "Ryo Shin | AI Researcher, Entrepreneur & Japanese Teacher",
      description: "Official portfolio of Ryo Shin, PhD student at Kyoto University and CEO of EastLinker Inc.",
    },
    // ... 他の言語
  };

  const selected = metaByLocale[lang];

  return {
    ...selected,
    robots: "index, follow",
    openGraph: {
      type: "website",
      locale: lang === "ja" ? "ja_JP" : lang === "en" ? "en_US" : "zh_CN",
      url: "https://example.com",
      title: selected.title,
      description: selected.description,
    },
    alternates: {
      canonical: "https://example.com",
      languages: {
        ja: "/ja",
        en: "/en",
        zh: "/zh",
      },
    },
  };
}
```

### 📄 サイトマップ生成

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://example.com';
  const locales = ['ja', 'en', 'zh'];
  const sections = ['', 'about', 'research', 'skills', 'projects', 'gallery'];

  return locales.flatMap(locale =>
    sections.map(section => ({
      url: `${baseUrl}/${locale}${section ? `/${section}` : ''}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: section === '' ? 1.0 : 0.8,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}${section ? `/${section}` : ''}`])
        ),
      },
    }))
  );
}
```

## パフォーマンス最適化

### ⚡ 最適化のポイント

1. **requestAnimationFrame**: スクロールイベントの処理を最適化
2. **passive: true**: イベントリスナーのパフォーマンス向上
3. **動的インポート**: コンポーネントの遅延読み込み
4. **デバウンス処理**: 連続イベントの制御

```typescript
// スクロールイベントの最適化例
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
```

## ブラウザ対応と注意点

### 🌐 対応状況

- **デスクトップ**: Chrome, Firefox, Safari, Edge
- **モバイル**: iOS Safari, Android Chrome
- **オーバースクロール**: タッチデバイスとトラックパッド

### ⚠️ 注意点

1. **アクセシビリティ**: キーボードナビゲーションの併用
2. **モバイル対応**: タッチイベントとの整合性
3. **ブラウザ差異**: スクロール挙動の違いへの対応

## まとめ

本記事では、Next.jsでSEO対応とスクロール連動ナビゲーションを両立する実装方法を解説しました。

### ✅ 実現できたこと

- **SEO対応**: 各ページが独立したURLを持ち、検索エンジンに適切にインデックス
- **UX向上**: 直感的なスクロール操作でのページ遷移
- **国際化**: 多言語サイトでの動作
- **アニメーション**: Framer Motionによる滑らかな視覚的フィードバック

### 🚀 応用可能性

この手法は、ポートフォリオサイトだけでなく、企業サイトやランディングページなど、ストーリー性のあるコンテンツ構成のWebサイトに広く応用できます。

ユーザー体験とSEOを両立させた現代的なWebサイト構築の参考になれば幸いです。

---

**参考リンク**

- [Next.js App Router](https://nextjs.org/docs/app)
- [Framer Motion](https://www.framer.com/motion/)
- [next-intl](https://next-intl-docs.vercel.app/)

**完全なソースコード**

実装の詳細については、[GitHubリポジトリ](https://github.com/example/scroll-navigation-demo)をご参照ください。