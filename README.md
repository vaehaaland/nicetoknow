# NiceToKnow

Ein privat, mobilvenleg web-app der to personar samlar rabattkodar, medlemskap, forsikringar og anna
som er kjekt å ha – med raskt søk og ein Claude-chat som kan slå opp i alt som er lagra.

## Kva som finst

- **Oversikt** (`/`): fritekstsøk, kategorifilter, kopier-knapp på kodar, varsel om utløp/fornying.
- **Spør Claude** (`/chat`): chat som får oppføringane dykkar som kontekst og svarar ut frå dei.
- **Innstillingar** (`/innstillingar`): invitasjonskode til partnaren, namn på husstanden, logg ut.
- **Deling**: kvar brukar høyrer til éin *husstand*. Row Level Security i Postgres gjer at berre
  medlemmer ser og endrar oppføringane.

## Teknologi

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Auth + Postgres) · Claude API (`@anthropic-ai/sdk`)

## Kome i gang

1. **Supabase**: opprett eit prosjekt og køyr `supabase/migrations/20261113120000_init.sql`
   (SQL Editor, eller `supabase db push`).
2. **Miljøvariablar**: kopier `.env.example` til `.env.local` og fyll inn verdiane.
   `ANTHROPIC_API_KEY` er valfri – utan han er alt unnateke chatten i bruk.
3. **Køyr**:

   ```bash
   npm install
   npm run dev
   ```

4. Opprett konto, lag ein husstand, og del invitasjonskoden under *Innstillingar* med partnaren.

Ved utrulling (t.d. Vercel): legg inn dei same miljøvariablane, og set *Site URL* og
`https://<domene>/auth/callback` under **Authentication → URL Configuration** i Supabase slik at
lenkja i stadfestings-e-posten fungerer.

## Struktur

| Sti | Innhald |
| --- | --- |
| `src/lib/entries.ts` | Datamodell, kategori-konfig og søkelogikk (éi kjelde til sanning) |
| `src/lib/supabase/` | Supabase-klientar for nettlesar, server og proxy |
| `src/lib/household.ts` | Oppslag av innlogga brukar + husstand |
| `src/proxy.ts` | Fornyar økta og sender uinnlogga til `/login` |
| `src/app/(app)/` | Innlogga sider + server-handlingar (`actions.ts`) |
| `src/app/api/chat/route.ts` | Strøymande chat-endepunkt mot Claude |
| `supabase/migrations/` | Tabellar, RLS-policyar og RPC-ar |

## Verdt å vite

- Chatten brukar `claude-opus-5-5` som standard. Set `ANTHROPIC_MODEL=claude-haiku-5-5` for
  vesentleg lågare kostnad per spørsmål.
- Ikkje lagre passord eller BankID-/kortdetaljar her – appen er laga for kodar, nummer og notat.
