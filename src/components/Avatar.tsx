// Rundt profilbilete, eller forbokstav når biletet manglar
export function Avatar({ name, src, size = 20 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: size * 0.5 };
  return src ? (
    // Data-URL frå databasen – next/image gir ingenting her
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" style={style} className="shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden
      style={style}
      className="flex shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-text"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
