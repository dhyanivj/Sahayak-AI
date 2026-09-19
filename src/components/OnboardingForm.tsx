/* Hallmark · macrostructure: elder-intake-docket · theme: warm-tactile-ink · genre: editorial
 * pre-emit critique: P5 H5 E5 S5 R5 V5
 * slop test: pass
 */
import React, { useState } from 'react';
import {
  User,
  HeartHandshake,
  Shield,
  Eye,
  Volume2,
  Sparkles,
  ArrowRight,
  Phone,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { UserProfile } from '../types';

interface OnboardingFormProps {
  initialProfile: UserProfile;
  onComplete: (profile: UserProfile) => void;
  isEditing?: boolean;
  onCancel?: () => void;
}

export const OnboardingForm: React.FC<OnboardingFormProps> = ({
  initialProfile,
  onComplete,
  isEditing = false,
  onCancel,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const quickStartRamesh = () => {
    setProfile({
      name: 'Ramesh Sharma',
      preferredGreeting: 'Ramesh Ji',
      age: 71,
      primaryConcern: 'all',
      fontSizeMode: 'normal',
      speechRate: 0.85,
      caregiver: {
        name: 'Priya',
        relationship: 'Daughter (Emergency Contact)',
        phone: '+1 (555) 019-2834',
      },
      hasCompletedOnboarding: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      ...profile,
      hasCompletedOnboarding: true,
    });
  };

  const adjustAge = (delta: number) => {
    setProfile((prev) => ({
      ...prev,
      age: Math.max(40, Math.min(110, prev.age + delta)),
    }));
  };

  const titleOptions = [
    `${profile.name ? profile.name.split(' ')[0] : 'Ramesh'} Ji`,
    'Mr. ' + (profile.name ? profile.name.split(' ').slice(-1)[0] : 'Sharma'),
    'Uncle',
    'Grandpa',
  ];

  return (
    <div className="max-w-3xl mx-auto my-6 px-4">
      
      {/* Editorial Header */}
      <div className="text-center mb-6 sm:mb-8 space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--color-action-amber)] text-white shadow-xs mb-1">
          <Shield className="w-7 h-7" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-ink-display)]">
          {isEditing ? 'Update Your Personal Profile' : 'Welcome to Sahayak AI (Aura)'}
        </h1>
        <p className="text-base sm:text-lg font-bold text-[var(--color-ink-muted)] max-w-xl mx-auto leading-relaxed">
          {isEditing
            ? 'Adjust your personal settings, display comfort, or emergency caregiver details.'
            : 'Please share a few details so Aura can address you respectfully, speak at your pace, and safeguard your health.'}
        </p>
      </div>

      {/* One-Tap Preset Banner for Quick Evaluation / Testing */}
      {!isEditing && (
        <div className="mb-6 p-4 sm:p-5 rounded-[var(--radius-tactile)] bg-[var(--color-surface-sunken)] border-2 border-[var(--color-border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[var(--color-action-amber)] shrink-0" />
            <div>
              <p className="font-extrabold text-base text-[var(--color-ink-display)]">
                Try the sample profile?
              </p>
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-ink-muted)]">
                Pre-fills details for Ramesh (Age 71, retired educator) and daughter Priya.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-quick-fill-ramesh"
            onClick={quickStartRamesh}
            className="h-12 px-4 rounded-xl bg-white border-2 border-[var(--color-border-strong)] hover:bg-amber-50 active:translate-y-0.5 text-[var(--color-ink-display)] font-extrabold text-sm flex items-center justify-center gap-2 transition-all touch-target whitespace-nowrap self-start sm:self-auto"
          >
            <Check className="w-4 h-4 text-[var(--color-action-amber)]" />
            <span>Load Ramesh&apos;s Profile</span>
          </button>
        </div>
      )}

      {/* The Intake Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-[var(--color-surface)] p-6 sm:p-8 rounded-[var(--radius-tactile)] border-2 border-[var(--color-border-base)] shadow-md"
      >
        
        {/* BLOCK 1: Personal Identification */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
            <User className="w-5 h-5 text-[var(--color-action-amber)]" />
            <h2 className="text-xl font-black text-[var(--color-ink-display)]">
              1. Your Name &amp; Age
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="input-user-fullname" className="block text-base font-extrabold text-[var(--color-ink-display)] mb-1.5">
                What is your full name?
              </label>
              <input
                id="input-user-fullname"
                type="text"
                required
                value={profile.name}
                onChange={(e) => {
                  const newName = e.target.value;
                  setProfile((prev) => ({
                    ...prev,
                    name: newName,
                    preferredGreeting: prev.preferredGreeting || (newName ? `${newName.split(' ')[0]} Ji` : 'Ramesh Ji'),
                  }));
                }}
                placeholder="e.g., Ramesh Sharma"
                className="w-full h-14 px-4 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] focus:border-[var(--color-action-amber)] focus:bg-white font-bold text-lg text-[var(--color-ink-primary)] touch-target"
              />
            </div>

            {/* Age Stepper */}
            <div>
              <label htmlFor="input-user-age" className="block text-base font-extrabold text-[var(--color-ink-display)] mb-1.5">
                Your Age
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-decrement-age"
                  onClick={() => adjustAge(-1)}
                  className="w-14 h-14 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-surface-sunken)] hover:bg-white active:translate-y-0.5 font-black text-xl text-[var(--color-ink-display)] flex items-center justify-center touch-target"
                  aria-label="Decrease age by 1"
                >
                  <Minus className="w-5 h-5" />
                </button>

                <input
                  id="input-user-age"
                  type="number"
                  min={40}
                  max={120}
                  required
                  value={profile.age}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, age: parseInt(e.target.value, 10) || 70 }))
                  }
                  className="flex-1 h-14 px-3 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] font-black text-2xl text-center text-[var(--color-ink-display)] touch-target"
                />

                <button
                  type="button"
                  id="btn-increment-age"
                  onClick={() => adjustAge(1)}
                  className="w-14 h-14 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-surface-sunken)] hover:bg-white active:translate-y-0.5 font-black text-xl text-[var(--color-ink-display)] flex items-center justify-center touch-target"
                  aria-label="Increase age by 1"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Preferred Greeting / Honorific */}
          <div>
            <label htmlFor="input-custom-greeting" className="block text-base font-extrabold text-[var(--color-ink-display)] mb-1.5">
              How should Aura respectfully address you?
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {titleOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setProfile((prev) => ({ ...prev, preferredGreeting: opt }))}
                  className={`h-11 px-3.5 rounded-lg border-2 font-bold text-sm sm:text-base active:translate-y-0.5 transition-all touch-target whitespace-nowrap ${
                    profile.preferredGreeting === opt
                      ? 'bg-[var(--color-action-amber)] text-white border-[var(--color-action-amber)]'
                      : 'bg-white border-[var(--color-border-base)] text-[var(--color-ink-display)] hover:bg-[var(--color-surface-sunken)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              id="input-custom-greeting"
              type="text"
              value={profile.preferredGreeting}
              onChange={(e) => setProfile((prev) => ({ ...prev, preferredGreeting: e.target.value }))}
              placeholder="Or type custom greeting, e.g., 'Professor Ramesh' or 'Dada'"
              className="w-full h-12 px-4 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] font-semibold text-base text-[var(--color-ink-primary)]"
            />
          </div>

          {/* Primary Focus / Concern */}
          <div>
            <label className="block text-base font-extrabold text-[var(--color-ink-display)] mb-2">
              What is your main daily priority for Aura?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'all', label: 'All-in-One Companion', desc: 'Bills, safety checks, pills & friendly chat' },
                { id: 'scams', label: 'Fraud & Scam Protection', desc: 'Scrutinizing suspicious SMS, bills & APK links' },
                { id: 'medicine', label: 'Medicine & Prescriptions', desc: 'Reading bottles, dosages & food instructions' },
                { id: 'memory', label: 'Memory & Family Recall', desc: 'Looking at vintage photos & reminiscence' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProfile((prev) => ({ ...prev, primaryConcern: item.id as any }))}
                  className={`p-3.5 rounded-xl border-2 text-left active:translate-y-0.5 transition-all ${
                    profile.primaryConcern === item.id
                      ? 'border-[var(--color-action-amber)] bg-amber-50/50 shadow-xs'
                      : 'border-[var(--color-border-base)] bg-white hover:border-[var(--color-border-strong)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-[var(--color-ink-display)]">
                      {item.label}
                    </span>
                    {profile.primaryConcern === item.id && (
                      <Check className="w-4 h-4 text-[var(--color-action-amber)]" />
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[var(--color-ink-muted)] mt-1">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* BLOCK 2: Emergency Contact / Caregiver */}
        <section className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
            <HeartHandshake className="w-5 h-5 text-[var(--color-action-amber)]" />
            <div>
              <h2 className="text-xl font-black text-[var(--color-ink-display)]">
                2. Trusted Family Emergency Contact
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[var(--color-ink-muted)]">
                Who should Aura notify with 1 tap if an urgent scam or unclear pill is detected?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Contact Name */}
            <div>
              <label htmlFor="input-caregiver-name" className="block text-sm font-extrabold text-[var(--color-ink-display)] mb-1">
                Contact Name
              </label>
              <input
                id="input-caregiver-name"
                type="text"
                required
                value={profile.caregiver.name}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    caregiver: { ...prev.caregiver, name: e.target.value },
                  }))
                }
                placeholder="e.g., Priya"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] font-bold text-base text-[var(--color-ink-primary)] touch-target"
              />
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="input-caregiver-relationship" className="block text-sm font-extrabold text-[var(--color-ink-display)] mb-1">
                Relationship
              </label>
              <input
                id="input-caregiver-relationship"
                type="text"
                required
                value={profile.caregiver.relationship}
                onChange={(e) =>
                  setProfile((prev) => ({
                    ...prev,
                    caregiver: { ...prev.caregiver, relationship: e.target.value },
                  }))
                }
                placeholder="e.g., Daughter"
                className="w-full h-12 px-3.5 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] font-bold text-base text-[var(--color-ink-primary)] touch-target"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="input-caregiver-phone" className="block text-sm font-extrabold text-[var(--color-ink-display)] mb-1">
                Telephone / SMS
              </label>
              <div className="relative">
                <input
                  id="input-caregiver-phone"
                  type="tel"
                  required
                  value={profile.caregiver.phone}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      caregiver: { ...prev.caregiver, phone: e.target.value },
                    }))
                  }
                  placeholder="+1 (555) 019-2834"
                  className="w-full h-12 pl-10 pr-3.5 rounded-xl border-2 border-[var(--color-border-base)] bg-[var(--color-canvas)] font-mono font-bold text-base text-[var(--color-ink-primary)] touch-target"
                />
                <Phone className="w-4 h-4 text-[var(--color-ink-muted)] absolute left-3.5 top-4" />
              </div>
            </div>
          </div>
        </section>

        {/* BLOCK 3: Sight & Sound Accessibility */}
        <section className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[var(--color-border-subtle)]">
            <Eye className="w-5 h-5 text-[var(--color-action-amber)]" />
            <h2 className="text-xl font-black text-[var(--color-ink-display)]">
              3. Visual &amp; Audio Comfort
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Print Size */}
            <div>
              <label className="block text-sm font-extrabold text-[var(--color-ink-display)] mb-2">
                Reading Text Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-font-normal"
                  onClick={() => setProfile((prev) => ({ ...prev, fontSizeMode: 'normal' }))}
                  className={`h-14 px-3 rounded-xl border-2 font-bold text-base active:translate-y-0.5 transition-all touch-target whitespace-nowrap ${
                    profile.fontSizeMode === 'normal'
                      ? 'border-[var(--color-action-amber)] bg-amber-50 text-[var(--color-ink-display)] font-extrabold shadow-2xs'
                      : 'border-[var(--color-border-base)] bg-white text-[var(--color-ink-muted)]'
                  }`}
                >
                  18px Standard
                </button>

                <button
                  type="button"
                  id="btn-font-jumbo"
                  onClick={() => setProfile((prev) => ({ ...prev, fontSizeMode: 'large' }))}
                  className={`h-14 px-3 rounded-xl border-2 text-lg active:translate-y-0.5 transition-all touch-target whitespace-nowrap ${
                    profile.fontSizeMode === 'large'
                      ? 'border-[var(--color-action-amber)] bg-amber-50 text-[var(--color-ink-display)] font-black shadow-2xs'
                      : 'border-[var(--color-border-base)] bg-white text-[var(--color-ink-muted)] font-bold'
                  }`}
                >
                  22px Jumbo Print
                </button>
              </div>
            </div>

            {/* Voice Speed */}
            <div>
              <label className="block text-sm font-extrabold text-[var(--color-ink-display)] mb-2 flex items-center justify-between">
                <span>Speaking Cadence</span>
                <span className="text-xs font-semibold text-[var(--color-action-amber)]">
                  {profile.speechRate === 0.85 ? 'Recommended (0.85x)' : `${profile.speechRate}x`}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0.7, label: '0.70x Slow' },
                  { rate: 0.85, label: '0.85x Warm' },
                  { rate: 1.0, label: '1.0x Normal' },
                ].map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, speechRate: item.rate }))}
                    className={`h-14 px-2 rounded-xl border-2 font-bold text-sm sm:text-base active:translate-y-0.5 transition-all touch-target whitespace-nowrap ${
                      profile.speechRate === item.rate
                        ? 'border-[var(--color-action-amber)] bg-amber-50 text-[var(--color-ink-display)] font-extrabold shadow-2xs'
                        : 'border-[var(--color-border-base)] bg-white text-[var(--color-ink-muted)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SUBMIT BUTTON */}
        <div className="pt-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3">
          {isEditing && onCancel ? (
            <button
              type="button"
              id="btn-cancel-edit-profile"
              onClick={onCancel}
              className="w-full sm:w-auto h-14 px-6 rounded-xl border-2 border-[var(--color-border-base)] bg-white hover:bg-[var(--color-surface-sunken)] font-extrabold text-base text-[var(--color-ink-muted)] touch-target whitespace-nowrap"
            >
              Cancel &amp; Keep Current
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-ink-muted)]">
              <Volume2 className="w-4 h-4 text-[var(--color-action-amber)] shrink-0" />
              <span>Aura automatically speaks out verified results slowly and clearly.</span>
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-onboarding"
            className="w-full sm:w-auto h-16 px-8 rounded-xl bg-[var(--color-action-amber)] hover:bg-[var(--color-action-amber-hover)] text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 active:translate-y-0.5 shadow-xs transition-all touch-target whitespace-nowrap"
          >
            <span>{isEditing ? 'Save & Return to Companion' : 'Enter Sahayak Companion'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

      </form>

    </div>
  );
};
