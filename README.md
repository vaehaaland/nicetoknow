# NiceToKnow

Ein privat, mobilvenleg web-app der to personar samlar rabattkodar, medlemskap, forsikringar og anna
som er kjekt å ha – med raskt søk og ein Claude-chat som kan slå opp i alt som er lagra.

## Kva som finst

- **Oversikt** (`/`): fritekstsøk, kategorifilter, kopier-knapp på kodar, varsel om utløp/fornying.
- **Spør Claude** (`/chat`): chat som får oppføringane dykkar som kontekst og svarar ut frå dei.
- **Innstillingar** (`/innstillingar`): invitasjonskode til partnaren, namn på husstanden, logg ut.
- **Fordelar og eigar**: ei oppføring kan høyre til eit medlemskap («Via Fagforeininga») og gjelde
  éin av dykk eller vere felles. Kvar brukar har namn og profilbilete.
- **Deling**: kvar brukar høyrer til éin *husstand*. Row Level Security i Postgres gjer at berre
  medlemmer ser og endrar oppføringane.

## Teknologi

Next.js 16 (App Router, TypeScript) · Tailwind CSS 4 · Supabase (Auth + Postgres) · Claude API (`@anthropic-ai/sdk`)

## Kome i gang

1. **Supabase**: opprett eit prosjekt og køyr filene i `supabase/migrations/` i rekkjefølgje
   (SQL Editor, eller `supabase db push`). Nye migreringar må køyrast *før* koden som brukar dei
   blir rulla ut.
2. **Miljøvariablar**: kopier `.env.example` til `.env.local` og fyll inn verdiane.
   `ANTHROPIC_API_KEY` er valfri – utan han er alt unnateke chatten i bruk.
3. **Køyr**:

   ```bash
   npm install
   npm run dev
   ```

4. Opprett konto, lag ein husstand, og del invitasjonskoden under *Innstillingar* med partnaren.

## Utrulling til Vercel

Appen treng ingen eigen Vercel-konfigurasjon – Next.js blir oppdaga automatisk.

1. Gå til [vercel.com/new](https://vercel.com/new) og importer GitHub-repoet `nicetoknow`.
2. Legg inn miljøvariablane under **Environment Variables** (Production og Preview):

   | Namn | Verdi |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://<prosjekt-ref>.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
   | `ANTHROPIC_API_KEY` | API-nøkkel frå Claude Console (marker som *Sensitive*) |
   | `ANTHROPIC_MODEL` | valfri, t.d. `claude-haiku-5-5` |

3. Trykk **Deploy**. Vercel byggjer produksjon frå `main` og ei førehandsvising for kvar pull request.
4. I Supabase, under **Authentication → URL Configuration**:
   - set **Site URL** til produksjonsadressa, t.d. `https://nicetoknow.vercel.app`
   - legg `https://nicetoknow.vercel.app/auth/callback` til under **Redirect URLs**

   Utan dette peikar lenkja i stadfestings-e-posten til `localhost`.
5. Opprett konto på produksjonsadressa, lag husstanden og del invitasjonskoden med partnaren.

`NEXT_PUBLIC_`-variablane blir bakte inn ved bygging, så endrar du dei må du rulle ut på nytt.

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
