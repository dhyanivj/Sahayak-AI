import { describe, it, expect } from 'vitest';
import { getTranslation, getSpeechLangCode, SUPPORTED_LANGUAGES } from '../lib/translations';
import { AppLanguage } from '../types';

describe('Sahayak AI - Multilingual Vernacular Localization', () => {
  const languages: AppLanguage[] = [
    'Hindi',
    'Tamil',
    'Telugu',
    'Bengali',
    'Marathi',
    'Spanish',
    'English',
  ];

  it('provides complete translation packages for every supported language', () => {
    languages.forEach((lang) => {
      const t = getTranslation(lang);
      expect(t).toBeDefined();
      expect(t.header).toBeDefined();
      expect(t.header.brand).toBeTruthy();
      expect(t.frontDoor).toBeDefined();
      expect(t.frontDoor.title).toBeTruthy();
      expect(t.frontDoor.presets.length).toBeGreaterThan(0);
      expect(t.result).toBeDefined();
    });
  });

  it('maps each vernacular language to valid BCP-47 speech synthesis codes', () => {
    expect(getSpeechLangCode('Hindi')).toBe('hi-IN');
    expect(getSpeechLangCode('Tamil')).toBe('ta-IN');
    expect(getSpeechLangCode('Telugu')).toBe('te-IN');
    expect(getSpeechLangCode('Bengali')).toBe('bn-IN');
    expect(getSpeechLangCode('Marathi')).toBe('mr-IN');
    expect(getSpeechLangCode('Spanish')).toBe('es-ES');
    expect(getSpeechLangCode('English')).toBe('en-US');
  });

  it('verifies cultural sensitivity in vernacular brand headers', () => {
    const hindi = getTranslation('Hindi');
    expect(hindi.header.brand).toBe('सहायक');

    const english = getTranslation('English');
    expect(english.header.brand).toBe('Sahayak');

    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === 'Hindi');
    expect(meta?.nativeLabel).toBe('हिंदी');
  });
});
