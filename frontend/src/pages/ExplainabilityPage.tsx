import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Eye,
  HelpCircle,
  Info,
  Layers,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { getGradCamExplanation, getShapExplanation } from '../services/api';
import { GradCamResponse, ShapResponse } from '../types';

export const ExplainabilityPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('Bearing Failure');
  const [shapData, setShapData] = useState<ShapResponse | null>(null);
  const [gradCamData, setGradCamData] = useState<GradCamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'both' | 'shap' | 'vision'>('both');

  const failureClasses = [
    'Bearing Failure',
    'Mechanical Wear',
    'Overheating',
    'Misalignment',
    'Motor Failure',
    'Normal',
  ];

  const fetchExplanations = async (cls: string) => {
    try {
      setLoading(true);
      const [shapRes, camRes] = await Promise.all([
        getShapExplanation(cls),
        getGradCamExplanation(cls),
      ]);
      setShapData(shapRes);
      setGradCamData(camRes);
    } catch (err) {
      console.error('Failed to load XAI explanations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplanations(selectedClass);
  }, [selectedClass]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Explainable AI (XAI) Suite</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Transparent model attribution: SHAP feature contributions for kinematic sensors & Grad-CAM heatmaps for vision
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-1 flex items-center gap-1 text-xs font-mono">
            <button
              onClick={() => setActiveView('both')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'both' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Unified XAI
            </button>
            <button
              onClick={() => setActiveView('shap')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'shap' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SHAP Sensors
            </button>
            <button
              onClick={() => setActiveView('vision')}
              className={`px-3 py-1 rounded transition-colors ${
                activeView === 'vision' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grad-CAM Vision
            </button>
          </div>

          <button
            onClick={() => fetchExplanations(selectedClass)}
            disabled={loading}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Target Class Selector */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-amber-400" />
          Explain Target Failure Mode:
        </span>
        <div className="flex flex-wrap gap-2">
          {failureClasses.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                selectedClass === cls
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SHAP Sensor Attribution Section */}
        {(activeView === 'both' || activeView === 'shap') && (
          <div className={`${activeView === 'both' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Sensor Modality SHAP Contributions</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Additive feature attribution against baseline expectation
                  </p>
                </div>
                {shapData && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    Base Value: {shapData.base_value.toFixed(3)}
                  </span>
                )}
              </div>

              {/* Chart */}
              {shapData ? (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={shapData.chart_data}
                      layout="vertical"
                      margin={{ left: 100, right: 30, top: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} horizontal={false} />
                      <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="feature"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#cbd5e1' }}
                        width={110}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [val, 'SHAP Impact']}
                      />
                      <ReferenceLine x={0} stroke="#94a3b8" />
                      <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                        {shapData.chart_data.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={entry.contribution >= 0 ? '#f59e0b' : '#38bdf8'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-xs font-mono text-slate-500">
                  Loading SHAP values...
                </div>
              )}

              {/* SHAP Summary Text */}
              {shapData && (
                <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p>{shapData.summary_text}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Grad-CAM Vision Inspection Section */}
        {(activeView === 'both' || activeView === 'vision') && (
          <div className={`${activeView === 'both' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>Vision Modality Grad-CAM Localization</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Gradient-weighted class activation mapping on ResNet-18 conv layers
                  </p>
                </div>
                {gradCamData && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    Conf: {(gradCamData.confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>

              {gradCamData ? (
                <div className="space-y-4">
                  {/* Image Gallery */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5 text-center">
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-1">
                        <img
                          src={gradCamData.original_image_base64}
                          alt="Original Inspection Frame"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Input Frame</span>
                    </div>

                    <div className="space-y-1.5 text-center">
                      <div className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center p-1">
                        <img
                          src={gradCamData.heatmap_base64}
                          alt="Grad-CAM Heatmap"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Activation Map</span>
                    </div>

                    <div className="space-y-1.5 text-center">
                      <div className="aspect-square rounded-lg overflow-hidden border border-amber-500/50 bg-slate-950 flex items-center justify-center p-1 shadow-lg shadow-amber-500/10">
                        <img
                          src={gradCamData.overlay_base64}
                          alt="Grad-CAM Composite Overlay"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">
                        Fused Overlay
                      </span>
                    </div>
                  </div>

                  {/* Grad-CAM Attention Description */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400">Visual Defect Region: </span>
                      <span>{gradCamData.attention_region_description}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-72 flex items-center justify-center text-xs font-mono text-slate-500">
                  Loading Grad-CAM visualization...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Cross-Modality Correlation Rationale Card */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
        <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          Multimodal Fusion Rationale & Auditability
        </h4>
        <p className="text-xs text-slate-300 font-mono leading-relaxed">
          The cross-attention layer validates that peak high-frequency sensor anomalies directly correlate with spatial visual defects identified by the inspection camera. By combining SHAP attributions with Grad-CAM feature heatmaps, safety engineers can verify that the AI decision is grounded in physical degradation rather than spurious correlation or sensor noise.
        </p>
      </div>
    </div>
  );
};
