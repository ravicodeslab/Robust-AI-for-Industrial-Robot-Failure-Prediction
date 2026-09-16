export interface SensorReading {
  timestamp?: number;
  vibration: number;
  current: number;
  temperature: number;
}

export interface ShapFactor {
  feature: string;
  contribution: number;
  value: number;
  direction?: 'POSITIVE' | 'NEGATIVE';
}

export interface PredictionResponse {
  id: string;
  robot_id: string;
  timestamp: string;
  failure_class: string;
  confidence: number;
  affected_component: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probabilities: Record<string, number>;
  data_mode: string;
  modality_used: 'multimodal' | 'sensor_only' | 'vision_only';
  robustness_status: 'GOOD' | 'WARNING' | 'SEVERE_DEGRADATION';
  recommended_action: 'CONTINUE OPERATION' | 'REDUCE SPEED' | 'SCHEDULE MAINTENANCE' | 'IMMEDIATE HALT' | 'DEGRADED / VERIFY MANUALLY';
  safety_reason: string;
  triggered_rules: string[];
  top_contributing_factors?: ShapFactor[];
  gradcam_overlay_base64?: string;
  is_anomaly: boolean;
}

export interface LiveStreamData {
  step: number;
  timestamp: number;
  vibration: number;
  current: number;
  temperature: number;
  failure_risk: number;
  robot_status: 'OPERATIONAL' | 'WARNING' | 'HIGH RISK' | 'HALTED';
  predicted_failure: string;
  recommended_action: string;
  data_mode: string;
}

export interface ShapResponse {
  predicted_class: string;
  base_value: number;
  features: ShapFactor[];
  chart_data: Array<{ feature: string; contribution: number }>;
  summary_text: string;
}

export interface GradCamResponse {
  predicted_class: string;
  confidence: number;
  original_image_base64: string;
  heatmap_base64: string;
  overlay_base64: string;
  attention_region_description: string;
}

export interface RobustnessPoint {
  level: number;
  accuracy: number;
  f1: number;
  auc?: number;
  confidence_avg: number;
}

export interface RobustnessResponse {
  test_id: string;
  model_architecture: string;
  noise_curve: RobustnessPoint[];
  dropout_curve: RobustnessPoint[];
  missing_modality_results: Record<string, { accuracy: number; f1_score: number; auc: number; status: string }>;
  timestamp: string;
  summary: string;
}

export interface SafetyRuleEvaluation {
  rule_id: string;
  condition_description: string;
  triggered: boolean;
  action_if_triggered: string;
  evaluated_values: Record<string, any>;
}

export interface SafetyDecisionResponse {
  action: string;
  confidence: number;
  severity: string;
  robustness_status: string;
  audit_reason: string;
  triggered_rules: string[];
  rule_evaluations: SafetyRuleEvaluation[];
  timestamp: string;
  is_degraded: boolean;
  requires_manual_inspection: boolean;
}

export interface ModelItem {
  id: string;
  name: string;
  architecture: string;
  modality: string;
  fusion_method: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  latency_ms: number;
  parameters: string;
  is_active: boolean;
  xai_supported: boolean;
  status: string;
}

export interface ExperimentItem {
  id: string;
  experiment_code: string;
  name: string;
  model_architecture: string;
  dataset_name: string;
  accuracy: number;
  f1_score: number;
  auc_score: number;
  noise_level: number;
  dropout_level: number;
  missing_modality: string;
  status: string;
  created_at: string;
}

export interface DatasetItem {
  id: string;
  name: string;
  modality: string;
  data_type: string;
  file_path: string;
  sample_count: number;
  columns: string[];
  detected_mapping: Record<string, string>;
  created_at: string;
}

export interface AlertItem {
  id: string;
  robot_id: string;
  timestamp: string;
  alert_type: string;
  severity: string;
  prediction_class: string;
  confidence: number;
  affected_component: string;
  recommended_action: string;
  detected_anomaly: string;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
}
