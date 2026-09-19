import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SingleFrontDoor } from '../components/SingleFrontDoor';

describe('Sahayak AI - Single Front Door Intake Docket', () => {
  const mockOnAnalyze = vi.fn();

  const renderFrontDoor = (fontSizeMode: 'normal' | 'large' | 'jumbo' = 'normal') => {
    return render(
      <SingleFrontDoor
        onAnalyze={mockOnAnalyze}
        isLoading={false}
        fontSizeMode={fontSizeMode}
        speechRate={0.85}
        preferredGreeting="Ramesh Ji"
        appLanguage="English"
      />
    );
  };

  it('renders primary intake docket heading and guidance', () => {
    renderFrontDoor('normal');
    expect(screen.getByText('Check a Document or Ask a Question')).toBeDefined();
    expect(screen.getByText(/Take a picture of a bill, medicine bottle/i)).toBeDefined();
  });

  it('displays realistic 1-tap elder test presets', () => {
    renderFrontDoor('large');
    expect(screen.getByText(/Power Bill Cutoff Threat/i)).toBeDefined();
    expect(screen.getByText(/Metformin 500mg Rx/i)).toBeDefined();
    expect(screen.getByText(/Grandchild Distress/i)).toBeDefined();
  });

  it('populates textarea and can trigger submission on preset click', () => {
    renderFrontDoor('normal');
    const powerCutButton = screen.getByText(/Power Bill Cutoff Threat/i);
    fireEvent.click(powerCutButton);

    const textarea = screen.getByPlaceholderText(/Paste suspicious text or ask a question/i) as HTMLTextAreaElement;
    expect(textarea.value).toContain('electricity will be disconnected');

    const submitBtn = screen.getByRole('button', { name: /Check Item Safely/i });
    expect(submitBtn).toBeDefined();
    fireEvent.click(submitBtn);

    expect(mockOnAnalyze).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.stringContaining('electricity will be disconnected'),
      })
    );
  });

  it('supports jumbo print mode class adjustments', () => {
    const { container } = renderFrontDoor('jumbo');
    const heading = container.querySelector('h2');
    expect(heading?.className).toContain('text-3xl');
  });
});
