import { describe, it, expect } from 'vitest';
import {
  generateTicketToken,
  hashTicketToken,
  generateTicketReference,
  encryptTicketToken,
  decryptTicketToken,
} from '@/lib/crypto/tokens';

describe('Cryptographic Token Engine', () => {
  it('generates unique, high-entropy 32-byte tokens', () => {
    const token1 = generateTicketToken();
    const token2 = generateTicketToken();

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    // Base64url representation of 32 bytes is ~43 chars
    expect(token1.length).toBeGreaterThanOrEqual(42);
  });

  it('computes deterministic SHA-256 hashes', () => {
    const token = 'test_token_sample_12345';
    const hash1 = hashTicketToken(token);
    const hash2 = hashTicketToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/); // 64 hex characters
  });

  it('produces distinct hashes for different tokens', () => {
    const hash1 = hashTicketToken('token_a');
    const hash2 = hashTicketToken('token_b');

    expect(hash1).not.toBe(hash2);
  });

  it('generates human-friendly ticket references with year and prefix', () => {
    const ref = generateTicketReference('UE');
    const currentYear = new Date().getFullYear();

    expect(ref).toMatch(new RegExp(`^UE-${currentYear}-[0-9A-F]{6}$`));
  });

  it('safely encrypts and decrypts raw tokens using AES-256-GCM', () => {
    const rawSecret = generateTicketToken();
    const encrypted = encryptTicketToken(rawSecret);

    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(':')).toHaveLength(3); // iv:tag:ciphertext

    const decrypted = decryptTicketToken(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it('returns null when attempting to decrypt corrupted ciphertexts', () => {
    const corrupted = 'bad:cipher:text';
    const decrypted = decryptTicketToken(corrupted);
    expect(decrypted).toBeNull();
  });
});
