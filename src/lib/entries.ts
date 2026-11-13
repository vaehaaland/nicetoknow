// Datamodell + kategori-konfig. Éi kjelde til sanning for skjema, kort og chat.

export const CATEGORY_IDS = ["discount", "membership", "insurance", "other"] as const;
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
  "id, category, title, provider, code, url, notes, expires_at, tags, parent_id, owner_id, updated_at";

type CategoryConfig = {
  label: string; // namn i fleirtal (filter)
  singular: string;
  icon: string;
  codeLabel: string; // kva «code»-feltet tyder for kategorien
  dateLabel: string; // kva «expires_at» tyder for kategorien
  badge: string; // Tailwind-klassar for merkelappen
};

export const CATEGORIES: Record<CategoryId, CategoryConfig> = {
  discount: {
    label: "Rabattkodar",
    singular: "Rabattkode",
    icon: "🏷️",
    codeLabel: "Rabattkode",
    dateLabel: "Gyldig til",
    badge: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  },
  membership: {
    label: "Medlemskap",
    singular: "Medlemskap",
    icon: "🪪",
    codeLabel: "Medlemsnummer",
    dateLabel: "Fornyast",
    badge: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  },
  insurance: {
    label: "Forsikringar",
    singular: "Forsikring",
    icon: "🛡️",
    codeLabel: "Polise-/avtalenummer",
    dateLabel: "Fornyast",
    badge: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  other: {
    label: "Anna",
    singular: "Anna",
    icon: "📌",
    codeLabel: "Referanse / kode",
    dateLabel: "Dato",
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
