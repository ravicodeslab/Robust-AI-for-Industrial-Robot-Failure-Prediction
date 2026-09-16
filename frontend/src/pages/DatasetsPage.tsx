import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  FileUp,
  HardDrive,
  Layers,
  Plus,
  RefreshCw,
  Search,
  UploadCloud,
} from 'lucide-react';
import { getDatasets, uploadDataset } from '../services/api';
import { DatasetItem } from '../types';

export const DatasetsPage: React.FC = () => {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);

  const loadDatasets = async () => {
    try {
      setLoading(true);
      const data = await getDatasets();
      setDatasets(data);
      if (data.length > 0 && !selectedDataset) {
        setSelectedDataset(data[0]);
      }
    } catch (err) {
      console.error('Failed to load datasets', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
      formData.append('modality', file.name.endsWith('.csv') ? 'sensor' : 'vision');

      const created = await uploadDataset(formData);
      setDatasets((prev) => [...prev, created]);
      setSelectedDataset(created);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide text-slate-100 flex items-center gap-2.5 font-mono">
            <FileSpreadsheet className="w-5 h-5 text-amber-400" />
            <span>Industrial Datasets & Sensor Telemetry Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Vibration time-series, electrical phase logs, thermal cameras, and optical defect archives
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono shadow-md cursor-pointer transition-colors">
            <UploadCloud className="w-4 h-4" />
            <span>{uploading ? 'Ingesting...' : 'Import Dataset'}</span>
            <input
              type="file"
              accept=".csv,.zip,.parquet"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={loadDatasets}
            disabled={loading}
            className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dataset Catalog Column */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            Available Datasets ({datasets.length})
          </h3>

          <div className="space-y-2.5">
            {datasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => setSelectedDataset(ds)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedDataset?.id === ds.id
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-slate-100">{ds.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 uppercase font-bold">
                    {ds.modality}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-4 text-[11px] font-mono text-slate-400">
                  <div>
                    <span className="text-slate-500">Samples: </span>
                    <span className="text-slate-200 font-bold">{ds.sample_count.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Type: </span>
                    <span className="text-slate-300">{ds.data_type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Dataset Detail Inspection */}
        <div className="lg:col-span-7 space-y-5">
          {selectedDataset ? (
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-400">Dataset Properties</span>
                  <h3 className="text-base font-bold text-slate-100 font-mono mt-0.5">
                    {selectedDataset.name}
                  </h3>
                </div>
                <span className="text-xs font-mono text-slate-500">{selectedDataset.file_path}</span>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-3 gap-3 font-mono">
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Sample Count</div>
                  <div className="text-lg font-bold text-slate-100">
                    {selectedDataset.sample_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Modality</div>
                  <div className="text-lg font-bold text-amber-400 uppercase">
                    {selectedDataset.modality}
                  </div>
                </div>
                <div className="p-3 rounded bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Format</div>
                  <div className="text-lg font-bold text-sky-400 uppercase">
                    {selectedDataset.file_path.split('.').pop() || 'FOLDER'}
                  </div>
                </div>
              </div>

              {/* Detected Columns & Schema */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
                  Detected Columns & Feature Schema
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {selectedDataset.columns.map((col) => (
                    <span
                      key={col}
                      className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>

              {/* Dynamic Column Mapping */}
              <div className="space-y-2">
                <label className="text-xs font-mono uppercase text-slate-400 tracking-wider block">
                  Sensor Mapping Configuration
                </label>
                <div className="p-3 rounded bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                  {Object.entries(selectedDataset.detected_mapping).map(([target, src]) => (
                    <div key={target} className="flex justify-between items-center text-slate-300">
                      <span className="text-slate-400 font-bold uppercase">{target}:</span>
                      <span className="text-amber-400">{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provenance Indicator */}
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-xs font-mono text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  All samples normalized via sliding-window segmenter (128 steps, stride 64) with standard scaler.
                </span>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs font-mono text-slate-500 border border-dashed border-slate-800 rounded-xl">
              Select a dataset to inspect schema and telemetry columns.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
