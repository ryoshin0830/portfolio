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
