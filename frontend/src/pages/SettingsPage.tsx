import React, { useState } from 'react';
import {
  CheckCircle2,
  Cpu,
  Database,
  Lock,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Terminal,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [continueThresh, setContinueThresh] = useState(0.30);
  const [maintenanceThresh, setMaintenanceThresh] = useState(0.60);
  const [reduceSpeedThresh, setReduceSpeedThresh] = useState(0.80);
  const [haltThresh, setHaltThresh] = useState(0.90);
  const [penaltyMissing, setPenaltyMissing] = useState(0.15);
  const [minConfidence, setMinConfidence] = useState(0.50);

  const [robotTarget, setRobotTarget] = useState('Robot-01 (6-DOF Manipulator)');
  const [cellLocation, setCellLocation] = useState('Cell-04 / Assembly & Welding');
  const [simInterval, setSimInterval] = useState(2000);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <SettingsIcon className="w-5 h-5 text-amber-400" />
            <span>Safety Parameters & Industrial Console Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Fine-tune ISO interlocking thresholds, sensor penalty coefficients, and physical robot target bindings
          </p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md transition-all"
        >
          {saved ? <CheckCircle2 className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
          {saved ? 'Thresholds Saved!' : 'Save System Parameters'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Safety Thresholds */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            Decision Boundary Thresholds (Probability)
          </h3>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Continue Operation Threshold (Below)</span>
              <span className="font-bold text-emerald-400">{(continueThresh * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.10"
              max="0.50"
              step="0.05"
              value={continueThresh}
              onChange={(e) => setContinueThresh(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-800 h-1.5 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Maintenance Advisory Threshold (Above)</span>
              <span className="font-bold text-yellow-400">{(maintenanceThresh * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.75"
              step="0.05"
              value={maintenanceThresh}
              onChange={(e) => setMaintenanceThresh(parseFloat(e.target.value))}
              className="w-full accent-yellow-500 bg-slate-800 h-1.5 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Reduce Speed Threshold (Above)</span>
              <span className="font-bold text-amber-400">{(reduceSpeedThresh * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.60"
              max="0.90"
              step="0.05"
              value={reduceSpeedThresh}
              onChange={(e) => setReduceSpeedThresh(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Immediate Halt / E-STOP Threshold (Above)</span>
              <span className="font-bold text-rose-400">{(haltThresh * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="0.99"
              step="0.01"
              value={haltThresh}
              onChange={(e) => setHaltThresh(parseFloat(e.target.value))}
              className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg"
            />
          </div>
        </div>

        {/* Robustness & Penalty Parameters */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            Resilience & Penalty Penalties
          </h3>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Missing Modality Confidence Penalty</span>
              <span className="font-bold text-sky-400">{(penaltyMissing * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="0.30"
              step="0.05"
              value={penaltyMissing}
              onChange={(e) => setPenaltyMissing(parseFloat(e.target.value))}
              className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
            />
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Subtracted from confidence when camera or accelerometer drops off-bus
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Minimum Trust Confidence Floor</span>
              <span className="font-bold text-purple-400">{(minConfidence * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0.30"
              max="0.70"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg"
            />
            <p className="text-[10px] text-slate-500 font-mono mt-1">
              Predictions below this trigger R005 degraded fallback
            </p>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Simulation Polling Cycle</span>
              <span className="font-bold text-slate-200">{simInterval} ms</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="500"
              value={simInterval}
              onChange={(e) => setSimInterval(parseInt(e.target.value))}
              className="w-full accent-slate-400 bg-slate-800 h-1.5 rounded-lg"
            />
          </div>
        </div>

        {/* Robot Target Binding */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4 md:col-span-2">
          <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Physical Workcell Target Binding
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Robot ID</label>
              <input
                type="text"
                value={robotTarget}
                onChange={(e) => setRobotTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Plant Location & Cell</label>
              <input
                type="text"
                value={cellLocation}
                onChange={(e) => setCellLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
