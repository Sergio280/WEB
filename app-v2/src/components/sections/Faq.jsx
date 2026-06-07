import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import Accordion from '../ui/Accordion.jsx';
import { useLang } from '../../i18n/LanguageProvider.jsx';

export default function Faq() {
  const { t } = useLang();
  return (
    <Section id="faq">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="eyebrow">{t.faq.eyebrow}</span>
        <h2 className="section-title mt-4">{t.faq.title}</h2>
      </Reveal>

      <Reveal delay={0.1} className="mx-auto mt-10 max-w-3xl">
        <Accordion items={t.faq.items} />
      </Reveal>
    </Section>
  );
}
