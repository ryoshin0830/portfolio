interface FolioProps {
  number: number;
  label: string;
  meta?: string;
}

export default function Folio({ number, label, meta }: FolioProps) {
  const padded = String(number).padStart(2, "0");
  return (
    <div className="flex items-baseline gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-amber-mark)]">
      <span aria-hidden>№</span>
      <span className="tabular-nums">{padded}</span>
      <span className="text-[color:var(--color-rule)]" aria-hidden>—</span>
      <span className="text-[color:var(--color-ink)] normal-case tracking-[0.02em] text-[12px] font-medium">
        {label}
      </span>
      {meta && (
        <span className="ml-auto text-[color:var(--color-ink-soft)] normal-case tracking-[0.05em]">
          {meta}
        </span>
      )}
    </div>
  );
}
