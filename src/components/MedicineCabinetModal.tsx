import React, { useState } from 'react';
import {
  Pill,
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Sparkles,
  Utensils,
  AlertOctagon,
} from 'lucide-react';
import { MedicineItem, DrugInteractionReport, UserProfile } from '../types';

interface MedicineCabinetModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines: MedicineItem[];
  onAddMedicine: (med: Omit<MedicineItem, 'id' | 'userId' | 'addedAt'>) => void;
  onDeleteMedicine: (id: string) => void;
  onToggleTaken: (id: string, takenToday: boolean) => void;
  userProfile?: UserProfile;
  fontSizeMode?: 'normal' | 'large' | 'jumbo';
  speechRate?: number;
  userName?: string;
  preferredGreeting?: string;
  onSendCaregiverAlert?: (text: string, headline: string) => Promise<boolean>;
}

export const MedicineCabinetModal: React.FC<MedicineCabinetModalProps> = ({
  isOpen,
  onClose,
  medicines,
  onAddMedicine,
  onDeleteMedicine,
  onToggleTaken,
  userProfile,
  fontSizeMode = 'normal',
  speechRate = 0.85,
  userName,
  preferredGreeting,
  onSendCaregiverAlert,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newTiming, setNewTiming] = useState<'morning' | 'afternoon' | 'evening' | 'night' | 'as_needed'>('morning');
  const [newInstructions, setNewInstructions] = useState('');
  const [newCautions, setNewCautions] = useState('');

  // Drug Interaction Check State
  const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);
  const [interactionReport, setInteractionReport] = useState<DrugInteractionReport | null>(null);
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [isPlayingReportAudio, setIsPlayingReportAudio] = useState(false);

  if (!isOpen) return null;

  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMedicine({
      name: newName.trim(),
      purpose: newPurpose.trim() || 'Daily Health',
      timing: newTiming,
      instructions: newInstructions.trim() || 'Take with water',
      cautions: newCautions.trim(),
      takenToday: false,
    });
    setNewName('');
    setNewPurpose('');
    setNewInstructions('');
    setNewCautions('');
    setIsAddingNew(false);
  };

  const handleRunInteractionCheck = async () => {
    if (medicines.length === 0) return;
    setIsCheckingInteractions(true);
    setInteractionError(null);
    setInteractionReport(null);

    try {
      const response = await fetch('/api/check-interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines,
          userProfile,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete interaction check');
      }

      const report: DrugInteractionReport = await response.json();
      setInteractionReport(report);

      // Read aloud automatically for senior convenience
      if ('speechSynthesis' in window && report.voiceReadout) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(report.voiceReadout);
        utterance.rate = speechRate;
        utterance.onend = () => setIsPlayingReportAudio(false);
        utterance.onerror = () => setIsPlayingReportAudio(false);
        setIsPlayingReportAudio(true);
        window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error(err);
      setInteractionError(err?.message || 'Unable to analyze interactions at this moment.');
    } finally {
      setIsCheckingInteractions(false);
    }
  };

  const toggleReportSpeech = () => {
    if (!('speechSynthesis' in window) || !interactionReport?.voiceReadout) return;
    if (isPlayingReportAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingReportAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(interactionReport.voiceReadout);
      utterance.rate = speechRate;
      utterance.onend = () => setIsPlayingReportAudio(false);
      utterance.onerror = () => setIsPlayingReportAudio(false);
      setIsPlayingReportAudio(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const timingLabels: Record<string, { label: string; time: string; badge: string }> = {
    morning: { label: 'Morning', time: '8:00 AM', badge: 'bg-amber-50 text-amber-900 border-amber-200' },
    afternoon: { label: 'Afternoon', time: '1:00 PM', badge: 'bg-sky-50 text-sky-900 border-sky-200' },
    evening: { label: 'Evening', time: '6:00 PM', badge: 'bg-indigo-50 text-indigo-900 border-indigo-200' },
    night: { label: 'Night / Bedtime', time: '9:30 PM', badge: 'bg-purple-50 text-purple-900 border-purple-200' },
    as_needed: { label: 'As Needed (SOS)', time: 'When required', badge: 'bg-neutral-50 text-neutral-800 border-neutral-200' },
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-lg border border-neutral-200 shadow-xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 bg-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded border border-neutral-200 bg-neutral-50 flex items-center justify-center text-neutral-900">
              <Pill className="w-5 h-5 text-neutral-800" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                Daily Medicine Cabinet &amp; AI Safety Check
              </h2>
              <p className="text-xs text-neutral-500">
                {medicines.length} medications saved · Stored securely in Firebase
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="w-8 h-8 rounded border border-neutral-200 hover:border-neutral-900 flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Bar: Check Interactions + Add Medicine */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-md border border-neutral-200 bg-neutral-50">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
                AI Clinical Safety Watchdog
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Checks all your prescriptions together for clashes, food rules, and duplicate doses.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                id="btn-run-drug-interaction-check"
                onClick={handleRunInteractionCheck}
                disabled={isCheckingInteractions || medicines.length === 0}
                className={`h-9 px-3.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer select-none ${
                  medicines.length === 0
                    ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                    : 'bg-neutral-900 hover:bg-black text-white shadow-2xs'
                }`}
                title="Verify that all saved medicines can be safely taken together"
              >
                {isCheckingInteractions ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Interactions...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Check AI Interactions</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsAddingNew(!isAddingNew)}
                className="h-9 px-3 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pill</span>
              </button>
            </div>
          </div>

          {/* Interaction Report Card Display */}
          {interactionError && (
            <div className="p-3.5 rounded-md border border-red-200 bg-red-50 text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{interactionError}</span>
            </div>
          )}

          {interactionReport && (
            <div className="p-4 sm:p-5 rounded-md border border-neutral-300 bg-white space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200">
                <div className="flex items-center gap-2">
                  {interactionReport.overallSafety === 'SAFE' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Everything Compatible &amp; Safe
                    </span>
                  ) : interactionReport.overallSafety === 'CAUTION' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-300 bg-amber-50 text-amber-800 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Caution: Spacing or Food Rules Needed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                      <AlertOctagon className="w-4 h-4" />
                      Attention: Potential Conflict Detected
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleReportSpeech}
                    className="h-8 px-2.5 rounded bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    {isPlayingReportAudio ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Stop Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Listen Aloud</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-base font-bold text-neutral-900 leading-snug">
                  {interactionReport.headline}
                </h4>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  {interactionReport.summary}
                </p>
              </div>

              {/* Specific Warnings */}
              {interactionReport.warnings && interactionReport.warnings.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-700">
                    Important Safety Observations:
                  </span>
                  <div className="space-y-1">
                    {interactionReport.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded border border-amber-200 bg-amber-50/70 text-xs text-amber-950 flex items-start gap-2"
                      >
                        <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-900 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                          !
                        </span>
                        <span>{w}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Food & Beverage Rules */}
              {interactionReport.foodCautions && interactionReport.foodCautions.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-700 flex items-center gap-1">
                    <Utensils className="w-3 h-3 text-neutral-500" />
                    Food &amp; Beverage Instructions:
                  </span>
                  <div className="space-y-1">
                    {interactionReport.foodCautions.map((fc, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 flex items-start gap-2"
                      >
                        <span className="text-neutral-400 font-bold">•</span>
                        <span>{fc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timing & Spacing Recommendations */}
              {interactionReport.timingRecommendations && interactionReport.timingRecommendations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-neutral-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-500" />
                    Optimal Time-of-Day Spacing:
                  </span>
                  <div className="space-y-1">
                    {interactionReport.timingRecommendations.map((tr, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded border border-neutral-200 bg-neutral-50 text-xs text-neutral-800 flex items-start gap-2"
                      >
                        <span className="text-neutral-400 font-bold">•</span>
                        <span>{tr}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form to Add New Medicine Manually */}
          {isAddingNew && (
            <form
              onSubmit={handleCreateMedicine}
              className="p-4 rounded-md border border-neutral-900 bg-neutral-50/80 space-y-3"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Add New Medicine
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Medicine Name &amp; Strength *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Amlodipine 5mg"
                    className="w-full h-8 px-2.5 rounded border border-neutral-200 bg-white text-xs text-neutral-900 focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Purpose (In Simple Words)
                  </label>
                  <input
                    type="text"
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    placeholder="e.g. For blood pressure"
                    className="w-full h-8 px-2.5 rounded border border-neutral-200 bg-white text-xs text-neutral-900 focus:border-neutral-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    When to Take *
                  </label>
                  <select
                    value={newTiming}
                    onChange={(e: any) => setNewTiming(e.target.value)}
                    className="w-full h-8 px-2 rounded border border-neutral-200 bg-white text-xs text-neutral-900"
                  >
                    <option value="morning">Morning (Breakfast)</option>
                    <option value="afternoon">Afternoon (Lunch)</option>
                    <option value="evening">Evening (Dinner)</option>
                    <option value="night">Night (Bedtime)</option>
                    <option value="as_needed">As Needed (SOS)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                    Instructions &amp; Food Rules
                  </label>
                  <input
                    type="text"
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="e.g. Take after meal with water"
                    className="w-full h-8 px-2.5 rounded border border-neutral-200 bg-white text-xs text-neutral-900 focus:border-neutral-900"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="h-8 px-3 rounded border border-neutral-200 bg-white text-neutral-600 text-xs hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-8 px-4 rounded bg-neutral-900 hover:bg-black text-white text-xs font-semibold"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          )}

          {/* List of Medicines */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-neutral-200">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                Today's Daily Pill Checklist
              </h3>
              <span className="text-xs text-neutral-500">
                Tap checkbox when taken
              </span>
            </div>

            {medicines.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-neutral-200 rounded-md bg-neutral-50/50 space-y-2">
                <Pill className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-700">
                  No medicines currently in your cabinet
                </p>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Scan a medicine strip or prescription on the main screen, or click "Add Pill" above to start your daily schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {medicines.map((med) => {
                  const meta = timingLabels[med.timing] || timingLabels.morning;
                  return (
                    <div
                      key={med.id}
                      className={`p-3.5 rounded-md border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        med.takenToday
                          ? 'border-emerald-200 bg-emerald-50/40 opacity-85'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleTaken(med.id, !med.takenToday)}
                          className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${
                            med.takenToday
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-neutral-300 bg-white hover:border-neutral-900'
                          }`}
                          title={med.takenToday ? 'Mark as not taken' : 'Mark as taken today'}
                        >
                          {med.takenToday && <CheckCircle2 className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-sm font-bold text-neutral-900 ${
                                med.takenToday ? 'line-through text-neutral-500' : ''
                              }`}
                            >
                              {med.name}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${meta.badge}`}
                            >
                              {meta.label} · {meta.time}
                            </span>
                          </div>

                          <div className="text-xs text-neutral-600 flex items-center gap-2 flex-wrap">
                            {med.purpose && (
                              <span className="font-medium text-neutral-800">
                                {med.purpose}
                              </span>
                            )}
                            {med.instructions && (
                              <span className="text-neutral-500">
                                · {med.instructions}
                              </span>
                            )}
                          </div>

                          {med.cautions && (
                            <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                              Caution: {med.cautions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <span className="text-[11px] text-neutral-400 font-medium">
                          {med.takenToday ? 'Taken Today' : 'Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteMedicine(med.id)}
                          className="w-7 h-7 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove from schedule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-neutral-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <span>Remember: Never change your prescribed dosage without asking your doctor.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-white border border-neutral-200 hover:border-neutral-900 text-neutral-800 text-xs font-semibold cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
