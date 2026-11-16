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
import type { IconName } from "@/lib/icons";
import { Avatar } from "./Avatar";
import { CopyButton } from "./CopyButton";
import { EntryForm } from "./EntryForm";
import { Icon } from "./Icon";

type Filter = CategoryId | "all";
const EXPIRY_WARNING_DAYS = 30;
const EXPIRED_GRACE_DAYS = 30; // kor lenge noko utgått blir ståande i «Skjer snart»

// «om 3 dagar», «i dag», «for 2 dagar sidan»
const relativeDays = (days: number) =>
  days === 0 ? "i dag" : days === 1 ? "i morgon" : days > 0 ? `om ${days} dagar` : days === -1 ? "i går" : `for ${-days} dagar sidan`;

// Teksten til høgre i stripa. Notat har ein nøytral dato: berre «om 9 dagar», utan «Utgått».
function UpcomingLabel({ entry, days }: { entry: Entry; days: number }) {
  const { dateLabel, plainDate } = CATEGORIES[entry.category];
  const expired = days < 0 && !plainDate;
  const tone = expired ? "text-danger" : "text-muted";
  const prefix = plainDate ? "" : expired ? "Utgått " : `${dateLabel} `;
  return <span className={`shrink-0 text-xs font-medium ${tone}`}>{prefix + relativeDays(days)}</span>;
}

