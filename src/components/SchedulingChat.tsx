"use client";

import { useCallback, useEffect, useMemo, useRef, useState, createContext, useContext } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { LuSparkles, LuSendHorizontal } from "react-icons/lu";
import { m, AnimatePresence } from "framer-motion";
import React from "react";

/**
 * `action:suggest` のような独自スキームの href を守るための urlTransform。
 *
 * react-markdown の既定 `defaultUrlTransform` は許可プロトコル
 * (`http(s)/irc(s)/mailto/xmpp`) 以外を空文字に落とす。`action:suggest` も
 * 弾かれて href="" になり、サジェストチップが `<a href="">` として描画され、
 * クリックで現在 URL へフルリロード → 会話履歴(useChat 状態)が消える、という
 * バグの原因になっていた。`action:` だけ素通しし、他は既定の安全化を維持する。
 */
export function schedulingUrlTransform(url: string): string {
  return url.startsWith("action:") ? url : defaultUrlTransform(url);
}

/**
 * AI(DeepSeek) が生成する生 HTML を `rehype-raw` で描画するため、XSS 面を
 * `rehype-sanitize` で塞ぐ。クイック返信チップに必要な要素・class・`data-text`・
 * `action:` href のみ許可し、`iframe`(srcdoc)/`script`/`style`/イベントハンドラ等は除去する。
 *
 * 注意: 既定スキーマの `a.className` は `data-footnote-backref` 値限定のタプルなので、
 * そのまま spread すると Tailwind class が剥がれる。className 系を一旦除いてから
 * 「全値許可」の `"className"` を入れ直す。
 */
const stripClassName = (
  list: readonly (string | [string, ...unknown[]])[] | undefined,
): (string | [string, ...unknown[]])[] =>
  (list ?? []).filter(
    (x) => !(x === "className" || (Array.isArray(x) && x[0] === "className")),
  );

const allowClassName = ["className"] as const;

export const schedulingSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...new Set([...(defaultSchema.tagNames ?? []), "div", "span"])],
  attributes: {
    ...defaultSchema.attributes,
    "*": [...stripClassName(defaultSchema.attributes?.["*"])],
    a: [...stripClassName(defaultSchema.attributes?.a), "className", "dataText", "href"],
    div: [...stripClassName(defaultSchema.attributes?.div), "className"],
    span: [...stripClassName(defaultSchema.attributes?.span), "className"],
    ul: [...allowClassName],
    ol: [...allowClassName],
    li: [...allowClassName],
    p: [...allowClassName],
    strong: [...allowClassName],
    em: [...allowClassName],
    code: [...allowClassName],
    pre: [...allowClassName],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...(defaultSchema.protocols?.href ?? []), "action"],
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(child: any): string {
  if (typeof child === "string" || typeof child === "number") return String(child);
  if (Array.isArray(child)) return child.map(extractText).join("");
  if (child && child.props && child.props.children) return extractText(child.props.children);
  return "";
}

function rehypeWrapColumns() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (tree: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leftNodes: any[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rightNodes: any[] = [];
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasUl = tree.children.some((n: any) => n.type === 'element' && n.tagName === 'ul');
    if (!hasUl) return;

    const timeSlotRegex = /(?:\d{4}[年/])?\s*\d{1,2}[/月]\d{1,2}日?\s*[(（].+?[)）]\s*\d{1,2}:\d{2}\s*[-~〜～ー]\s*\d{1,2}:\d{2}/;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tree.children.forEach((node: any) => {
      if (node.type === 'element' && node.tagName === 'ul') {
        // Check if any li contains a slot
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasSlot = node.children?.some((li: any) => {
          if (li.type !== 'element' || li.tagName !== 'li') return false;
          const text = extractText(li);
          return timeSlotRegex.test(text);
        });

        if (hasSlot) {
          rightNodes.push(node);
        } else {
          leftNodes.push(node);
        }
      } else {
        leftNodes.push(node);
      }
    });

    if (rightNodes.length === 0) return; // Nothing to split

    tree.children = [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['flex', 'flex-col', 'md:flex-row', 'gap-x-8', 'gap-y-6', 'w-full', 'items-start'] },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['flex-1', 'min-w-[250px]', 'flex', 'flex-col', 'w-full'] },
            children: leftNodes
          },
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['w-full', 'md:w-[45%]', 'lg:w-[40%]', 'min-w-[300px]', 'flex', 'flex-col'] },
            children: rightNodes
          }
        ]
      }
    ];
  };
}

