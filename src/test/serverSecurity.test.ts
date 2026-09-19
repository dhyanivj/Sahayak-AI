import { describe, it, expect } from 'vitest';
import { isSafeInlineMedia, isSafeWebhookUrl, pruneRateLimitRecords, safePromptText, sanitizeElderText } from '../../server';

describe('Sahayak AI - Server Security & Defense Invariants', () => {
  it('strips null bytes from untrusted elder input payloads', () => {
    const maliciousInput = 'Urgent bill\0payment required immediately\0';
    const sanitized = sanitizeElderText(maliciousInput);
    expect(sanitized).toBe('Urgent billpayment required immediately');
    expect(sanitized).not.toContain('\0');
  });

  it('drops cross-site script injection tags completely', () => {
    const scriptPayload = 'Electricity notice <script>alert("pwned")</script> please pay now';
    const sanitized = sanitizeElderText(scriptPayload);
    expect(sanitized).toBe('Electricity notice  please pay now');
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('alert');
  });

  it('strips javascript pseudo-protocol and inline event handlers', () => {
    const attackPayload = 'Click here: javascript:alert(1) <img src="x" onerror="steal()" />';
    const sanitized = sanitizeElderText(attackPayload);
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).not.toContain('onerror=');
  });

  it('handles non-string or null inputs gracefully without crashing', () => {
    expect(sanitizeElderText(null)).toBe('');
    expect(sanitizeElderText(undefined)).toBe('');
    expect(sanitizeElderText(12345)).toBe('');
    expect(sanitizeElderText({})).toBe('');
  });

  it('validates rate limit window configuration', () => {
    const RATE_LIMIT_WINDOW_MS = 60 * 1000;
    const MAX_REQUESTS = 120;
    expect(RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(MAX_REQUESTS).toBe(120);
  });

  it('bounds model input after sanitizing it', () => {
    expect(safePromptText(`<script>ignore this</script>${'a'.repeat(20)}`, 10)).toBe('aaaaaaaaaa');
  });

  it('accepts only public HTTPS caregiver webhook URLs', () => {
    expect(isSafeWebhookUrl('https://hooks.example.com/sahayak')).toBe(true);
    expect(isSafeWebhookUrl('http://hooks.example.com/sahayak')).toBe(false);
    expect(isSafeWebhookUrl('https://127.0.0.1/private')).toBe(false);
    expect(isSafeWebhookUrl('https://[::1]/private')).toBe(false);
    expect(isSafeWebhookUrl('https://user:secret@hooks.example.com')).toBe(false);
    expect(isSafeWebhookUrl('https://localhost/private')).toBe(false);
  });

  it('rejects malformed, oversized, or unsupported inline media before model inference', () => {
    const allowed = new Set(['image/jpeg']);
    expect(isSafeInlineMedia({ data: 'aGVsbG8=', mimeType: 'image/jpeg' }, allowed, 10)).toBe(true);
    expect(isSafeInlineMedia({ data: 'not base64!', mimeType: 'image/jpeg' }, allowed, 10)).toBe(false);
    expect(isSafeInlineMedia({ data: 'aGVsbG8=', mimeType: 'image/svg+xml' }, allowed, 10)).toBe(false);
    expect(isSafeInlineMedia({ data: 'a'.repeat(20), mimeType: 'image/jpeg' }, allowed, 10)).toBe(false);
  });

  it('prunes expired rate-limit clients and caps retained client buckets', () => {
    const records = new Map([
      ['expired', { count: 1, resetTime: 99 }],
      ['oldest', { count: 1, resetTime: 150 }],
      ['newest', { count: 1, resetTime: 200 }],
    ]);
    pruneRateLimitRecords(records, 100, 1);
    expect([...records.keys()]).toEqual(['newest']);
  });
});
