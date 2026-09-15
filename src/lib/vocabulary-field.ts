/**
 * 背景の「語彙空間」を作る。奥行きの違う 4 層の点群と、最近傍リンク。
 *
 * このサイトの主題は ことば そのもの（応用言語学 × 機械学習）で、本人の
 * 研究は語の難易度を埋め込み空間で測る類のもの。既存の VocabScatter
 * （語彙プロファイラーの Word2Vec 散布図）と同じ視覚語彙——点と最近傍
 * リンク——を背景に広げたのがこれで、サイト全体が一つの系統に揃う。
 *
 * **文字は置かない。** 背景に語を並べると、前景の本文と「読もうとする」
 * 知覚を奪い合ってしまい、マスクや不透明度で薄めても根本的に解決しない。
 * 点なら読む対象にならないので、前景の可読性を削らずに密度を出せる。
 *
 * 座標は割合で持つ:
 *  - x: 0..1（描画幅に対する割合）
 *  - y: 0..1（**タイル**の高さに対する割合。描画側はタイルを 2 枚縦に
 *    並べて、スクロールに合わせて剰余で巻き戻す＝無限に流れる）
 *
 * 生成は固定シードの疑似乱数なので、実行のたびに同じ結果になる
 * （SSR とクライアントで一致し、テストもできる）。
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

export type FieldPoint = { x: number; y: number; r: number };

/** points 配列への添字の組。 */
export type FieldLink = { a: number; b: number };

export type FieldLayer = {
  /** 0 = 最奥、1 = 最前。大きさと濃さを決める。 */
  depth: number;
  /**
   * スクロール量に対する移動係数。層ごとに大きく変えることが視差の本体で、
   * ここが近いと「動いているのに奥行きが見えない」ことになる。
   */
  rate: number;
  opacity: number;
  points: FieldPoint[];
  links: FieldLink[];
};

const LAYER_SPECS = [
  // depth, rate, opacity, 点数, クラスタ数, 半径の下限/上限
  { depth: 0, rate: 0.06, opacity: 0.3, count: 110, clusters: 9, r: [0.9, 1.6] },
  { depth: 0.35, rate: 0.16, opacity: 0.4, count: 70, clusters: 7, r: [1.5, 2.4] },
  { depth: 0.7, rate: 0.34, opacity: 0.5, count: 46, clusters: 6, r: [2.4, 3.6] },
  { depth: 1, rate: 0.62, opacity: 0.68, count: 26, clusters: 5, r: [3.4, 5.2] },
] as const;

/**
 * クラスタを作ってその周りに散らす。一様乱数だとただの砂嵐になり、
 * 「意味の近さで集まっている」という埋め込み空間の見え方にならない。
 */
function buildPoints(
  rand: () => number,
  count: number,
  clusters: number,
  rMin: number,
  rMax: number,
): FieldPoint[] {
  const centers = Array.from({ length: clusters }, () => ({
    x: rand(),
    y: rand(),
  }));

  return Array.from({ length: count }, (_, i) => {
    // 2 割は散り玉。全部がクラスタに属すると整いすぎる。
    const stray = i % 5 === 0;
    if (stray) {
      return {
        x: rand(),
        y: rand(),
        r: rMin + rand() * (rMax - rMin),
      };
    }
    const c = centers[i % clusters];
    // 中心寄りに寄せるため乱数を 2 乗する
    const spread = 0.16;
    const dx = (rand() - 0.5) * 2;
    const dy = (rand() - 0.5) * 2;
    return {
      x: Math.min(1, Math.max(0, c.x + dx * Math.abs(dx) * spread)),
      y: Math.min(1, Math.max(0, c.y + dy * Math.abs(dy) * spread)),
      r: rMin + rand() * (rMax - rMin),
    };
  });
}

/**
 * 各「起点」から最も近い数点へリンクを張る。VocabScatter が描いている
 * 「問い合わせ語とその最近傍」そのもの。
 *
 * `maxDistance` を超える相手には張らない。点がまばらな層では「最近傍」
 * でも画面の端から端まで離れていることがあり、そのまま引くと本文を
 * 斜めに横切る長い線になって騒がしくなる。近い者どうしだけを結べば
 * 小さな星座がいくつかできて、意図した図に見える。
 */
export const MAX_LINK_DISTANCE = 0.17;

function buildLinks(
  points: FieldPoint[],
  anchors: number,
  perAnchor: number,
  maxDistance = MAX_LINK_DISTANCE,
): FieldLink[] {
  const links: FieldLink[] = [];
  const step = Math.max(1, Math.floor(points.length / anchors));
  const maxSq = maxDistance ** 2;

  for (let a = 0; a < points.length; a += step) {
    const near = points
      .map((p, i) => ({
        i,
        d: (p.x - points[a].x) ** 2 + (p.y - points[a].y) ** 2,
      }))
      .filter((n) => n.i !== a && n.d <= maxSq)
      .sort((x, y) => x.d - y.d)
      .slice(0, perAnchor);

    for (const n of near) links.push({ a, b: n.i });
  }
  return links;
}

export function buildLayers(seed = 20260915): FieldLayer[] {
  return LAYER_SPECS.map((spec, li) => {
    const rand = makeRandom(seed + li * 977);
    const points = buildPoints(
      rand,
      spec.count,
      spec.clusters,
      spec.r[0],
      spec.r[1],
    );
    // リンクは手前 2 層だけ。奥まで描くと線が多すぎて騒がしくなる。
    const links = spec.depth >= 0.7 ? buildLinks(points, 6, 2) : [];
    return {
      depth: spec.depth,
      rate: spec.rate,
      opacity: spec.opacity,
      points,
      links,
    };
  });
}

export const LAYERS: readonly FieldLayer[] = buildLayers();

/** タイルの高さ = ビューポート高 × これ。 */
export const TILE_RATIO = 1.5;
