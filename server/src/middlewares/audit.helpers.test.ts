import { describe, expect, it } from 'vitest';
import { auditAction, isSafeMethod, shouldAudit } from './audit.helpers';

describe('shouldAudit', () => {
  it('audits an authenticated successful mutation', () => {
    expect(shouldAudit('POST', 201, true, '/api/v1/students')).toBe(true);
    expect(shouldAudit('DELETE', 204, true, '/api/v1/invoices')).toBe(true);
  });

  it('skips safe methods', () => {
    expect(shouldAudit('GET', 200, true, '/api/v1/students')).toBe(false);
    expect(shouldAudit('OPTIONS', 204, true, '/api/v1/students')).toBe(false);
  });

  it('skips failed responses and unauthenticated requests', () => {
    expect(shouldAudit('POST', 400, true, '/api/v1/students')).toBe(false);
    expect(shouldAudit('POST', 201, false, '/api/v1/students')).toBe(false);
  });

  it('skips auth endpoints (they record their own events)', () => {
    expect(shouldAudit('POST', 200, true, '/api/v1/auth')).toBe(false);
  });
});

describe('auditAction', () => {
  it('joins method + base + route pattern (param names preserved)', () => {
    expect(auditAction('POST', '/api/v1/students', '/:id/portal-access')).toBe(
      'POST /api/v1/students/:id/portal-access',
    );
    expect(auditAction('DELETE', '/api/v1/invoices', '/:id')).toBe('DELETE /api/v1/invoices/:id');
  });
});

describe('isSafeMethod', () => {
  it('classifies read vs mutating methods', () => {
    expect(isSafeMethod('GET')).toBe(true);
    expect(isSafeMethod('POST')).toBe(false);
  });
});
