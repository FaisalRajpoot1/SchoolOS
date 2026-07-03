import { authenticator } from 'otplib';

// Allow ±1 time-step (±30s) to tolerate clock drift between server and device.
authenticator.options = { window: 1 };

export const generateTotpSecret = (): string => authenticator.generateSecret();

/** Builds the otpauth:// URI encoded into the setup QR code. */
export const buildOtpAuthUrl = (secret: string, account: string, issuer = 'SchoolOS'): string =>
  authenticator.keyuri(account, issuer, secret);

/** Verifies a 6-digit TOTP against the secret; never throws. */
export const verifyTotp = (secret: string, token: string): boolean => {
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
};
