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
      className="max-w-4xl mx-auto my-4 p-4 rounded-md bg-white border border-red-200"
    >
      <div className="flex flex-col sm:flex-row items-start gap-3">
        <div className="w-7 h-7 rounded border border-red-200 bg-red-50 text-red-600 flex items-center justify-center shrink-0">
          <AlertOctagon className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs uppercase text-red-600 font-semibold tracking-wider">
            Connection Issue
          </div>
          <h2 className="text-sm font-semibold text-neutral-900 mt-0.5">
            Unable to Complete Check
          </h2>
          <p className="mt-1 text-xs text-neutral-600 leading-relaxed">
            {error || 'We could not connect right now. Please check your internet connection and try again.'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {caregiverContact?.phone && (
              <a
                id="link-offline-dial-emergency"
                href={`tel:${caregiverContact.phone}`}
                className="h-8 px-3 rounded-md bg-black hover:bg-neutral-800 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call {caregiverContact.name || 'Emergency Contact'}</span>
              </a>
            )}

            <button
              id="btn-offline-retry"
              onClick={onRetry}
              className="h-8 px-3 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-neutral-500" />
              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
