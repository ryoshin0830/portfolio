"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

/**
 * Hero の粒子フィールドを読み込む薄いクライアント境界。
 *
 * three.js は重いので `ssr: false` の動的 import に隔離し、初期バンドルと
 * サーバーレンダリングの両方から外す（実測で First Load JS は 327 kB のまま
 * 変わらず、粒子は遅延チャンクに落ちている）。Hero のテキストは粒子が無くても
 * 完全に成立するので、読み込みプレースホルダも置かない（LCP を汚さない）。
 *
 * **狭い画面では読み込み自体を行わない。** モバイルの Hero は
 * 名前・肩書き・タグライン・連絡先が縦に詰まっていて粒子を置く余白が無く、
 * 小さく出しても文字の背後でノイズになるだけだった。描画を諦めるのではなく
 * import ごと止めることで、モバイル回線で ~450 kB を無駄に落とさずに済む。
 */
const HeroParticles = dynamic(() => import("./HeroParticles"), { ssr: false });

const WIDE = "(min-width: 768px)";

export default function HeroScene() {
  const { theme, mounted } = useTheme();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(WIDE);
    const sync = () => setWide(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  // ハイドレーション前は theme が確定していない（ThemeProvider は常に light
  // から始まる）。確定するまで描画しないことで、一瞬ライト配色で描いてから
  // ダークに塗り直す、というちらつきを避ける。
  if (!mounted || !wide) return null;

  return <HeroParticles dark={theme === "dark"} />;
}
