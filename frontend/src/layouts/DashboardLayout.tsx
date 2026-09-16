import React from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Eye,
  FileSpreadsheet,
  Gauge,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Terminal,
  Zap,
} from 'lucide-react';
import { LiveStreamData } from '../types';

interface DashboardLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  liveData: LiveStreamData | null;
  isSimulating: boolean;
  onToggleSimulation: () => void;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  liveData,
  isSimulating,
  onToggleSimulation,
  children,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Gauge },
    { id: 'sensors', label: 'Sensors', icon: Activity },
    { id: 'vision', label: 'Vision', icon: Eye },
    { id: 'prediction', label: 'AI Prediction', icon: Cpu },
    { id: 'explainability', label: 'Explainability', icon: Layers },
    { id: 'robustness', label: 'Robustness Lab', icon: Sliders },
    { id: 'safety', label: 'Safety Decision', icon: Shield },
    { id: 'comparison', label: 'Model Comparison', icon: Zap },
    { id: 'experiments', label: 'Experiments', icon: Terminal },
    { id: 'datasets', label: 'Datasets', icon: FileSpreadsheet },
    { id: 'training', label: 'Training', icon: Play },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  const getStatusBadge = () => {
    if (!liveData) return { label: 'STANDBY', color: 'bg-slate-700 text-slate-300' };
    switch (liveData.robot_status) {
      case 'OPERATIONAL':
        return { label: 'SYSTEM ONLINE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
      case 'WARNING':
        return { label: 'MAINTENANCE ADVISORY', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40' };
      case 'HIGH RISK':
      case 'HALTED':
        return { label: 'CRITICAL RISK', color: 'bg-rose-500/20 text-rose-400 border-rose-500/40' };
      default:
        return { label: 'ONLINE', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between z-20">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="font-bold text-sm tracking-wider text-slate-200 uppercase font-mono">
                RoboSafe AI
              </div>
              <div className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                Safety Decision Console
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-230px)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Simulation & Mode Indicator */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Live Simulation</span>
            <button
              onClick={onToggleSimulation}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isSimulating ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  isSimulating ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="text-[10px] font-mono text-slate-500 bg-slate-900/90 p-2 rounded border border-slate-800">
            <div>TARGET: Robot-01 (6-DOF)</div>
            <div>LOC: Cell-04 / Assembly</div>
            <div className="text-amber-400/90 font-bold mt-1">MODE: DEMO BENCHMARK</div>
          </div>
        </div>
      </aside>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Header Console Bar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 px-6 flex items-center justify-between backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2 tracking-wide font-mono">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Industrial Robot AI Monitoring & Safety Console</span>
            </h1>
            <span
              className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded border uppercase tracking-wider flex items-center gap-1.5 ${statusBadge.color}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current status-indicator-pulse" />
              {statusBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            {liveData && (
              <div className="flex items-center gap-5 pr-3 border-r border-slate-800">
                <div>
                  <span className="text-slate-500">VIB: </span>
                  <span className={`font-bold ${liveData.vibration > 0.4 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {liveData.vibration}g
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">TEMP: </span>
                  <span className={`font-bold ${liveData.temperature > 60 ? 'text-rose-400' : 'text-amber-300'}`}>
                    {liveData.temperature}°C
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">CURR: </span>
                  <span className="font-bold text-slate-200">{liveData.current}A</span>
                </div>
                <div>
                  <span className="text-slate-500">RISK: </span>
                  <span
                    className={`font-bold ${
                      liveData.failure_risk > 0.7
                        ? 'text-rose-400'
                        : liveData.failure_risk > 0.3
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {(liveData.failure_risk * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            <div className="text-[11px] text-slate-400">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </header>

        {/* Global Industrial Safety Advisory Banner */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-1.5 flex items-center justify-between text-[11px] text-amber-300/90 font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>
              Research Prototype: Predictions and recommended actions are for decision support only. Real deployment requires validation and appropriate industrial safety certification.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-amber-500/20 rounded border border-amber-500/40">
            DEMONSTRATION DATA
          </span>
        </div>

        {/* Scrollable Tab Content Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-slate-950 to-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
};