// Kort øvst: det som går ut, fornyast eller mistar garantien snart (eller nett har gjort det)
function UpcomingStrip({ entries, today, onShow }: { entries: Entry[]; today: string; onShow: (title: string) => void }) {
  const upcoming = entries
    .flatMap((entry) => (entry.expires_at ? [{ entry, days: daysUntil(entry.expires_at, today) }] : []))
    .filter(({ days }) => days <= EXPIRY_WARNING_DAYS && days >= -EXPIRED_GRACE_DAYS)
    .sort((a, b) => a.days - b.days);
  if (upcoming.length === 0) return null;

  return (
    // Fylt kort i tertiærfarge skil «hugs dette» frå dei vanlege korta
    <section aria-label="Skjer snart" className="rounded-xl bg-tertiary-container py-2 text-on-tertiary-container">
      <h2 className="flex items-center gap-2 px-4 py-2 text-sm font-medium">
        <Icon name="schedule" size={18} /> Skjer snart
      </h2>
      <ul>
        {upcoming.map(({ entry, days }) => (
          <li key={entry.id}>
            <button onClick={() => onShow(entry.title)} className="state-layer flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm">
              <Icon name={CATEGORIES[entry.category].icon} size={20} />
              <span className="min-w-0 flex-1 truncate">{entry.title}</span>
              <UpcomingLabel entry={entry} days={days} />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Merkelapp for utløp/fornying: feilfarge når passert, tertiær når det nærmar seg
function ExpiryBadge({ entry, today }: { entry: Entry; today: string }) {
  if (!entry.expires_at) return null;
  const days = daysUntil(entry.expires_at, today);
  const { dateLabel, plainDate } = CATEGORIES[entry.category];
  const expired = days < 0 && !plainDate;
  const tone = expired
    ? "border-transparent bg-error-container text-on-error-container"
    : days >= 0 && days <= EXPIRY_WARNING_DAYS
      ? "border-transparent bg-tertiary-container text-on-tertiary-container"
      : "";
  return (
    <span className={`chip ${tone}`}>
      {expired ? "Utgått" : (dateLabel ?? "Dato")} {formatDate(entry.expires_at)}
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
    <li className="card flex min-w-0 flex-col gap-3 p-4">
      {/* Hovud: kategori-ikon, tittel og rediger */}
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container" title={config.singular}>
          <Icon name={config.icon} size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base leading-6 font-medium break-words">{entry.title}</h3>
          <p className="text-sm text-muted break-words">{[config.singular, entry.provider].filter(Boolean).join(" · ")}</p>
        </div>
        <button onClick={onEdit} aria-label={`Rediger ${entry.title}`} title="Rediger" className="btn-icon -mt-1 -mr-2">
          <Icon name="edit" size={20} />
        </button>
      </div>

      {entry.code && (
        <div className="flex items-center justify-between gap-2 rounded-lg bg-container-high py-1.5 pr-1 pl-4">
          <div className="min-w-0">
            <p className="text-xs text-muted">{config.codeLabel}</p>
            <p className="font-mono text-base font-medium break-all select-all">{entry.code}</p>
          </div>
          <CopyButton value={entry.code} />
        </div>
      )}

      {entry.notes && <p className="text-sm whitespace-pre-line break-words">{entry.notes}</p>}

      {/* Medlemskap: fordelane som høyrer til */}
      {entry.category === "membership" && (
        <div className="flex flex-col rounded-lg border border-border py-1">
          <div className="flex items-center justify-between gap-2 pr-1 pl-4">
            <p className="text-sm font-medium text-muted">Fordelar ({benefits.length})</p>
            <button onClick={onAddBenefit} className="btn-text">
              <Icon name="add" size={18} /> Legg til
            </button>
          </div>
          {benefits.map((benefit) => (
            <button key={benefit.id} onClick={() => onShow(benefit.title)} className="state-layer flex min-h-10 items-center gap-3 px-4 text-left text-sm">
              <Icon name={CATEGORIES[benefit.category].icon} size={18} className="text-muted" />
              <span className="min-w-0 truncate">
                {benefit.title}
                {benefit.provider && <span className="text-muted"> · {benefit.provider}</span>}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="chip pl-1.5">
          {owner ? <Avatar name={owner.name} src={owner.avatar} size={20} /> : <Icon name="group" size={18} className="ml-0.5" />}
          {owner?.name ?? "Felles"}
        </span>
        {parent && (
          <button onClick={() => onShow(parent.title)} className="chip chip-selected state-layer">
            <span className="truncate">Via {parent.title}</span>
          </button>
        )}
        {entry.purchased_at && <span className="chip">Kjøpt {formatDate(entry.purchased_at)}</span>}
        <ExpiryBadge entry={entry} today={today} />
        {entry.tags.map((tag) => (
          <span key={tag} className="chip">
            #{tag}
          </span>
        ))}
        {entry.url && (
          <a href={entry.url} target="_blank" rel="noopener noreferrer" className="btn-text ml-auto">
            Opne <Icon name="open_in_new" size={18} />
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

  const filters: { id: Filter; label: string; icon?: IconName }[] = [
    { id: "all", label: "Alle" },
    ...CATEGORY_IDS.map((id) => ({ id, label: CATEGORIES[id].label, icon: CATEGORIES[id].icon })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {/* M3 search bar: pilleforma, fylt, med ikon framfor */}
        <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-full bg-container-high px-4 text-muted focus-within:ring-2 focus-within:ring-accent">
          <Icon name="search" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Søk i kodar, ting, notat …"
            aria-label="Søk"
            className="min-w-0 flex-1 bg-transparent text-base text-text outline-none placeholder:text-muted"
          />
        </label>
        <button onClick={() => openNew()} className="btn-primary hidden h-14 shrink-0 sm:inline-flex">
          <Icon name="add" size={20} /> Legg til
        </button>
      </div>

      {/* Filter-chips, horisontalt rullbare på mobil */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {filters.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`chip state-layer text-text ${filter === id ? "chip-selected pl-2" : ""}`}
          >
            {/* Vald chip får hake framfor, slik M3 filter chips gjer */}
            {filter === id ? <Icon name="check" size={18} /> : icon && <Icon name={icon} size={18} className="text-accent" />}
            {label}
          </button>
        ))}
      </div>

      {/* Berre i den ufiltrerte oversikta, så kortet ikkje står i vegen for eit søk */}
      {!query && filter === "all" && <UpcomingStrip entries={entries} today={today} onShow={show} />}

      {visible.length > 0 ? (
        // grid-cols-1 = minmax(0, 1fr): lange titlar får ikkje utvide kolonnen forbi skjermen
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-container-high text-muted">
            <Icon name={entries.length === 0 ? "inventory_2" : "search"} size={32} />
          </span>
          <p className="text-muted">
            {entries.length === 0
              ? "Ingenting her enno. Legg inn den første rabattkoden, medlemskapet eller forsikringa."
              : "Ingen treff. Prøv eit anna søk eller filter."}
          </p>
          {entries.length === 0 && (
            <button onClick={() => openNew()} className="btn-primary">
              <Icon name="add" size={20} /> Legg til
            </button>
          )}
        </div>
      )}

      {/* FAB over botn-navigasjonen på mobil */}
      <button
        onClick={() => openNew()}
        aria-label="Legg til"
        className="state-layer fixed right-4 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 flex size-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-level3 sm:hidden"
      >
        <Icon name="add" />
      </button>

      {editing && (
        <EntryForm
          key={editing.entry?.id ?? `new-${editing.parentId}`}
          entry={editing.entry}
          // Ein ny fordel under eit medlemskap startar som «Kjekt å vite»
          defaultCategory={editing.parentId ? "note" : filter === "all" ? "discount" : filter}
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
