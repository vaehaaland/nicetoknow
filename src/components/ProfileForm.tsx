"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/(app)/actions";
import { Avatar } from "./Avatar";

const AVATAR_SIZE = 128; // px – held data-URL-en på nokre få kB

// Skalerer og kvadrat-kuttar biletet i nettlesaren, og returnerer ein JPEG data-URL
async function toAvatarDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = AVATAR_SIZE;
  canvas
    .getContext("2d")!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
  return canvas.toDataURL("image/jpeg", 0.85);
}

type Props = { displayName: string | null; avatar: string | null };

// Namn + profilbilete for innlogga brukar
export function ProfileForm({ displayName, avatar }: Props) {
  const [preview, setPreview] = useState<string>(); // nytt, ulagra bilete
  const [message, setMessage] = useState<{ text: string; isError: boolean }>();
  const [pending, startTransition] = useTransition();

  async function pickImage(file: File | undefined) {
    if (!file) return;
    try {
      setPreview(await toAvatarDataUrl(file));
    } catch {
      setMessage({ text: "Kunne ikkje lese biletet.", isError: true });
    }
  }

  const save = (formData: FormData) =>
    startTransition(async () => {
      const result = await updateProfile(formData);
      setMessage(result.error ? { text: result.error, isError: true } : { text: "Lagra ✓", isError: false });
    });

  return (
    <form action={save} className="card flex flex-col gap-3 p-5">
      <h2 className="font-semibold">Profilen din</h2>
      <div className="flex items-center gap-4">
        <Avatar name={displayName ?? "?"} src={preview ?? avatar} size={64} />
        <label className="btn-ghost cursor-pointer">
          Vel bilete
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pickImage(e.target.files?.[0])} />
        </label>
      </div>
      {preview && <input type="hidden" name="avatar" value={preview} />}
      <label className="flex flex-col gap-1 text-sm font-medium">
        Namn
        <input className="field" name="display_name" defaultValue={displayName ?? ""} maxLength={40} required placeholder="Fornamnet ditt" />
      </label>
      {message && <p className={`text-sm ${message.isError ? "text-danger" : "text-accent"}`}>{message.text}</p>}
      <button disabled={pending} className="btn-primary self-start px-6">
        {pending ? "Lagrar …" : "Lagre profil"}
      </button>
    </form>
  );
}
