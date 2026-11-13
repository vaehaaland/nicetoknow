"use client";

import { useState } from "react";

// Kopierer ein verdi til utklippstavla og gir ei kort kvittering
export function CopyButton({ value, label = "Kopier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={copy} className="btn-ghost min-h-9 shrink-0 px-3 text-xs">
      {copied ? "Kopiert ✓" : label}
    </button>
  );
}
