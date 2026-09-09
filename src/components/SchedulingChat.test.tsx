import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
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
const setMessages = vi.fn();
let mockMessages: Array<{
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
}> = [];

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: mockMessages,
    sendMessage,
    setMessages,
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

const fetchMock = vi.fn();

beforeEach(() => {
  sendMessage.mockClear();
  setMessages.mockClear();
  fetchMock.mockReset();
  mockMessages = [];
  // 既定は「初期提案の取得に成功」。個別テストで上書きする。
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        timezone: "Asia/Tokyo",
        slots: [
          { start: "2026-09-09T10:00:00+09:00", end: "2026-09-09T11:00:00+09:00", label: "10:00" },
        ],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  vi.stubGlobal("fetch", fetchMock);
});

// vitest.config に globals:true が無いため Testing Library の自動 cleanup が
// 登録されない。各テスト後に明示的にアンマウントして DOM の蓄積（同一ボタンの
// 重複描画 → getByRole の multiple match）を防ぐ。
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
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

describe("SchedulingChat — クイック返信（クライアント描画）", () => {
  const quickReplies = ja.scheduling.chatQuickReplies;

  function initialProposal() {
    return [
      {
        id: "initial-proposal",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "直近の空き枠です。\n\n- 9/9 (水) 10:00 - 11:00" }],
      },
    ];
  }

  it("初回提案には翻訳ファイル由来のクイック返信を描画する", () => {
    mockMessages = initialProposal();
    renderChat();

    for (const reply of quickReplies) {
      expect(screen.getByRole("button", { name: reply.label })).toBeTruthy();
    }
  });

  it("クイック返信のクリックで label ではなく text が送信される", () => {
    mockMessages = initialProposal();
    renderChat();

    fireEvent.click(screen.getByRole("button", { name: quickReplies[0].label }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ text: quickReplies[0].text });
  });

  it("アシスタントの応答がまだ無いときは描画しない", () => {
    mockMessages = [{ id: "u1", role: "user" as const, parts: [{ type: "text" as const, text: "こんにちは" }] }];
    renderChat();

    expect(screen.queryByRole("button", { name: quickReplies[0].label })).toBeNull();
  });
});

describe("SchedulingChat — 応答が途中で切れたとき", () => {
  // Vercel の関数タイムアウトでストリームが殺されると HTTP は 200 のまま無言で
  // 終わり、本文の無いアシスタントメッセージだけが残る。useChat の error は
  // 立たないので、以前は「延々と待って何も出てこない」行き止まりになっていた。
  const truncated = () => [
    { id: "u1", role: "user" as const, parts: [{ type: "text" as const, text: "週末に1時間" }] },
    { id: "a1", role: "assistant" as const, parts: [{ type: "text" as const, text: "" }] },
  ];

  it("本文が空のまま終わったらエラーとリトライを出す", () => {
    mockMessages = truncated();
    renderChat();

    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByRole("button", { name: ja.scheduling.chatRetry })).toBeTruthy();
  });

  it("リトライで直前のユーザー発話を再送する", () => {
    mockMessages = truncated();
    renderChat();

    fireEvent.click(screen.getByRole("button", { name: ja.scheduling.chatRetry }));

    expect(sendMessage).toHaveBeenCalledWith({ text: "週末に1時間" });
  });

  it("本文が SUGGEST 行だけの応答は「途中で切れた」扱いにしない", () => {
    // truncated 判定を SUGGEST 除去後のテキストで行うと、提案だけの応答が
    // 空本文に見えて誤ってエラーバナーが出る。判定は生テキストで行う。
    mockMessages = [assistantMsg("SUGGEST: 30分で十分 | 夜の枠がいい")];
    renderChat();

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "30分で十分" })).toBeTruthy();
  });

  it("本文があるときはエラーを出さない", () => {
    mockMessages = [assistantMsg("候補はこちらです。")];
    renderChat();

    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("SchedulingChat — 初回表示（LLM を経由しない）", () => {
  it("初回は LLM ではなく /api/schedule/initial-slots を叩く", async () => {
    renderChat();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/schedule/initial-slots");
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("取得した枠を日付+時刻の Markdown としてアシスタントメッセージに注入する", async () => {
    renderChat();

    await waitFor(() => expect(setMessages).toHaveBeenCalled());

    const injected = setMessages.mock.calls[0][0] as Array<{
      role: string;
      parts: Array<{ type: string; text: string }>;
    }>;
    expect(injected).toHaveLength(1);
    expect(injected[0].role).toBe("assistant");
    const text = injected[0].parts.map((part) => part.text).join("");
    expect(text).toContain(ja.scheduling.chatInitialLead);
    expect(text).toContain("- 9/9 (水) 10:00 - 11:00");
  });

  it("日を跨ぐ終端は 24:00 と表記する（00:00 にしない）", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          timezone: "Asia/Tokyo",
          slots: [
            { start: "2026-09-08T23:00:00+09:00", end: "2026-09-09T00:00:00+09:00", label: "23:00" },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    renderChat();

    await waitFor(() => expect(setMessages).toHaveBeenCalled());

    const injected = setMessages.mock.calls[0][0] as Array<{
      parts: Array<{ type: string; text: string }>;
    }>;
    expect(injected[0].parts.map((p) => p.text).join("")).toContain("23:00 - 24:00");
  });

  it("空きが 0 件なら空き無しの案内を出す", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ timezone: "Asia/Tokyo", slots: [] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    renderChat();

    await waitFor(() => expect(setMessages).toHaveBeenCalled());

    const injected = setMessages.mock.calls[0][0] as Array<{
      parts: Array<{ type: string; text: string }>;
    }>;
    expect(injected[0].parts.map((p) => p.text).join("")).toContain(ja.scheduling.chatReplyNone);
  });

  it("取得に失敗したらエラーとリトライを出し、メッセージは注入しない", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "upstream_error" }), { status: 502 }),
    );
    renderChat();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());

    expect(screen.getByRole("button", { name: ja.scheduling.chatRetry })).toBeTruthy();
    expect(setMessages).not.toHaveBeenCalled();
  });

  it("リトライで初期提案を取り直す", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "upstream_error" }), { status: 502 }),
    );
    renderChat();
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: ja.scheduling.chatRetry }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

describe("SchedulingChat — LLM 提案のクイック返信（SUGGEST 行）", () => {
  it("SUGGEST 行は本文に出さず、チップとして描画する", () => {
    mockMessages = [assistantMsg("候補はこちらです。\nSUGGEST: 30分で十分 | 夜の枠がいい")];
    const { container } = renderChat();

    expect(container.textContent).not.toContain("SUGGEST");
    expect(screen.getByRole("button", { name: "30分で十分" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "夜の枠がいい" })).toBeTruthy();
  });

  it("SUGGEST 由来のチップはその文字列をそのまま送信する", () => {
    mockMessages = [assistantMsg("候補はこちらです。\nSUGGEST: 30分で十分 | 夜の枠がいい")];
    renderChat();

    fireEvent.click(screen.getByRole("button", { name: "夜の枠がいい" }));

    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith({ text: "夜の枠がいい" });
  });

  it("SUGGEST が無い LLM 応答ではチップを出さない", () => {
    mockMessages = [assistantMsg("承知しました。お名前を教えてください。")];
    renderChat();

    for (const reply of ja.scheduling.chatQuickReplies) {
      expect(screen.queryByRole("button", { name: reply.label })).toBeNull();
    }
  });
});
