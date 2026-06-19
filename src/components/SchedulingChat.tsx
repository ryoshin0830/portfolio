"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LuSendHorizontal,
  LuCheck,
  LuExternalLink,
  LuVideo,
  LuArrowLeft,
  LuSparkles,
} from "react-icons/lu";
import type { BookingResult, ChatResponse, Slot } from "@/types/scheduling";

/**
 * AI ネイティブな会話型日程調整（クライアント）。
 *
 * 訪問者が自然言語で要望を書く → /api/schedule/chat が Hermes(= Google Calendar) に
 * 渡して「返答メッセージ＋空き枠の提案」を返す → 枠チップをクリックして確認 →
 * /api/schedule/book で予約確定。伝統的なカレンダーピッカーではなく、AI との対話で
 * 日程を詰める体験にしている。
 *
 * アニメーションは CSS のみ（無限ループ無し → useActiveAnimation 不要）。
 */

type Bubble = {
  id: number;
  role: "assistant" | "user";
  text: string;
  slots?: Slot[];
  result?: BookingResult; // 予約完了バブル用
};

let bubbleSeq = 0;
const nextId = () => ++bubbleSeq;

export default function SchedulingChat() {
  const t = useTranslations("scheduling");
  const locale = useLocale();

  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 初回グリーティング（API を叩かず静的に出す）。
  useEffect(() => {
    setBubbles([{ id: nextId(), role: "assistant", text: t("chatGreeting") }]);
  }, [t]);

  // 新しいバブル／状態変化で最下部へスクロール。
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [bubbles, thinking, selectedSlot]);

  const examples = useMemo(() => t.raw("chatExamples") as string[], [t]);

  const fmtSlot = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(locale, {
        timeZone: "Asia/Tokyo",
        month: "numeric",
        day: "numeric",
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(iso)),
    [locale],
  );

  const send = useCallback(
    async (text: string) => {
      const clean = text.trim();
      if (!clean || thinking) return;
      setInput("");
      setSelectedSlot(null);
      setBookingError(null);

      const userBubble: Bubble = { id: nextId(), role: "user", text: clean };
      const history = [...bubbles, userBubble];
      setBubbles(history);
      setThinking(true);

      try {
        const res = await fetch("/api/schedule/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale,
            messages: history
              .filter((b) => !b.result) // 完了バブルは履歴に含めない
              .map((b) => ({ role: b.role, content: b.text })),
          }),
        });
        if (res.status === 503) {
          setBubbles((b) => [...b, { id: nextId(), role: "assistant", text: t("notConfigured") }]);
          return;
        }
        if (!res.ok) {
          setBubbles((b) => [...b, { id: nextId(), role: "assistant", text: t("chatError") }]);
          return;
        }
        const data = (await res.json()) as ChatResponse;
        setBubbles((b) => [
          ...b,
          {
            id: nextId(),
            role: "assistant",
            text: data.reply || t("chatError"),
            slots: data.slots,
          },
        ]);
      } catch {
        setBubbles((b) => [...b, { id: nextId(), role: "assistant", text: t("chatError") }]);
      } finally {
        setThinking(false);
      }
    },
    [bubbles, locale, t, thinking],
  );

  const submitBooking = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedSlot) return;
      setSubmitting(true);
      setBookingError(null);
      try {
        const res = await fetch("/api/schedule/book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: selectedSlot.start,
            end: selectedSlot.end,
            name,
            email,
            note,
            company,
          }),
        });
        const data = (await res.json()) as BookingResult;
        if (res.ok && data.ok) {
          const slot = selectedSlot;
          setSelectedSlot(null);
          setBubbles((b) => [
            ...b,
            {
              id: nextId(),
              role: "assistant",
              text: `${t("successBody")}（${fmtSlot(slot.start)}）`,
              result: data,
            },
          ]);
        } else {
          setBookingError(data.error === "slot_taken" ? "slot_taken" : "error");
        }
      } catch {
        setBookingError("error");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedSlot, name, email, note, company, t, fmtSlot],
  );

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
        {bubbles.map((b) => (
          <div key={b.id} className={b.role === "user" ? "self-end" : "self-start"}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[0.95rem] leading-relaxed ${
                b.role === "user"
                  ? "ml-auto bg-[color:var(--color-accent)] text-white"
                  : "bg-[color:var(--color-bg-soft)] text-[color:var(--color-ink)]"
              }`}
            >
              {b.text}
            </div>

            {/* 提案枠チップ */}
            {b.slots && b.slots.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {b.slots.map((slot) => {
                  const active = selectedSlot?.start === slot.start;
                  return (
                    <li key={slot.start}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setBookingError(null);
                        }}
                        aria-pressed={active}
                        className={`num rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white"
                            : "border-[color:var(--color-rule)] text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                        }`}
                      >
                        {fmtSlot(slot.start)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* 予約完了バブルのリンク */}
            {b.result && (
              <div className="mt-3 flex flex-wrap gap-2">
                {b.result.meetUrl && (
                  <a href={b.result.meetUrl} target="_blank" rel="noopener noreferrer" className="btn-pill text-sm">
                    <LuVideo size={15} /> {t("successMeet")}
                  </a>
                )}
                {b.result.htmlLink && (
                  <a
                    href={b.result.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-pill btn-pill--ghost text-sm"
                  >
                    {t("successCalendar")} <LuExternalLink size={13} />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 思考中インジケータ */}
        {thinking && (
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

        {/* 例示プロンプト（会話がグリーティングだけのとき） */}
        {bubbles.length <= 1 && !thinking && (
          <ul className="mt-1 flex flex-wrap gap-2 self-start">
            {examples.map((ex) => (
              <li key={ex}>
                <button
                  type="button"
                  onClick={() => send(ex)}
                  className="rounded-full border border-[color:var(--color-rule)] px-3.5 py-2 text-sm text-[color:var(--color-ink-soft)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                >
                  {ex}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 予約確認フォーム（枠選択時にインライン展開） */}
      {selectedSlot && (
        <div className="border-t border-[color:var(--color-rule-soft)] bg-[color:var(--color-bg-soft)] px-5 py-4">
          <button type="button" onClick={() => setSelectedSlot(null)} className="link-accent mb-3 text-sm">
            <LuArrowLeft size={13} /> {t("back")}
          </button>
          <p className="meta mb-0.5">{t("selectedSlotLabel")}</p>
          <p className="num mb-4 font-semibold">{fmtSlot(selectedSlot.start)}</p>
          <form onSubmit={submitBooking} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                type="text"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                aria-label={t("nameLabel")}
                className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                aria-label={t("emailLabel")}
                className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
              />
            </div>
            <input
              type="text"
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              aria-label={t("noteLabel")}
              className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-3.5 py-2.5 text-sm outline-none focus:border-[color:var(--color-accent)]"
            />
            {/* ハニーポット */}
            <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            {bookingError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                {bookingError === "slot_taken" ? t("errorSlotTaken") : t("errorGeneric")}
              </p>
            )}
            <button type="submit" disabled={submitting} className="btn-pill w-full justify-center disabled:opacity-60">
              {submitting ? (
                t("submitting")
              ) : (
                <>
                  <LuCheck size={16} /> {t("submit")}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 入力欄 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-[color:var(--color-rule-soft)] px-4 py-3"
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={thinking}
          placeholder={t("chatPlaceholder")}
          aria-label={t("chatPlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-[0.95rem] text-[color:var(--color-ink)] outline-none placeholder:text-[color:var(--color-ink-muted)]"
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          aria-label={t("chatSend")}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white transition-opacity disabled:opacity-40"
        >
          <LuSendHorizontal size={17} />
        </button>
      </form>
    </div>
  );
}
