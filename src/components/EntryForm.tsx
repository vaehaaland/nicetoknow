"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { deleteEntry, saveEntry, type ActionResult } from "@/app/(app)/actions";
import { Icon } from "./Icon";
import { CATEGORIES, CATEGORY_IDS, memberName, type CategoryId, type Entry, type Member } from "@/lib/entries";

type Props = {
  entry: Entry | null;
  defaultCategory: CategoryId;
  defaultParentId?: string; // sett når ein legg til ein fordel frå eit medlemskap
  memberships: Entry[]; // medlemskapa ein fordel kan høyre til
  members: Member[];
  currentUserId: string;
  onClose: () => void;
};

// Etikett + felt med lik utforming
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted">
      {label}
      {children}
    </label>
  );
}

// Modal for å opprette (entry = null) eller redigere ei oppføring
export function EntryForm({ entry, defaultCategory, defaultParentId, memberships, members, currentUserId, onClose }: Props) {
  // Ei oppføring kan ikkje høyre til seg sjølv
  const parentOptions = memberships.filter((membership) => membership.id !== entry?.id);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [category, setCategory] = useState<CategoryId>(entry?.category ?? defaultCategory);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const config = CATEGORIES[category];

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  // Køyrer ei server-handling og lukkar modalen når ho lukkast
  const run = (action: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else onClose();
    });

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      // Botnark på mobil, dialog på større skjermar (M3: 28px hjørne, surface-container-high)
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-[28px] bg-container-high p-0 text-text shadow-level3 sm:m-auto sm:max-w-lg sm:rounded-[28px]"
    >
      <form action={(formData) => run(() => saveEntry(formData))} className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl leading-8">{entry ? "Rediger" : "Ny oppføring"}</h2>
          <button type="button" onClick={onClose} aria-label="Lukk" className="btn-icon -mr-2">
            <Icon name="close" />
          </button>
        </div>

        {entry && <input type="hidden" name="id" value={entry.id} />}
        <input type="hidden" name="category" value={category} />

        {/* Kategorival styrer etikettane på felta under */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategory(id)}
              aria-pressed={id === category}
              className={`chip state-layer ${id === category ? `${CATEGORIES[id].tone} pl-2` : "text-text"}`}
            >
              <Icon name={id === category ? "check" : CATEGORIES[id].icon} size={18} className={id === category ? "" : CATEGORIES[id].ink} />
              {CATEGORIES[id].singular}
            </button>
          ))}
        </div>

        <Field label="Tittel">
          <input className="field" name="title" defaultValue={entry?.title} required maxLength={200} placeholder={`T.d. «${config.titleHint}»`} />
        </Field>
        <Field label={config.hasPurchaseDate ? "Merke / butikk" : "Leverandør / butikk"}>
          <input className="field" name="provider" defaultValue={entry?.provider ?? ""} />
        </Field>
        <Field label={config.codeLabel}>
          <input className="field font-mono" name="code" defaultValue={entry?.code ?? ""} autoCapitalize="none" autoCorrect="off" spellCheck={false} />
        </Field>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="Gjeld">
            <select className="field" name="owner_id" defaultValue={entry?.owner_id ?? ""}>
              <option value="">Felles</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {memberName(member, currentUserId)}
                </option>
              ))}
            </select>
          </Field>
          {parentOptions.length > 0 && (
            <Field label="Fordel via medlemskap">
              <select className="field" name="parent_id" defaultValue={entry?.parent_id ?? defaultParentId ?? ""}>
                <option value="">Ingen</option>
                {parentOptions.map((membership) => (
                  <option key={membership.id} value={membership.id}>
                    {membership.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          {config.hasPurchaseDate && (
            <Field label="Kjøpt">
              <input className="field" type="date" name="purchased_at" defaultValue={entry?.purchased_at ?? ""} />
            </Field>
          )}
          {config.dateLabel && (
            <Field label={config.dateLabel}>
              <input className="field" type="date" name="expires_at" defaultValue={entry?.expires_at ?? ""} />
            </Field>
          )}
          <Field label="Lenkje">
            <input className="field" type="url" name="url" defaultValue={entry?.url ?? ""} placeholder="https://" />
          </Field>
        </div>
        <Field label="Notat">
          <textarea className="field min-h-24" name="notes" defaultValue={entry?.notes ?? ""} placeholder="Vilkår, kundeservice-nummer, kva som er dekt …" />
        </Field>
        <Field label="Emneknaggar (kommaskilde)">
          <input className="field" name="tags" defaultValue={entry?.tags.join(", ")} placeholder="reise, bil" autoCapitalize="none" />
        </Field>

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex items-center gap-2 pt-1 pb-[env(safe-area-inset-bottom)]">
          {entry && (
            <button
              type="button"
              disabled={pending}
              onClick={() => confirm(`Slette «${entry.title}»?`) && run(() => deleteEntry(entry.id))}
              className="btn-text text-danger"
            >
              <Icon name="delete" size={18} /> Slett
            </button>
          )}
          <button disabled={pending} className="btn-primary ml-auto">
            {pending ? "Lagrar …" : "Lagre"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
