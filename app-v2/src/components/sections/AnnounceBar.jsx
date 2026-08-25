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
        {t.announce.version && (
          <span className="ml-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[0.72rem] font-semibold text-brand-200 ring-1 ring-brand-400/30">
            ✨ {t.announce.version}
            {/* El detalle se oculta en pantallas estrechas: en móvil la barra ya va
                justa y partir esta píldora en dos líneas descoloca el resto. Lo que
                importa siempre —que hay versión nueva— se ve en cualquier ancho. */}
            {t.announce.versionDetail && (
              <span className="hidden font-normal text-brand-300/90 lg:inline">
                · {t.announce.versionDetail}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
