import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import MotionProvider from "./MotionProvider";
import ja from "../../messages/ja.json";

// jsdom は Element.scrollTo を実装していない（SchedulingChat の自動スクロールが呼ぶ）。
Element.prototype.scrollTo = () => {};

/**
 * SchedulingChat の回帰テスト。
 *
 * 1) サジェストチップのリロードバグ（最重要）:
 *    AI 応答末尾の生 HTML `<a href="action:suggest" data-text="...">` は、修正前は
 *    react-markdown の defaultUrlTransform で href="" の <a> になりクリックでフル
 *    リロード→会話消失していた。修正後は <button> として描画され、クリックで
 *    useChat().sendMessage({text}) を呼ぶ。
 * 2) Markdown 時間枠リストからのスロットボタン生成。
 * 3) XSS サニタイズ（iframe/script/onerror/style 除去、正当な class 保持）。
 * 4) urlTransform 純関数の単体検証。
 */

// useChat をモックして、決め打ちの messages / sendMessage(spy) を返す。
const sendMessage = vi.fn();
let mockMessages: Array<{
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
}> = [];

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage,
    status: "ready" as const,
    error: undefined,
  }),
}));

// DefaultChatTransport は new されるだけなので軽量スタブで十分。
vi.mock("ai", () => ({
  DefaultChatTransport: class {},
}));

import SchedulingChat, {
  schedulingUrlTransform,
  schedulingSanitizeSchema,
} from "./SchedulingChat";

function renderChat() {
  return render(
    <NextIntlClientProvider locale="ja" messages={ja}>
      <MotionProvider>
        <SchedulingChat />
      </MotionProvider>
    </NextIntlClientProvider>,
  );
}

function assistantMsg(text: string) {
  return { id: "a1", role: "assistant" as const, parts: [{ type: "text" as const, text }] };
}

beforeEach(() => {
  sendMessage.mockClear();
  mockMessages = [];
});

// vitest.config に globals:true が無いため Testing Library の自動 cleanup が
// 登録されない。各テスト後に明示的にアンマウントして DOM の蓄積（同一ボタンの
// 重複描画 → getByRole の multiple match）を防ぐ。
afterEach(() => {
  cleanup();
});

describe("schedulingUrlTransform（単体）", () => {
  it("action:suggest はそのまま素通し（href が空にならない＝チップ判定に使える）", () => {
    expect(schedulingUrlTransform("action:suggest")).toBe("action:suggest");
  });

  it("javascript: は空文字に落とす（XSS 防御）", () => {
    expect(schedulingUrlTransform("javascript:alert(1)")).toBe("");
  });

  it("通常の https URL はそのまま", () => {
    expect(schedulingUrlTransform("https://x.com")).toBe("https://x.com");
  });

  it("ハッシュ・相対 URL はそのまま", () => {
    expect(schedulingUrlTransform("#foo")).toBe("#foo");
    expect(schedulingUrlTransform("/relative/path")).toBe("/relative/path");
  });
});

describe("schedulingSanitizeSchema（スキーマ構成）", () => {
  it("href プロトコルに action を許可している", () => {
    expect(schedulingSanitizeSchema.protocols.href).toContain("action");
  });

  it("a 要素に className / dataText / href を許可している（チップの class 保持に必要）", () => {
    expect(schedulingSanitizeSchema.attributes.a).toContain("className");
    expect(schedulingSanitizeSchema.attributes.a).toContain("dataText");
    expect(schedulingSanitizeSchema.attributes.a).toContain("href");
  });
});

