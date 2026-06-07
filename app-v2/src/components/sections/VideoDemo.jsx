import { useState } from 'react';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { YOUTUBE_ID } from '../../data/nav.js';
import { track } from '../../lib/track.js';
import { useLang } from '../../i18n/LanguageProvider.jsx';

// Facade del video: muestra la miniatura y carga el iframe sólo al hacer clic
// (evita bloquear la primera pintura). Mismo comportamiento que la home.
export default function VideoDemo() {
  const { t } = useLang();
  const [playing, setPlaying] = useState(false);

  return (
    <Section id="video-demo" className="pt-10">
      <Reveal className="text-center">
        <h2 className="section-title">{t.videoDemo.title}</h2>
        <p className="mt-2 text-slate-400">{t.videoDemo.subtitle}</p>
      </Reveal>

      <Reveal delay={0.1} className="mx-auto mt-8 max-w-4xl">
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 shadow-glow-lg">
          {playing ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
              title={t.videoDemo.iframeTitle}
              allow="accelerated-feedback; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => {
                setPlaying(true);
                track('video_play', { video: 'demo' });
              }}
              className="group absolute inset-0 h-full w-full"
              aria-label={t.videoDemo.playAria}
            >
              <img
                src={`https://i.ytimg.com/vi/${YOUTUBE_ID}/maxresdefault.jpg`}
                alt={t.videoDemo.thumbAlt}
                className="h-full w-full object-cover"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/20">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600 shadow-2xl transition-transform group-hover:scale-110">
                  <span className="ml-1.5 border-y-[14px] border-l-[22px] border-y-transparent border-l-white" />
                </span>
              </span>
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-sm text-slate-500">
          {t.videoDemo.ctaPre}
          <a href="#trial" className="font-semibold text-brand-300 hover:text-white">
            {t.videoDemo.ctaLink}
          </a>
        </p>
      </Reveal>
    </Section>
  );
}
