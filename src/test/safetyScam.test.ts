import { describe, it, expect } from 'vitest';
import { SahayakActionPayload, CaregiverContact, MedicineItem } from '../types';

describe('Sahayak AI - Scam Detection & Safety Verification', () => {
  it('correctly identifies high-pressure financial extortion scam', () => {
    const scamPayload: SahayakActionPayload = {
      mode: 'SAFETY_BILL_SCAM',
      headline: 'Fake Electricity Disconnection Warning',
      is_urgent_or_scam: true,
      confidence_reason: 'Unverified sender requesting immediate payment via personal cell number.',
      bullets: [
        'Do not transfer money or call the number.',
        'Official power utility never cuts electricity without registered postal notices.',
        'Show this message to your daughter Priya.',
      ],
      voice_readout: 'Ramesh Ji, please do not worry. This message is completely fake.',
      caregiver_alert: 'Urgent: Fake electricity disconnection threat received on Ramesh Ji\'s phone.',
      scamDetails: {
        scamType: 'Electricity Disconnection Threat',
        psychologicalTrap: 'Artificial urgency threatening power cutoff within 2 hours',
        redFlags: [
          'Sent from an unknown 10-digit mobile number',
          'Threatens immediate disconnection without account verification',
          'Demands payment via external link or APK',
        ],
        safeRebuttalScript: 'I am an elderly citizen. All official bills are handled in person by my daughter.',
      },
    };

    expect(scamPayload.is_urgent_or_scam).toBe(true);
    expect(scamPayload.mode).toBe('SAFETY_BILL_SCAM');
    expect(scamPayload.bullets.length).toBeGreaterThanOrEqual(2);
    expect(scamPayload.scamDetails?.redFlags.length).toBeGreaterThan(0);
    expect(scamPayload.scamDetails?.safeRebuttalScript).toBeDefined();
    expect(scamPayload.caregiver_alert).toBeTruthy();
  });

  it('marks benign utility bill as safe to proceed', () => {
    const safePayload: SahayakActionPayload = {
      mode: 'SAFETY_BILL_SCAM',
      headline: 'Monthly Water Bill: $24.50 Due in 18 Days',
      is_urgent_or_scam: false,
      confidence_reason: 'Matches official municipal billing cycle with standard due date.',
      bullets: [
        'Routine monthly water service statement.',
        'Due date is next month on the 15th.',
        'No immediate action required today.',
      ],
      voice_readout: 'Ramesh Ji, your routine water bill has arrived. You have plenty of time.',
      caregiver_alert: null,
    };

    expect(safePayload.is_urgent_or_scam).toBe(false);
    expect(safePayload.caregiver_alert).toBeNull();
  });
});
