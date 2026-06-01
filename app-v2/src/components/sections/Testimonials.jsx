import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { WHATSAPP_URL } from '../../data/nav.js';

// Sección honesta — sin testimonios inventados. Copy verbatim de la home.
export default function Testimonials() {
  return (
    <Section>
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="section-title">Aún estamos recogiendo las primeras reseñas</h2>
        <p className="mt-4 text-slate-400">
          BIMS es un producto reciente. En lugar de mostrar testimonios genéricos, preferimos esperar a tener reseñas
          reales con autorización para publicarlas. Si ya lo probaste y quieres ser de los primeros en compartir tu
          experiencia, nos encantaría leerte.
        </p>

        <div className="mt-7">
          <a
            href={`${WHATSAPP_URL}?text=Hola%2C%20quiero%20dejar%20mi%20rese%C3%B1a%20sobre%20BIMS`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            💬 Dejar mi reseña por WhatsApp
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          Mientras tanto, te invitamos a probar el plugin tú mismo con{' '}
          <a href="#trial" className="font-semibold text-brand-300 hover:text-white">14 días gratis</a> y a revisar
          nuestros{' '}
          <a href="#casos" className="font-semibold text-brand-300 hover:text-white">casos de uso documentados</a>.
        </p>
      </Reveal>
    </Section>
  );
}
