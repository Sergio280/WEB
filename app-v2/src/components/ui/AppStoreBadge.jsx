import { APPSTORE_URL } from '../../data/nav.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Sello de confianza "Verificado en el Autodesk App Store". Enlaza a la ficha
// oficial del idioma activo. Señal de legitimidad (Autodesk revisó el plugin)
// que combate la duda de seguridad / el aviso de SmartScreen. NO es el CTA
// principal — la conversión sigue siendo el formulario de prueba.
//
// Solo TEXTO + ✓: no se usa el logo de Autodesk para no incurrir en un problema
// de marca (misma razón por la que se quitó el logo de Revit del plugin). Si más
// adelante se consigue el badge oficial de publisher, se sustituye aquí.
export default function AppStoreBadge({ className = '' }) {
  const { lang, t } = useLang();
  const url = APPSTORE_URL[lang] || APPSTORE_URL.es;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track('appstore_badge_click', { lang })}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 transition-colors hover:border-brand-500/40 hover:text-white ${className}`}
    >
      <span className="font-bold text-accent-green">✓</span>
      <span>{t.appStore.badge}</span>
      <span aria-hidden="true" className="text-slate-500">→</span>
    </a>
  );
}
