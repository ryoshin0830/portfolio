import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import MotionProvider from "./MotionProvider";
import ContactModal from "./ContactModal";
import ja from "../../messages/ja.json";

/**
 * ContactModal のテスト。
 *
 * 「すべての連絡先」は以前ページ最下部の ContactSection へのアンカーで、
 * スクロールが目的地に届かないバグがあった。現在は #contact ハッシュで
 * 開くモーダル。ハッシュとの同期・開閉・連絡先の表示を検証する。
 */

function renderModal() {
  return render(
    <NextIntlClientProvider locale="ja" messages={ja}>
      <MotionProvider>
        <ContactModal />
      </MotionProvider>
    </NextIntlClientProvider>
  );
}

function setHash(hash: string) {
  act(() => {
    window.history.replaceState(
      {},
      "",
      `${window.location.pathname}${hash}`
    );
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

describe("ContactModal", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/ja");
    document.body.innerHTML = "";
  });

  it("初期状態では表示されない", () => {
    renderModal();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hashchange (#contact) で開き、連絡先一覧を表示する", () => {
    renderModal();
    setHash("#contact");

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeTruthy();
    // 見出し（ja.json の contact.title）
    expect(screen.getByText(ja.contact.title)).toBeTruthy();
    // SocialLinks の代表的な連絡先が（可視ラベル付きで）表示されている
    expect(screen.getByText("GitHub")).toBeTruthy();
    expect(screen.getByText("LinkedIn")).toBeTruthy();
    expect(screen.getByText("WeChat")).toBeTruthy();
  });

  it("#contact 付きで着地した場合（旧 /{locale}/contact リダイレクト）マウント時に開く", () => {
    window.history.replaceState({}, "", "/ja#contact");
    renderModal();

    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("他のハッシュ（#blog 等）では開かない", () => {
    renderModal();
    setHash("#blog");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("閉じるボタンで閉じ、ハッシュを消す（再クリックで再度開ける）", async () => {
    renderModal();
    setHash("#contact");
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.click(screen.getByLabelText(ja.common.close));

    expect(window.location.hash).toBe("");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

    // ハッシュが消えているので同じリンクの再クリックで hashchange が再発火する
    setHash("#contact");
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("Escape キーで閉じる", async () => {
    renderModal();
    setHash("#contact");
    expect(screen.getByRole("dialog")).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(window.location.hash).toBe("");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
