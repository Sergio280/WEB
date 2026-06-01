// Marco de ventana de escritorio (mockup) con barra de título y pestaña "BIMS".
export default function WindowFrame({ title = 'Autodesk Revit', tab = 'BIMS', children, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-glow-lg ${className}`}>
      {/* Barra de título */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-ink-700/80 px-4 py-2.5">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="ml-3 truncate text-xs font-medium text-slate-400">{title}</span>
      </div>
      {/* Cinta de pestañas (ribbon) con BIMS activo */}
      <div className="flex items-center gap-1 border-b border-white/10 bg-ink-800 px-3 pt-2">
        {['Arquitectura', 'Estructura', tab, 'Vista'].map((t) => (
          <span
            key={t}
            className={`rounded-t-md px-3 py-1.5 text-xs font-semibold ${
              t === tab ? 'bg-brand-500/15 text-brand-300 ring-1 ring-inset ring-brand-500/30' : 'text-slate-500'
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
