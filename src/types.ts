export interface FeatureAttribution {
  feature: string;
  attribution: number;
  importance: number;
  value: number | string;
  direction: 'increases_risk' | 'decreases_risk';
  explanation: string;
}

export interface PredictionResult {
  is_intrusion: boolean;
  prediction: 'Normal' | 'DoS' | 'Probe' | 'R2L' | 'U2R' | string;
  attack_category: string;
  confidence: number;
  probabilities: {
    Normal: number;
    DoS: number;
    Probe: number;
    R2L: number;
    U2R: number;
    [key: string]: number;
  };
  risk_level: 'Nominal' | 'Low' | 'Medium' | 'High' | 'Critical';
  top_contributing_features: FeatureAttribution[];
  inference_latency_ms: number;
  timestamp: string;
}

export interface BatchRecordResult {
  record_id: number;
  prediction: string;
  is_intrusion: boolean;
  confidence: number;
  risk_level: string;
  protocol: string;
  service: string;
  flag: string;
  src_bytes: number;
  dst_bytes: number;
  count: number;
  serror_rate: number;
  ground_truth?: string;
}

export interface BatchSummary {
  total_records: number;
  total_intrusions_flagged: number;
  total_normal_flows: number;
  intrusion_rate_percent: number;
  breakdown: Record<string, number>;
  total_batch_latency_ms: number;
  avg_latency_per_sample_ms: number;
}

export interface BatchPredictionResponse {
  summary: BatchSummary;
  records: BatchRecordResult[];
}

export interface TrafficPreset {
  id: string;
  title: string;
  description: string;
  expected: string;
  data: Record<string, any>;
}

export interface SystemHealth {
  status: string;
  service: string;
  model: string;
  version: string;
  device: string;
  classes: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: string;
  createdAt: string;
  lastLoginAt: string;
  preferences?: {
    alertThreshold?: number;
    autoSaveScans?: boolean;
    highRiskAlertSound?: boolean;
  };
}

export interface UserScanRecord {
  id: string;
  userId: string;
  timestamp: string;
  predicted_class: string;
  is_intrusion: boolean;
  confidence: number;
  risk_level: string;
  inference_time_ms: number;
  flowData: Record<string, any>;
  class_probabilities?: Record<string, number>;
  notes?: string;
  incidentStatus: 'Unreviewed' | 'Under Investigation' | 'Mitigated' | 'False Positive';
  isBookmarked?: boolean;
}

export interface UserBatchRunRecord {
  id: string;
  userId: string;
  timestamp: string;
  title: string;
  total_samples: number;
  total_intrusions: number;
  total_normal: number;
  avg_latency_ms: number;
  summary: BatchSummary;
  sample_results?: BatchRecordResult[];
}
