/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React, { useState } from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { CaregiverContact, CaregiverDispatchLog } from '../types';

interface CaregiverLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispatches: CaregiverDispatchLog[];
  contact: CaregiverContact;
  onUpdateContact: (updated: CaregiverContact) => void;
  onSendManualTestAlert: () => void;
  isSendingTest: boolean;
}

export const CaregiverLogModal: React.FC<CaregiverLogModalProps> = ({
  isOpen,
  onClose,
  dispatches,
  contact,
  onUpdateContact,
  onSendManualTestAlert,
  isSendingTest,
}) => {
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [tempContact, setTempContact] = useState<CaregiverContact>(contact);

  if (!isOpen) return null;

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateContact(tempContact);
    setIsEditingContact(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-caregiver-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-tactile)] max-w-2xl w-full border-2 border-[var(--color-border-base)] shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[var(--color-surface-sunken)] p-5 border-b border-[var(--color-border-base)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-action-amber)] text-white flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 id="modal-caregiver-title" className="text-xl font-black text-[var(--color-ink-display)]">
                Family Safety Dispatch Log
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-ink-muted)]">
                Automated webhook dispatches to daughter Priya
              </p>
            </div>
          </div>

          <button
            id="btn-close-caregiver-modal"
            onClick={onClose}
            className="w-10 h-10 rounded-lg border border-[var(--color-border-base)] hover:bg-white text-[var(--color-ink-muted)] flex items-center justify-center touch-target transition-colors"
            aria-label="Close family alerts log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Active Family Contact Card */}
          <div className="p-4 rounded-xl bg-[var(--color-surface-sunken)] border border-[var(--color-border-base)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-wider font-extrabold text-[var(--color-action-amber)]">
                  Designated Emergency Contact
                </span>
                <p className="text-lg font-extrabold text-[var(--color-ink-display)] mt-0.5">
                  {contact.name}{' '}
                  <span className="text-sm font-semibold text-[var(--color-ink-muted)]">({contact.relationship})</span>
                </p>
                <p className="text-sm font-bold text-[var(--color-ink-muted)] mt-0.5">
                  Phone / SMS: <span className="font-mono text-[var(--color-ink-display)]">{contact.phone}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-edit-contact-toggle"
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  className="h-10 px-3.5 rounded-lg bg-white border border-[var(--color-border-base)] hover:bg-[var(--color-surface-sunken)] text-[var(--color-ink-primary)] font-bold text-xs sm:text-sm touch-target whitespace-nowrap"
                >
                  {isEditingContact ? 'Cancel' : 'Edit Contact'}
                </button>

                <button
                  id="btn-test-webhook-alert"
                  onClick={onSendManualTestAlert}
                  disabled={isSendingTest}
                  className="h-10 px-3.5 rounded-lg bg-[var(--color-action-amber)] hover:bg-[var(--color-action-amber-hover)] disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 touch-target whitespace-nowrap"
                >
                  {isSendingTest ? 'Sending...' : 'Send Test Ping'}
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {isEditingContact && (
              <form onSubmit={handleSaveContact} className="mt-4 pt-4 border-t border-[var(--color-border-base)] space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-1">Name</label>
                    <input
                      type="text"
                      value={tempContact.name}
                      onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                      className="w-full h-10 px-3 border border-[var(--color-border-base)] rounded-lg font-bold text-[var(--color-ink-primary)] bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-1">Relationship</label>
                    <input
                      type="text"
                      value={tempContact.relationship}
                      onChange={(e) => setTempContact({ ...tempContact, relationship: e.target.value })}
                      className="w-full h-10 px-3 border border-[var(--color-border-base)] rounded-lg font-bold text-[var(--color-ink-primary)] bg-white text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-ink-muted)] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={tempContact.phone}
                      onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                      className="w-full h-10 px-3 border border-[var(--color-border-base)] rounded-lg font-bold text-[var(--color-ink-primary)] bg-white text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-[var(--color-ink-display)] hover:opacity-90 text-white font-extrabold text-xs whitespace-nowrap"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Dispatch Log List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[var(--color-ink-display)]">
                Recent Dispatches ({dispatches.length})
              </h3>
              <span className="text-xs font-semibold text-[var(--color-ink-muted)]">Live Session Log</span>
            </div>

            {dispatches.length === 0 ? (
              <div className="p-7 rounded-xl bg-[var(--color-surface-sunken)] border border-dashed border-[var(--color-border-base)] text-center">
                <ShieldCheck className="w-8 h-8 text-emerald-700 mx-auto mb-2" />
                <p className="text-sm font-bold text-[var(--color-ink-primary)]">No urgent alerts dispatched yet.</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  When a scam or unclear medicine is detected, Ramesh can notify Priya with a single tap.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {dispatches.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-xl border ${
                      log.is_urgent
                        ? 'bg-red-50/60 border-red-200'
                        : 'bg-[var(--color-surface-sunken)] border-[var(--color-border-base)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {log.is_urgent ? (
                          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                        )}
                        <span className="font-extrabold text-sm sm:text-base text-[var(--color-ink-display)]">
                          {log.headline}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[var(--color-ink-muted)] bg-white px-2 py-0.5 rounded border border-[var(--color-border-subtle)] whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="mt-2 text-xs sm:text-sm font-mono text-[var(--color-ink-primary)] bg-white p-2 rounded border border-[var(--color-border-subtle)]">
                      "{log.alertMessage}"
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[var(--color-ink-muted)]">
                      <span>Recipient: {log.recipient.name} ({log.recipient.phone})</span>
                      <span className="inline-flex items-center gap-1 text-emerald-800 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Sent
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-[var(--color-surface-sunken)] p-4 border-t border-[var(--color-border-base)] flex justify-end">
          <button
            onClick={onClose}
            className="h-11 px-5 rounded-lg bg-[var(--color-ink-display)] hover:opacity-90 text-white font-extrabold text-sm touch-target whitespace-nowrap"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
