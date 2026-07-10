import { EMAIL, WHATSAPP_URL } from '../../data/nav.js';
import AppStoreBadge from '../ui/AppStoreBadge.jsx';
import { useLang } from '../../i18n/LanguageProvider.jsx';

export default function Footer() {
  const { t } = useLang();
  const f = t.footer;
  return (
    <footer id="contacto" className="border-t border-white/10 bg-ink-900/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="flex items-center gap-2.5 font-display text-lg font-extrabold text-white">
            <img src="/icono/favicon-32.png" alt="BIMS" className="h-6 w-6 rounded" />
            BIMS
          </div>
          <p className="mt-3 text-sm text-slate-400">{f.tagline}</p>
          <p className="mt-1 text-sm text-slate-500">{f.version}</p>
          <AppStoreBadge className="mt-4" />
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">{f.colProduct}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {f.product.map((l) => (
              <li key={l.label}><a href={l.href} className="text-slate-400 hover:text-white">{l.label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">{f.colPricing}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {f.pricing.map((l) => (
              <li key={l.label}><a href={l.href} className="text-slate-400 hover:text-white">{l.label}</a></li>
            ))}
            <li><a href={`mailto:${EMAIL}?subject=${f.enterpriseSubject}`} className="text-slate-400 hover:text-white">{f.pricingEnterprise}</a></li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">{f.colLegal}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {f.legal.map((l) => (
              <li key={l.label}><a href={l.href} className="text-slate-400 hover:text-white">{l.label}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold text-brand-300">{f.colContact}</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="text-slate-400">📧 {EMAIL}</li>
            <li>
              📱{' '}
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-slate-400 underline hover:text-white">
                +51 989 455 558
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-6 text-center text-xs text-slate-500">
        <p>{f.copyright}</p>
        <p className="mt-1">{f.trademark}</p>
      </div>
    </footer>
  );
}
