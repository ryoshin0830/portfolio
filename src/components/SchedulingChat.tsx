"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { LuSparkles, LuSendHorizontal } from "react-icons/lu";

/**
 * AI ネイティブな会話型日程調整（クライアント）。
 *
 * Mastra エージェント（DeepSeek）を `useChat` 経由で叩く。応答は本物のトークン
 * ストリーミング（サーバーが /api/schedule/chat で UIMessage ストリームを返す）。
 * エージェントが find-slots / book-slot ツールを呼び、空き提案〜予約までを会話で行う。
 * カレンダーの中身はツールに渡らない（空き時刻のみ）＝漏洩しない。
 */
export default function SchedulingChat() {
  const t = useTranslations("scheduling");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/schedule/chat" }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const examples = useMemo(() => t.raw("chatExamples") as string[], [t]);

  const busy = status === "submitted" || status === "streaming";

  // 新規メッセージ／状態変化で最下部へ。
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    sendMessage({ text: clean });
  };

  // 各メッセージのテキストパートを連結（ツールパートは UI では伏せる）。
  const textOf = (m: (typeof messages)[number]) =>
    m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");

  // 最後がアシスタントでまだ本文が無い（＝考え中 or ツール実行中）か。
  const last = messages[messages.length - 1];
  const showThinking = busy && (!last || last.role === "user" || textOf(last).trim() === "");

  return (
    <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-bg)]">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 border-b border-[color:var(--color-rule-soft)] px-5 py-3">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white">
          <LuSparkles size={15} />
        </span>
        <span className="text-sm font-semibold tracking-tight">{t("aiLabel")}</span>
        <span className="meta ml-auto">{t("timezoneNote")}</span>
      </div>

      {/* 会話 */}
      <div ref={scrollRef} className="flex h-[26rem] flex-col gap-4 overflow-y-auto px-5 py-5">
        {/* 初回グリーティング（API を叩かず静的に） */}
        <div className="self-start">
          <div className="max-w-[80%] rounded-2xl bg-[color:var(--color-bg-soft)] px-4 py-2.5 text-[0.95rem] leading-relaxed text-[color:var(--color-ink)]">
            {t("chatGreeting")}
          </div>
        </div>

        {/* 例示プロンプト（会話開始前のみ） */}
        {messages.length === 0 && !busy && (
          <ul className="flex flex-wrap gap-2 self-start">
            {examples.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  onClick={() => submit(ex)}
                  className="rounded-full border border-[color:var(--color-rule)] px-3.5 py-2 text-sm text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        )}

        {messages.map((m) => {
          const text = textOf(m);
          if (!text) return null; // ツールのみのアシスタント中間メッセージは表示しない
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={isUser ? "self-end" : "self-start"}>
              <div
                className={
                  isUser
                    ? "ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-[color:var(--color-accent)] px-4 py-2.5 text-[0.95rem] leading-relaxed text-white"
                    : // アシスタントは Markdown 描画（太字・箇条書き）。bubble 内を詰めて整形。
                      "max-w-[80%] rounded-2xl bg-[color:var(--color-bg-soft)] px-4 py-2.5 text-[0.95rem] leading-relaxed text-[color:var(--color-ink)] [&>*]:m-0 [&>*+*]:mt-2 [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5"
                }
              >
                {isUser ? text : <ReactMarkdown>{text}</ReactMarkdown>}
              </div>
            </div>
          );
        })}

        {/* 思考／ツール実行インジケータ */}
        {showThinking && (
          <div className="self-start">
            <div className="flex items-center gap-2 rounded-2xl bg-[color:var(--color-bg-soft)] px-4 py-3 text-[color:var(--color-ink-soft)]">
              <span className="flex gap-1" aria-hidden>
                <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--color-ink-muted)] [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--color-ink-muted)] [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-[color:var(--color-ink-muted)]" />
              </span>
              <span className="text-sm">{t("chatThinking")}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="self-start">
            <div className="rounded-2xl bg-[color:var(--color-bg-soft)] px-4 py-2.5 text-sm text-[color:var(--color-ink-soft)]">
              {t("chatError")}
            </div>
          </div>
        )}
      </div>

      {/* 入力欄 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-[color:var(--color-rule-soft)] px-4 py-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
          placeholder={t("chatPlaceholder")}
          aria-label={t("chatPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[0.95rem] text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink-muted)]"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label={t("chatSend")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white transition-opacity disabled:opacity-40"
        >
          <LuSendHorizontal size={17} />
        </button>
      </form>
    </div>
  );
}
