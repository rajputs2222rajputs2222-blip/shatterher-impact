export function GlowBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="blob-a absolute -left-[20%] top-[-15%] h-[70vh] w-[70vh] rounded-full bg-primary/45 blur-[130px]" />
      <div className="blob-b absolute right-[-15%] top-[10%] h-[60vh] w-[60vh] rounded-full bg-accent/25 blur-[140px]" />
      <div className="blob-c absolute bottom-[-20%] left-[25%] h-[75vh] w-[75vh] rounded-full bg-primary/35 blur-[150px]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent,color-mix(in_oklch,var(--background)_82%,transparent))]" />
    </div>
  );
}
