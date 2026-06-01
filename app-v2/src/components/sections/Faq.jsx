import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import Accordion from '../ui/Accordion.jsx';
import { FAQ } from '../../data/faq.js';

export default function Faq() {
  return (
    <Section id="faq">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">FAQ</span>
        <h2 className="section-title mt-4">Preguntas frecuentes</h2>
      </Reveal>

      <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl">
        <Accordion items={FAQ} />
      </Reveal>
    </Section>
  );
}
