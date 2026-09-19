import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaregiverLogModal } from '../components/CaregiverLogModal';
import { CaregiverDispatchLog, CaregiverContact } from '../types';

describe('Sahayak AI - Caregiver Audit Log & Safeguard Configuration', () => {
  const sampleContact: CaregiverContact = {
    name: 'Priya',
    relationship: 'Daughter (Emergency Contact)',
    phone: '+1 (555) 019-2834',
    webhookUrl: 'https://webhook.site/emergency-alert',
  };

  const sampleDispatches: CaregiverDispatchLog[] = [
    {
      id: 'dispatch-1',
      timestamp: '2026-09-18T12:30:00Z',
      headline: 'Urgent Electricity Disconnection Threat',
      mode: 'SAFETY_BILL_SCAM',
      is_urgent: true,
      alertMessage: 'Suspicious electricity cutoff demand detected.',
      recipient: sampleContact,
      status: 'SENT',
      webhookDispatched: true,
    },
    {
      id: 'dispatch-2',
      timestamp: '2026-09-18T09:15:00Z',
      headline: 'Routine Medicine Schedule Check',
      mode: 'HEALTH_PILL',
      is_urgent: false,
      alertMessage: 'Metformin daily dosage checked.',
      recipient: sampleContact,
      status: 'SENT',
      webhookDispatched: false,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnUpdateContact = vi.fn();
  const mockOnSendManualTestAlert = vi.fn();

  it('renders recent caregiver dispatches and alert details', () => {
    render(
      <CaregiverLogModal
        isOpen={true}
        onClose={mockOnClose}
        dispatches={sampleDispatches}
        contact={sampleContact}
        onUpdateContact={mockOnUpdateContact}
        onSendManualTestAlert={mockOnSendManualTestAlert}
        isSendingTest={false}
      />
    );

    expect(screen.getByText('Family & Helper Alert Logs')).toBeDefined();
    expect(screen.getByText('Urgent Electricity Disconnection Threat')).toBeDefined();
    expect(screen.getByText('Routine Medicine Schedule Check')).toBeDefined();
  });

  it('displays caregiver contact configuration and toggle edit form', () => {
    render(
      <CaregiverLogModal
        isOpen={true}
        onClose={mockOnClose}
        dispatches={sampleDispatches}
        contact={sampleContact}
        onUpdateContact={mockOnUpdateContact}
        onSendManualTestAlert={mockOnSendManualTestAlert}
        isSendingTest={false}
      />
    );

    expect(screen.getByText(/Your Trusted Emergency Contact/i)).toBeDefined();
    expect(screen.getAllByText(/Priya/i).length).toBeGreaterThan(0);

    const editBtn = screen.getByRole('button', { name: /Edit Contact/i });
    expect(editBtn).toBeDefined();
    fireEvent.click(editBtn);

    expect(screen.getByRole('button', { name: /Cancel/i })).toBeDefined();
  });
});
