"use client";

import { useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown from "react-markdown";
import { LuSparkles, LuSendHorizontal } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";

const ListContext = createContext<"ul" | "ol">("ul");

/**
 * AI ネイティブな会話型日程調整（クライアント）。
 *
 * Mastra エージェント（DeepSeek）を `useChat` 経由で叩く。応答は本物のトークン
 * ストリーミング（サーバーが /api/schedule/chat で UIMessage ストリームを返す）。
 * エージェントが find-slots / book-slot ツールを呼び、空き提案〜予約までを会話で行う。
 * カレンダーの中身はブラウザに渡らない（パディング適用後の空き時刻のみ）＝漏洩しない。
 */
export default function SchedulingChat() {
  const t = useTranslations("scheduling");
  const locale = useLocale();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/schedule/chat" }),
    [],
  );
  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const busy = status === "submitted" || status === "streaming";

  // 新規メッセージ／状態変化で最下部へ。
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, status]);

  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && messages.length === 0) {
      initRef.current = true;
      sendMessage({ text: `PROPOSE_INITIAL_SLOTS_IN_${locale.toUpperCase()}` });
    }
  }, [messages.length, sendMessage, locale]);

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
    <div className="relative mx-auto flex h-[75dvh] max-h-[800px] min-h-[500px] w-full max-w-5xl flex-col overflow-hidden bg-white/70 shadow-[0_8px_40px_rgb(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-150 rounded-3xl border border-black/5 dark:border-white/10 dark:bg-[color:var(--color-bg)]/50">
      {/* ヘッダー */}
      <div className="absolute top-0 z-20 flex w-full items-center gap-3 border-b border-black/5 bg-white/60 px-6 py-4 backdrop-blur-md dark:border-white/5 dark:bg-black/60">
        <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-accent)] to-[color:var(--color-accent-hover)] text-white shadow-lg shadow-[color:var(--color-accent)]/20">
          <LuSparkles size={16} />
        </span>
        <span className="text-sm font-semibold tracking-tight">{t("aiLabel")}</span>
        <span className="meta ml-auto">{t("timezoneNote")}</span>
      </div>

      {/* 会話 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-28 pt-24 sm:px-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 custom-scrollbar">
        <div className="flex flex-col gap-6">
          <AnimatePresence initial={false}>
            {messages.map((m) => {
              const text = textOf(m);
              if (!text || text.startsWith("PROPOSE_INITIAL_SLOTS")) return null; // ツールのみのアシスタント中間メッセージや初期プロンプトは表示しない
              const isUser = m.role === "user";
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-sm bg-gradient-to-br from-[color:var(--color-accent)] to-[color:var(--color-accent-hover)] px-5 py-4 text-[0.95rem] leading-relaxed text-white shadow-lg shadow-[color:var(--color-accent)]/20"
                        : "w-full text-[0.95rem] leading-relaxed text-[color:var(--color-ink)] grid grid-cols-1 md:gap-x-8 items-start md:has-[ul]:grid-cols-[minmax(300px,38%)_1fr] lg:has-[ul]:grid-cols-[minmax(350px,35%)_1fr]"
                    }
                  >
                    {isUser ? text : (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="md:col-start-1 w-fit max-w-[90%] sm:max-w-[85%] md:max-w-full text-[0.95rem] text-[color:var(--color-ink)] leading-relaxed mb-4 last:mb-0 [&_strong]:font-semibold">
                              {children}
                            </p>
                          ),
                          ul: function MarkdownUl({ children, ...props }) {
                            return (
                              <ListContext.Provider value="ul">
                                <ul className="md:col-start-2 md:row-start-1 md:row-span-12 my-6 md:my-0 w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-0 list-none" {...props}>
                                  {children}
                                </ul>
                              </ListContext.Provider>
                            );
                          },
                          ol: function MarkdownOl({ children, ...props }) {
                            return (
                              <ListContext.Provider value="ol">
                                <ol className="md:col-start-1 w-fit max-w-[90%] sm:max-w-[85%] md:max-w-full text-[0.95rem] text-[color:var(--color-ink)] leading-relaxed mb-4 last:mb-0 list-decimal pl-5 [&_li]:my-1" {...props}>
                                  {children}
                                </ol>
                              </ListContext.Provider>
                            );
                          },
                          li: function MarkdownLi({ children, ...props }) {
                            const listType = useContext(ListContext);

                            if (listType === "ol") {
                              return <li className="my-0.5" {...props}>{children}</li>;
                            }

                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const extractText = (child: any): string => {
                              if (typeof child === "string" || typeof child === "number") return String(child);
                              if (Array.isArray(child)) return child.map(extractText).join("");
                              if (child && child.props && child.props.children) return extractText(child.props.children);
                              return "";
                            };
                            const rawText = extractText(children);

                            const timeSlotRegex = /^(?:\d{4}\/)?(\d{1,2}\/\d{1,2})\s*\((.+?)\)\s*(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})$/;
                            const match = rawText.match(timeSlotRegex);

                            if (match) {
                              const [, date, day, start, end] = match;
                              return (
                                <li className="m-0 p-0 h-full" {...props}>
                                  <button
                                    type="button"
                                    onClick={() => submit(rawText)}
                                    className="group relative flex w-full h-full flex-col justify-between overflow-hidden rounded-[1.25rem] border border-[color:var(--color-rule-soft)] bg-white/60 px-5 py-4 text-left shadow-sm backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[color:var(--color-accent)]/40 hover:bg-white hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] dark:border-white/5 dark:bg-white/5 dark:hover:border-[color:var(--color-accent)]/40 dark:hover:bg-white/10 dark:hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.05)]"
                                  >
                                    <div className="flex items-center justify-between w-full mb-3">
                                      <span className="text-[0.75rem] font-bold uppercase tracking-widest text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)] transition-colors duration-300">
                                        {date} <span className="opacity-70">({day})</span>
                                      </span>
                                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-bg-soft)] text-[color:var(--color-accent)] opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110 shadow-sm">
                                        <LuSendHorizontal size={14} className="translate-x-[1px]" />
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-2xl sm:text-3xl font-light tracking-tighter text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors duration-300">{start}</span>
                                      <span className="text-sm font-medium text-[color:var(--color-ink-muted)] px-1">-</span>
                                      <span className="text-lg sm:text-xl font-light tracking-tight text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)]/80 transition-colors duration-300">{end}</span>
                                    </div>
                                    <div className="absolute -right-8 -top-8 -z-10 h-24 w-24 rounded-full bg-[color:var(--color-accent)]/10 blur-2xl transition-all duration-700 group-hover:bg-[color:var(--color-accent)]/20 group-hover:scale-150" />
                                  </button>
                                </li>
                              );
                            }

                            return (
                              <li className="m-0 p-0 h-full" {...props}>
                                <button
                                  type="button"
                                  onClick={() => submit(rawText)}
                                  className="group flex w-full h-full items-center justify-between gap-4 rounded-[1.25rem] border border-[color:var(--color-rule-soft)] bg-white/60 px-5 py-4 text-left text-[0.95rem] font-medium text-[color:var(--color-ink)] shadow-sm backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-[color:var(--color-accent)]/40 hover:bg-white hover:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.1)] dark:border-[color:var(--color-rule-soft)] dark:bg-white/5 dark:hover:border-[color:var(--color-accent)]/40 dark:hover:bg-white/10 dark:hover:shadow-[0_12px_40px_-12px_rgba(255,255,255,0.05)]"
                                >
                                  <span className="leading-relaxed break-words min-w-0 flex-1">{children}</span>
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-bg-soft)] text-[color:var(--color-accent)] opacity-0 transition-all duration-500 group-hover:opacity-100 group-hover:scale-110 shadow-sm">
                                    <LuSendHorizontal size={14} className="translate-x-[1px]" />
                                  </span>
                                </button>
                              </li>
                            );
                          },
                        }}
                      >
                        {text}
                      </ReactMarkdown>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* 思考／ツール実行インジケータ */}
          {showThinking && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="self-start"
            >
              <div className="flex items-center gap-3 rounded-3xl rounded-tl-sm border border-[color:var(--color-rule-soft)] bg-white/80 px-5 py-3.5 text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md dark:border-[color:var(--color-rule-soft)] dark:bg-[color:var(--color-bg-soft)]/80">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)] opacity-60 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)] opacity-80 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)]" />
                </span>
                <span className="text-sm font-medium">{t("chatThinking")}</span>
              </div>
            </motion.div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start"
            >
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                {t("chatError")}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* 入力欄 */}
      <div className="absolute bottom-0 z-20 w-full border-t border-black/5 bg-white/70 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl dark:border-white/5 dark:bg-black/70">
        <div className="mx-auto max-w-3xl px-4 sm:px-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex items-center gap-2 rounded-full border border-[color:var(--color-rule)] bg-white p-1.5 shadow-sm transition-all focus-within:border-[color:var(--color-accent)] focus-within:ring-4 focus-within:ring-[color:var(--color-accent)]/10 dark:border-[color:var(--color-rule-soft)] dark:bg-[color:var(--color-bg)]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder={t("chatPlaceholder")}
              aria-label={t("chatPlaceholder")}
              className="min-w-0 flex-1 bg-transparent px-4 py-2 text-[0.95rem] text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink-muted)] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label={t("chatSend")}
              className="group mr-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--color-accent)] to-[color:var(--color-accent-hover)] text-white shadow-md transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none"
            >
              <LuSendHorizontal size={16} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
