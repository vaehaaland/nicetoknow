import type { IconName } from "./icons";

// Datamodell + kategori-konfig. Éi kjelde til sanning for skjema, kort og chat.

export const CATEGORY_IDS = ["discount", "membership", "insurance", "product", "note"] as const;
export type CategoryId = (typeof CATEGORY_IDS)[number];

export type Entry = {
  id: string;
  category: CategoryId;
  title: string;
  provider: string | null;
  code: string | null;
  url: string | null;
  notes: string | null;
  expires_at: string | null; // ISO-dato (YYYY-MM-DD)
  purchased_at: string | null; // kjøpsdato, berre for ting me eig
  tags: string[];
  parent_id: string | null; // medlemskapet ein fordel høyrer til
  owner_id: string | null; // kven det gjeld; null = felles
  updated_at: string;
};

// Medlem i husstanden med profil
export type Member = { user_id: string; display_name: string | null; avatar: string | null };
export const MEMBER_COLUMNS = "user_id, display_name, avatar";

// Namn å vise for eit medlem – med fallback til «Meg»/«Partnar» før namnet er sett
export const memberName = (member: Member, currentUserId: string) =>
  member.display_name ?? (member.user_id === currentUserId ? "Meg" : "Partnar");

// Kolonnane appen les – held select-spørjingane like overalt
export const ENTRY_COLUMNS =
  "id, category, title, provider, code, url, notes, expires_at, purchased_at, tags, parent_id, owner_id, updated_at";

type CategoryConfig = {
  label: string; // namn i fleirtal (filter)
  singular: string;
  icon: IconName;
  tone: string; // fylt flate i kategorifargen (ikon-sirkel, vald chip)
  ink: string; // kategorifargen som tekst-/ikonfarge på nøytral bakgrunn
  codeLabel: string; // kva «code»-feltet tyder for kategorien
  dateLabel: string | null; // kva «expires_at» tyder for kategorien; null = ingen dato
  plainDate?: boolean; // datoen er ikkje eit utløp: aldri «Utgått» eller raud merking
  hasPurchaseDate?: boolean; // viser feltet «Kjøpt»
  titleHint: string; // døme i tittelfeltet
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  discount: {
    label: "Rabattkodar",
    singular: "Rabattkode",
    icon: "sell",
    tone: "border-transparent bg-cat-discount text-on-cat-discount",
    ink: "text-cat-discount-accent",
    codeLabel: "Rabattkode",
    dateLabel: "Gyldig til",
    titleHint: "10 % hos Zalando",
  },
  membership: {
    label: "Medlemskap",
    singular: "Medlemskap",
    icon: "id_card",
    tone: "border-transparent bg-cat-membership text-on-cat-membership",
    ink: "text-cat-membership-accent",
    codeLabel: "Medlemsnummer",
    dateLabel: "Fornyast",
    titleHint: "Fagforbundet",
  },
  insurance: {
    label: "Forsikringar",
    singular: "Forsikring",
    icon: "shield",
    tone: "border-transparent bg-cat-insurance text-on-cat-insurance",
    ink: "text-cat-insurance-accent",
    codeLabel: "Polise-/avtalenummer",
    dateLabel: "Fornyast",
    titleHint: "Reiseforsikring",
  },
  product: {
    label: "Ting me eig",
    singular: "Ting",
    icon: "inventory_2",
    tone: "border-transparent bg-cat-product text-on-cat-product",
    ink: "text-cat-product-accent",
    codeLabel: "Storleik / modell",
    dateLabel: "Garanti til",
    hasPurchaseDate: true,
    titleHint: "Dr. Martens 1460",
  },
  note: {
    label: "Kjekt å vite",
    singular: "Kjekt å vite",
    icon: "lightbulb",
    tone: "border-transparent bg-cat-note text-on-cat-note",
    ink: "text-cat-note-accent",
    codeLabel: "Detalj / verdi",
    dateLabel: "Dato",
    plainDate: true,
    titleHint: "Veggmåling i stova",
  },
};

export const isCategory = (value: unknown): value is CategoryId =>
  CATEGORY_IDS.includes(value as CategoryId);

const dateFormat = new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium", timeZone: "UTC" });
export const formatDate = (iso: string) => dateFormat.format(new Date(`${iso}T00:00:00Z`));

// Dagar til datoen (negativt = passert). `today` er YYYY-MM-DD.
export function daysUntil(iso: string, today: string) {
  return Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
}

// Fritekstsøk: alle orda i søket må finnast ein stad i oppføringa.
// `extra` er tekst utanfor sjølve oppføringa, t.d. namnet på medlemskapet og eigaren.
export function matchesQuery(entry: Entry, query: string, extra: (string | undefined)[] = []) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const haystack = [
    entry.title,
    entry.provider,
    entry.code,
    entry.notes,
    entry.url,
    CATEGORIES[entry.category].singular,
    ...entry.tags,
    ...extra,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.every((word) => haystack.includes(word));
}

// Skil svarteksten frå JSON-forslaga i chat-strøymen (ASCII «record separator»)
export const PROPOSALS_MARKER = "\u001e";

// Felta som blir skrivne til databasen for ei oppføring
export type EntryValues = Omit<Entry, "id" | "updated_at">;
// Forslag frå chatten: verdiane + visningsnamn som klienten slepp å slå opp
export type EntryDraft = EntryValues & { owner_name: string | null; parent_title: string | null };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Vaskar ukjend input (skjema-data eller chat-forslag) til gyldige verdiar; null = ugyldig.
// Éin stad for reglane, slik at skjemaet og chatten lagrar likt.
export function toEntryValues(raw: unknown): EntryValues | null {
  const input = (raw ?? {}) as Record<string, unknown>;
  // Tom streng → null, slik at valfrie felt ikkje blir lagra som ""
  const text = (key: string, max = 2000) =>
    (typeof input[key] === "string" ? (input[key] as string).trim().slice(0, max) : "") || null;
  const matching = (key: string, pattern: RegExp) => {
    const value = text(key);
    return value && pattern.test(value) ? value : null;
  };

  const { category } = input;
  const title = text("title", 200);
  if (!isCategory(category) || !title) return null;
  const config = CATEGORIES[category];

  // Emneknaggar kjem som kommaskild tekst (skjema) eller liste (chat)
  const tags = Array.isArray(input.tags) ? input.tags : String(input.tags ?? "").split(",");

  return {
    category,
    title,
    provider: text("provider", 200),
    code: text("code", 500),
    url: matching("url", /^https?:\/\//i),
    notes: text("notes"),
    // Datofelt kategorien ikkje har, blir aldri lagra
    expires_at: config.dateLabel ? matching("expires_at", ISO_DATE) : null,
    purchased_at: config.hasPurchaseDate ? matching("purchased_at", ISO_DATE) : null,
    // Framandnøklane i databasen sikrar at begge peikar innanfor eigen husstand
    parent_id: matching("parent_id", UUID),
    owner_id: matching("owner_id", UUID),
    tags: [...new Set(tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean))].slice(0, 20),
  };
}
