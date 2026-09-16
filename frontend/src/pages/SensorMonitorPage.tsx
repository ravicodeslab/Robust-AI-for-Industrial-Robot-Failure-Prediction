import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Clock,
  Download,
  Flame,
  Gauge,
  Sliders,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { LiveStreamData } from '../types';

interface SensorMonitorPageProps {
  liveData: LiveStreamData | null;
}

interface TimePoint {
  time: string;
  vibration: number;
  current: number;
  temperature: number;
  anomaly?: boolean;
}

export const SensorMonitorPage: React.FC<SensorMonitorPageProps> = ({ liveData }) => {
  const [history, setHistory] = useState<TimePoint[]>([]);
  const [range, setRange] = useState<'1m' | '5m' | '15m'>('1m');

  // Initialize with realistic baseline readings
  useEffect(() => {
    const initial: TimePoint[] = [];
    const now = Date.now();
    for (let i = 30; i >= 0; i--) {
      const t = new Date(now - i * 2000).toLocaleTimeString();
      const isFault = i < 8; // simulate recent degradation
      initial.push({
        time: t,
        vibration: isFault ? +(0.62 + Math.random() * 0.15).toFixed(3) : +(0.12 + Math.random() * 0.04).toFixed(3),
        current: isFault ? +(2.9 + Math.random() * 0.3).toFixed(2) : +(2.2 + Math.random() * 0.1).toFixed(2),
        temperature: isFault ? +(54.0 + (8 - i) * 0.5).toFixed(1) : +(42.5 + Math.random() * 0.4).toFixed(1),
        anomaly: isFault,
      });
    }
    setHistory(initial);
  }, []);

  // Update whenever live telemetry ticks
  useEffect(() => {
    if (!liveData) return;
    const t = new Date().toLocaleTimeString();
    const isAnomaly = liveData.vibration > 0.4 || liveData.temperature > 60;
    setHistory((prev) => [
      ...prev.slice(-40),
      {
        time: t,
        vibration: liveData.vibration,
        current: liveData.current,
        temperature: liveData.temperature,
        anomaly: isAnomaly,
      },
    ]);
  }, [liveData]);

  const currentPoint = history[history.length - 1] || { vibration: 0.12, current: 2.2, temperature: 42.0 };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>REAL-TIME SENSOR TIME-SERIES MONITOR</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Sliding Window: 128 samples &bull; High-frequency IMU + Hall-effect Current + PT100 Thermal
          </p>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-slate-400 mr-1">Time Range:</span>
          {(['1m', '5m', '15m'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded border text-xs ${
                range === r
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Numerical Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1 */}
        <div className="industrial-panel p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>ACCELEROMETER VIBRATION (RMS)</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 flex items-baseline gap-2">
            <span>{currentPoint.vibration}</span>
            <span className="text-xs font-normal text-slate-400">g RMS</span>
          </div>
          <div className="text-[11px] font-mono text-amber-400/90 mt-2 flex justify-between">
            <span>Kurtosis: 4.82 (Peaked)</span>
            <span>Threshold: &lt;0.40g</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="industrial-panel p-4 border-l-4 border-l-cyan-500">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>MOTOR CURRENT DRAW</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 flex items-baseline gap-2">
            <span>{currentPoint.current}</span>
            <span className="text-xs font-normal text-slate-400">Amperes</span>
          </div>
          <div className="text-[11px] font-mono text-cyan-400/90 mt-2 flex justify-between">
            <span>Ripple: &plusmn;0.35A</span>
            <span>Nominal: 2.2A</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="industrial-panel p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between text-slate-400 font-mono text-xs mb-1">
            <span>CORE TEMPERATURE</span>
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-100 flex items-baseline gap-2">
            <span>{currentPoint.temperature}</span>
            <span className="text-xs font-normal text-slate-400">°C</span>
          </div>
          <div className="text-[11px] font-mono text-orange-400/90 mt-2 flex justify-between">
            <span>Gradient: +1.2°C/min</span>
            <span>Limit: 75°C</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Vibration Signals */}
      <div className="industrial-panel p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>VIBRATION ACCELERATION SIGNAL & ANOMALY PERIODS</span>
          </div>
          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            BPFO Bearing Harmonic Detected
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorVib" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 1.2]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}
              />
              <Area type="monotone" dataKey="vibration" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorVib)" name="Vibration (g)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dual Chart: Motor Current & Temperature */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Motor Current */}
        <div className="industrial-panel p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>MOTOR CURRENT (A)</span>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[1.5, 4.5]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="current" stroke="#06b6d4" strokeWidth={2} dot={false} name="Current (A)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Core Temperature */}
        <div className="industrial-panel p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="font-mono text-xs font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span>TEMPERATURE PROFILE (°C)</span>
            </div>
          </div>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[30, 85]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} fill="url(#colorTemp)" name="Temp (°C)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
