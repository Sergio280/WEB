import Marquee from '../ui/Marquee.jsx';
import { RIBBON_COMMANDS } from '../../data/commands.js';

// Cinta animada con TODOS los botones reales de la cinta BIMS en Revit.
export default function MarqueeStrip() {
  return (
    <div className="border-y border-white/10 bg-ink-900/40 py-6">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        Más de 30 comandos en tu cinta de Revit
      </p>
      <Marquee items={RIBBON_COMMANDS} />
    </div>
  );
}
