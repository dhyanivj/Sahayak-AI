import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MedicineCabinetModal } from '../components/MedicineCabinetModal';
import { MedicineItem } from '../types';

describe('Sahayak AI - Medicine Cabinet UI & Safety Watchdog', () => {
  const sampleMeds: MedicineItem[] = [
    {
      id: 'med-1',
      userId: 'test-elder',
      name: 'Metformin 500mg',
      purpose: 'Blood sugar control',
      timing: 'morning',
      instructions: 'Take with breakfast',
      cautions: 'Do not skip meals',
      takenToday: true,
      addedAt: '2026-09-18T00:00:00Z',
    },
    {
      id: 'med-2',
      userId: 'test-elder',
      name: 'Lisinopril 10mg',
      purpose: 'Blood pressure control',
      timing: 'morning',
      instructions: 'Take once daily',
      cautions: 'Avoid salt substitutes',
      takenToday: false,
      addedAt: '2026-09-18T00:05:00Z',
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnToggle = vi.fn();

  it('renders medicine items with dosages and schedules', () => {
    render(
      <MedicineCabinetModal
        isOpen={true}
        onClose={mockOnClose}
        medicines={sampleMeds}
        onAddMedicine={mockOnAdd}
        onDeleteMedicine={mockOnDelete}
        onToggleTaken={mockOnToggle}
        preferredGreeting="Ramesh Ji"
        fontSizeMode="normal"
        speechRate={0.85}
      />
    );

    expect(screen.getByText('Metformin 500mg')).toBeDefined();
    expect(screen.getByText('Blood sugar control')).toBeDefined();
    expect(screen.getByText('Lisinopril 10mg')).toBeDefined();
    expect(screen.getByText('Blood pressure control')).toBeDefined();
  });

  it('toggles medicine taken status on checkbox click', () => {
    render(
      <MedicineCabinetModal
        isOpen={true}
        onClose={mockOnClose}
        medicines={sampleMeds}
        onAddMedicine={mockOnAdd}
        onDeleteMedicine={mockOnDelete}
        onToggleTaken={mockOnToggle}
        preferredGreeting="Ramesh Ji"
        fontSizeMode="normal"
        speechRate={0.85}
      />
    );

    const toggleBtns = screen.getAllByRole('button').filter(
      (b) => b.getAttribute('title')?.includes('Mark as')
    );
    expect(toggleBtns.length).toBeGreaterThan(0);
    fireEvent.click(toggleBtns[0]);
    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('shows check safety watchdog button when medicines exist', () => {
    render(
      <MedicineCabinetModal
        isOpen={true}
        onClose={mockOnClose}
        medicines={sampleMeds}
        onAddMedicine={mockOnAdd}
        onDeleteMedicine={mockOnDelete}
        onToggleTaken={mockOnToggle}
        preferredGreeting="Ramesh Ji"
        fontSizeMode="normal"
        speechRate={0.85}
      />
    );

    const watchdogBtn = screen.getByRole('button', { name: /Check AI Interactions/i });
    expect(watchdogBtn).toBeDefined();
  });
});
