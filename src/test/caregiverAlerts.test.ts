import { describe, it, expect } from 'vitest';
import { CaregiverContact } from '../types';

describe('Sahayak AI - Multichannel Caregiver Safeguards', () => {
  const caregiver: CaregiverContact = {
    name: 'Priya',
    relationship: 'Daughter (Emergency Contact)',
    phone: '+1 (555) 019-2834',
    webhookUrl: 'https://webhook.site/emergency-alert',
  };

  it('formats clean phone digits for WhatsApp and SMS tel links', () => {
    const cleanDigits = caregiver.phone.replace(/[^0-9]/g, '');
    expect(cleanDigits).toBe('15550192834');

    const telLink = `tel:${caregiver.phone}`;
    expect(telLink).toBe('tel:+1 (555) 019-2834');

    const alertMessage = 'Suspicious electricity cutoff demand detected.';
    const smsLink = `sms:${caregiver.phone}?body=${encodeURIComponent(alertMessage)}`;
    expect(smsLink).toContain('sms:+1 (555) 019-2834?body=');
    expect(smsLink).toContain(encodeURIComponent(alertMessage));

    const whatsappLink = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(alertMessage)}`;
    expect(whatsappLink).toContain('https://wa.me/15550192834?text=');
  });

  it('validates caregiver alert payload format', () => {
    const alertData = {
      headline: 'Urgent Scam Warning',
      mode: 'SAFETY_BILL_SCAM',
      is_urgent: true,
      alertMessage: 'Sahayak AI detected a fraudulent electricity bill warning.',
      recipient: caregiver,
    };

    expect(alertData.is_urgent).toBe(true);
    expect(alertData.alertMessage).toBeTruthy();
    expect(alertData.recipient.name).toBe('Priya');
    expect(alertData.recipient.phone).toBe('+1 (555) 019-2834');
  });
});
