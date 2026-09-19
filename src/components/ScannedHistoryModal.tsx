/* Hallmark · macrostructure: elder-history-archive · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React from 'react';
import {
  X,
  History,
  ShieldAlert,
  Pill,
  FileText,
  Heart,
  Volume2,
  Trash2,
  Calendar,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';
import { ScannedRecord, SahayakMode } from '../types';

interface ScannedHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: ScannedRecord[];
  onSelectRecord: (record: ScannedRecord) => void;
  onClearHistory: () => void;
}

export const ScannedHistoryModal: React.FC<ScannedHistoryModalProps> = ({
  isOpen,
  onClose,
  records,
  onSelectRecord,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const getModeBadge = (mode: SahayakMode, isUrgent: boolean) => {
    switch (mode) {
      case 'HEALTH_PILL':
        return {
          label: 'Health & Medication',
          color: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: Pill,
        };
      case 'SAFETY_BILL_SCAM':
        return isUrgent
          ? {
              label: 'Fraud / Threat Alert',
              color: 'bg-red-100 text-red-950 border-red-400 font-black',
              icon: ShieldAlert,
            }
          : {
              label: 'Verified Safe Bill',
              color: 'bg-sky-100 text-sky-950 border-sky-300',
              icon: FileText,
            };
      case 'MEMORY_STIMULATION':
        return {
          label: 'Family Memory',
          color: 'bg-purple-100 text-purple-900 border-purple-300',
          icon: Heart,
        };
      case 'SMART_ASSIST':
      default:
        return {
          label: 'Smart Assist',
          color: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: CheckCircle2,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border-base)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[var(--color-surface-sunken)] px-5 py-4 border-b border-[var(--color-border-base)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-action-amber)] text-white flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-[var(--color-ink-display)]">
                Scanned History Archive
              </h3>
              <p className="text-xs font-bold text-[var(--color-ink-muted)]">
                {records.length} document{records.length === 1 ? '' : 's'} verified for your records
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {records.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="h-10 px-3 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors"
                title="Clear scanned history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear All</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl border border-[var(--color-border-base)] bg-white hover:bg-slate-100 flex items-center justify-center text-[var(--color-ink-primary)]"
              title="Close history"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
          {records.length === 0 ? (
            <div className="text-center py-12 px-4">
              <History className="w-12 h-12 text-[var(--color-ink-subtle)] mx-auto mb-3" />
              <h4 className="text-lg font-bold text-[var(--color-ink-display)]">
                No past scans recorded yet
              </h4>
              <p className="text-sm font-medium text-[var(--color-ink-muted)] max-w-md mx-auto mt-1">
                Whenever you take a photo of a bill, medicine bottle, or inspect a message, it will be safely logged here for you and your family.
              </p>
            </div>
          ) : (
            records.map((item) => {
              const badge = getModeBadge(item.mode, item.is_urgent_or_scam);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={item.id}
                  className="bg-white border-2 border-[var(--color-border-base)] hover:border-[var(--color-action-amber)] rounded-xl p-4 transition-all shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {/* Thumbnail or Icon */}
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt="Thumbnail"
                        className="w-16 h-16 rounded-lg object-cover border border-[var(--color-border-base)] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)] flex items-center justify-center shrink-0">
                        <BadgeIcon className="w-6 h-6 text-[var(--color-action-amber)]" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-bold ${badge.color}`}
                        >
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                        <span className="text-xs font-bold text-[var(--color-ink-muted)] flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </span>
                      </div>

                      <h4 className="text-base font-extrabold text-[var(--color-ink-display)] truncate">
                        {item.headline}
                      </h4>

                      <p className="text-xs text-[var(--color-ink-muted)] line-clamp-1 mt-0.5 font-medium">
                        {item.payload.voice_readout}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectRecord(item);
                        onClose();
                      }}
                      className="h-10 px-3.5 rounded-lg bg-[var(--color-action-amber)] hover:bg-amber-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      title="View full action points and voice readout"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Review Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-[var(--color-surface-sunken)] px-5 py-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
          <span>🔒 Stored securely in your private browser memory</span>
          <button
            type="button"
            onClick={onClose}
            className="font-extrabold text-[var(--color-action-amber)] hover:underline"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
