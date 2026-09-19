export type SahayakMode = 'HEALTH_PILL' | 'SAFETY_BILL_SCAM' | 'MEMORY_STIMULATION' | 'SMART_ASSIST';

export interface MedicineDetails {
  name: string;
  purpose: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'night' | 'as_needed';
  instructions: string;
  cautions: string;
}

export interface ScamDefenseDetails {
  scamType: string;
  psychologicalTrap: string;
  redFlags: string[];
  safeRebuttalScript: string;
}

export interface ClarifyMessage {
  id: string;
  sender: 'elder' | 'sahayak';
  text: string;
  timestamp: string;
}

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
  medicineDetails?: MedicineDetails | null;
  scamDetails?: ScamDefenseDetails | null;
  currentLanguage?: string;
}

export interface MedicineItem {
  id: string;
  userId: string;
  name: string;
  purpose: string;
  timing: 'morning' | 'afternoon' | 'evening' | 'night' | 'as_needed';
  instructions?: string;
  cautions?: string;
  takenToday?: boolean;
  addedAt: string;
}

export interface DrugInteractionReport {
  hasConflict: boolean;
  overallSafety: 'SAFE' | 'CAUTION' | 'DANGER';
  headline: string;
  summary: string;
  warnings: string[];
  foodCautions: string[];
  timingRecommendations: string[];
  voiceReadout: string;
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
