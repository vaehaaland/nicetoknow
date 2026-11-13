"use client";

import { useEffect, useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Har me nokon rabattkodar som går ut snart?",
  "Kva reiseforsikring har me, og kva er polisenummeret?",
  "Kva medlemskap har me?",
];

// Enkel chat mot /api/chat. Svaret blir strøyma inn i den siste meldinga.
export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ block: "end" }), [messages]);

  // Legg tekst til den siste (assistent-)meldinga
  const appendToLast = (text: string) =>
    setMessages((current) => {
      const last = current[current.length - 1];
      return [...current.slice(0, -1), { ...last, content: last.content + text }];
    });

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
        body: JSON.stringify({ messages: history.filter((m) => m.content) }),
      });
      if (!response.ok || !response.body) {
        appendToLast((await response.text()) || "Noko gjekk gale.");
        return;
      }

      // Les strøymen bit for bit
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        appendToLast(chunk.value);
      }
    } catch {
      appendToLast("Fekk ikkje kontakt med serveren.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-3 py-6">
          <h1 className="text-xl font-bold">Spør Claude</h1>
          <p className="text-muted">Claude kan slå opp i alt de har lagra. Prøv til dømes:</p>
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
            <li
              key={index}
              className={`max-w-[88%] rounded-2xl px-4 py-2.5 whitespace-pre-wrap break-words ${
                message.role === "user"
                  ? "self-end rounded-br-md bg-accent text-accent-text"
                  : "card self-start rounded-bl-md"
              }`}
            >
              {message.content || <span className="animate-pulse text-muted">Tenkjer …</span>}
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
        className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] flex gap-2 bg-bg py-2 sm:bottom-0"
      >
        <input
          className="field"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Skriv eit spørsmål …"
          aria-label="Melding"
          maxLength={4000}
        />
        <button disabled={busy || !input.trim()} className="btn-primary shrink-0">
          Send
        </button>
      </form>
    </div>
  );
}
