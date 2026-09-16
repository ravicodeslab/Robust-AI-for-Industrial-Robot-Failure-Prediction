import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Layers,
  RefreshCw,
  Shield,
  Zap,
} from 'lucide-react';
import {
  acknowledgeAlert,
  getAlerts,
  predictMultimodal,
} from '../services/api';
import { AlertItem, LiveStreamData, PredictionResponse } from '../types';

interface OverviewPageProps {
  liveData: LiveStreamData | null;
  onNavigateTab: (tab: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ liveData, onNavigateTab }) => {
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPrediction = async () => {
    try {
      setLoading(true);
      const res = await predictMultimodal({});
      setPrediction(res);
    } catch (err) {
      console.error('Failed to run demo prediction', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const data = await getAlerts();
      setAlerts(data);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    }
  };

  useEffect(() => {
    fetchPrediction();
    loadAlerts();
  }, []);

  const handleAck = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'CONTINUE OPERATION':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'REDUCE SPEED':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'SCHEDULE MAINTENANCE':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'IMMEDIATE HALT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <span>SYSTEM TELEMETRY & PREDICTION OVERVIEW</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Autonomous Workcell 04 &bull; 6-Axis Articulated Robot &bull; Online Monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchPrediction}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs font-mono font-bold hover:bg-amber-500/30 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>RUN PREDICTION PASS</span>
          </button>
        </div>
      </div>

      {/* Main 4 Industrial Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ROBOT STATUS */}
        <div className="industrial-panel p-5 border-l-4 border-l-emerald-500 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
            <span>ROBOT STATUS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono tracking-wide">
            {liveData?.robot_status || 'OPERATIONAL'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 flex items-center justify-between">
            <span>Subsystem: Articulation J1-J6</span>
            <span className="text-emerald-400 font-bold">NORMAL</span>
          </div>
        </div>

        {/* Card 2: FAILURE RISK */}
        <div className="industrial-panel p-5 border-l-4 border-l-amber-500 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
            <span>FAILURE RISK</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono tracking-wide flex items-baseline gap-2">
            <span>{prediction ? (prediction.confidence * 100).toFixed(1) : '91.4'}%</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              {prediction?.severity || 'HIGH'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 flex items-center justify-between">
            <span>Trend: Elevating (Vib/Temp)</span>
            <span className="text-amber-400">Degrading</span>
          </div>
        </div>

        {/* Card 3: PREDICTION */}
        <div className="industrial-panel p-5 border-l-4 border-l-cyan-500 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
            <span>PREDICTION</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-slate-100 font-mono tracking-tight truncate">
            {prediction?.failure_class || 'Bearing Failure'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 flex items-center justify-between">
            <span>Component: {prediction?.affected_component || 'Bearing Assembly'}</span>
            <span className="text-cyan-400 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('prediction')}>
              Details &rarr;
            </span>
          </div>
        </div>

        {/* Card 4: SAFETY ACTION */}
        <div className="industrial-panel p-5 border-l-4 border-l-rose-500 relative">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono uppercase tracking-wider mb-2">
            <span>SAFETY ACTION</span>
            <Shield className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg font-black font-mono tracking-tight">
            <span className={`px-2.5 py-1 rounded border inline-block ${getActionColor(prediction?.recommended_action)}`}>
              {prediction?.recommended_action || 'REDUCE SPEED'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 flex items-center justify-between">
            <span>Rule: R003 (Audited)</span>
            <span className="text-rose-400 font-semibold cursor-pointer hover:underline" onClick={() => onNavigateTab('safety')}>
              Audit &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Modality Health & Latest Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sensor Branch Health */}
        <div className="industrial-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-200">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>SENSOR BRANCH HEALTH</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
              OPTIMAL (3/3)
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Vibration (RMS):</span>
                <span className="text-amber-400 font-bold">0.652 g (Anomaly &gt; 0.40)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-3/4 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Motor Current:</span>
                <span className="text-slate-200">2.84 A (Nominal: 2.2A)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 w-1/2 rounded-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Core Temperature:</span>
                <span className="text-amber-300">54.2 °C (Warning: 60°C)</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 w-3/5 rounded-full" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('sensors')}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded flex items-center justify-center gap-1 transition"
          >
            <span>OPEN SENSOR TELEMETRY CHARTS</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Vision Branch Health */}
        <div className="industrial-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-200">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>VISION BRANCH HEALTH</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold">
              DEFECT DETECTED
            </span>
          </div>

          <div className="flex gap-3 items-center">
            {prediction?.gradcam_overlay_base64 ? (
              <img
                src={prediction.gradcam_overlay_base64}
                alt="Grad-CAM Overlay"
                className="w-24 h-24 object-cover rounded border border-slate-700 shadow"
              />
            ) : (
              <div className="w-24 h-24 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono text-center p-2">
                Grad-CAM Live View
              </div>
            )}
            <div className="space-y-1 text-xs font-mono">
              <div className="text-slate-300 font-bold">Surface Inspection:</div>
              <div className="text-rose-400 font-semibold">Outer Race Spall / Pitting</div>
              <div className="text-slate-400 text-[11px]">Attention: Raceway Region</div>
              <div className="text-cyan-400 text-[10px]">Backbone: ResNet18 (Layer4)</div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('vision')}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded flex items-center justify-center gap-1 transition"
          >
            <span>INSPECT GRAD-CAM HEATMAP</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multimodal Attention Fusion Status */}
        <div className="industrial-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-sm font-bold font-mono text-slate-200">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>CROSS-ATTENTION FUSION</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold">
              ACTIVE
            </span>
          </div>

          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Multi-head cross-attention dynamically weights vibration spectral peaks with localized surface pitting anomalies to eliminate false alarms.
          </p>

          <div className="p-3 bg-slate-950/80 rounded border border-slate-800/90 text-xs font-mono space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Attention Heads:</span>
              <span className="text-slate-200">4 heads (Bidirectional)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Sensor Query Weight:</span>
              <span className="text-amber-300 font-bold">62% (Dominant)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Vision Query Weight:</span>
              <span className="text-cyan-300 font-bold">38%</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('explainability')}
            className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded flex items-center justify-center gap-1 transition"
          >
            <span>VIEW SHAP & GRAD-CAM AUDIT</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Alerts Panel */}
      <div className="industrial-panel p-5">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-slate-200">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            <span>CRITICAL AUDIT ALERTS LOG</span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {alerts.filter((a) => a.status === 'ACTIVE').length} Active Warning(s)
          </span>
        </div>

        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-lg border font-mono text-xs flex items-center justify-between transition ${
                alert.status === 'ACTIVE'
                  ? 'bg-rose-950/20 border-rose-800/50 text-rose-200'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${alert.status === 'ACTIVE' ? 'text-rose-400' : 'text-slate-500'}`} />
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>{alert.prediction_class} Risk ({alert.confidence * 100}%)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {alert.affected_component}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Detected: {alert.detected_anomaly}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>{alert.timestamp}</span>
                    <span>&bull; Recommended: <strong className="text-amber-300">{alert.recommended_action}</strong></span>
                  </div>
                </div>
              </div>

              <div>
                {alert.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleAck(alert.id)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded text-[11px] font-bold uppercase transition"
                  >
                    ACKNOWLEDGE
                  </button>
                ) : (
                  <span className="text-[10px] px-2 py-1 bg-slate-800 text-slate-400 rounded border border-slate-700">
                    ACKNOWLEDGED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
