import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  Play,
  RefreshCw,
  Search,
  Terminal,
  Zap,
} from 'lucide-react';
import { getExperiments } from '../services/api';
import { ExperimentItem } from '../types';

export const ExperimentsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterArch, setFilterArch] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadExperiments = async () => {
    try {
      setLoading(true);
      const data = await getExperiments();
      setExperiments(data);
    } catch (err) {
      console.error('Failed to load experiments', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperiments();
  }, []);

  const filtered = experiments.filter((exp) => {
    const matchesArch = filterArch === 'all' || exp.model_architecture.toLowerCase().includes(filterArch.toLowerCase());
    const matchesSearch =
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.experiment_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.dataset_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesArch && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <Terminal className="w-5 h-5 text-amber-400" />
            <span>Research Evaluation & Experiment Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Systematic benchmark execution registry across ablation suites, noise levels, and fusion layers
          </p>
        </div>

        <button
          onClick={loadExperiments}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search experiments by code, model, dataset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterArch}
            onChange={(e) => setFilterArch(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 focus:border-amber-500"
          >
            <option value="all">All Architectures</option>
            <option value="attention">Cross-Attention</option>
            <option value="concat">Concat Fusion</option>
            <option value="cnn">Sensor (CNN-LSTM)</option>
            <option value="resnet">Vision (ResNet18)</option>
          </select>
        </div>
      </div>

      {/* Experiments Registry Table */}
      <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Benchmark Runs ({filtered.length} total)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Run ID</th>
                <th className="p-3">Experiment Name</th>
                <th className="p-3">Architecture</th>
                <th className="p-3">Dataset</th>
                <th className="p-3">Accuracy</th>
                <th className="p-3">F1-Score</th>
                <th className="p-3">ROC-AUC</th>
                <th className="p-3">Noise / Dropout</th>
                <th className="p-3">Status</th>
                <th className="p-3">Logged Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filtered.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-bold text-amber-400">{exp.experiment_code}</td>
                  <td className="p-3 font-medium text-slate-200">{exp.name}</td>
                  <td className="p-3 text-slate-300">{exp.model_architecture}</td>
                  <td className="p-3 text-slate-400">{exp.dataset_name}</td>
                  <td className="p-3 text-slate-300">{(exp.accuracy * 100).toFixed(1)}%</td>
                  <td className="p-3 text-emerald-400 font-bold">{(exp.f1_score * 100).toFixed(1)}%</td>
                  <td className="p-3 text-slate-300">{exp.auc_score.toFixed(3)}</td>
                  <td className="p-3 text-slate-400">
                    {exp.noise_level > 0 ? `${(exp.noise_level * 100).toFixed(0)}% N` : 'Clean'} /{' '}
                    {exp.dropout_level > 0 ? `${(exp.dropout_level * 100).toFixed(0)}% D` : '0% D'}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {exp.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{exp.created_at.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
