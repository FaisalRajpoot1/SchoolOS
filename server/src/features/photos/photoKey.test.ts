import { describe, expect, it } from 'vitest';
import { buildImageKey, imageExtension, imageMime } from './photoKey';

describe('imageExtension', () => {
  it('accepts allowed image extensions, case-insensitively', () => {
    expect(imageExtension('avatar.png')).toBe('.png');
    expect(imageExtension('SCAN.JPG')).toBe('.jpg');
    expect(imageExtension('logo.webp')).toBe('.webp');
  });

  it('rejects non-image or dangerous extensions', () => {
    expect(imageExtension('doc.pdf')).toBe('');
    expect(imageExtension('shell.svg')).toBe(''); // SVG excluded (can carry scripts)
    expect(imageExtension('malware.exe')).toBe('');
    expect(imageExtension('noext')).toBe('');
    expect(imageExtension('../../etc/passwd')).toBe('');
  });
});

describe('imageMime', () => {
  it('maps extensions to canonical image MIME types', () => {
    expect(imageMime('.png')).toBe('image/png');
    expect(imageMime('.JPEG')).toBe('image/jpeg');
    expect(imageMime('.gif')).toBe('image/gif');
  });

  it('falls back to a generic binary type for anything unknown', () => {
    expect(imageMime('.pdf')).toBe('application/octet-stream');
    expect(imageMime('')).toBe('application/octet-stream');
  });
});

describe('buildImageKey', () => {
  it('joins a server id with the image extension only', () => {
    expect(buildImageKey('11111111-2222-3333-4444-555555555555', '.png')).toBe(
      '11111111-2222-3333-4444-555555555555.png',
    );
  });
});
