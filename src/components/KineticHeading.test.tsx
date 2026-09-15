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

  it("読み上げ用に元のテキストを保持する", () => {
    const { container } = render(<KineticHeading text="梁 震" />);
    // 分割した側は aria-hidden、読み上げは元テキスト 1 つだけ
    expect(container.querySelector("[aria-hidden]")).not.toBeNull();
    expect(container.textContent).toContain("梁");
  });

  it("空白を nbsp に置き換えて折り返しを防ぐ", () => {
    const { container } = render(<KineticHeading text="a b" />);
    const letters = container.querySelectorAll(".kinetic-letter");
    expect(letters).toHaveLength(3);
    expect(letters[1].textContent).toBe(" ");
  });
});
