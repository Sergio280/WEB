// Cinta horizontal en bucle (CSS animation). Duplica los items para loop seamless.
export default function Marquee({ items, className = '' }) {
  return (
    <div className={`group relative flex overflow-hidden ${className}`}>
      {/* fades laterales */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink-950 to-transparent" />
      <div className="flex shrink-0 animate-marquee items-center gap-4 pr-4 group-hover:[animation-play-state:paused]">
        {[...items, ...items].map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/[0.03] px-5 py-2 text-sm font-semibold text-slate-200"
          >
            <span className="text-brand-400">◆</span>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
