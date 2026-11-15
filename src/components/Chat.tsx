"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveEntries } from "@/app/(app)/actions";
import { CATEGORIES, PROPOSALS_MARKER, type EntryDraft } from "@/lib/entries";

type Message = {
  role: "user" | "assistant";
  content: string;
  proposals?: EntryDraft[]; // oppføringar Claude føreslår å leggje inn
  saved?: number; // kor mange av dei som vart lagra
};

// Historikken til API-et er rein tekst: fortel òg kva som vart føreslått og om det vart lagra
const toApiMessage = ({ role, content, proposals, saved }: Message) => ({
  role,
  content: proposals
    ? `${content}\n[Forslag vist til brukaren: ${proposals.map((p) => p.title).join("; ")} – ${
        saved ? "lagra" : "ikkje lagra enno"
      }]`
    : content,
});

// Forslag frå Claude: brukaren kan fjerne enkeltlinjer og må sjølv trykkje lagre
function Proposals({ message, onChange }: { message: Message; onChange: (patch: Partial<Message>) => void }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const drafts = message.proposals ?? [];

  if (message.saved) return <p className="self-start text-sm text-muted">✓ {message.saved} lagt til i oversikta</p>;
  if (drafts.length === 0) return null;

  const save = () =>
    startTransition(async () => {
      const result = await saveEntries(drafts);
      if (result.error) setError(result.error);
      else onChange({ saved: drafts.length });
    });

  return (
    <div className="card flex w-full max-w-[88%] flex-col gap-2 self-start p-3">
      <ul className="flex flex-col divide-y divide-border">
        {drafts.map((draft, index) => (
          <li key={index} className="flex items-start gap-2 py-2 text-sm">
            <span aria-hidden>{CATEGORIES[draft.category].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold break-words">{draft.title}</p>
              {/* Dei viktigaste felta på éi linje */}
              <p className="text-muted break-words">
                {[
                  CATEGORIES[draft.category].singular,
                  draft.provider,
                  draft.code,
                  draft.purchased_at && `kjøpt ${draft.purchased_at}`,
                  draft.expires_at && `${CATEGORIES[draft.category].dateLabel?.toLowerCase()} ${draft.expires_at}`,
                  draft.owner_name ?? "Felles",
                  draft.parent_title && `via ${draft.parent_title}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {draft.notes && <p className="whitespace-pre-line break-words">{draft.notes}</p>}
            </div>
            <button
              onClick={() => onChange({ proposals: drafts.filter((_, i) => i !== index) })}
              aria-label={`Fjern ${draft.title}`}
              className="btn-ghost min-h-8 px-2.5 text-xs"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button onClick={save} disabled={pending} className="btn-primary">
        {pending ? "Lagrar …" : `Legg til ${drafts.length} ${drafts.length === 1 ? "oppføring" : "oppføringar"}`}
      </button>
    </div>
  );
}

const SUGGESTIONS = [
  "Har me nokon rabattkodar som går ut snart?",
  "Kva reiseforsikring har me, og kva er polisenummeret?",
  "Legg inn desse tinga: Dr. Martens 1460 str. 43 kjøpt i oktober, Bosch oppvaskmaskin",
];

// Enkel chat mot /api/chat. Svaret blir strøyma inn i den siste meldinga.
export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Blokk-kropp med vilje: scrollIntoView returnerer eit Promise i nyare nettlesarar,
  // og ein effekt må ikkje returnere noko anna enn ein oppryddingsfunksjon.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Oppdaterer éi melding (standard: den siste, altså svaret som blir strøyma inn)
  const patchMessage = (patch: Partial<Message>, index = -1) =>
    setMessages((current) => current.map((m, i) => (i === (index + current.length) % current.length ? { ...m, ...patch } : m)));

  async function send(text: string) {
    const question = text.trim();
    if (!question || busy) return;

    const history: Message[] = [...messages, { role: "user", content: question }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Tomme (feila) svar blir ikkje sende med i historikken
        body: JSON.stringify({ messages: history.filter((m) => m.content).map(toApiMessage) }),
      });
      if (!response.ok || !response.body) {
        patchMessage({ content: (await response.text()) || "Noko gjekk gale." });
        return;
      }

      // Les strøymen bit for bit; teksten kjem først, eventuelle forslag (JSON) etter markøren
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let raw = "";
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        raw += chunk.value;
        patchMessage({ content: raw.split(PROPOSALS_MARKER)[0] });
      }
      const [, json] = raw.split(PROPOSALS_MARKER);
      if (json) patchMessage({ proposals: JSON.parse(json) });
    } catch {
      patchMessage({ content: "Fekk ikkje kontakt med serveren." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-3 py-6">
          <h1 className="text-xl font-bold">Spør Claude</h1>
          <p className="text-muted">Claude kan slå opp i alt de har lagra, og leggje inn nye ting frå ei liste. Prøv til dømes:</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} onClick={() => send(suggestion)} className="card px-4 py-3 text-left text-sm hover:border-accent">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {messages.map((message, index) => (
            <li key={index} className="flex flex-col gap-2">
              <p
                className={`max-w-[88%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words ${
                  message.role === "user"
                    ? "self-end rounded-br-md bg-accent text-accent-text"
                    : "card self-start rounded-bl-md"
                }`}
              >
                {message.content || <span className="animate-pulse text-muted">Tenkjer …</span>}
              </p>
              {message.proposals && <Proposals message={message} onChange={(patch) => patchMessage(patch, index)} />}
            </li>
          ))}
        </ul>
      )}
      <div ref={bottomRef} />

      {/* Skrivefeltet står fast over botn-fana på mobil */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(input);
        }}
        className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] flex items-end gap-2 bg-bg py-2 sm:bottom-0"
      >
        {/* Tekstområde slik at innlimte lister held på linjeskifta; Enter sender, Shift+Enter gir ny linje */}
        <textarea
          className="field resize-none"
          rows={Math.min(6, input.split("\n").length)}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              send(input);
            }
          }}
          placeholder="Spør, eller lim inn ei liste …"
          aria-label="Melding"
          maxLength={20000}
        />
        <button disabled={busy || !input.trim()} className="btn-primary shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
