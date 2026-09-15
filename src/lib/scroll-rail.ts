/**
 * セクションとセクションの間の空白帯に流す「語彙空間の断面」を作る。
 *
 * このサイトの主題は ことば そのもの（応用言語学 × 機械学習）で、本人の
 * 研究は語の難易度を埋め込み空間で測る類のもの。既存の VocabScatter
 * （語彙プロファイラーの Word2Vec 散布図）と同じ視覚語彙——点と最近傍
 * リンク——を、横長の帯として切り出したのがこれ。
 *
 * **全面に敷く背景にはしない。** 画面全体を覆う装飾はどう薄めても必ず
 * 本文の裏に回り、可読性を削る。このサイトにはセクション間に 256px 規模の
 * 純粋な空白帯があるので、そこだけを舞台にする。本文の裏には一切入らず、
 * 帯が横長であることを活かして左右の動きを作れる。
 *
 * 座標は割合で持つ:
 *  - x: 0..1（**トラック**幅に対する割合。トラックは画面より広く、
 *    スクロールに応じて横に流れる）
 *  - y: 0..1（帯の高さに対する割合）
 *
 * 生成は固定シードの疑似乱数なので決定的（SSR と一致し、テストできる）。
 */

/** mulberry32。小さく、決定的で、分布が素直。 */
function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RailPoint = {
  x: number;
  y: number;
  r: number;
  /** アクセント色で描く「問い合わせ語」相当の点。 */
  accent: boolean;
};

/** points 配列への添字の組。 */
export type RailLink = { a: number; b: number };

export type Rail = {
  points: RailPoint[];
  links: RailLink[];
};

/**
 * リンクを張る上限距離（x 方向の割合）。帯は横に長いので、遠い点どうしを
 * 結ぶと帯を端から端まで貫く線になって落ち着かない。近い者だけを結べば
 * 小さな星座がいくつか並ぶ見え方になる。
 */
export const MAX_LINK_DX = 0.055;

/**
 * トラック幅 = 画面幅 × これ。1 より大きくないと、横に流したときに
 * 端が見えてしまう。
 */
export const TRACK_RATIO = 1.6;

export function buildRail(seed: number, count = 30): Rail {
  const rand = makeRandom(seed);

  const points: RailPoint[] = Array.from({ length: count }, (_, i) => {
    // x はおおむね等間隔に散らす。完全な乱数だと粗密が偏りすぎて、
    // 帯の一部が空っぽになる。
    const slot = (i + rand() * 0.8) / count;
    return {
      x: Math.min(1, Math.max(0, slot)),
      // 中央に寄せる。帯の上下端に貼り付くと切れて見える。
      y: 0.5 + (rand() - 0.5) * 0.62,
      r: 1.6 + rand() * 2.6,
      // 2 割ほどをアクセントにする。全部青いと図として騒がしい。
      accent: rand() < 0.2,
    };
  });

  const links: RailLink[] = [];
  for (let a = 0; a < points.length - 1; a++) {
    for (let b = a + 1; b < points.length; b++) {
      const dx = Math.abs(points[a].x - points[b].x);
      if (dx > MAX_LINK_DX) break; // x 昇順なので、離れたら以降も離れている
      links.push({ a, b });
    }
  }

  return { points, links };
}
