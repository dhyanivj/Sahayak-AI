import React, { useState } from 'react';
import {
  User,
  HeartHandshake,
  Shield,
  Eye,
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
    profile.name ? `${profile.name.split(' ')[0]} Ji` : 'Sir / Ma’am',
    profile.name ? (profile.name.split(' ').length > 1 ? `Mr. ${profile.name.split(' ').slice(-1)[0]}` : profile.name) : 'Mr. Sharma',
    'Uncle',
    'Aunty',
    'Grandpa',
  ];

  return (
    <div className="max-w-2xl mx-auto my-6 px-4">
      
      {/* Header */}
      <div className="text-center mb-6 space-y-1.5">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded border border-neutral-200 bg-neutral-50 text-neutral-900 mb-1">
          <Shield className="w-5 h-5" />
        </div>
        <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium">
          Getting Started
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
          {isEditing ? 'Your Profile & Settings' : 'Welcome to Sahayak'}
        </h1>
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
          {isEditing
            ? 'Change your text size, voice reading speed, or emergency contact.'
            : 'Set up your name, preferred text size, and trusted family contact.'}
        </p>
      </div>

      {/* Form Container */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-5 sm:p-6 rounded-md border border-neutral-200"
      >
        
        {/* Section 1: Senior Identity */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <User className="w-4 h-4 text-neutral-600" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Step 1: Your Name &amp; Age
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-user-fullname" className="block text-xs font-medium text-neutral-700 mb-1">
                Your Full Name
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
                    preferredGreeting: prev.preferredGreeting || (newName ? `${newName.split(' ')[0]} Ji` : ''),
                  }));
                }}
                placeholder="Enter your full name"
                className="w-full h-9 px-3 rounded-md border border-neutral-200 text-neutral-900 bg-white focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 text-xs"
              />
            </div>

            <div>
              <label htmlFor="input-user-age" className="block text-xs font-medium text-neutral-700 mb-1">
                Your Age
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-decrement-age"
                  onClick={() => adjustAge(-1)}
                  className="w-9 h-9 rounded-md border border-neutral-200 bg-white hover:border-neutral-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
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
                  className="flex-1 h-9 px-2 rounded-md border border-neutral-200 text-xs text-center text-neutral-900 bg-white focus:border-neutral-900"
                />

                <button
                  type="button"
                  id="btn-increment-age"
                  onClick={() => adjustAge(1)}
                  className="w-9 h-9 rounded-md border border-neutral-200 bg-white hover:border-neutral-900 text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="input-custom-greeting" className="block text-xs font-medium text-neutral-700 mb-1.5">
              How would you like to be addressed?
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {titleOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setProfile((prev) => ({ ...prev, preferredGreeting: opt }))}
                  className={`h-7 px-2.5 rounded-md border text-xs transition-colors cursor-pointer ${
                    profile.preferredGreeting === opt
                      ? 'bg-black text-white border-black font-medium'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900'
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
              placeholder="Or type your preferred greeting, e.g. 'Professor Ramesh'"
              className="w-full h-9 px-3 rounded-md border border-neutral-200 text-neutral-900 bg-white focus:border-neutral-900 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              What do you want help with most?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: 'all', label: 'All-in-One Safety Companion', desc: 'Bills, safety checks, prescriptions & questions' },
                { id: 'scams', label: 'Fraud & Scam Protection', desc: 'Checking suspicious text messages, letters & calls' },
                { id: 'medicine', label: 'Medicine & Dosages', desc: 'Reading medicine labels, instructions & times to take' },
                { id: 'memory', label: 'Family Memory & Reminders', desc: 'Friendly conversations and daily reminders' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setProfile((prev) => ({ ...prev, primaryConcern: item.id as any }))}
                  className={`p-3 rounded-md border text-left transition-colors cursor-pointer ${
                    profile.primaryConcern === item.id
                      ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                      : 'border-neutral-200 bg-white hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-900">
                      {item.label}
                    </span>
                    {profile.primaryConcern === item.id && (
                      <Check className="w-3.5 h-3.5 text-neutral-900" />
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {item.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Caregiver Emergency Contact */}
        <section className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <HeartHandshake className="w-4 h-4 text-neutral-600" />
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
                Step 2: Trusted Family or Helper Contact
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="input-caregiver-name" className="block text-xs font-medium text-neutral-700 mb-1">
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
                placeholder="e.g. Sarah or Amit"
                className="w-full h-9 px-3 rounded-md border border-neutral-200 text-neutral-900 bg-white text-xs"
              />
            </div>

            <div>
              <label htmlFor="input-caregiver-relationship" className="block text-xs font-medium text-neutral-700 mb-1">
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
                placeholder="e.g. Daughter or Neighbor"
                className="w-full h-9 px-3 rounded-md border border-neutral-200 text-neutral-900 bg-white text-xs"
              />
            </div>

            <div>
              <label htmlFor="input-caregiver-phone" className="block text-xs font-medium text-neutral-700 mb-1">
                Phone Number
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
                  className="w-full h-9 pl-8 pr-3 rounded-md border border-neutral-200 text-xs text-neutral-900 bg-white"
                />
                <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Visual & Audio Preferences */}
        <section className="space-y-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
            <Eye className="w-4 h-4 text-neutral-600" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-900">
              Step 3: Text Size &amp; Reading Speed
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Comfortable Text Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-font-normal"
                  onClick={() => setProfile((prev) => ({ ...prev, fontSizeMode: 'normal' }))}
                  className={`h-9 px-3 rounded-md border text-xs transition-colors cursor-pointer ${
                    profile.fontSizeMode === 'normal'
                      ? 'bg-black text-white border-black font-medium'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  Standard Size
                </button>

                <button
                  type="button"
                  id="btn-font-jumbo"
                  onClick={() => setProfile((prev) => ({ ...prev, fontSizeMode: 'large' }))}
                  className={`h-9 px-3 rounded-md border text-xs transition-colors cursor-pointer ${
                    profile.fontSizeMode === 'large'
                      ? 'bg-black text-white border-black font-medium'
                      : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900'
                  }`}
                >
                  Large Print
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5 flex items-center justify-between">
                <span>Voice Reading Speed</span>
                <span className="text-neutral-500 font-medium">
                  {profile.speechRate <= 0.75 ? 'Gentle & Slow' : profile.speechRate <= 0.9 ? 'Normal Pace' : 'Faster Pace'}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 0.7, label: 'Slow' },
                  { rate: 0.85, label: 'Normal' },
                  { rate: 1.0, label: 'Fast' },
                ].map((item) => (
                  <button
                    key={item.rate}
                    type="button"
                    onClick={() => setProfile((prev) => ({ ...prev, speechRate: item.rate }))}
                    className={`h-9 px-2 rounded-md border text-xs transition-colors cursor-pointer ${
                      profile.speechRate === item.rate
                        ? 'bg-black text-white border-black font-medium'
                        : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-900'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Submit */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {isEditing && onCancel ? (
            <button
              type="button"
              id="btn-cancel-edit-profile"
              onClick={onCancel}
              className="w-full sm:w-auto h-9 px-4 rounded-md border border-neutral-200 bg-white hover:border-neutral-900 text-xs font-medium text-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          ) : (
            <div className="text-xs text-neutral-500">
              Answers can be read aloud automatically so you never have to strain your eyes
            </div>
          )}

          <button
            type="submit"
            id="btn-submit-onboarding"
            className="w-full sm:w-auto h-9 px-4 rounded-md bg-black hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <span>{isEditing ? 'Save Preferences' : 'Start Using Sahayak'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </form>

    </div>
  );
};
