import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';
import { Header } from '../components/Header';

// Helper component that throws to test ErrorBoundary
const ThrowingComponent = () => {
  throw new Error('Test crash in senior UI');
};

describe('Sahayak AI - Component Unit Tests', () => {
  it('renders ErrorBoundary gracefully without crashing senior experience', () => {
    // Suppress console.error during expected throw
    const originalError = console.error;
    console.error = vi.fn();

    render(
      <ErrorBoundary fallbackCaregiverPhone="+15550192834" caregiverName="Priya">
        <ThrowingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Don't worry, Sahayak is here.")).toBeDefined();
    expect(screen.getByText('Reload Sahayak')).toBeDefined();
    expect(screen.getByText('Call Priya')).toBeDefined();

    console.error = originalError;
  });

  it('renders OfflineBanner when disconnected', () => {
    render(
      <OfflineBanner
        error="Network timeout: server is unreachable."
        onRetry={() => {}}
        caregiverContact={{
          name: 'Priya',
          relationship: 'Daughter',
          phone: '+1 (555) 019-2834',
        }}
      />
    );
    expect(screen.getByText('Unable to Complete Check')).toBeDefined();
    expect(screen.getByText('Network timeout: server is unreachable.')).toBeDefined();
    expect(screen.getByText('Call Priya')).toBeDefined();
  });

  it('renders Header with senior ergonomics and accessibility tags', () => {
    render(
      <Header
        fontSizeMode="normal"
        setFontSizeMode={() => {}}
        speechRate={0.85}
        setSpeechRate={() => {}}
        caregiverContact={{
          name: 'Priya',
          relationship: 'Daughter',
          phone: '+1 (555) 019-2834',
        }}
        dispatchCount={2}
        onOpenCaregiverModal={() => {}}
        scannedCount={5}
        onOpenScannedHistory={() => {}}
        medicineCount={3}
        onOpenMedicineCabinet={() => {}}
        currentUser={null}
        onLogin={() => {}}
        onLogout={() => {}}
      />
    );

    expect(screen.getByText('Sahayak')).toBeDefined();
    expect(screen.getByText('Medicines')).toBeDefined();
    expect(screen.getByText('Past Items')).toBeDefined();
  });
});
