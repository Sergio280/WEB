import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';

const DOWNLOAD_URL = 'https://github.com/Sergio280/WEB/releases/latest/download/BIMS_Setup.exe';
const PILLS = ['Windows 10 / 11', 'Revit 2024', 'Revit 2025', 'Revit 2026'];

export default function Download() {
  return (
    <Section id="descargar">
      <Reveal className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-800 to-ink-900 p-10 text-center sm:p-14">
        <div className="eng-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <h2 className="section-title text-white">📥 Descarga BIMS</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            <strong className="text-white">¿Aún no tienes licencia?</strong> Empieza con el trial gratuito de 14 días —
            te enviamos tu clave al instante.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#trial" className="rounded-full bg-accent-emerald px-7 py-3.5 font-bold text-white transition-transform hover:-translate-y-0.5">
              🎁 Activar trial gratis 14 días
            </a>
            <a
              href={DOWNLOAD_URL}
              download
              className="rounded-full border border-white/20 bg-white/5 px-7 py-3.5 font-semibold text-slate-100 transition-colors hover:bg-white/10"
            >
              ⬇ Descargar instalador (requiere clave)
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {PILLS.map((p) => (
              <span key={p} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Privacidad */}
      <Reveal delay={0.1} className="mx-auto mt-8 flex max-w-3xl items-center gap-5 rounded-2xl border border-white/10 glass p-6">
        <span className="text-3xl">🔒</span>
        <div>
          <h3 className="font-display font-bold text-white">Privacidad y Seguridad</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            BIMS solo recopila los datos estrictamente necesarios para activar tu licencia y entregar actualizaciones.
            Toda la información se almacena de forma segura en servidores de Google Cloud. Nunca vendemos ni compartimos
            tus datos con terceros para fines de marketing.{' '}
            <a href="/privacy-policy.html" className="font-semibold text-brand-300 hover:text-white">
              → Leer la Política de Privacidad completa
            </a>
          </p>
        </div>
      </Reveal>
    </Section>
  );
}
