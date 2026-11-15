// Datamodell + kategori-konfig. Éi kjelde til sanning for skjema, kort og chat.

export const CATEGORY_IDS = ["discount", "membership", "insurance", "product", "note", "other"] as const;
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
  icon: string;
  codeLabel: string; // kva «code»-feltet tyder for kategorien
  dateLabel: string | null; // kva «expires_at» tyder for kategorien; null = ingen dato
  hasPurchaseDate?: boolean; // viser feltet «Kjøpt»
  titleHint: string; // døme i tittelfeltet
  badge: string; // Tailwind-klassar for merkelappen
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  discount: {
    label: "Rabattkodar",
    singular: "Rabattkode",
    icon: "🏷️",
    codeLabel: "Rabattkode",
    dateLabel: "Gyldig til",
    titleHint: "10 % hos Zalando",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  },
  membership: {
    label: "Medlemskap",
    singular: "Medlemskap",
    icon: "🪪",
    codeLabel: "Medlemsnummer",
    dateLabel: "Fornyast",
    titleHint: "Fagforbundet",
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  },
  insurance: {
    label: "Forsikringar",
    singular: "Forsikring",
    icon: "🛡️",
    codeLabel: "Polise-/avtalenummer",
    dateLabel: "Fornyast",
    titleHint: "Reiseforsikring",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  product: {
    label: "Ting me eig",
    singular: "Ting",
    icon: "📦",
    codeLabel: "Storleik / modell",
    dateLabel: "Garanti til",
    hasPurchaseDate: true,
    titleHint: "Dr. Martens 1460",
    badge: "bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-200",
  },
  note: {
    label: "Kjekt å vite",
    singular: "Kjekt å vite",
    icon: "💡",
    codeLabel: "Detalj / verdi",
    dateLabel: null,
    titleHint: "Veggmåling i stova",
    badge: "bg-rose-100 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200",
  },
  other: {
    label: "Anna",
    singular: "Anna",
    icon: "📌",
    codeLabel: "Referanse / kode",
    dateLabel: "Dato",
    titleHint: "Wifi-passord på hytta",
    badge: "bg-stone-200 text-stone-800 dark:bg-stone-700 dark:text-stone-100",
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
