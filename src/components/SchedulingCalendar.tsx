"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  LuChevronLeft,
  LuChevronRight,
  LuCheck,
  LuExternalLink,
  LuVideo,
  LuArrowLeft,
} from "react-icons/lu";
import type { AvailabilityResponse, BookingResult, Slot } from "@/types/scheduling";

/**
 * AI 日程調整カレンダー（クライアント）。
 *
 * フロー: 月カレンダー表示 → 日付クリックで /api/schedule/availability を叩いて
 * その日の空き枠を取得 → 枠を選ぶとフォーム → /api/schedule/book で予約確定。
 * 秘密情報はサーバー側 API に閉じており、ここは「空き枠」と「結果」しか扱わない。
 *
 * アニメーションは CSS トランジションのみ（無限ループ無し → useActiveAnimation 不要）。
 */

const HORIZON_DAYS = 30;

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}
function dateKey(y: number, m: number, d: number): string {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}
/** ローカル日付の 0:00（時刻成分を落として日付比較に使う） */
function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

type View = "calendar" | "form" | "done";

export default function SchedulingCalendar() {
  const t = useTranslations("scheduling");
  const locale = useLocale();

  const today = useMemo(() => startOfDay(new Date()), []);
  const horizon = useMemo(() => {
    const h = new Date(today);
    h.setDate(h.getDate() + HORIZON_DAYS);
    return h;
  }, [today]);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [view, setView] = useState<View>("calendar");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [result, setResult] = useState<BookingResult | null>(null);

  // ── 月グリッドの曜日ヘッダー（ロケール依存、Intl から導出）─────────────
  const weekdayLabels = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2024-01-07 は日曜。そこから 7 日分。
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(2024, 0, 7 + i)),
    );
  }, [locale]);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { year: "numeric", month: "long" }).format(
        new Date(viewYear, viewMonth, 1),
      ),
    [locale, viewYear, viewMonth],
  );

  // ── 当月の日セル ───────────────────────────────────────────
  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const arr: ({ day: number; key: string; disabled: boolean } | null)[] = [];
    for (let i = 0; i < startWeekday; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const weekday = date.getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const isPast = date < today;
      const beyond = date > horizon;
      arr.push({
        day: d,
        key: dateKey(viewYear, viewMonth, d),
        disabled: isWeekend || isPast || beyond,
      });
    }
    return arr;
  }, [viewYear, viewMonth, today, horizon]);

  // 前月へ戻れるか（今日より前の月は出さない）
  const canGoPrev =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth > today.getMonth());

  const goPrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);
  const goNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDate = useCallback(
    async (key: string) => {
      setSelectedDate(key);
      setSelectedSlot(null);
      setSlots(null);
      setSlotsError(null);
      setLoadingSlots(true);
      try {
        const res = await fetch(`/api/schedule/availability?date=${key}`);
        if (res.status === 503) {
          setSlotsError("not_configured");
          return;
        }
        if (!res.ok) {
          setSlotsError("error");
          return;
        }
        const data = (await res.json()) as AvailabilityResponse;
        setSlots(data.slots);
      } catch {
        setSlotsError("error");
      } finally {
        setLoadingSlots(false);
      }
    },
    [],
  );

  const pickSlot = useCallback((slot: Slot) => {
    setSelectedSlot(slot);
    setBookingError(null);
    setView("form");
  }, []);

  const submit = useCallback(
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
            company, // honeypot — 空であることをサーバーが検証
          }),
        });
        const data = (await res.json()) as BookingResult;
        if (res.ok && data.ok) {
          setResult(data);
          setView("done");
        } else {
          setBookingError(data.error === "slot_taken" ? "slot_taken" : "error");
        }
      } catch {
        setBookingError("error");
      } finally {
        setSubmitting(false);
      }
    },
    [selectedSlot, name, email, note, company],
  );

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(new Date(y, m - 1, d));
  }, [selectedDate, locale]);

  const resetToCalendar = useCallback(() => {
    setView("calendar");
    setSelectedSlot(null);
    setBookingError(null);
  }, []);

  // ── 完了画面 ───────────────────────────────────────────────
  if (view === "done" && result) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] p-8 text-center md:p-10">
        <div className="mx-auto mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-white">
          <LuCheck size={28} />
        </div>
        <h3 className="display display--lg mb-3">{t("successTitle")}</h3>
        <p className="prose-body mb-2 text-[color:var(--color-ink-soft)]">
          {t("successBody")}
        </p>
        <p className="num mb-8 text-lg font-semibold">
          {selectedDateLabel} · {selectedSlot?.label}
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {result.meetUrl && (
            <a
              href={result.meetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill"
            >
              <LuVideo size={16} /> {t("successMeet")}
            </a>
          )}
          {result.htmlLink && (
            <a
              href={result.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill btn-pill--ghost"
            >
              {t("successCalendar")} <LuExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── 予約フォーム ───────────────────────────────────────────
  if (view === "form" && selectedSlot) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] p-6 md:p-8">
        <button
          type="button"
          onClick={resetToCalendar}
          className="link-accent mb-5 text-sm"
        >
          <LuArrowLeft size={14} /> {t("back")}
        </button>
        <p className="meta mb-1">{t("selectedSlotLabel")}</p>
        <p className="num mb-6 text-lg font-semibold">
          {selectedDateLabel} · {selectedSlot.label}–{selectedSlot.end.slice(11, 16)}
        </p>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="sched-name" className="meta mb-1.5 block">
              {t("nameLabel")}
            </label>
            <input
              id="sched-name"
              type="text"
              required
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("namePlaceholder")}
              className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-4 py-2.5 text-base text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]"
            />
          </div>
          <div>
            <label htmlFor="sched-email" className="meta mb-1.5 block">
              {t("emailLabel")}
            </label>
            <input
              id="sched-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="w-full rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-4 py-2.5 text-base text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]"
            />
          </div>
          <div>
            <label htmlFor="sched-note" className="meta mb-1.5 block">
              {t("noteLabel")}
            </label>
            <textarea
              id="sched-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("notePlaceholder")}
              className="w-full resize-y rounded-lg border border-[color:var(--color-rule)] bg-[color:var(--color-bg)] px-4 py-2.5 text-base text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)]"
            />
          </div>
          {/* ハニーポット: スクリーンリーダー・人間からは隠す。ボットだけが埋める。 */}
          <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
            <label htmlFor="sched-company">Company</label>
            <input
              id="sched-company"
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
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>
      </div>
    );
  }

  // ── カレンダー + 空き枠 ────────────────────────────────────
  return (
    <div className="grid gap-10 lg:grid-cols-[auto_1fr] lg:gap-16">
      {/* 月カレンダー */}
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goPrev}
            disabled={!canGoPrev}
            aria-label={t("prevMonth")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)] disabled:opacity-30"
          >
            <LuChevronLeft size={20} />
          </button>
          <p className="text-lg font-semibold tracking-tight">{monthLabel}</p>
          <button
            type="button"
            onClick={goNext}
            aria-label={t("nextMonth")}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[color:var(--color-ink-soft)] transition-colors hover:text-[color:var(--color-ink)]"
          >
            <LuChevronRight size={20} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {weekdayLabels.map((w, i) => (
            <div key={i} className="meta py-2 text-xs">
              {w}
            </div>
          ))}
          {cells.map((cell, i) =>
            cell === null ? (
              <div key={`b${i}`} />
            ) : (
              <button
                key={cell.key}
                type="button"
                disabled={cell.disabled}
                onClick={() => selectDate(cell.key)}
                aria-pressed={selectedDate === cell.key}
                className={`num aspect-square rounded-full text-sm transition-colors ${
                  cell.disabled
                    ? "cursor-default text-[color:var(--color-rule)]"
                    : selectedDate === cell.key
                      ? "bg-[color:var(--color-accent)] font-semibold text-white"
                      : "text-[color:var(--color-ink)] hover:bg-[color:var(--color-bg)]"
                }`}
              >
                {cell.day}
              </button>
            ),
          )}
        </div>
        <p className="meta mt-4">{t("timezoneNote")}</p>
      </div>

      {/* 空き枠 */}
      <div className="min-h-[12rem]">
        {!selectedDate && (
          <p className="prose-body text-[color:var(--color-ink-soft)]">
            {t("selectDatePrompt")}
          </p>
        )}
        {selectedDate && (
          <>
            <p className="meta mb-4">{selectedDateLabel}</p>
            {loadingSlots && (
              <p className="prose-body text-[color:var(--color-ink-soft)]">
                {t("loadingSlots")}
              </p>
            )}
            {slotsError === "not_configured" && (
              <p className="prose-body text-[color:var(--color-ink-soft)]">
                {t("notConfigured")}
              </p>
            )}
            {slotsError === "error" && (
              <p className="prose-body text-[color:var(--color-ink-soft)]">
                {t("errorGeneric")}
              </p>
            )}
            {!loadingSlots && !slotsError && slots && slots.length === 0 && (
              <p className="prose-body text-[color:var(--color-ink-soft)]">
                {t("noSlots")}
              </p>
            )}
            {!loadingSlots && !slotsError && slots && slots.length > 0 && (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {slots.map((slot) => (
                  <li key={slot.start}>
                    <button
                      type="button"
                      onClick={() => pickSlot(slot)}
                      className="num w-full rounded-lg border border-[color:var(--color-rule)] py-2.5 text-center text-sm font-medium text-[color:var(--color-ink)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                    >
                      {slot.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
