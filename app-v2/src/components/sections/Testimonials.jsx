import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { WHATSAPP_URL } from '../../data/nav.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Sección honesta — sin testimonios inventados.
export default function Testimonials() {
  const { t } = useLang();
  const tt = t.testimonials;
  return (
    <Section>
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="section-title">{tt.title}</h2>
        <p className="mt-4 text-slate-400">{tt.desc}</p>

        <div className="mt-7">
          <a
            href={`${WHATSAPP_URL}?text=${tt.whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            {tt.cta}
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          {tt.footerPre}
          <a href="#trial" className="font-semibold text-brand-300 hover:text-white">{tt.footerLink1}</a>
          {tt.footerMid}
          <a href="#casos" className="font-semibold text-brand-300 hover:text-white">{tt.footerLink2}</a>
          {tt.footerPost}
        </p>
      </Reveal>
    </Section>
  );
}
