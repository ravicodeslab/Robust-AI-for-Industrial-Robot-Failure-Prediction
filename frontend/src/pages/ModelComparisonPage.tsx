import React, { useEffect, useState } from 'react';
import {
  Activity,
  Award,
  BarChart2,
  CheckCircle2,
  Cpu,
  Layers,
  RefreshCw,
  Sparkles,
  TrendingUp,
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
import { getModels } from '../services/api';
import { ModelItem } from '../types';

export const ModelComparisonPage: React.FC = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadModels = async () => {
    try {
      setLoading(true);
      const data = await getModels();
      setModels(data);
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  const chartData = models.map((m) => ({
    name: m.name.replace(' Multimodal', '').replace(' Network', ''),
    Accuracy: Math.round(m.accuracy * 1000) / 10,
    F1: Math.round(m.f1_score * 1000) / 10,
    AUC: Math.round(m.auc_roc * 1000) / 10,
    Latency: m.latency_ms,
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>Multimodal Model Benchmark & Comparison</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Empirical evaluation comparing unimodal baselines vs early concatenation vs cross-attention neural fusion
          </p>
        </div>

        <button
          onClick={loadModels}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Benchmarks
        </button>
      </div>

      {/* Top Winner Card: Proposed Cross-Attention Architecture */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 shadow-inner">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 uppercase">
                  Best In Class Model
                </span>
                <span className="text-[10px] font-mono text-slate-400 uppercase">Production Candidate</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 font-mono mt-0.5">
                Cross-Attention Multimodal Fusion (1D CNN-LSTM + ResNet18)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-5 font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Macro F1</div>
              <div className="text-2xl font-black text-amber-400">94.8%</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">ROC-AUC</div>
              <div className="text-2xl font-black text-emerald-400">0.985</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase">Inference Latency</div>
              <div className="text-2xl font-black text-sky-400">14.2 ms</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-300 font-mono leading-relaxed border-t border-slate-800/80 pt-3">
          The cross-attention architecture outperforms unimodal sensor baselines (+6.3% F1) and vision baselines (+7.6% F1) by learning dynamic correlation weights between high-frequency vibration harmonics and surface thermal/defect camera frames, while maintaining real-time industrial edge inference speeds under 20ms.
        </p>
      </div>

      {/* Comparison Metrics Chart */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-400" />
              <span>Comparative Performance Metrics Across Architectures (%)</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Side-by-side Accuracy, Macro F1-Score, and ROC-AUC
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ left: -10, right: 20, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11, fill: '#cbd5e1' }} />
              <YAxis domain={[75, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              <Bar dataKey="Accuracy" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="AUC" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Benchmark Summary Table */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Detailed Benchmark Summary Table</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Model Architecture</th>
                <th className="p-3">Modality</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">Precision</th>
                <th className="p-3">Recall</th>
                <th className="p-3">F1-Score</th>
                <th className="p-3">ROC-AUC</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Params</th>
                <th className="p-3">XAI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {models.map((m) => (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-800/40 ${
                    m.fusion_method === 'cross_attention' ? 'bg-amber-500/5 font-semibold' : ''
                  }`}
                >
                  <td className="p-3 text-slate-200 flex items-center gap-2">
                    {m.fusion_method === 'cross_attention' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                    )}
                    {m.name}
                  </td>
                  <td className="p-3 text-slate-400 uppercase">{m.modality}</td>
                  <td className="p-3 text-slate-300">{(m.accuracy * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-300">{(m.precision * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-300">{(m.recall * 100).toFixed(1)}%</td>
                  <td className="p-3 text-amber-400 font-bold">{(m.f1_score * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-400">{m.auc_roc.toFixed(3)}</td>
                  <td className="p-3 text-sky-400">{m.latency_ms} ms</td>
                  <td className="p-3 text-slate-400">{m.parameters}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.xai_supported
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {m.xai_supported ? 'SHAP + CAM' : 'NO'}
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
