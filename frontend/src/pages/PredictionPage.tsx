import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { predictMultimodal } from '../services/api';
import { PredictionResponse } from '../types';

interface PredictionPageProps {
  onNavigateTab?: (tab: string) => void;
}

export const PredictionPage: React.FC<PredictionPageProps> = ({ onNavigateTab }) => {
  const [fusionMethod, setFusionMethod] = useState<'cross_attention' | 'concat'>('cross_attention');
  const [vibrationAmp, setVibrationAmp] = useState(0.45);
  const [currentDraw, setCurrentDraw] = useState(3.2);
  const [temperatureVal, setTemperatureVal] = useState(58);
  const [noiseLevel, setNoiseLevel] = useState(0.0);
  const [dropoutRate, setDropoutRate] = useState(0.0);
  const [robotId, setRobotId] = useState('Robot-01');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const presets = [
    {
      name: 'Normal Operation',
      vibration: 0.12,
      current: 2.1,
      temp: 42,
      noise: 0.0,
      dropout: 0.0,
      desc: 'Healthy 6-DOF kinematics within ISO thresholds',
    },
    {
      name: 'Bearing Fatigue',
      vibration: 0.68,
      current: 3.8,
      temp: 59,
      noise: 0.05,
      dropout: 0.0,
      desc: 'High-frequency harmonic vibrations in Joint 3',
    },
    {
      name: 'Motor Overheat',
      vibration: 0.35,
      current: 4.8,
      temp: 84,
      noise: 0.0,
      dropout: 0.0,
      desc: 'Thermal excursion exceeding motor winding safety envelope',
    },
    {
      name: 'Mechanical Wear',
      vibration: 0.52,
      current: 3.4,
      temp: 62,
      noise: 0.08,
      dropout: 0.1,
      desc: 'Gear backlash with intermittent sensor dropout',
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setVibrationAmp(p.vibration);
    setCurrentDraw(p.current);
    setTemperatureVal(p.temp);
    setNoiseLevel(p.noise);
    setDropoutRate(p.dropout);
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      // Construct a 128-point simulated sensor window based on current sliders
      const sensorWindow = Array.from({ length: 128 }, (_, i) => ({
        timestamp: i,
        vibration: Number((Math.sin(i * 0.2) * vibrationAmp + (Math.random() - 0.5) * noiseLevel).toFixed(4)),
        current: Number((currentDraw + Math.cos(i * 0.15) * 0.2 + (Math.random() - 0.5) * noiseLevel).toFixed(3)),
        temperature: Number((temperatureVal + (Math.random() - 0.5) * 0.5).toFixed(2)),
      }));

      const res = await predictMultimodal({
        sensor_window: sensorWindow,
        fusion_method: fusionMethod,
        noise_level: noiseLevel,
        sensor_dropout: dropoutRate,
        robot_id: robotId,
      });
      setResult(res);
    } catch (err) {
      console.error('Prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result
    ? Object.entries(result.probabilities).map(([name, prob]) => ({
        name,
        probability: Math.round(prob * 1000) / 10,
      }))
    : [];

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/50';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      default:
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('HALT')) return 'bg-rose-600 text-white animate-pulse';
    if (action.includes('SPEED')) return 'bg-amber-600 text-white';
    if (action.includes('MAINTENANCE')) return 'bg-yellow-600 text-slate-900 font-bold';
    if (action.includes('DEGRADED')) return 'bg-purple-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Scope */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Cpu className="w-5 h-5 text-amber-400" />
            <span>Multimodal AI Failure Predictor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Cross-attention fusion correlating high-frequency vibration streams with visual joint defect frames
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              applyPreset(presets[0]);
              setResult(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          <button
            onClick={handlePredict}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-mono transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-current text-slate-950" />
            )}
            Run AI Inference
          </button>
        </div>
      </div>

      {/* Preset Fast Selectors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {presets.map((p) => (
          <button
            key={p.name}
            onClick={() => applyPreset(p)}
            className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 text-left transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-slate-200 group-hover:text-amber-400">
                {p.name}
              </span>
              <Sparkles className="w-3 h-3 text-slate-600 group-hover:text-amber-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Model Controls & Inputs */}
        <div className="lg:col-span-5 space-y-5">
          {/* Architecture Selector */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
            <label className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Fusion Architecture
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFusionMethod('cross_attention')}
                className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-all ${
                  fusionMethod === 'cross_attention'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>Cross-Attention</div>
                <div className="text-[10px] font-normal text-slate-400">Multimodal Co-Attn</div>
              </button>
              <button
                onClick={() => setFusionMethod('concat')}
                className={`p-2.5 rounded-lg border text-xs font-mono text-left transition-all ${
                  fusionMethod === 'concat'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div>Concat Fusion</div>
                <div className="text-[10px] font-normal text-slate-400">Early Feature Merge</div>
              </button>
            </div>
          </div>

          {/* Telemetry Input Sliders */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Kinematic & Thermal Parameters
            </h3>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Vibration Amplitude</span>
                <span className="font-bold text-amber-400">{vibrationAmp.toFixed(2)} g</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.5"
                step="0.01"
                value={vibrationAmp}
                onChange={(e) => setVibrationAmp(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Motor Phase Current</span>
                <span className="font-bold text-sky-400">{currentDraw.toFixed(1)} A</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={currentDraw}
                onChange={(e) => setCurrentDraw(parseFloat(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Stator Core Temperature</span>
                <span className="font-bold text-rose-400">{temperatureVal}°C</span>
              </div>
              <input
                type="range"
                min="25"
                max="100"
                step="1"
                value={temperatureVal}
                onChange={(e) => setTemperatureVal(parseInt(e.target.value))}
                className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>
          </div>

          {/* Robustness Perturbation Controls */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Real-World Sensor Perturbations
            </h3>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Gaussian Noise Injection</span>
                <span className="font-bold text-purple-400">{(noiseLevel * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.4"
                step="0.05"
                value={noiseLevel}
                onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Channel Packet Dropout</span>
                <span className="font-bold text-orange-400">{(dropoutRate * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="0.5"
                step="0.05"
                value={dropoutRate}
                onChange={(e) => setDropoutRate(parseFloat(e.target.value))}
                className="w-full accent-orange-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Prediction Outcomes & Visualizations */}
        <div className="lg:col-span-7 space-y-5">
          {result ? (
            <>
              {/* Primary Decision Banner */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[11px] font-mono text-slate-400 uppercase">Predicted State</div>
                      <div className="text-xl font-extrabold text-slate-100 font-mono tracking-wide">
                        {result.failure_class}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded border uppercase tracking-wider ${getSeverityBadge(
                        result.severity
                      )}`}
                    >
                      {result.severity} SEVERITY
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-3 py-1 rounded shadow-md uppercase tracking-wider ${getActionBadge(
                        result.recommended_action
                      )}`}
                    >
                      {result.recommended_action}
                    </span>
                  </div>
                </div>

                {/* Metric Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                    <div className="text-base font-bold text-amber-400">
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Component</div>
                    <div className="text-base font-bold text-slate-200 truncate">
                      {result.affected_component}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Modality</div>
                    <div className="text-base font-bold text-sky-400 uppercase">
                      {result.modality_used}
                    </div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800/80">
                    <div className="text-[10px] text-slate-500 uppercase">Robustness</div>
                    <div className="text-base font-bold text-emerald-400 uppercase">
                      {result.robustness_status}
                    </div>
                  </div>
                </div>

                {/* Safety Audit Reason */}
                <div className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Safety Interlock Rationale:</span>
                  </div>
                  <p className="text-slate-300 pl-5">{result.safety_reason}</p>
                </div>
              </div>

              {/* Class Probability Distribution Chart */}
              <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-400" />
                    Failure Class Probability Spectrum (%)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-500">Cross-Entropy Softmax</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 30, top: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        stroke="#64748b"
                        tick={{ fontSize: 11, fill: '#cbd5e1' }}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '12px',
                        }}
                        formatter={(val: any) => [`${val}%`, 'Likelihood']}
                      />
                      <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, idx) => (
                          <Cell
                            key={`cell-${idx}`}
                            fill={
                              entry.name === result.failure_class
                                ? '#f59e0b'
                                : entry.probability > 20
                                ? '#ef4444'
                                : '#38bdf8'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900/50 border border-dashed border-slate-800 text-center">
              <Cpu className="w-12 h-12 text-slate-700 mb-3 animate-pulse" />
              <h3 className="text-sm font-mono font-bold text-slate-300">Ready for Multimodal Inference</h3>
              <p className="text-xs text-slate-500 max-w-md mt-1 mb-4 font-mono">
                Select preset operating conditions or adjust parameters, then trigger the neural fusion pipeline.
              </p>
              <button
                onClick={handlePredict}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md"
              >
                Run Baseline Evaluation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
