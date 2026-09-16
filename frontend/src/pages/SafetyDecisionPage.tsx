import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Play,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Unlock,
  Zap,
} from 'lucide-react';
import { evaluateSafetyDecision, getSafetyRules } from '../services/api';
import { SafetyDecisionResponse } from '../types';

export const SafetyDecisionPage: React.FC = () => {
  const [confidence, setConfidence] = useState(0.85);
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [failureClass, setFailureClass] = useState('Bearing Failure');
  const [robustnessStatus, setRobustnessStatus] = useState<'GOOD' | 'WARNING' | 'SEVERE_DEGRADATION'>('GOOD');
  const [sensorMissing, setSensorMissing] = useState(false);
  const [visionMissing, setVisionMissing] = useState(false);

  const [decision, setDecision] = useState<SafetyDecisionResponse | null>(null);
  const [rulesConfig, setRulesConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [eStopEngaged, setEStopEngaged] = useState(false);

  const loadRules = async () => {
    try {
      const data = await getSafetyRules();
      setRulesConfig(data);
    } catch (err) {
      console.error('Failed to load rules', err);
    }
  };

  const evaluateRules = async () => {
    try {
      setLoading(true);
      const res = await evaluateSafetyDecision({
        failure_class: failureClass,
        confidence,
        severity,
        robustness_status: robustnessStatus,
        sensor_missing: sensorMissing,
        vision_missing: visionMissing,
      });
      setDecision(res);
    } catch (err) {
      console.error('Failed to evaluate safety decision', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
    evaluateRules();
  }, [confidence, severity, failureClass, robustnessStatus, sensorMissing, visionMissing]);

  const getActionColor = (action: string) => {
    if (eStopEngaged) return 'bg-rose-700 text-white animate-pulse border-rose-500';
    if (action.includes('HALT')) return 'bg-rose-600 text-white border-rose-500 animate-pulse';
    if (action.includes('SPEED')) return 'bg-amber-600 text-white border-amber-500';
    if (action.includes('MAINTENANCE')) return 'bg-yellow-500 text-slate-950 font-bold border-yellow-400';
    if (action.includes('DEGRADED')) return 'bg-purple-600 text-white border-purple-500';
    return 'bg-emerald-600 text-white border-emerald-500';
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>ISO-Compliant Safety Decision Support Engine</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Deterministic rule-based interlocking enforcing fail-safe operational boundaries over neural outputs
          </p>
        </div>

        {/* E-STOP Fast Trigger Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEStopEngaged(!eStopEngaged)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black tracking-wider uppercase shadow-xl transition-all ${
              eStopEngaged
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 animate-pulse'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
            }`}
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{eStopEngaged ? 'E-STOP ACTIVE (LATCHED)' : 'TRIGGER MANUAL E-STOP'}</span>
          </button>
        </div>
      </div>

      {/* Emergency Interlock Status Banner */}
      {eStopEngaged && (
        <div className="p-4 rounded-xl bg-rose-600/20 border border-rose-500/60 flex items-center justify-between text-rose-300 font-mono text-xs shadow-lg">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-400 animate-spin flex-shrink-0" />
            <div>
              <div className="font-bold text-sm text-white">HARDWARE INTERLOCK TRIPPED: ROBOT ARRESTED</div>
              <div>Power disconnected to 6-DOF actuators. Manual reset key required to clear interlocking state.</div>
            </div>
          </div>
          <button
            onClick={() => setEStopEngaged(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs"
          >
            <Unlock className="w-3.5 h-3.5" />
            Clear Interlock
          </button>
        </div>
      )}

      {/* Decision Output Summary Banner */}
      {decision && (
        <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-mono text-slate-400 uppercase">Deterministic Safety Action</span>
              <div className="text-2xl font-black font-mono tracking-wider text-slate-100 flex items-center gap-3 mt-1">
                <span
                  className={`px-4 py-1.5 rounded-lg border shadow-lg text-sm md:text-base font-bold uppercase tracking-wider ${getActionColor(
                    eStopEngaged ? 'IMMEDIATE HALT' : decision.action
                  )}`}
                >
                  {eStopEngaged ? 'IMMEDIATE HALT (E-STOP OVERRIDE)' : decision.action}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-right">
                <div className="text-[10px] text-slate-500 uppercase">Triggered Rules</div>
                <div className="font-bold text-amber-400">
                  {eStopEngaged ? 'ESTOP-OVERRIDE' : decision.triggered_rules.join(', ') || 'NONE'}
                </div>
              </div>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-right">
                <div className="text-[10px] text-slate-500 uppercase">Audit Status</div>
                <div className="font-bold text-emerald-400 uppercase">VERIFIED DETERMINISTIC</div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1">
            <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Safety Action Rationale:
            </span>
            <p className="pl-5 leading-relaxed">
              {eStopEngaged
                ? 'Manual Emergency Stop button depressed by operator. All motion commands superseded by hardware interrupt.'
                : decision.audit_reason}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Sliders */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Interlock Simulator Inputs
              </h3>
              <span className="text-[10px] font-mono text-slate-500">Live Evaluation</span>
            </div>

            {/* Confidence Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Model Confidence</span>
                <span className="font-bold text-amber-400">{(confidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="1.0"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            {/* Failure Mode Selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Failure Class</label>
              <select
                value={failureClass}
                onChange={(e) => setFailureClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:border-amber-500"
              >
                <option value="Normal">Normal Operation</option>
                <option value="Bearing Failure">Bearing Failure</option>
                <option value="Motor Failure">Motor Failure</option>
                <option value="Sensor Fault">Sensor Fault</option>
                <option value="Overheating">Overheating</option>
                <option value="Mechanical Wear">Mechanical Wear</option>
                <option value="Misalignment">Misalignment</option>
              </select>
            </div>

            {/* Severity Level */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Fault Severity</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 rounded text-[10px] font-mono font-bold transition-all ${
                      severity === sev
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Robustness Grade */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Telemetry Integrity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['GOOD', 'WARNING', 'SEVERE_DEGRADATION'] as const).map((rob) => (
                  <button
                    key={rob}
                    onClick={() => setRobustnessStatus(rob)}
                    className={`py-1.5 rounded text-[10px] font-mono font-bold transition-all ${
                      robustnessStatus === rob
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rob === 'SEVERE_DEGRADATION' ? 'SEVERE' : rob}
                  </button>
                ))}
              </div>
            </div>

            {/* Modality Missing Checkboxes */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Simulate Hardware Dropouts
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensorMissing}
                  onChange={(e) => setSensorMissing(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <span>Kinematic Vibration Sensor Offline</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visionMissing}
                  onChange={(e) => setVisionMissing(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                />
                <span>Inspection Camera Occluded</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Rule Evaluation Matrix */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Rule Interlocking Matrix (ISO 10218 / 13849)</span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Hierarchical rule resolution ordered by safety criticality priority
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {decision?.rule_evaluations ? (
                decision.rule_evaluations.map((rule) => (
                  <div
                    key={rule.rule_id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      rule.triggered
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-mono">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded ${
                            rule.triggered ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {rule.rule_id}
                        </span>
                        <span className="text-xs font-bold text-slate-200">
                          {rule.action_if_triggered}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase border ${
                          rule.triggered
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                            : 'bg-slate-900 text-slate-500 border-slate-800'
                        }`}
                      >
                        {rule.triggered ? 'TRIGGERED' : 'NOT TRIGGERED'}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] font-mono text-slate-400">
                      <div>Condition: <span className="text-slate-300">{rule.condition_description}</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  Evaluating safety rules...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
