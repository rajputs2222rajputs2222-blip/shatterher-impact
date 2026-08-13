export function GlowBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background" />
      <div className="blob-a glow-pulse absolute -left-[18%] top-[-18%] h-[80vh] w-[80vh] rounded-full bg-primary/80 blur-[120px]" />
      <div className="blob-b absolute right-[-14%] top-[6%] h-[65vh] w-[65vh] rounded-full bg-accent/45 blur-[130px]" />
      <div className="blob-c glow-pulse absolute bottom-[-22%] left-[22%] h-[85vh] w-[85vh] rounded-full bg-primary/65 blur-[140px]" />
      <div className="blob-b absolute right-[10%] bottom-[-10%] h-[45vh] w-[45vh] rounded-full bg-primary/50 blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent,color-mix(in_oklch,var(--background)_58%,transparent))]" />
    </div>
  );
}
