/**
 * テキストを 1 文字ずつ span に割る。**サーバー側で静的に**行うので、
 * 初期 HTML の時点で分割済みのテキストが入っている。
 *
 * これが LCP 保護の要: クライアントでテキストを差し替えないため、
 * LCP 要素の内容は最初から最後まで同一になる（CLAUDE.md の
 * 「LCP テキストは LCP 計測ウィンドウ中に差し替えない」を満たす）。
 * 併せて、初期 transform を当てない（ScrollMotionRoot が gsap.to で
 * スクロール時にだけ変形させる）ので、ファーストビューの描画は
 * 分割前とピクセル等価になる。
 *
 * アクセシビリティ: 分割した文字列は aria-hidden にし、読み上げ名は
 * **呼び出し側が親要素の aria-label で与える**。sr-only の複製テキストを
 * 併置する手もあるが、それだと textContent が「梁梁震震」のように重複し、
 * 見出しをコピーしたときに壊れた文字列が取れてしまう。
 */
export default function KineticHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {Array.from(text).map((ch, i) => (
        <span className="kinetic-letter" key={`${ch}-${i}`}>
          {ch === " " || ch === "　" ? " " : ch}
        </span>
      ))}
    </span>
  );
}
