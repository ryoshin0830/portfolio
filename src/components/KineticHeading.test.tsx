import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import KineticHeading from "./KineticHeading";

describe("KineticHeading", () => {
  it("1 文字ずつ span に割る", () => {
    const { container } = render(<KineticHeading text="梁震" />);
    const letters = container.querySelectorAll(".kinetic-letter");
    expect(letters).toHaveLength(2);
    expect(letters[0].textContent).toBe("梁");
    expect(letters[1].textContent).toBe("震");
  });

  it("空白を nbsp に置き換えて折り返しを防ぐ", () => {
    const { container } = render(<KineticHeading text="a b" />);
    const letters = container.querySelectorAll(".kinetic-letter");
    expect(letters).toHaveLength(3);
    expect(letters[1].textContent).toBe(" ");
  });

  it("テキストを重複させない（コピーしても壊れない）", () => {
    // sr-only の複製を併置すると textContent が「梁梁震震」になり、
    // 見出しをコピーしたときに壊れた文字列が取れてしまう。
    const { container } = render(<KineticHeading text="梁震" />);
    expect(container.textContent).toBe("梁震");
  });

  it("分割側は読み上げから隠す（1 文字ずつ読まれるのを防ぐ）", () => {
    // 読み上げ名は呼び出し側が親の aria-label で与える契約。
    const { container } = render(<KineticHeading text="梁震" />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