describe("SchedulingChat — サジェストチップ（リロードバグ回帰）", () => {
  it("チップは <button> として描画され、リロードを起こす <a href=''> が存在しない", () => {
    mockMessages = [
      assistantMsg(
        'どうぞ！\n\n<a href="action:suggest" data-text="ランチに行きましょう！" class="rounded-full border px-4 py-2">ランチ</a>',
      ),
    ];
    const { container } = renderChat();

    // チップが button として存在する
    const btn = screen.getByRole("button", { name: "ランチに行きましょう！" });
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe("BUTTON");
    expect(btn.getAttribute("type")).toBe("button");

    // リロードを起こすアンカー（空 href の <a>）が一切無い
    expect(container.querySelector('a[href=""]')).toBeNull();
    // action:suggest を持つ <a> も描画されていない（button に置き換わっている）
    expect(container.querySelector('a[href="action:suggest"]')).toBeNull();
  });

  it("チップクリックで sendMessage が data-text の値で1回呼ばれる", () => {
    mockMessages = [
      assistantMsg(
        '<a href="action:suggest" data-text="ランチに行きましょう！" class="rounded-full">ランチ</a>',
      ),
    ];
    renderChat();

    const btn = screen.getByRole("button", { name: "ランチに行きましょう！" });
    fireEvent.click(btn);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ text: "ランチに行きましょう！" });
  });

  it("チップに付与された class（rounded-full）が保持される", () => {
    mockMessages = [
      assistantMsg(
        '<a href="action:suggest" data-text="はい" class="rounded-full border px-4 py-2">はい</a>',
      ),
    ];
    renderChat();
    const btn = screen.getByRole("button", { name: "はい" });
    expect(btn.className).toContain("rounded-full");
  });
});

describe("SchedulingChat — Markdown 時間枠スロット", () => {
  it("Markdown の時間枠リストからスロットボタンが生成され、aria-label が付く", () => {
    mockMessages = [
      assistantMsg(
        [
          "ご希望に近い空き枠です。",
          "",
          "- 6/21 (Sun) 17:00 - 18:00",
          "- 6/21 (Sun) 18:00 - 19:00",
          "- 6/22 (Mon) 10:00 - 11:00",
        ].join("\n"),
      ),
    ];
    renderChat();

    const slotBtn = screen.getByRole("button", { name: "6/21 (Sun) 17:00 - 18:00" });
    expect(slotBtn.tagName).toBe("BUTTON");
    expect(slotBtn.getAttribute("aria-label")).toBe("6/21 (Sun) 17:00 - 18:00");
  });

  it("スロットボタンのクリックで sendMessage が rawText 相当で呼ばれる", () => {
    mockMessages = [
      assistantMsg(
        ["候補です。", "", "- 6/21 (Sun) 17:00 - 18:00", "- 6/22 (Mon) 10:00 - 11:00"].join("\n"),
      ),
    ];
    renderChat();

    const slotBtn = screen.getByRole("button", { name: "6/22 (Mon) 10:00 - 11:00" });
    fireEvent.click(slotBtn);

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ text: "6/22 (Mon) 10:00 - 11:00" });
  });
});

describe("SchedulingChat — XSS サニタイズ", () => {
  it("iframe / script は DOM に存在せず、onerror / style 属性も剥がれるが、正当な class は残る", () => {
    mockMessages = [
      assistantMsg(
        [
          "テスト",
          '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
          "<script>alert(1)</script>",
          '<img src=x onerror="alert(2)">',
          '<div style="position:fixed">x</div>',
          '<a href="action:suggest" data-text="ok" class="rounded-full">ok</a>',
        ].join("\n\n"),
      ),
    ];
    const { container } = renderChat();

    // iframe / script は除去される
    expect(container.querySelector("iframe")).toBeNull();
    expect(container.querySelector("script")).toBeNull();

    // img は残ってもよいが onerror は剥がれている
    const img = container.querySelector("img");
    if (img) {
      expect(img.getAttribute("onerror")).toBeNull();
    }

    // div の style 属性は剥がれている
    const fixedDiv = Array.from(container.querySelectorAll("div")).find(
      (d) => d.textContent === "x",
    );
    if (fixedDiv) {
      expect(fixedDiv.getAttribute("style")).toBeNull();
    }

    // 一方で、正当なチップ（class 保持）は生きている
    const btn = screen.getByRole("button", { name: "ok" });
    expect(btn.className).toContain("rounded-full");
  });
});
