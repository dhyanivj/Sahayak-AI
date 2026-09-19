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
  dispatches = [],
  contact = { name: '', relationship: '', phone: '' },
  onUpdateContact,
  onSendManualTestAlert,
  isSendingTest = false,
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
      <div className="bg-white rounded-md max-w-2xl w-full border border-neutral-200 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-white p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded border border-neutral-200 bg-neutral-50 text-neutral-900 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="modal-caregiver-title" className="text-sm font-semibold text-neutral-900">
                Family &amp; Helper Alert Logs
              </h2>
              <p className="text-xs text-neutral-500">
                Messages and alerts sent to your trusted contact
              </p>
            </div>
          </div>

          <button
            id="btn-close-caregiver-modal"
            onClick={onClose}
            className="w-7 h-7 rounded border border-neutral-200 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close family alerts log"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Active Family Contact Card */}
          <div className="p-4 rounded-md bg-neutral-50 border border-neutral-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase font-medium text-neutral-500">
                  Your Trusted Emergency Contact
                </span>
                <p className="text-sm font-semibold text-neutral-900 mt-0.5">
                  {contact.name}{' '}
                  <span className="text-xs font-normal text-neutral-500">({contact.relationship})</span>
                </p>
                <p className="text-xs text-neutral-600 mt-0.5">
                  Phone: {contact.phone}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="btn-edit-contact-toggle"
                  onClick={() => setIsEditingContact(!isEditingContact)}
                  className="h-8 px-2.5 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-medium cursor-pointer select-none transition-colors"
                >
                  {isEditingContact ? 'Cancel' : 'Edit Contact'}
                </button>

                <button
                  id="btn-test-webhook-alert"
                  onClick={onSendManualTestAlert}
                  disabled={isSendingTest}
                  className="h-8 px-2.5 rounded-md bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 cursor-pointer select-none transition-colors"
                >
                  {isSendingTest ? 'Sending...' : 'Send Test Message'}
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {isEditingContact && (
              <form onSubmit={handleSaveContact} className="mt-4 pt-4 border-t border-neutral-200 space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Name</label>
                    <input
                      type="text"
                      value={tempContact.name}
                      onChange={(e) => setTempContact({ ...tempContact, name: e.target.value })}
                      className="w-full h-8 px-2.5 border border-neutral-200 rounded text-neutral-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Relationship</label>
                    <input
                      type="text"
                      value={tempContact.relationship}
                      onChange={(e) => setTempContact({ ...tempContact, relationship: e.target.value })}
                      className="w-full h-8 px-2.5 border border-neutral-200 rounded text-neutral-900 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-600 mb-1 font-medium">Phone Number</label>
                    <input
                      type="text"
                      value={tempContact.phone}
                      onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                      className="w-full h-8 px-2.5 border border-neutral-200 rounded text-neutral-900 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="h-8 px-3 rounded-md bg-black text-white text-xs font-medium cursor-pointer"
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
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Sent Messages &amp; Alerts ({dispatches.length})
              </h3>
              <span className="text-xs text-neutral-500">Connected</span>
            </div>

            {dispatches.length === 0 ? (
              <div className="p-6 rounded-md bg-neutral-50 border border-dashed border-neutral-200 text-center text-xs">
                <ShieldCheck className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                <p className="text-neutral-800 font-medium">No alerts sent yet.</p>
                <p className="text-neutral-500 mt-1">
                  Whenever an alert is sent to your trusted helper or daughter, a copy will be logged here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {dispatches.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-md border border-neutral-200 bg-white"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {log.is_urgent ? (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                        <span className="font-semibold text-xs text-neutral-900">
                          {log.headline}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {log.timestamp}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded border border-neutral-200 leading-relaxed">
                      "{log.alertMessage}"
                    </p>

                    <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                      <span>To: {log.recipient?.name || 'Caregiver'} ({log.recipient?.phone || ''})</span>
                      <span className="text-emerald-700 font-medium">Status: Delivered</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-neutral-50 p-3.5 border-t border-neutral-200 flex justify-end">
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-md bg-black hover:bg-neutral-800 text-white font-medium text-xs cursor-pointer select-none transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
