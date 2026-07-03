import { describe, expect, it } from 'vitest';
import { buildStorageKey, mimeForExtension, safeDownloadName, safeExtension } from './fileKey';

describe('safeExtension', () => {
  it('accepts allow-listed extensions, case-insensitively', () => {
    expect(safeExtension('report.pdf')).toBe('.pdf');
    expect(safeExtension('scan.PNG')).toBe('.png');
    expect(safeExtension('sheet.XLSX')).toBe('.xlsx');
  });

  it('rejects unknown or dangerous extensions', () => {
    expect(safeExtension('malware.exe')).toBe('');
    expect(safeExtension('script.sh')).toBe('');
    expect(safeExtension('archive.tar.gz')).toBe('');
    expect(safeExtension('noext')).toBe('');
  });

  it('ignores path components (traversal-safe)', () => {
    expect(safeExtension('../../etc/passwd')).toBe('');
    expect(safeExtension('../../secret.pdf')).toBe('.pdf'); // extension only; id supplies the key
  });
});

describe('buildStorageKey', () => {
  it('joins a server id with the safe extension only', () => {
    expect(buildStorageKey('11111111-2222-3333-4444-555555555555', 'My File.PDF')).toBe(
      '11111111-2222-3333-4444-555555555555.pdf',
    );
  });

  it('drops the extension entirely when it is not allow-listed', () => {
    expect(buildStorageKey('abc', 'evil.exe')).toBe('abc');
  });
});

describe('mimeForExtension', () => {
  it('maps allow-listed extensions to canonical MIME types', () => {
    expect(mimeForExtension('.pdf')).toBe('application/pdf');
    expect(mimeForExtension('.PNG')).toBe('image/png');
    expect(mimeForExtension('.jpg')).toBe('image/jpeg');
    expect(mimeForExtension('.csv')).toBe('text/csv');
  });

  it('falls back to a generic binary type for anything unknown', () => {
    expect(mimeForExtension('.exe')).toBe('application/octet-stream');
    expect(mimeForExtension('')).toBe('application/octet-stream');
  });
});

describe('safeDownloadName', () => {
  it('replaces characters that could inject into Content-Disposition', () => {
    expect(safeDownloadName('a"b\r\nc.pdf')).toBe('a_b__c.pdf');
    expect(safeDownloadName('résumé (final).pdf')).toBe('r_sum___final_.pdf');
  });

  it('falls back to a default for an empty name', () => {
    expect(safeDownloadName('')).toBe('download');
  });
});
