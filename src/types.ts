export type SahayakMode = 'HEALTH_PILL' | 'SAFETY_BILL_SCAM' | 'MEMORY_STIMULATION' | 'SMART_ASSIST';

export interface SahayakActionPayload {
  mode: SahayakMode;
  headline: string;
  is_urgent_or_scam: boolean;
  confidence_reason: string;
  bullets: string[];
  voice_readout: string;
  caregiver_alert: string | null;
  inferenceTimeMs?: number;
  sourceImage?: string;
}

export interface CaregiverContact {
  name: string;
  relationship: string;
  phone: string;
  webhookUrl?: string;
}

export interface CaregiverDispatchLog {
  id: string;
  timestamp: string;
  headline: string;
  mode: SahayakMode;
  is_urgent: boolean;
  alertMessage: string;
  recipient: CaregiverContact;
  status: 'SENT' | 'FAILED';
  webhookDispatched?: boolean;
}

export interface ScannedRecord {
  id: string;
  timestamp: string;
  headline: string;
  mode: SahayakMode;
  is_urgent_or_scam: boolean;
  inputText?: string;
  thumbnailUrl?: string;
  payload: SahayakActionPayload;
  caregiverDispatched?: boolean;
}

export interface UserProfile {
  name: string;
  preferredGreeting: string;
  age: number;
  primaryConcern: 'all' | 'scams' | 'medicine' | 'memory';
  fontSizeMode: 'normal' | 'large';
  speechRate: number;
  caregiver: CaregiverContact;
  hasCompletedOnboarding: boolean;
}

export interface AnalyzeRequest {
  text?: string;
  image?: {
    data: string; // base64
    mimeType: string;
  };
  audio?: {
    data: string; // base64
    mimeType: string;
  };
  userProfile?: UserProfile;
}
