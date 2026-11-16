"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveEntries } from "@/app/(app)/actions";
import { CATEGORIES, PROPOSALS_MARKER, type EntryDraft } from "@/lib/entries";
import { CHAT_IMAGE, scaleImage } from "@/lib/image";
import { Icon } from "./Icon";

type Message = {
  role: "user" | "assistant";
  content: string;
  images?: string[]; // vedlagde bilete som data-URL-ar (berre brukarmeldingar)
  proposals?: EntryDraft[]; // oppføringar Claude føreslår å leggje inn
  saved?: number; // kor mange av dei som vart lagra
};

// Historikken til API-et er rein tekst: fortel òg kva som vart føreslått og om det vart lagra
const toApiMessage = ({ role, content, images, proposals, saved }: Message) => ({
  role,
  images,
  content: proposals
    ? `${content}\n[Forslag vist til brukaren: ${proposals.map((p) => p.title).join("; ")} – ${
        saved ? "lagra" : "ikkje lagra enno"
      }]`
    : content,
});

// Rad med småbilete; med `onRemove` får kvart bilete ein fjern-knapp
function Thumbnails({ images, className = "", onRemove }: { images: string[]; className?: string; onRemove?: (index: number) => void }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {images.map((src, index) => (
        <li key={index} className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- data-URL, ingenting å optimalisere */}
          <img src={src} alt={`Vedlegg ${index + 1}`} className="size-20 rounded-lg border border-border object-cover" />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              aria-label={`Fjern vedlegg ${index + 1}`}
              className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-text text-bg"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

// Forslag frå Claude: brukaren kan fjerne enkeltlinjer og må sjølv trykkje lagre
function Proposals({ message, onChange }: { message: Message; onChange: (patch: Partial<Message>) => void }) {
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const drafts = message.proposals ?? [];

  if (message.saved) return <p className="flex items-center gap-1.5 self-start text-sm text-muted"><Icon name="check" size={18} /> {message.saved} lagt til i oversikta</p>;
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
            <Icon name={CATEGORIES[draft.category].icon} size={20} className="mt-0.5 text-muted" />
            <div className="min-w-0 flex-1">
              <p className="font-medium break-words">{draft.title}</p>
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
              className="btn-icon -mr-2"
            >
              <Icon name="close" size={20} />
            </button>
          </li>
        ))}
      </ul>
      {error && <p className="text-sm text-danger">{error}</p>}
      <button onClick={save} disabled={pending} className="btn-primary self-end">
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
  const [images, setImages] = useState<string[]>([]); // bilete som ventar på å bli sende
  const [notice, setNotice] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Blokk-kropp med vilje: scrollIntoView returnerer eit Promise i nyare nettlesarar,
  // og ein effekt må ikkje returnere noko anna enn ein oppryddingsfunksjon.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Oppdaterer éi melding (standard: den siste, altså svaret som blir strøyma inn)
  const patchMessage = (patch: Partial<Message>, index = -1) =>
    setMessages((current) => current.map((m, i) => (i === (index + current.length) % current.length ? { ...m, ...patch } : m)));

  // Skalerer ned valde bilete i nettlesaren før dei blir lagde ved
  async function attach(files: FileList | null) {
    setNotice(undefined);
    try {
      const scaled = await Promise.all([...(files ?? [])].map((file) => scaleImage(file, { maxSide: CHAT_IMAGE.maxSide, quality: 0.8 })));
      const next = [...images, ...scaled];
      if (next.length > CHAT_IMAGE.perMessage) setNotice(`Maks ${CHAT_IMAGE.perMessage} bilete per melding.`);
      setImages(next.slice(0, CHAT_IMAGE.perMessage));
    } catch {
      setNotice("Kunne ikkje lese biletet.");
    }
  }

  async function send(text: string) {
    const question = text.trim();
    if ((!question && images.length === 0) || busy) return;

    const history: Message[] = [...messages, { role: "user", content: question, images }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setImages([]);
    setNotice(undefined);
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Tomme (feila) svar blir ikkje sende med i historikken
        body: JSON.stringify({ messages: history.filter((m) => m.content || m.images?.length).map(toApiMessage) }),
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
          <h1 className="text-[28px] leading-9">Spør Claude</h1>
          <p className="text-muted">Claude kan slå opp i alt de har lagra, og leggje inn nye ting frå ei liste eller eit bilete av ei kvittering. Prøv til dømes:</p>
          <div className="flex flex-col gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} onClick={() => send(suggestion)} className="card state-layer px-4 py-3 text-left text-sm">
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-3">
          {messages.map((message, index) => (
            <li key={index} className="flex flex-col gap-2">
              {message.images && message.images.length > 0 && <Thumbnails images={message.images} className="justify-end" />}
              {(message.content || message.role === "assistant") && (
                <p
                  className={`max-w-[88%] rounded-[20px] px-4 py-2.5 whitespace-pre-wrap break-words ${
                    message.role === "user"
                      ? "self-end rounded-br-sm bg-primary-container text-on-primary-container"
                      : "self-start rounded-bl-sm bg-container-high"
                  }`}
                >
                  {message.content || <span className="animate-pulse text-muted">Tenkjer …</span>}
                </p>
              )}
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
        className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] flex flex-wrap items-end gap-2 bg-bg py-2 sm:bottom-0"
      >
        {(images.length > 0 || notice) && (
          <div className="flex w-full flex-col gap-2 pt-1.5">
            <Thumbnails images={images} onRemove={(index) => setImages(images.filter((_, i) => i !== index))} />
            {notice && <p className="text-sm text-danger">{notice}</p>}
          </div>
        )}
        <label className="btn-icon mb-2 cursor-pointer" title="Legg ved bilete">
          <Icon name="photo_camera" />
          <span className="sr-only">Legg ved bilete</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              attach(event.target.files);
              event.target.value = ""; // same bilete kan veljast på nytt
            }}
          />
        </label>
        {/* Tekstområde slik at innlimte lister held på linjeskifta; Enter sender, Shift+Enter gir ny linje */}
        <textarea
          className="min-w-0 flex-1 resize-none rounded-[28px] bg-container-high px-5 py-4 text-base text-text outline-none placeholder:text-muted focus:ring-2 focus:ring-accent"
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
        {/* Fylt ikonknapp for sending */}
        <button
          disabled={busy || (!input.trim() && images.length === 0)}
          aria-label="Send"
          className="state-layer mb-2 flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-text disabled:bg-text/12 disabled:text-text/40"
        >
          <Icon name="send" size={20} />
        </button>
      </form>
    </div>
  );
}
