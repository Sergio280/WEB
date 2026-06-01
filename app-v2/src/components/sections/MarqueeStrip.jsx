import Marquee from '../ui/Marquee.jsx';
import { MARQUEE_CLAIMS } from '../../data/metrics.js';

export default function MarqueeStrip() {
  return (
    <div className="border-y border-white/10 bg-ink-900/40 py-6">
      <Marquee items={MARQUEE_CLAIMS} />
    </div>
  );
}
