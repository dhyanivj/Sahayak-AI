import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReactiveResultCard } from '../components/ReactiveResultCard';
import { SahayakActionPayload, CaregiverContact } from '../types';

describe('Sahayak AI - Reactive Result Card & Protective Actions', () => {
  const mockPayload: SahayakActionPayload = {
    mode: 'SAFETY_BILL_SCAM',
    headline: 'Fake Electricity Disconnection Threat',
    is_urgent_or_scam: true,
    confidence_reason: 'High pressure urgency demanding phone payment within 2 hours.',
    bullets: [
      'Official utility providers never disconnect without registered letters.',
      'Do not call the mobile number in the message.',
      'Show this alert to your caregiver or daughter.',
    ],
    voice_readout: 'Ramesh Ji, please stay calm. This is an extortion attempt. Do not send any money.',
    caregiver_alert: 'Urgent Alert: Potential electricity scam text received on elder phone.',
    scamDetails: {
      scamType: 'Utility Disconnection Threat',
      psychologicalTrap: 'Manufactured emergency targeting fears of darkness',
      redFlags: [
        'Sent from personal 10-digit mobile number',
        'Demands immediate payment over phone',
      ],
      safeRebuttalScript: 'I am an elderly citizen. All billing matters are managed in person by my daughter.',
    },
  };

  const mockCaregiver: CaregiverContact = {
    name: 'Priya',
    relationship: 'Daughter',
    phone: '+1 (555) 019-2834',
  };

  it('renders high-contrast warning badge and headline for urgent scams', () => {
    render(
      <ReactiveResultCard
        payload={mockPayload}
        fontSizeMode="normal"
        onReset={() => {}}
        onSendCaregiverAlert={async () => true}
        isSendingAlert={false}
        caregiverContact={mockCaregiver}
        speechRate={0.85}
        appLanguage="English"
      />
    );

    expect(screen.getByText(/Caution: Suspicious or Threat/i)).toBeDefined();
    expect(screen.getByText('Fake Electricity Disconnection Threat')).toBeDefined();
    expect(screen.getByText(/Manufactured emergency targeting fears/i)).toBeDefined();
    expect(screen.getByText(/Sent from personal 10-digit mobile number/i)).toBeDefined();
  });

  it('renders safe rebuttal script and allows copying with feedback', () => {
    render(
      <ReactiveResultCard
        payload={mockPayload}
        fontSizeMode="normal"
        onReset={() => {}}
        onSendCaregiverAlert={async () => true}
        isSendingAlert={false}
        caregiverContact={mockCaregiver}
        speechRate={0.85}
        appLanguage="English"
      />
    );

    expect(screen.getByText(/Safe Response Message You Can Send:/i)).toBeDefined();
    expect(screen.getByText(/All billing matters are managed in person by my daughter/i)).toBeDefined();

    const copyButtons = screen.getAllByRole('button', { name: /Copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
    fireEvent.click(copyButtons[0]);
  });

  it('provides direct 1-tap multichannel caregiver access links', () => {
    render(
      <ReactiveResultCard
        payload={mockPayload}
        fontSizeMode="normal"
        onReset={() => {}}
        onSendCaregiverAlert={async () => true}
        isSendingAlert={false}
        caregiverContact={mockCaregiver}
        speechRate={0.85}
        appLanguage="English"
      />
    );

    const callLink = screen.getByRole('link', { name: /Phone Call/i });
    expect(callLink.getAttribute('href')).toBe('tel:+1 (555) 019-2834');

    const smsLink = screen.getByRole('link', { name: /Text Message/i });
    expect(smsLink.getAttribute('href')).toContain('sms:+1 (555) 019-2834?body=');

    const waLink = screen.getByRole('link', { name: /WhatsApp/i });
    expect(waLink.getAttribute('href')).toContain('https://wa.me/15550192834?text=');
  });
});
