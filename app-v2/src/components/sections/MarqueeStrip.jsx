import Marquee from '../ui/Marquee.jsx';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Cinta animada con TODOS los botones reales de la cinta BIMS en Revit.
export default function MarqueeStrip() {
  const { t } = useLang();
  return (
    <div className="border-y border-white/10 bg-ink-900/40 py-6">
      <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-slate-500">
        {t.marquee.heading}
      </p>
      <Marquee items={t.marquee.commands} />
    </div>
  );
}
