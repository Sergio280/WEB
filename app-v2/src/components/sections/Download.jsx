import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

const DOWNLOAD_URL = 'https://github.com/Sergio280/WEB/releases/latest/download/BIMS_Setup.exe';

export default function Download() {
  const { t } = useLang();
  const d = t.download;
  return (
    <Section id="descargar">
      <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-800 to-ink-900 p-10 text-center sm:p-14">
        <div className="eng-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <h2 className="section-title text-white">{d.title}</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            <strong className="text-white">{d.descStrong}</strong>{d.descRest}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#trial"
              onClick={() => track('hero_cta_click', { cta: 'trial', context: 'download' })}
              className="rounded-full bg-accent-emerald px-7 py-3.5 font-bold text-white transition-transform hover:-translate-y-0.5"
            >
              {d.ctaTrial}
            </a>
            <a
              href={DOWNLOAD_URL}
              download
              onClick={() => track('download_click')}
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-slate-100 transition-colors hover:bg-white/10"
            >
              {d.ctaDownload}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {d.pills.map((p) => (
              <span key={p} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Aviso SmartScreen — BIMS aún no tiene firma digital (certificado EV) */}
      <Reveal delay={0.05} className="mx-auto mt-8 max-w-3xl rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] p-6">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🛡️</span>
          <div>
            <h3 className="font-display font-bold text-white">
              {d.smartTitle}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {d.smartDesc.pre}<strong className="text-slate-200">{d.smartDesc.strong}</strong>{d.smartDesc.post}
            </p>
            <ol className="mt-4 space-y-2.5">
              {d.smartSteps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-xs font-extrabold text-accent-amber">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              {d.smartFootPre}
              <a href="mailto:soporte@bimsaddin.com" className="font-semibold text-brand-300 hover:text-white">
                soporte@bimsaddin.com
              </a>
              {d.smartFootPost}
            </p>
          </div>
        </div>
      </Reveal>

      {/* Privacidad */}
      <Reveal delay={0.1} className="mx-auto mt-8 flex max-w-3xl items-center gap-5 rounded-2xl border border-white/10 glass p-6">
        <span className="text-3xl">🔒</span>
        <div>
          <h3 className="font-display font-bold text-white">{d.privacyTitle}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            {d.privacyDesc}
            <a href={d.privacyHref} className="font-semibold text-brand-300 hover:text-white">
              {d.privacyLink}
            </a>
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
