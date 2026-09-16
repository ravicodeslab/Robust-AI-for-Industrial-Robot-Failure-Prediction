import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Sparkles,
  StopCircle,
  TrendingUp,
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
import { getTrainingStatus, startTraining } from '../services/api';

export const TrainingPage: React.FC = () => {
  const [modelType, setModelType] = useState('fusion');
  const [fusionMethod, setFusionMethod] = useState('cross_attention');
  const [epochs, setEpochs] = useState(20);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [valSplit, setValSplit] = useState(0.2);

  const [trainingStatus, setTrainingStatus] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkStatus = async () => {
    try {
      const data = await getTrainingStatus();
      setTrainingStatus(data);
    } catch (err) {
      console.error('Failed to get training status', err);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    try {
      setSubmitting(true);
      await startTraining({
        model_type: modelType,
        fusion_method: fusionMethod,
        epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        val_split: valSplit,
      });
      await checkStatus();
    } catch (err) {
      console.error('Failed to start training', err);
    } finally {
      setSubmitting(false);
    }
  };

  const chartHistory = trainingStatus?.history?.map((h: any) => ({
    epoch: `Ep ${h.epoch}`,
    TrainLoss: Number(h.train_loss.toFixed(4)),
    ValLoss: Number(h.val_loss.toFixed(4)),
    TrainAcc: Number((h.train_acc * 100).toFixed(1)),
    ValAcc: Number((h.val_acc * 100).toFixed(1)),
  })) || [];

  const isTraining = trainingStatus?.is_training;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Play className="w-5 h-5 text-amber-400" />
            <span>Neural Training & Cross-Attention Fine-Tuning</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            End-to-end multimodal optimization with cosine annealing and validation interlocks
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-mono font-bold px-3 py-1 rounded border uppercase tracking-wider ${
              isTraining
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}
          >
            {isTraining ? 'TRAINING IN PROGRESS' : 'ENGINE READY'}
          </span>
          <button
            onClick={handleStart}
            disabled={isTraining || submitting}
            className="flex items-center gap-2 px-5 py-2 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md disabled:opacity-50"
          >
            {isTraining ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Play className="w-4 h-4 fill-current text-slate-950" />
            )}
            Launch Training Job
          </button>
        </div>
      </div>

      {/* Progress Bar (When Active) */}
      {trainingStatus && (
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-300 font-bold">
              Epoch {trainingStatus.current_epoch} / {trainingStatus.total_epochs}
            </span>
            <span className="text-amber-400 font-bold">
              {trainingStatus.total_epochs > 0
                ? `${Math.round((trainingStatus.current_epoch / trainingStatus.total_epochs) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-400 h-full transition-all duration-300"
              style={{
                width: `${
                  trainingStatus.total_epochs > 0
                    ? (trainingStatus.current_epoch / trainingStatus.total_epochs) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hyperparameters */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-300 tracking-wider flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              Model Architecture & Hyperparameters
            </h3>

            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">Target Architecture</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:border-amber-500"
              >
                <option value="fusion">Multimodal Fusion (Sensor + Vision)</option>
                <option value="sensor">Sensor Branch (1D CNN-LSTM)</option>
                <option value="vision">Vision Branch (ResNet18)</option>
              </select>
            </div>

            {modelType === 'fusion' && (
              <div>
                <label className="text-xs font-mono text-slate-400 block mb-1">Fusion Mechanism</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setFusionMethod('cross_attention')}
                    className={`p-2 rounded text-xs font-mono border ${
                      fusionMethod === 'cross_attention'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Cross-Attention
                  </button>
                  <button
                    onClick={() => setFusionMethod('concat')}
                    className={`p-2 rounded text-xs font-mono border ${
                      fusionMethod === 'concat'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    Concat Early
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Total Epochs</span>
                <span className="font-bold text-amber-400">{epochs}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Learning Rate</span>
                <span className="font-bold text-sky-400">{learningRate}</span>
              </div>
              <input
                type="range"
                min="0.0001"
                max="0.01"
                step="0.0005"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
                <span>Validation Split</span>
                <span className="font-bold text-purple-400">{(valSplit * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.30"
                step="0.05"
                value={valSplit}
                onChange={(e) => setValSplit(parseFloat(e.target.value))}
                className="w-full accent-purple-500 bg-slate-800 h-1.5 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Convergence Curves */}
        <div className="lg:col-span-7 space-y-5">
          <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Training Loss & Accuracy Convergence Curves</span>
            </h3>

            {chartHistory.length > 0 ? (
              <div className="space-y-6">
                {/* Accuracy Chart */}
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartHistory} margin={{ left: -10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis domain={[60, 100]} stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="TrainAcc" name="Train Acc (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ValAcc" name="Val Acc (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Loss Chart */}
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartHistory} margin={{ left: -10, right: 20, top: 5, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                      <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.5rem',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="TrainLoss" name="Train Loss" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ValLoss" name="Val Loss" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
                Launch a training run to stream live loss and accuracy curves.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
