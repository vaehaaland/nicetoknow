"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES,
  CATEGORY_IDS,
  daysUntil,
  formatDate,
  matchesQuery,
  memberName,
  type CategoryId,
  type Entry,
  type Member,
} from "@/lib/entries";
import { Avatar } from "./Avatar";
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

type CardProps = {
  entry: Entry;
  today: string;
  owner?: { name: string; avatar: string | null }; // undefined = felles
  parent?: Entry; // medlemskapet fordelen høyrer til
  benefits: Entry[]; // fordelar under dette medlemskapet
  onEdit: () => void;
  onAddBenefit: () => void;
  onShow: (title: string) => void; // søk fram ei anna oppføring
};

function EntryCard({ entry, today, owner, parent, benefits, onEdit, onAddBenefit, onShow }: CardProps) {
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

      {/* Medlemskap: fordelane som høyrer til */}
      {entry.category === "membership" && (
        <div className="flex flex-col gap-1.5 rounded-xl border border-border px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-muted">Fordelar ({benefits.length})</p>
            <button onClick={onAddBenefit} className="text-xs font-semibold text-accent">
              + Legg til fordel
            </button>
          </div>
          {benefits.map((benefit) => (
            <button key={benefit.id} onClick={() => onShow(benefit.title)} className="truncate text-left text-sm hover:text-accent">
              {CATEGORIES[benefit.category].icon} {benefit.title}
              {benefit.provider && <span className="text-muted"> · {benefit.provider}</span>}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${config.badge}`}>
          {config.icon} {config.singular}
        </span>
        <span className="flex items-center gap-1 rounded-full border border-border py-0.5 pr-2 pl-0.5 text-xs">
          {owner ? <Avatar name={owner.name} src={owner.avatar} size={16} /> : <span aria-hidden className="pl-1.5">👥</span>}
          {owner?.name ?? "Felles"}
        </span>
        {parent && (
          <button
            onClick={() => onShow(parent.title)}
            className="max-w-full truncate rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-900 dark:bg-sky-900/40 dark:text-sky-200"
          >
            Via {parent.title}
          </button>
        )}
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
type Props = { entries: Entry[]; members: Member[]; currentUserId: string; today: string };

export function EntryBrowser({ entries, members, currentUserId, today }: Props) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // null = lukka; elles oppføringa som blir redigert, eller ei ny (ev. som fordel under eit medlemskap)
  const [editing, setEditing] = useState<{ entry: Entry | null; parentId?: string } | null>(null);
  const openNew = (parentId?: string) => setEditing({ entry: null, parentId });

  // Oppslag som korta treng: oppføring per id, fordelar per medlemskap, eigar per brukar
  const { byId, benefitsOf, ownerOf, memberships } = useMemo(() => {
    const benefitsOf = new Map<string, Entry[]>();
    for (const entry of entries) {
      if (entry.parent_id) benefitsOf.set(entry.parent_id, [...(benefitsOf.get(entry.parent_id) ?? []), entry]);
    }
    return {
      byId: new Map(entries.map((entry) => [entry.id, entry])),
      benefitsOf,
      ownerOf: new Map(members.map((m) => [m.user_id, { name: memberName(m, currentUserId), avatar: m.avatar }])),
      memberships: entries.filter((entry) => entry.category === "membership"),
    };
  }, [entries, members, currentUserId]);

  const parentOf = (entry: Entry) => (entry.parent_id ? byId.get(entry.parent_id) : undefined);
  const owner = (entry: Entry) => (entry.owner_id ? ownerOf.get(entry.owner_id) : undefined);

  // Søket treff òg på medlemskapet ein fordel høyrer til og på eigaren
  const visible = entries.filter(
    (e) =>
      (filter === "all" || e.category === filter) &&
      matchesQuery(e, query, [parentOf(e)?.title, owner(e)?.name ?? "Felles"]),
  );

  // Vis ei anna oppføring ved å søkje ho fram (nullstiller filteret så ho ikkje blir gøymd)
  const show = (title: string) => {
    setFilter("all");
    setQuery(title);
    window.scrollTo({ top: 0 });
  };

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
        <button onClick={() => openNew()} className="btn-primary hidden shrink-0 sm:inline-flex">
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
            <EntryCard
              key={entry.id}
              entry={entry}
              today={today}
              owner={owner(entry)}
              parent={parentOf(entry)}
              benefits={benefitsOf.get(entry.id) ?? []}
              onEdit={() => setEditing({ entry })}
              onAddBenefit={() => openNew(entry.id)}
              onShow={show}
            />
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
            <button onClick={() => openNew()} className="btn-primary">
              + Legg til
            </button>
          )}
        </div>
      )}

      {/* Flytande knapp over botn-fana på mobil */}
      <button
        onClick={() => openNew()}
        aria-label="Legg til"
        className="fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-full bg-accent text-3xl text-accent-text shadow-lg active:scale-95 sm:hidden"
      >
        +
      </button>

      {editing && (
        <EntryForm
          key={editing.entry?.id ?? `new-${editing.parentId}`}
          entry={editing.entry}
          // Ein ny fordel under eit medlemskap startar som «Anna»
          defaultCategory={editing.parentId ? "other" : filter === "all" ? "discount" : filter}
          defaultParentId={editing.parentId}
          memberships={memberships}
          members={members}
          currentUserId={currentUserId}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
