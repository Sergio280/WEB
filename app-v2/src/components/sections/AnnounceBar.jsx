// Barra superior de anuncio (gradiente). Copy verbatim de la home.
export default function AnnounceBar() {
  return (
    <div className="relative z-50 border-b border-brand-500/20 bg-gradient-to-r from-ink-900 via-brand-800/40 to-ink-900 text-center text-[0.82rem] font-semibold tracking-wide text-slate-200">
      <div className="px-5 py-2.5">
        🎁 <strong className="text-white">14 días GRATIS</strong> — Prueba BIMS sin tarjeta · Revit 2024/2025/2026/2027
        <a href="#trial" className="ml-2 text-brand-300 underline-offset-2 hover:text-white hover:underline">
          Empezar trial →
        </a>
      </div>
    </div>
  );
}
