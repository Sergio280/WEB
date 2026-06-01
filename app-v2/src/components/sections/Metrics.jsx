import { Bar, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import Section from '../ui/Section.jsx';
import Reveal from '../ui/Reveal.jsx';
import { QUICK_METRICS, CHART_TIME, CHART_ERROR, CHART_RADAR } from '../../data/metrics.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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
  // Chart 1 — Tiempo por tarea (minutos)
  const timeData = {
    labels: CHART_TIME.labels,
    datasets: [
      { label: 'Sin BIMS (manual)', data: CHART_TIME.manual, backgroundColor: GREY, borderRadius: 6 },
      { label: 'Con BIMS', data: CHART_TIME.bims, backgroundColor: BLUE, borderRadius: 6 },
    ],
  };
  const timeOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TICK, usePointStyle: true, pointStyle: 'rectRounded' } } },
    scales: {
      x: { grid: { color: GRID }, ticks: { color: TICK, callback: (v) => v + ' min' } },
      y: { grid: { display: false }, ticks: { color: TICK, font: { size: 9 } } },
    },
  };

  // Chart 2 — Tasa de error (%)
  const errorData = {
    labels: CHART_ERROR.labels,
    datasets: [
      { label: 'Sin BIMS (%)', data: CHART_ERROR.manual, backgroundColor: GREY, borderRadius: 6 },
      { label: 'Con BIMS (%)', data: CHART_ERROR.bims, backgroundColor: GREEN, borderRadius: 6 },
    ],
  };
  const errorOpts = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TICK, usePointStyle: true, pointStyle: 'rectRounded' } } },
    scales: {
      x: { grid: { color: GRID }, ticks: { color: TICK, callback: (v) => v + '%' } },
      y: { grid: { display: false }, ticks: { color: TICK, font: { size: 9 } } },
    },
  };

  // Chart 3 — Radar de automatización por módulo
  const radarData = {
    labels: CHART_RADAR.labels,
    datasets: [
      { label: 'Proceso manual', data: CHART_RADAR.manual, backgroundColor: 'rgba(100,116,139,.2)', borderColor: GREY, pointBackgroundColor: GREY },
      { label: 'Con BIMS', data: CHART_RADAR.bims, backgroundColor: 'rgba(45,125,255,.22)', borderColor: BLUE, pointBackgroundColor: BLUE },
    ],
  };
  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: TICK, usePointStyle: true } } },
    scales: {
      r: {
        angleLines: { color: GRID },
        grid: { color: GRID },
        pointLabels: { color: TICK, font: { size: 10 } },
        ticks: { display: false, stepSize: 25 },
        min: 0,
        max: 100,
      },
    },
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

      {/* Charts: tiempo + error */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Reveal className="rounded-2xl border border-white/10 glass p-5">
          <p className="mb-4 text-sm font-bold text-slate-200">Tiempo por tarea (minutos)</p>
          <div className="h-64">
            <Bar data={timeData} options={timeOpts} />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="rounded-2xl border border-white/10 glass p-5">
          <p className="mb-4 text-sm font-bold text-slate-200">Tasa de error (%)</p>
          <div className="h-64">
            <Bar data={errorData} options={errorOpts} />
          </div>
        </Reveal>
      </div>

      {/* Radar */}
      <Reveal delay={0.1} className="mt-4 rounded-2xl border border-white/10 glass p-5">
        <p className="mb-4 text-sm font-bold text-slate-200">Nivel de automatización por módulo</p>
        <div className="mx-auto h-80 max-w-xl">
          <Radar data={radarData} options={radarOpts} />
        </div>
      </Reveal>
    </Section>
  );
}
