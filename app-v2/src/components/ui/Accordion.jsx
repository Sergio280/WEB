import { useState } from 'react';

// Acordeón animado (altura) tipo Radix. Sólo un item abierto a la vez.
//
// La altura la animaba framer-motion con height: 0 → auto, que es justo lo que
// CSS no sabía hacer durante años. Ahora sí: una rejilla de una fila que pasa de
// 0fr a 1fr interpola sola, sin medir nada en JavaScript. El hijo lleva
// overflow-hidden para que el texto se recorte mientras se pliega.
export default function Accordion({ items }) {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10 glass">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition-colors hover:bg-white/[0.03]"
              aria-expanded={isOpen}
            >
              <span className={`font-semibold ${isOpen ? 'text-brand-300' : 'text-slate-100'}`}>{it.q}</span>
              <span
                aria-hidden="true"
                className={`shrink-0 text-brand-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
              >
                ▾
              </span>
            </button>
            <div
              className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{it.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
