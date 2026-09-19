import { beforeAll, vi } from 'vitest';

// Mock Web SpeechSynthesis for jsdom
beforeAll(() => {
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const mockSpeechSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([
        { name: 'Google Natural English', lang: 'en-US', default: true },
        { name: 'Google Hindi', lang: 'hi-IN', default: false },
      ]),
      speaking: false,
      paused: false,
      pending: false,
    };

    Object.defineProperty(window, 'speechSynthesis', {
      writable: true,
      value: mockSpeechSynthesis,
    });

    (window as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text) => ({
      text,
      rate: 1,
      pitch: 1,
      lang: 'en-US',
      voice: null,
      onstart: null,
      onend: null,
      onerror: null,
    }));
  }
});
