import axios from 'axios';
import {
  AlertItem,
  DatasetItem,
  ExperimentItem,
  GradCamResponse,
  LiveStreamData,
  ModelItem,
  PredictionResponse,
  RobustnessResponse,
  SafetyDecisionResponse,
  ShapResponse,
} from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getHealth = async () => {
  const { data } = await api.get('/health');
  return data;
};

export const getLiveStream = async (): Promise<LiveStreamData> => {
  const { data } = await api.get('/predict/live');
  return data;
};

export const predictMultimodal = async (payload: {
  sensor_window?: any[];
  image_base64?: string;
  fusion_method?: string;
  noise_level?: number;
  sensor_dropout?: number;
  robot_id?: string;
}): Promise<PredictionResponse> => {
  const { data } = await api.post('/predict', payload);
  return data;
};

export const getShapExplanation = async (failureClass: string = 'Bearing Failure'): Promise<ShapResponse> => {
  const { data } = await api.post('/explain/shap', null, {
    params: { failure_class: failureClass },
  });
  return data;
};

export const getGradCamExplanation = async (
  failureClass: string = 'Bearing Failure',
  imageBase64?: string
): Promise<GradCamResponse> => {
  const { data } = await api.post(
    '/explain/gradcam',
    null,
    {
      params: { failure_class: failureClass, image_base64: imageBase64 },
    }
  );
  return data;
};

export const runRobustnessTest = async (payload: {
  noise_levels?: number[];
  dropout_levels?: number[];
}): Promise<RobustnessResponse> => {
  const { data } = await api.post('/robustness/test', payload);
  return data;
};

export const evaluateSafetyDecision = async (payload: {
  failure_class: string;
  confidence: number;
  severity: string;
  robustness_status?: string;
  sensor_missing?: boolean;
  vision_missing?: boolean;
  sensor_features?: Record<string, number>;
}): Promise<SafetyDecisionResponse> => {
  const { data } = await api.post('/safety/decision', payload);
  return data;
};

export const getSafetyRules = async () => {
  const { data } = await api.get('/safety/rules');
  return data;
};

export const getModels = async (): Promise<ModelItem[]> => {
  const { data } = await api.get('/models');
  return data;
};

export const getModelComparison = async () => {
  const { data } = await api.get('/models/comparison');
  return data;
};

export const getExperiments = async (): Promise<ExperimentItem[]> => {
  const { data } = await api.get('/experiments');
  return data;
};

export const getDatasets = async (): Promise<DatasetItem[]> => {
  const { data } = await api.get('/datasets');
  return data;
};

export const uploadDataset = async (formData: FormData): Promise<DatasetItem> => {
  const { data } = await api.post('/datasets/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const startTraining = async (config: {
  model_type: string;
  fusion_method: string;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  val_split: number;
}) => {
  const { data } = await api.post('/train', config);
  return data;
};

export const getTrainingStatus = async () => {
  const { data } = await api.get('/train/status');
  return data;
};

export const getAlerts = async (): Promise<AlertItem[]> => {
  const { data } = await api.get('/alerts');
  return data;
};

export const acknowledgeAlert = async (alertId: string) => {
  const { data } = await api.post(`/alerts/${alertId}/acknowledge`);
  return data;
};
