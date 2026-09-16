import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getModelComparison, getModels } from '../services/api';
import { ModelItem } from '../types';

export const ComparisonPage: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'f1_score' | 'auc_roc' | 'latency_ms'>('accuracy');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getModels();
        setModels(data);
      } catch (err) {
        console.error('Failed to load model registry', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const chartData = models.map((m) => ({
    name: m.name.replace(' (Proposed)', '').replace(' Baseline', ''),
    fullName: m.name,
    accuracy: +(m.accuracy * 100).toFixed(1),
    f1_score: +(m.f1_score * 100).toFixed(1),
    auc_roc: +(m.auc_roc * 100).toFixed(1),
    latency_ms: m.latency_ms,
    isProposed: m.id.includes('cross_attn'),
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="industrial-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-mono tracking-wide">
                Model Benchmark &amp; Architecture Comparison
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparative evaluation across Sensor-only, Vision-only, Early Concat Fusion, and Proposed Cross-Attention Transformer
              </p>
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Metric:</span>
          {(['accuracy', 'f1_score', 'auc_roc', 'latency_ms'] as const).map((metric) => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                selectedMetric === metric
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {metric.toUpperCase().replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Top Winner Card */}
      <div className="industrial-panel p-5 bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border-amber-500/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500 text-slate-950 font-bold">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                  Optimal Architecture
                </span>
                <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PRODUCTION ACTIVE
                </span>
              </div>
              <h3 className="text-lg font-bold font-mono text-slate-100 mt-1">
                Cross-Attention Multimodal Fusion (Proposed Model)
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Delivers 94.8% accuracy (+8.6% over sensor baseline, +15.4% over vision baseline) at 14.2ms latency with full SHAP/Grad-CAM interpretability.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 border-l border-slate-800 pl-6 text-center font-mono">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Accuracy</div>
              <div className="text-xl font-bold text-amber-400">94.8%</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">F1-Score</div>
              <div className="text-xl font-bold text-slate-200">0.944</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Latency</div>
              <div className="text-xl font-bold text-cyan-400">14.2ms</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Chart */}
      <div className="industrial-panel p-5">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Cross-Architecture Performance ({selectedMetric.toUpperCase().replace('_', ' ')})</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {selectedMetric === 'latency_ms' ? 'Lower is better (ms)' : 'Higher is better (%)'}
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} />
              <YAxis
                unit={selectedMetric === 'latency_ms' ? 'ms' : '%'}
                domain={selectedMetric === 'latency_ms' ? [0, 20] : [60, 100]}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                formatter={(val: number) => [
                  `${val}${selectedMetric === 'latency_ms' ? ' ms' : '%'}`,
                  selectedMetric.toUpperCase().replace('_', ' '),
                ]}
              />
              <Bar dataKey={selectedMetric} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isProposed ? '#f59e0b' : '#475569'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Full Architectural Comparison Matrix Table */}
      <div className="industrial-panel p-5">
        <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Cpu className="w-4 h-4 text-amber-400" />
          <span>Complete Experimental Benchmark Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3">MODEL NAME</th>
                <th className="p-3">ARCHITECTURE</th>
                <th className="p-3">MODALITY</th>
                <th className="p-3">ACCURACY</th>
                <th className="p-3">F1-SCORE</th>
                <th className="p-3">AUC-ROC</th>
                <th className="p-3">LATENCY</th>
                <th className="p-3">PARAMS</th>
                <th className="p-3">XAI SUPPORT</th>
                <th className="p-3">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {models.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-800/30 transition-colors ${
                    m.id.includes('cross_attn') ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="p-3 font-semibold text-slate-100 flex items-center gap-2">
                    {m.id.includes('cross_attn') && (
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span>{m.name}</span>
                  </td>
                  <td className="p-3 text-slate-300">{m.architecture}</td>
                  <td className="p-3 text-slate-400 uppercase">{m.modality}</td>
                  <td className="p-3 font-bold text-amber-400">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-200">{m.f1_score.toFixed(3)}</td>
                  <td className="p-3 text-slate-200">{m.auc_roc.toFixed(3)}</td>
                  <td className="p-3 text-cyan-300">{m.latency_ms} ms</td>
                  <td className="p-3 text-slate-400">{m.parameters}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.xai_supported
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m.xai_supported ? 'SHAP + CAM' : 'NONE'}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.is_active
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
