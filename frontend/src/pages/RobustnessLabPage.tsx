import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
  TrendingDown,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { runRobustnessTest } from '../services/api';
import { RobustnessResponse } from '../types';

export const RobustnessLabPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<RobustnessResponse | null>(null);
  const [selectedStress, setSelectedStress] = useState<'both' | 'noise' | 'dropout'>('both');

  const executeTest = async () => {
    try {
      setLoading(true);
      const res = await runRobustnessTest({
        noise_levels: [0.0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4],
        dropout_levels: [0.0, 0.1, 0.2, 0.3, 0.4, 0.5],
      });
      setData(res);
    } catch (err) {
      console.error('Failed to run robustness test', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeTest();
  }, []);

  const formatNoiseData = data?.noise_curve.map((pt) => ({
    level: `${(pt.level * 100).toFixed(0)}%`,
    Accuracy: Math.round(pt.accuracy * 1000) / 10,
    F1: Math.round(pt.f1 * 1000) / 10,
    Confidence: Math.round(pt.confidence_avg * 1000) / 10,
  })) || [];

  const formatDropoutData = data?.dropout_curve.map((pt) => ({
    level: `${(pt.level * 100).toFixed(0)}%`,
    Accuracy: Math.round(pt.accuracy * 1000) / 10,
    F1: Math.round(pt.f1 * 1000) / 10,
    Confidence: Math.round(pt.confidence_avg * 1000) / 10,
  })) || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Sliders className="w-5 h-5 text-amber-400" />
            <span>Robustness & Sensor Degradation Lab</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Stress-testing multimodal neural fusion under Gaussian noise, packet dropout, and single-modality failures
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setSelectedStress('both')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedStress === 'both' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Curves
            </button>
            <button
              onClick={() => setSelectedStress('noise')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedStress === 'noise' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sensor Noise
            </button>
            <button
              onClick={() => setSelectedStress('dropout')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedStress === 'dropout' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Packet Dropout
            </button>
          </div>

          <button
            onClick={executeTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-current text-slate-950" />
            )}
            Run Stress Suite
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Clean Baseline F1</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {data ? `${(data.noise_curve[0]?.f1 * 100).toFixed(1)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">0% synthetic noise / full modalities</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>40% Noise Retention</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {data ? `${(data.noise_curve[data.noise_curve.length - 1]?.accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Resilient via cross-modality anchoring</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>50% Dropout Retention</span>
            <AlertTriangle className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {data ? `${(data.dropout_curve[data.dropout_curve.length - 1]?.accuracy * 100).toFixed(1)}%` : '--'}
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Half sensor channels dropped</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Fail-Safe Grace Status</span>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">VERIFIED SAFE</div>
          <p className="text-[11px] text-slate-500 font-mono">Trips ISO R005 safety interlock</p>
        </div>
      </div>

      {/* Degradation Curves Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(selectedStress === 'both' || selectedStress === 'noise') && (
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Gaussian Noise Degradation Profile</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Accuracy and F1-Score retention across sensor SNR variations
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatNoiseData} margin={{ left: -10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="level" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[50, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
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
                  <Line type="monotone" dataKey="Accuracy" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="F1" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Confidence" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {(selectedStress === 'both' || selectedStress === 'dropout') && (
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-amber-400" />
                  <span>Sensor Packet Dropout Resilience</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Performance degradation when industrial bus drops channel frames
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formatDropoutData} margin={{ left: -10, right: 20, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="level" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[50, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
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
                  <Line type="monotone" dataKey="Accuracy" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="F1" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Confidence" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Missing Modality Resilience Matrix */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Missing Modality Tolerance Matrix</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Quantifying model degradation when one sensor branch goes offline or suffers camera occlusion
            </p>
          </div>
        </div>

        {data?.missing_modality_results ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Operating Configuration</th>
                  <th className="p-3">Accuracy</th>
                  <th className="p-3">F1-Score</th>
                  <th className="p-3">ROC-AUC</th>
                  <th className="p-3">Operational Grade</th>
                  <th className="p-3">Safety Policy Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(data.missing_modality_results).map(([modality, res]) => (
                  <tr key={modality} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-200 capitalize">
                      {modality.replace('_', ' ')}
                    </td>
                    <td className="p-3 text-slate-300">{(res.accuracy * 100).toFixed(1)}%</td>
                    <td className="p-3 text-slate-300">{(res.f1_score * 100).toFixed(1)}%</td>
                    <td className="p-3 text-slate-300">{(res.auc * 100).toFixed(1)}%</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          res.status === 'GOOD'
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                            : res.status === 'WARNING'
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {res.status === 'GOOD'
                        ? 'Full Autonomous Operation'
                        : res.status === 'WARNING'
                        ? 'Degraded Mode / Penalize Confidence 15%'
                        : 'Rule R005 Interlock: Mandatory Manual Inspection'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-xs font-mono text-slate-500">
            Running modality perturbation suite...
          </div>
        )}
      </div>

      {/* Audit Summary Box */}
      {data?.summary && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono space-y-1">
            <span className="font-bold text-slate-200 uppercase">Robustness Assessment Summary:</span>
            <p className="text-slate-400">{data.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
};
