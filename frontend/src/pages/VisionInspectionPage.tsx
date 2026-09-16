import React, { useEffect, useState } from 'react';
import {
  Camera,
  CheckCircle2,
  Crosshair,
  Download,
  Eye,
  FileUp,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { getGradCamExplanation } from '../services/api';
import { GradCamResponse } from '../types';

export const VisionInspectionPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState('Bearing Failure');
  const [camData, setCamData] = useState<GradCamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'overlay' | 'heatmap' | 'original'>('all');

  const failurePresets = [
    'Bearing Failure',
    'Mechanical Wear',
    'Overheating',
    'Misalignment',
    'Motor Failure',
    'Normal',
  ];

  const fetchGradCam = async (cls: string) => {
    try {
      setLoading(true);
      const res = await getGradCamExplanation(cls);
      setCamData(res);
    } catch (err) {
      console.error('Failed to load Grad-CAM', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGradCam(selectedClass);
  }, [selectedClass]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        setLoading(true);
        const res = await getGradCamExplanation(selectedClass, base64);
        setCamData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 font-mono flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <span>VISION INSPECTION & GRAD-CAM LOCALIZATION</span>
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Backbone: ResNet18 &bull; Target: layer4 (512-dim Feature Activations) &bull; Surface Defect Classification
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-3.5 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 rounded-lg text-xs font-mono font-bold cursor-pointer transition shadow-sm">
          <FileUp className="w-4 h-4" />
          <span>UPLOAD INSPECTION IMAGE</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Preset Selector */}
      <div className="industrial-panel p-4 flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5 flex-shrink-0">
          <Crosshair className="w-3.5 h-3.5 text-amber-400" />
          <span>Preset Inspection Samples:</span>
        </span>
        <div className="flex items-center gap-2">
          {failurePresets.map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition flex-shrink-0 ${
                selectedClass === cls
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold shadow'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Triplet Display */}
      {loading ? (
        <div className="industrial-panel p-16 flex flex-col items-center justify-center text-slate-400 font-mono gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-xs">Computing Grad-CAM Gradients on layer4 feature maps...</span>
        </div>
      ) : camData ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel 1: Original Image */}
            <div className="industrial-panel p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
                <span className="font-bold">1. ORIGINAL INSPECTION IMAGE</span>
                <span className="text-[10px] text-slate-500">224 &times; 224 RGB</span>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
                <img
                  src={camData.original_image_base64}
                  alt="Original"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Industrial robotic end-effector raceway surface scan.
              </div>
            </div>

            {/* Panel 2: Grad-CAM Heatmap */}
            <div className="industrial-panel p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
                <span className="font-bold text-amber-300">2. GRAD-CAM ACTIVATION MAP</span>
                <span className="text-[10px] text-amber-400">Jet Colormap</span>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
                <img
                  src={camData.heatmap_base64}
                  alt="Heatmap"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Warm colors indicate highest convolutional receptive gradients.
              </div>
            </div>

            {/* Panel 3: Overlay */}
            <div className="industrial-panel p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300 border-b border-slate-800 pb-2">
                <span className="font-bold text-cyan-300">3. LOCALIZED OVERLAY</span>
                <span className="text-[10px] text-cyan-400">Alpha: 0.4</span>
              </div>
              <div className="aspect-square rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950 flex items-center justify-center">
                <img
                  src={camData.overlay_base64}
                  alt="Overlay"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Direct spatial alignment of model attention onto surface anomaly.
              </div>
            </div>
          </div>

          {/* Localization Insight Box */}
          <div className="industrial-panel p-5 border-l-4 border-l-cyan-500 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span className="font-bold uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>SPATIAL ATTENTION REGION AUDIT</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                Confidence: {(camData.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <p className="text-sm font-mono text-slate-200 leading-relaxed">
              &ldquo;{camData.attention_region_description}&rdquo;
            </p>
            <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-400 border-t border-slate-800/80">
              <div>TARGET CLASS: <strong className="text-amber-300">{camData.predicted_class}</strong></div>
              <div>GRADIENT TARGET: <strong className="text-cyan-300">Conv2d layer4</strong></div>
              <div>PROVENANCE: <strong className="text-emerald-400">GENUINE MODEL FORWARD/BACKWARD</strong></div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
