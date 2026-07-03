import { randomBytes } from 'node:crypto';

// Crockford-ish alphabet: no 0/O/1/I/L to avoid transcription errors.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const randomCode = (len: number): string => {
  const bytes = randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[(bytes[i] ?? 0) % ALPHABET.length];
  }
  return out;
};

/** Human-friendly grouping for display: ABCDEFGH → ABCD-EFGH. */
export const formatBackupCode = (raw: string): string =>
  raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;

/** Canonical form for storage/lookup: uppercased with separators stripped. */
export const normalizeBackupCode = (input: string): string =>
  input.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();

/** Generates `count` formatted single-use backup codes. */
export const generateBackupCodes = (count: number): string[] =>
  Array.from({ length: count }, () => formatBackupCode(randomCode(8)));
