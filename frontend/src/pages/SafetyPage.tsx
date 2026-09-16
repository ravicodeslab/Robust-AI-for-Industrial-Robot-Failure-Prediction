import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { evaluateSafetyDecision, getSafetyRules } from '../services/api';
import { SafetyDecisionResponse } from '../types';

export const SafetyPage: React.FC = () => {
  const [rules, setRules] = useState<any[]>([]);
  const [evaluation, setEvaluation] = useState<SafetyDecisionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Manual scenario state
  const [scenarioClass, setScenarioClass] = useState<string>('Bearing Failure');
  const [scenarioConfidence, setScenarioConfidence] = useState<number>(0.92);
  const [scenarioSeverity, setScenarioSeverity] = useState<string>('HIGH');
  const [sensorMissing, setSensorMissing] = useState<boolean>(false);
  const [visionMissing, setVisionMissing] = useState<boolean>(false);
  const [overrideActive, setOverrideActive] = useState<string | null>(null);

  const fetchRules = async () => {
    try {
      const data = await getSafetyRules();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Failed to load rules', err);
    }
  };

  const runEvaluation = async () => {
    try {
      setLoading(true);
      const res = await evaluateSafetyDecision({
        failure_class: scenarioClass,
        confidence: scenarioConfidence,
        severity: scenarioSeverity,
        sensor_missing: sensorMissing,
        vision_missing: visionMissing,
        sensor_features: {
          vibration: scenarioClass === 'Bearing Failure' ? 0.85 : 0.25,
          temperature: scenarioClass === 'Overheating' ? 82.0 : 45.0,
          current: 3.8,
        },
      });
      setEvaluation(res);
      setOverrideActive(null);
    } catch (err) {
      console.error('Failed to evaluate safety decision', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
    runEvaluation();
  }, []);

  const handleOverride = (action: string) => {
    setOverrideActive(action);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="industrial-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 font-mono tracking-wide">
                Transparent Safety Decision Engine
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Deterministic Rule-Based Guardrails (ISO 10218 / IEC 61508) Governing AI Model Recommendations
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOverride('EMERGENCY HALT')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase transition-all shadow-lg hover:shadow-rose-600/30 cursor-pointer"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>Manual E-Stop</span>
          </button>
          <button
            onClick={() => handleOverride('SPEED DERATE 50%')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold transition-all cursor-pointer"
          >
            <span>Derate 50%</span>
          </button>
          <button
            onClick={() => handleOverride('RESET TO NOMINAL')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Override Alert Banner if operator intervened */}
      {overrideActive && (
        <div className="p-4 rounded-xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-between text-rose-300 font-mono animate-pulse">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-6 h-6 text-rose-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm tracking-wider uppercase">
                OPERATOR OVERRIDE ACTIVE: {overrideActive}
              </div>
              <div className="text-xs text-rose-300/80 mt-0.5">
                Automated model recommendations overridden by manual safety officer control. Safety log ID: OVR-{Date.now().toString().slice(-6)}.
              </div>
            </div>
          </div>
          <button
            onClick={() => setOverrideActive(null)}
            className="px-3 py-1.5 rounded bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
          >
            Clear Override
          </button>
        </div>
      )}

      {/* Decision Output & Scenario Evaluator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Scenario Inputs (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="industrial-panel p-5 space-y-4">
            <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>Safety Rule Evaluation Inputs</span>
            </h3>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Simulated Failure Class</label>
              <select
                value={scenarioClass}
                onChange={(e) => setScenarioClass(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="Bearing Failure">Bearing Failure</option>
                <option value="Motor Failure">Motor Failure</option>
                <option value="Overheating">Overheating</option>
                <option value="Mechanical Wear">Mechanical Wear</option>
                <option value="Normal">Normal Operation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Severity Rating</label>
              <select
                value={scenarioSeverity}
                onChange={(e) => setScenarioSeverity(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">Model Confidence</span>
                <span className="text-amber-400 font-bold">{(scenarioConfidence * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.02"
                value={scenarioConfidence}
                onChange={(e) => setScenarioConfidence(parseFloat(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sensorMissing}
                  onChange={(e) => setSensorMissing(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Simulate Sensor Loss (Disconnected)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visionMissing}
                  onChange={(e) => setVisionMissing(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Simulate Camera Occlusion (Vision Lost)</span>
              </label>
            </div>

            <button
              onClick={runEvaluation}
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              {loading ? 'Evaluating Rules...' : 'Run Safety Evaluation'}
            </button>
          </div>
        </div>

        {/* Right: Evaluation Decision and Rule Trace (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Directive Box */}
          {evaluation && (
            <div className="industrial-panel p-6 border-l-4 border-l-amber-500 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Deterministic Safety Directive</div>
                  <div className="text-2xl font-mono font-bold text-slate-100 mt-1 flex items-center gap-3">
                    <span>{evaluation.action}</span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded border uppercase font-mono font-bold ${
                        evaluation.action.includes('HALT')
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                          : evaluation.action.includes('SPEED')
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      {evaluation.severity} HAZARD LEVEL
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500 uppercase">Audit Decision Confidence</div>
                  <div className="text-xl font-mono font-bold text-amber-400">
                    {(evaluation.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed">
                <span className="text-amber-400 font-bold">Rule Engine Audit: </span>
                {evaluation.audit_reason}
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Degraded Modality Status:</span>
                  <span className={`font-bold ${evaluation.is_degraded ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {evaluation.is_degraded ? 'YES (MODALITY MISSING)' : 'NO (ALL SENSORS NOMINAL)'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Requires Manual Inspection:</span>
                  <span
                    className={`font-bold ${
                      evaluation.requires_manual_inspection ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {evaluation.requires_manual_inspection ? 'REQUIRED (SAFETY LOCK)' : 'NOT REQUIRED'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Rule Evaluation Tree */}
          <div className="industrial-panel p-5">
            <h3 className="text-sm font-bold font-mono text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Configured Safety Rules &amp; Real-time Activation Trace</span>
            </h3>

            <div className="space-y-3">
              {evaluation?.rule_evaluations?.map((r, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border transition-all ${
                    r.triggered
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          r.triggered ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
                        }`}
                      />
                      <span className="font-mono text-xs font-bold text-slate-200">{r.rule_id}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        r.triggered
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {r.triggered ? 'RULE TRIGGERED' : 'PASS'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-mono mb-2">{r.condition_description}</div>

                  <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-800/80 text-slate-400">
                    <div>Action if Triggered: <span className="text-amber-300 font-bold">{r.action_if_triggered}</span></div>
                    <div>Evaluated Condition: <span className="text-slate-200 font-semibold">{r.triggered ? 'TRUE' : 'FALSE'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
