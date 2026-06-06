import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { CLIPS } from '../../data/nav.js';

// Lightbox modal que reproduce el clip de YouTube seleccionado.
function Lightbox({ clip, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-4xl"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 20 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-11 right-0 flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white"
          aria-label="Cerrar"
        >
          Cerrar ✕
        </button>
        <div className="aspect-video overflow-hidden rounded-2xl border border-white/15 shadow-glow-lg">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${clip.yt}?autoplay=1&rel=0`}
            title={`BIMS — ${clip.title}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="mt-3 text-center font-display font-bold text-white">{clip.title}</p>
      </motion.div>
    </motion.div>
  );
}

function ClipCard({ clip, onPlay }) {
  const soon = !clip.yt;
  return (
    <button
      onClick={() => !soon && onPlay(clip)}
      disabled={soon}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 glass text-left transition-all duration-300 ${
        soon ? 'cursor-default opacity-70' : 'hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-glow'
      }`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-ink-950">
        {soon ? (
          <div className="eng-grid absolute inset-0 flex items-center justify-center">
            <span className="rounded-full border border-white/15 bg-ink-800/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              Próximamente
            </span>
          </div>
        ) : (
          <>
            <img
              src={`https://i.ytimg.com/vi/${clip.yt}/hqdefault.jpg`}
              alt={clip.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/15">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500/90 shadow-glow transition-transform group-hover:scale-110">
                <span className="ml-1 border-y-[9px] border-l-[15px] border-y-transparent border-l-white" />
              </span>
            </span>
          </>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-base font-bold leading-snug text-white">{clip.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-400">{clip.desc}</p>
      </div>
    </button>
  );
}

export default function Clips() {
  const [active, setActive] = useState(null);

  function play(clip) {
    setActive(clip);
    if (typeof window.gtag === 'function') window.gtag('event', 'clip_play', { clip: clip.title });
  }

  return (
    <Section id="clips">
      <Reveal className="text-center">
        <span className="eyebrow">En acción</span>
        <h2 className="section-title mt-4">BIMS en acción, comando por comando</h2>
        <p className="mt-3 text-slate-400">Clips cortos: mira cada herramienta resolver una tarea real de Revit</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CLIPS.map((clip, i) => (
            <ClipCard key={clip.title} clip={clip} onPlay={play} />
          ))}
        </div>
      </Reveal>

      <AnimatePresence>
        {active && <Lightbox clip={active} onClose={() => setActive(null)} />}
      </AnimatePresence>
    </Section>
  );
}
