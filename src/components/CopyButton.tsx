"use client";

import { useState } from "react";
import { Icon } from "./Icon";

// Ikonknapp som kopierer ein verdi til utklippstavla og gir ei kort kvittering
export function CopyButton({ value, label = "Kopier" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={copy} aria-label={copied ? "Kopiert" : label} title={label} className="btn-icon">
      <Icon name={copied ? "check" : "content_copy"} size={20} />
    </button>
  );
}
