import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingForm } from '../components/OnboardingForm';
import { UserProfile } from '../types';

describe('Sahayak AI - Onboarding & Profile Customization', () => {
  const initialProfile: UserProfile = {
    name: 'Ramesh Sharma',
    preferredGreeting: 'Ramesh Ji',
    age: 72,
    primaryConcern: 'all',
    fontSizeMode: 'normal',
    speechRate: 0.85,
    appLanguage: 'Hindi',
    highContrastMode: false,
    caregiver: {
      name: 'Priya',
      relationship: 'Daughter',
      phone: '+1 (555) 019-2834',
    },
    hasCompletedOnboarding: true,
  };

  const mockOnComplete = vi.fn();

  it('renders profile fields with default senior values', () => {
    render(
      <OnboardingForm
        initialProfile={initialProfile}
        onComplete={mockOnComplete}
        isEditing={true}
        onCancel={() => {}}
      />
    );

    expect(screen.getByDisplayValue('Ramesh Sharma')).toBeDefined();
    expect(screen.getByDisplayValue('Ramesh Ji')).toBeDefined();
    expect(screen.getByDisplayValue('Priya')).toBeDefined();
  });

  it('submits updated profile when user clicks save', () => {
    render(
      <OnboardingForm
        initialProfile={initialProfile}
        onComplete={mockOnComplete}
        isEditing={true}
        onCancel={() => {}}
      />
    );

    const nameInput = screen.getByDisplayValue('Ramesh Sharma');
    fireEvent.change(nameInput, { target: { value: 'Ramesh Kumar Sharma' } });

    const saveBtn = screen.getByRole('button', { name: /Save Preferences/i });
    fireEvent.click(saveBtn);

    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ramesh Kumar Sharma',
        hasCompletedOnboarding: true,
      })
    );
  });
});
