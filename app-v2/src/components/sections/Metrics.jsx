import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { QUICK_METRICS, CHART_TIME, CHART_RADAR, CHART_DONUT } from '../../data/metrics.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const GRID = 'rgba(255,255,255,.08)';
const TICK = 'rgba(203,213,225,.7)';
const BLUE = '#2d7dff';
const GREY = '#64748b';
const GREEN = '#4ade80';

const accentBorder = {
  brand: 'border-brand-500/40',
  emerald: 'border-emerald-400/40',
  violet: 'border-violet-400/40',
};

export default function Metrics() {
  const barData = {
    labels: CHART_TIME.labels,
    datasets: [
      { label: 'Proceso manual (min)', data: CHART_TIME.manual, backgroundColor: GREY, borderRadius: 6 },
      { label: 'Con BIMS (min)', data: CHART_TIME.bims, backgroundColor: BLUE, borderRadius: 6 },
    ],
  };
  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TICK } } },
    scales: {
      x: { grid: { color: GRID }, ticks: { color: TICK, font: { size: 9 } } },
      y: { grid: { color: GRID }, ticks: { color: TICK } },
    },
  };

  const radarData = {
    labels: CHART_RADAR.labels,
    datasets: [
      { label: 'Manual', data: CHART_RADAR.manual, backgroundColor: 'rgba(100,116,139,.2)', borderColor: GREY, pointBackgroundColor: GREY },
      { label: 'BIMS', data: CHART_RADAR.bims, backgroundColor: 'rgba(45,125,255,.22)', borderColor: BLUE, pointBackgroundColor: BLUE },
    ],
  };
  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TICK } } },
    scales: {
      r: {
        angleLines: { color: GRID },
        grid: { color: GRID },
        pointLabels: { color: TICK, font: { size: 10 } },
        ticks: { display: false, stepSize: 25 },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
  };

  const donutData = {
    labels: CHART_DONUT.labels,
    datasets: [{ data: CHART_DONUT.values, backgroundColor: [GREEN, 'rgba(255,255,255,.1)'], borderWidth: 0 }],
  };
  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { position: 'bottom', labels: { color: TICK, font: { size: 11 } } } },
  };

  return (
    <Section id="efectividad">
      <Reveal className="text-center">
        <span className="eyebrow">Eficiencia cuantificada</span>
        <h2 className="section-title mt-4">BIMS vs. procesos manuales</h2>
        <p className="mt-3 text-slate-400">Cifras ancladas a tareas específicas, según el chart de tiempos comparados.</p>
      </Reveal>

      {/* Métricas rápidas */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {QUICK_METRICS.map((m, i) => (
          <Reveal key={m.label} delay={i * 0.1}>
            <div className={`rounded-2xl border ${accentBorder[m.accent]} glass p-6 text-center`}>
              <p className="text-sm text-slate-400">{m.label}</p>
              <p className="mt-2 font-display text-2xl font-extrabold text-white">{m.value}</p>
              <p className="mt-1 text-xs text-slate-500">según chart de tiempos comparados</p>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Reveal className="rounded-2xl border border-white/10 glass p-5 lg:col-span-2">
          <p className="mb-4 text-sm font-bold text-slate-200">Tiempo por tarea (minutos)</p>
          <div className="h-64">
            <Bar data={barData} options={barOpts} />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="rounded-2xl border border-white/10 glass p-5">
          <p className="mb-4 text-sm font-bold text-slate-200">Tiempo recuperado</p>
          <div className="h-64">
            <Doughnut data={donutData} options={donutOpts} />
          </div>
        </Reveal>
      </div>

      <Reveal delay={0.1} className="mt-4 rounded-2xl border border-white/10 glass p-5">
        <p className="mb-4 text-sm font-bold text-slate-200">Cobertura manual vs. BIMS</p>
        <div className="mx-auto h-80 max-w-xl">
          <Radar data={radarData} options={radarOpts} />
        </div>
      </Reveal>
    </Section>
  );
}
