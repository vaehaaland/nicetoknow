"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_IDS,
  daysUntil,
  formatDate,
  matchesQuery,
  type CategoryId,
  type Entry,
} from "@/lib/entries";
import { CopyButton } from "./CopyButton";
import { EntryForm } from "./EntryForm";

type Filter = CategoryId | "all";
const EXPIRY_WARNING_DAYS = 30;

// Merkelapp for utløp/fornying: raud når passert, gul når det nærmar seg
function ExpiryBadge({ entry, today }: { entry: Entry; today: string }) {
  if (!entry.expires_at) return null;
  const days = daysUntil(entry.expires_at, today);
  const tone =
    days < 0
      ? "bg-danger/15 text-danger"
      : days <= EXPIRY_WARNING_DAYS
        ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
        : "bg-bg text-muted";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {days < 0 ? "Utgått" : CATEGORIES[entry.category].dateLabel} {formatDate(entry.expires_at)}
    </span>
  );
}

function EntryCard({ entry, today, onEdit }: { entry: Entry; today: string; onEdit: () => void }) {
  const config = CATEGORIES[entry.category];

  return (
    <li className="card flex flex-col gap-2.5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug break-words">{entry.title}</h3>
          {entry.provider && <p className="text-sm text-muted">{entry.provider}</p>}
        </div>
        <button onClick={onEdit} className="btn-ghost min-h-9 shrink-0 px-3 text-xs">
          Rediger
        </button>
      </div>

      {entry.code && (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-bg py-1.5 pr-1.5 pl-3">
          <div className="min-w-0">
            <p className="text-[11px] text-muted">{config.codeLabel}</p>
            <p className="font-mono text-base font-semibold break-all select-all">{entry.code}</p>
          </div>
          <CopyButton value={entry.code} />
        </div>
      )}

      {entry.notes && <p className="text-sm whitespace-pre-line break-words">{entry.notes}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
          {config.icon} {config.singular}
        </span>
        <ExpiryBadge entry={entry} today={today} />
        {entry.tags.map((tag) => (
          <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
            #{tag}
          </span>
        ))}
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm font-semibold text-accent">
            Opne lenkje ↗
          </a>
        )}
      </div>
    </li>
  );
}

// Oversikta: søk, kategorifilter, kort og modal for ny/rediger
export function EntryBrowser({ entries, today }: { entries: Entry[]; today: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // null = lukka, "new" = ny oppføring, elles oppføringa som blir redigert
  const [editing, setEditing] = useState<Entry | "new" | null>(null);

  const visible = useMemo(
    () => entries.filter((e) => (filter === "all" || e.category === filter) && matchesQuery(e, query)),
    [entries, filter, query],
  );

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "Alle" },
    ...CATEGORY_IDS.map((id) => ({ id, label: `${CATEGORIES[id].icon} ${CATEGORIES[id].label}` })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Søk i kodar, butikkar, notat …"
          aria-label="Søk"
          className="field"
        />
        <button onClick={() => setEditing("new")} className="btn-primary hidden shrink-0 sm:inline-flex">
          + Legg til
        </button>
      </div>

      {/* Horisontalt rullbare filter på mobil */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium ${
              filter === id ? "border-accent bg-accent text-accent-text" : "border-border bg-surface text-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {visible.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visible.map((entry) => (
            <EntryCard key={entry.id} entry={entry} today={today} onEdit={() => setEditing(entry)} />
          ))}
        </ul>
      ) : (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <p className="text-4xl" aria-hidden>
            {entries.length === 0 ? "🗂️" : "🔍"}
          </p>
          <p className="text-muted">
            {entries.length === 0
              ? "Ingenting her enno. Legg inn den første rabattkoden, medlemskapet eller forsikringa."
              : "Ingen treff. Prøv eit anna søk eller filter."}
          </p>
          {entries.length === 0 && (
            <button onClick={() => setEditing("new")} className="btn-primary">
              + Legg til
            </button>
          )}
        </div>
      )}

      {/* Flytande knapp over botn-fana på mobil */}
      <button
        onClick={() => setEditing("new")}
        aria-label="Legg til"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-3xl text-accent-text shadow-lg active:scale-95 sm:hidden"
      >
        +
      </button>

      {editing && (
        <EntryForm
          key={editing === "new" ? "new" : editing.id}
          entry={editing === "new" ? null : editing}
          defaultCategory={filter === "all" ? "discount" : filter}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
