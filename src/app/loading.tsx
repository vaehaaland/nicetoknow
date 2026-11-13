// Suspense-plasshaldar medan innlogging og data blir henta (alt innhald er per brukar)
export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-10" role="status" aria-label="Lastar">
      <span className="size-8 animate-spin rounded-full border-4 border-border border-t-accent" />
    </div>
  );
}
