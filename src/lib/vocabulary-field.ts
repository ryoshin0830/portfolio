/**
 * 背景の「語彙空間」に置く語と、その配置を決める。
 *
 * このサイトの主題は ことば そのもの（応用言語学 × 機械学習）で、
 * 本人は 北京 → 横浜 → 北京 → 京都 と三言語を行き来してきた。
 * なので背景は汎用的な粒子ではなく、**同じ概念の日本語・中国語・英語が
 * 寄り添って漂う空間**にしてある。語の選定も本人の研究領域と経歴から採る
 * （「橋」は名前の「梁」、「響き」は「震」に掛けてある）。
 *
 * 既存の VocabScatter（語彙プロファイラーの Word2Vec 散布図）と同じ語彙
 * ——点と最近傍リンク——を使うので、サイト全体で一つの視覚言語に揃う。
 *
 * 座標は 0..1 の割合で持ち、描画側が実サイズを掛ける。手置きなのは
 * 疑似乱数だと密度が均一になりすぎて「データ」に見えないため
 * （VocabScatter と同じ方針）。
 */

export type Triplet = {
  /** 日本語 */
  ja: string;
  /** 中国語 */
  zh: string;
  /** 英語 */
  en: string;
  /** 組の中心。0..1 の割合。 */
  x: number;
  y: number;
};

/**
 * 画面右寄りに置く。左カラムには名前とタグラインが来るので空ける。
 *
 * さらに Hero 右下の事実リスト（現職 / 学位 / 連絡先。おおよそ
 * x 0.66..0.96 × y 0.50..0.78）と、最下部の発信ティーザー（y > 0.80）も
 * 避けている。下半分は中央の空きカラム（x 0.45..0.62）に逃がす。
 */
export const TRIPLETS: readonly Triplet[] = [
  { ja: "ことば", zh: "词语", en: "word", x: 0.72, y: 0.09 },
  { ja: "意味", zh: "意义", en: "meaning", x: 0.92, y: 0.21 },
  { ja: "語彙", zh: "词汇", en: "vocabulary", x: 0.63, y: 0.28 },
  { ja: "難しさ", zh: "难度", en: "difficulty", x: 0.85, y: 0.36 },
  { ja: "声", zh: "声音", en: "voice", x: 0.95, y: 0.5 },
  { ja: "学ぶ", zh: "学习", en: "learn", x: 0.52, y: 0.46 },
  { ja: "橋", zh: "桥", en: "bridge", x: 0.48, y: 0.64 },
  { ja: "響き", zh: "回响", en: "resonance", x: 0.58, y: 0.77 },
] as const;

export type PlacedWord = {
  text: string;
  /** 三言語のどれか。描画側が字面の大きさを変えるのに使う。 */
  lang: "ja" | "zh" | "en";
  x: number;
  y: number;
};

export type PlacedTriplet = {
  words: [PlacedWord, PlacedWord, PlacedWord];
  /** 日本語を中心に、中国語・英語へ引く線。 */
  links: ReadonlyArray<{ x1: number; y1: number; x2: number; y2: number }>;
};

/**
 * 組ごとに散らし方の角度を変えて、機械的な整列に見えないようにする。
 * index から決めるので描画のたびに同じ（SSR とクライアントで一致する）。
 */
function spokeAngles(index: number): [number, number] {
  const base = (index * 2.4) % (Math.PI * 2);
  return [base, base + 2.1];
}

/**
 * 1 組を実座標に展開する。`radius` は組の広がり（px）。
 */
export function layoutTriplet(
  triplet: Triplet,
  index: number,
  width: number,
  height: number,
  radius: number,
): PlacedTriplet {
  const cx = triplet.x * width;
  const cy = triplet.y * height;
  const [a1, a2] = spokeAngles(index);

  const ja: PlacedWord = { text: triplet.ja, lang: "ja", x: cx, y: cy };
  const zh: PlacedWord = {
    text: triplet.zh,
    lang: "zh",
    x: cx + Math.cos(a1) * radius,
    y: cy + Math.sin(a1) * radius,
  };
  const en: PlacedWord = {
    text: triplet.en,
    lang: "en",
    x: cx + Math.cos(a2) * radius * 1.25,
    y: cy + Math.sin(a2) * radius * 1.25,
  };

  return {
    words: [ja, zh, en],
    links: [
      { x1: ja.x, y1: ja.y, x2: zh.x, y2: zh.y },
      { x1: ja.x, y1: ja.y, x2: en.x, y2: en.y },
    ],
  };
}
