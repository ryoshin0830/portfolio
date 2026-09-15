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
 * 読み上げは分割前の文字列 1 つだけを露出させ、分割側は aria-hidden にする
 * （1 文字ずつ読み上げられるのを防ぐ）。
 */
export default function KineticHeading({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {Array.from(text).map((ch, i) => (
          <span className="kinetic-letter" key={`${ch}-${i}`}>
            {ch === " " || ch === "　" ? " " : ch}
          </span>
        ))}
      </span>
    </span>
  );
}
