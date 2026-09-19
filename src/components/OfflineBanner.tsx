/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React from 'react';
import { AlertOctagon, Phone, RefreshCw } from 'lucide-react';
import { CaregiverContact } from '../types';

interface OfflineBannerProps {
  error: string;
  onRetry: () => void;
  caregiverContact: CaregiverContact;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  error,
  onRetry,
  caregiverContact,
}) => {
  return (
    <div
      id="card-offline-error-banner"
      role="alert"
      className="max-w-4xl mx-auto my-6 p-6 rounded-[var(--radius-tactile)] bg-amber-50/90 border-2 border-[var(--color-action-amber)] shadow-sm text-[var(--color-ink-primary)]"
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-action-amber)] text-white flex items-center justify-center shrink-0">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl sm:text-2xl font-black text-amber-950 tracking-tight">
            Connection Interruption or Verification Pause
          </h2>
          <p className="mt-1.5 text-base sm:text-lg font-bold text-[var(--color-ink-primary)] leading-relaxed">
            {error || 'Unable to communicate with the verification engine right now.'}
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--color-ink-muted)]">
            For peace of mind, you can directly telephone your daughter {caregiverContact.name} or tap retry.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a
              id="link-offline-dial-emergency"
              href={`tel:${caregiverContact.phone}`}
              className="h-14 px-6 rounded-xl bg-[var(--color-danger-border)] hover:bg-red-800 text-white font-black text-base flex items-center gap-2.5 shadow-xs active:translate-y-0.5 transition-all touch-target whitespace-nowrap"
            >
              <Phone className="w-5 h-5" />
              <span>Call {caregiverContact.name} ({caregiverContact.phone})</span>
            </a>

            <button
              id="btn-offline-retry"
              onClick={onRetry}
              className="h-14 px-6 rounded-xl bg-white border-2 border-[var(--color-border-base)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-display)] font-extrabold text-base flex items-center gap-2 active:translate-y-0.5 transition-all touch-target whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4 text-[var(--color-ink-muted)]" />
              <span>Retry Scanning</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