const ListContext = createContext<"ul" | "ol" | "slot-ul">("ul");

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
  // ユーザーが履歴を上にスクロールして読んでいる間は、ストリーミングで
  // 最下部へ引き戻さない。最下部付近にいるときだけ追従する。
  const atBottomRef = useRef(true);

  const busy = status === "submitted" || status === "streaming";

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    atBottomRef.current = distanceFromBottom < 80;
  }, []);

  // 新規メッセージ／状態変化で最下部へ（ユーザーが上を読んでいるときは追従しない）。
  useEffect(() => {
    if (scrollRef.current && atBottomRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, status]);

  const sendInitialPrompt = useCallback(() => {
    sendMessage({ text: `PROPOSE_INITIAL_SLOTS_IN_${locale.toUpperCase()}` });
  }, [sendMessage, locale]);

  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && messages.length === 0) {
      initRef.current = true;
      sendInitialPrompt();
    }
  }, [messages.length, sendInitialPrompt]);

  const submit = (text: string) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setInput("");
    atBottomRef.current = true; // 自分の送信時は最下部へ追従する
    sendMessage({ text: clean });
  };

  // エラー後のリトライ。初期提案がまだ無ければ初期プロンプトを、
  // 会話途中なら直近のユーザー発話を再送する（永久空白・行き止まりを防ぐ）。
  const retry = () => {
    if (busy) return;
    const lastUser = [...messages].reverse().find((mm) => mm.role === "user");
    if (messages.length === 0 || !lastUser) {
      sendInitialPrompt();
      return;
    }
    const text = lastUser.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (text) sendMessage({ text });
  };

  // 各メッセージのテキストパートを連結（ツールパートは UI では伏せる）。
  const textOf = (msg: (typeof messages)[number]) =>
    msg.parts
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
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label={t("aiLabel")}
        className="flex-1 overflow-y-auto px-4 pb-36 pt-24 sm:px-8 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10 dark:[&::-webkit-scrollbar-thumb]:bg-white/10 custom-scrollbar"
      >
        <div className="flex flex-col gap-6">
          <AnimatePresence initial={false}>
            {messages.map((mItem) => {
              const text = textOf(mItem);
              if (!text || text.startsWith("PROPOSE_INITIAL_SLOTS")) return null; // ツールのみのアシスタント中間メッセージや初期プロンプトは表示しない
              const isUser = mItem.role === "user";
              return (
                <m.div
                  key={mItem.id}
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className={`w-full flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      isUser
                        ? "max-w-[85%] whitespace-pre-wrap rounded-3xl rounded-tr-sm bg-gradient-to-br from-[color:var(--color-accent)] to-[color:var(--color-accent-hover)] px-5 py-4 text-[0.95rem] leading-relaxed text-white shadow-lg shadow-[color:var(--color-accent)]/20"
                        : "w-full text-[0.95rem] leading-relaxed text-[color:var(--color-ink)]"
                    }
                  >
                    {isUser ? text : (
                      <ReactMarkdown
                        urlTransform={schedulingUrlTransform}
                        rehypePlugins={[rehypeRaw, [rehypeSanitize, schedulingSanitizeSchema], rehypeWrapColumns]}
                        components={{
                          p: ({ children }) => (
                            <p className="w-full text-[0.95rem] text-[color:var(--color-ink)] leading-relaxed mb-4 last:mb-0 [&_strong]:font-semibold">
                              {children}
                            </p>
                          ),
                          a: ({ href, children, ...props }) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const dataText = (props as any)["data-text"] as string | undefined;
                            // href ("action:suggest") と data-text の両方でクイック返信を判定する。
                            // urlTransform / sanitize の挙動変化に対する多重防御。
                            if (href === "action:suggest") {
                              const textToSubmit = dataText || extractText(children);
                              return (
                                <button
                                  type="button"
                                  onClick={() => submit(textToSubmit)}
                                  aria-label={textToSubmit || undefined}
                                  className={props.className || "inline-block px-4 py-2 rounded-full border border-[color:var(--color-accent)] text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)] hover:text-white transition-all text-sm font-medium"}
                                >
                                  {children}
                                </button>
                              );
                            }
                            return (
                              <a href={href} className="text-[color:var(--color-accent)] hover:underline" {...props}>
                                {children}
                              </a>
                            );
                          },
                          ul: function MarkdownUl({ children, ...props }) {
                            const childrenArray = React.Children.toArray(children);
                            
                            type SlotItem = { rawText: string; date: string; day: string; start: string; end: string };
                            const slots: SlotItem[] = [];
                            const nonSlots: React.ReactNode[] = [];
                            
                            childrenArray.forEach(child => {
                              const rawText = extractText(child).trim();
                              const timeSlotRegex = /^(?:\d{4}[年/])?\s*(\d{1,2}[/月]\d{1,2})日?\s*[(（](.+?)[)）]\s*(\d{1,2}:\d{2})\s*[-~〜～ー]\s*(\d{1,2}:\d{2})/;
                              const match = rawText.match(timeSlotRegex);
                              if (match) {
                                const dateMatch = match[1].replace('月', '/');
                                slots.push({ rawText, date: dateMatch, day: match[2], start: match[3], end: match[4] });
                              } else {
                                if (rawText) nonSlots.push(child);
                              }
                            });

                            if (slots.length > 0 && nonSlots.length <= slots.length / 2) {
                              const groups: Record<string, SlotItem[]> = {};
                              slots.forEach(slot => {
                                const key = `${slot.date} (${slot.day})`;
                                if (!groups[key]) groups[key] = [];
                                groups[key].push(slot);
                              });

                              const today = new Date();
                              
                              return (
                                <div className="w-full flex flex-col gap-6 my-6 md:my-0">
                                  {Object.entries(groups).map(([groupKey, groupSlots]) => {
                                    const [dateStr] = groupKey.split(' ');
                                    const [m, d] = dateStr.split('/').map(Number);
                                    const slotDate = new Date(today.getFullYear(), m - 1, d);
                                    if (today.getMonth() === 11 && m === 1) {
                                      slotDate.setFullYear(today.getFullYear() + 1);
                                    }
                                    
                                    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                                    const diffDays = Math.round((slotDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    let relativeText = "";
                                    if (diffDays >= 0 && diffDays <= 2) {
                                      try {
                                        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
                                        relativeText = rtf.format(diffDays, 'day');
                                        if (relativeText) relativeText = relativeText.charAt(0).toUpperCase() + relativeText.slice(1);
                                      } catch {
                                        // Ignore formatting errors
                                      }
                                    }
                                    
                                    return (
                                      <div key={groupKey} className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2 px-1">
                                          {relativeText && (
                                            <span className="text-sm font-bold text-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 px-2 py-0.5 rounded-md">
                                              {relativeText}
                                            </span>
                                          )}
                                          <span className="text-[0.95rem] font-semibold text-[color:var(--color-ink)]">
                                            {groupKey}
                                          </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                          {groupSlots.map((slot) => (
                                            <button
                                              key={slot.rawText}
                                              type="button"
                                              onClick={() => submit(slot.rawText)}
                                              aria-label={slot.rawText}
                                              className="group flex items-center justify-center gap-1.5 w-full rounded-[1rem] border border-[color:var(--color-rule-soft)] bg-white/60 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.02)] backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:border-[color:var(--color-accent)]/40 hover:bg-white hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] dark:border-white/5 dark:bg-white/5 dark:hover:border-[color:var(--color-accent)]/40 dark:hover:bg-white/10"
                                            >
                                              <span className="text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-ink)] group-hover:text-[color:var(--color-accent)] transition-colors">{slot.start}</span>
                                              <span aria-hidden className="text-[0.8rem] font-medium text-[color:var(--color-ink-muted)] opacity-50">-</span>
                                              <span className="text-[1.05rem] font-semibold tracking-tight text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-accent)]/80 transition-colors">{slot.end}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            }

                            return (
                              <ListContext.Provider value="ul">
                                <ul className="md:col-start-1 w-fit max-w-[90%] sm:max-w-[85%] md:max-w-full text-[0.95rem] text-[color:var(--color-ink)] leading-relaxed mb-4 last:mb-0 list-disc pl-5 [&_li]:my-1" {...props}>
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
                            const isOl = listType === "ol";
                            return (
                              <li className={`my-0.5 ${isOl ? "" : "leading-relaxed"}`} {...props}>
                                {children}
                              </li>
                            );
                          },
                        }}
                      >
                        {text}
                      </ReactMarkdown>
                    )}
                  </div>
                </m.div>
              );
            })}
          </AnimatePresence>

          {/* 思考／ツール実行インジケータ */}
          {showThinking && (
            <m.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="self-start"
            >
              <div className="flex items-center gap-3 rounded-3xl rounded-tl-sm border border-[color:var(--color-rule-soft)] bg-white/80 px-5 py-3.5 text-[color:var(--color-ink-soft)] shadow-sm backdrop-blur-md dark:border-[color:var(--color-rule-soft)] dark:bg-[color:var(--color-bg-soft)]/80">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)] opacity-60 [animation-delay:-0.3s] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)] opacity-80 [animation-delay:-0.15s] motion-reduce:animate-none" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--color-accent)] motion-reduce:animate-none" />
                </span>
                <span className="text-sm font-medium">{t("chatThinking")}</span>
              </div>
            </m.div>
          )}

          {error && (
            <m.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-start"
              role="alert"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
                <span>{t("chatError")}</span>
                <button
                  type="button"
                  onClick={retry}
                  disabled={busy}
                  className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/40"
                >
                  {t("chatRetry")}
                </button>
              </div>
            </m.div>
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
