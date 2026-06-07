import { useLang } from '../../i18n/LanguageProvider.jsx';

// Barra superior de anuncio (gradiente).
export default function AnnounceBar() {
  const { t } = useLang();
  return (
    <div className="relative z-50 border-b border-brand-500/20 bg-gradient-to-r from-ink-900 via-brand-800/40 to-ink-900 text-center text-[0.82rem] font-semibold tracking-wide text-slate-200">
      <div className="px-5 py-2.5">
        {t.announce.gift} <strong className="text-white">{t.announce.free}</strong>{t.announce.desc}
        <a href="#trial" className="ml-2 text-brand-300 underline-offset-2 hover:text-white hover:underline">
          {t.announce.cta}
        </a>
      </div>
    </div>
  );
}
