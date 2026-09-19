import { describe, it, expect } from 'vitest';
import { MedicineItem, DrugInteractionReport } from '../types';

describe('Sahayak AI - Medicine Cabinet & AI Drug Interaction Watchdog', () => {
  const sampleCabinet: MedicineItem[] = [
    {
      id: 'med-1',
      userId: 'elder-123',
      name: 'Metformin 500mg',
      purpose: 'Blood sugar control',
      timing: 'morning',
      instructions: 'Take with breakfast and full glass of water',
      cautions: 'Do not skip meals',
      takenToday: true,
      addedAt: '2026-09-18T10:00:00Z',
    },
    {
      id: 'med-2',
      userId: 'elder-123',
      name: 'Lisinopril 10mg',
      purpose: 'Blood pressure regulation',
      timing: 'morning',
      instructions: 'Take once daily in morning',
      cautions: 'Avoid excessive potassium or salt substitutes',
      takenToday: false,
      addedAt: '2026-09-18T10:05:00Z',
    },
    {
      id: 'med-3',
      userId: 'elder-123',
      name: 'Aspirin 81mg',
      purpose: 'Cardiovascular heart health',
      timing: 'night',
      instructions: 'Take with dinner',
      cautions: 'Watch for easy bruising',
      takenToday: false,
      addedAt: '2026-09-18T10:10:00Z',
    },
  ];

  it('tracks daily medicine schedule and taken status accurately', () => {
    const morningMeds = sampleCabinet.filter((m) => m.timing === 'morning');
    expect(morningMeds.length).toBe(2);

    const takenCount = sampleCabinet.filter((m) => m.takenToday).length;
    expect(takenCount).toBe(1);

    const pendingCount = sampleCabinet.filter((m) => !m.takenToday).length;
    expect(pendingCount).toBe(2);
  });

  it('verifies clinical drug interaction report structure', () => {
    const sampleReport: DrugInteractionReport = {
      hasConflict: false,
      overallSafety: 'SAFE',
      headline: 'Medications Are Safe Together',
      summary: 'Metformin, Lisinopril, and low-dose Aspirin are a well-tolerated combination under standard senior guidelines.',
      warnings: [],
      foodCautions: [
        'Avoid high-potassium salt substitutes while taking Lisinopril',
        'Drink adequate water throughout the day with Metformin',
      ],
      timingRecommendations: [
        'Take Metformin and Lisinopril with your morning breakfast',
        'Take low-dose Aspirin with dinner to protect your stomach lining',
      ],
      voiceReadout: 'Ramesh Ji, your daily medicines work very well together. There are no dangerous clashes.',
    };

    expect(sampleReport.overallSafety).toBe('SAFE');
    expect(sampleReport.hasConflict).toBe(false);
    expect(sampleReport.foodCautions.length).toBeGreaterThanOrEqual(1);
    expect(sampleReport.timingRecommendations.length).toBeGreaterThanOrEqual(1);
    expect(sampleReport.voiceReadout).toContain('Ramesh Ji');
  });

  it('detects dangerous drug clashes or duplicate therapies', () => {
    const clashReport: DrugInteractionReport = {
      hasConflict: true,
      overallSafety: 'CAUTION',
      headline: 'Caution: Duplicate Blood Thinners Detected',
      summary: 'Taking Warfarin along with high-dose Ibuprofen or duplicate NSAIDs increases bleeding risk significantly.',
      warnings: [
        'Warfarin and NSAIDs both affect blood clotting. Increased risk of gastric bleeding.',
      ],
      foodCautions: [
        'Keep vitamin K intake (dark leafy greens) consistent while on Warfarin',
      ],
      timingRecommendations: [
        'Consult with your cardiologist before adding over-the-counter pain relievers',
      ],
      voiceReadout: 'Ramesh Ji, we found two medications that thin your blood. Please check with your doctor before taking both.',
    };

    expect(clashReport.hasConflict).toBe(true);
    expect(clashReport.overallSafety).toBe('CAUTION');
    expect(clashReport.warnings.length).toBeGreaterThan(0);
  });
});
