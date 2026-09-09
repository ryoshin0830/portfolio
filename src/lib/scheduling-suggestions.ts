/**
 * エージェント応答末尾のクイック返信マーカーを解析する純関数。
 *
 * 旧実装は instructions に 3 言語ぶんの Tailwind 付き `<a href="action:suggest">` を
 * ベタ書きし、毎ターン ~700 トークンの HTML を LLM に出力させていた（内容は固定）。
 * 代わりに `SUGGEST: a | b | c` の 1 行（~25 トークン）を出させ、文脈に応じた
 * 返信候補をクライアントでチップに描画する。
 *
 * 本文には絶対に出さない。ストリーミング中はこの行が途中まで届くので、マーカーの
 * 部分状態（"S" … "SUGGEST:"）も本文から取り除く。チップは非ストリーミング時のみ
 * 描画するため、途中段階で items が揺れても画面には出ない。
 */

const MARKER = "SUGGEST:";
/** 行頭（前置の空白は許容）のマーカー。全角コロンも受ける。 */
const MARKER_LINE_RE = /^[ \t]*SUGGEST[:：][ \t]*(.*)$/;
/** 返信候補の上限。これ以上は UI が横に溢れる。 */
const MAX_SUGGESTIONS = 4;

export interface ParsedSuggestions {
  /** 画面に出す本文（マーカー行を除去済み）。 */
  text: string;
  /** クイック返信の候補。マーカーが無ければ空。 */
  suggestions: string[];
}

/** "SUGGEST:" の途中まで（"S" … "SUGGEST:"）か。ストリーミング中の判定に使う。 */
function isPartialMarker(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return false;
  const normalized = trimmed.replace("：", ":");
  return normalized.length <= MARKER.length && MARKER.startsWith(normalized);
}

function splitItems(raw: string): string[] {
  return raw
    .split("|")
    .map((item) => item.trim())
    .filter((item) => item !== "")
    .slice(0, MAX_SUGGESTIONS);
}

export function parseSuggestions(text: string): ParsedSuggestions {
  const lines = text.split("\n");

  // 完成したマーカー行を後ろから探す。見つかったらその行だけを取り除き、
  // 後続の本文は残す（モデルが末尾以外に置いてしまった場合の保険）。
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const match = lines[i].match(MARKER_LINE_RE);
    if (!match) continue;
    const rest = [...lines.slice(0, i), ...lines.slice(i + 1)];
    return { text: rest.join("\n").trim(), suggestions: splitItems(match[1]) };
  }

  // マーカーがまだ完成していない（ストリーミング中）。最終行が綴りの途中なら隠す。
  const last = lines[lines.length - 1];
  if (lines.length > 0 && isPartialMarker(last)) {
    return { text: lines.slice(0, -1).join("\n").trim(), suggestions: [] };
  }

  return { text, suggestions: [] };
}
