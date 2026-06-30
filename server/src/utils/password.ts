import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/** Hashes a plaintext password. */
export const hashPassword = (password: string): Promise<string> =>
  bcrypt.hash(password, SALT_ROUNDS);

/** Verifies a plaintext password against a stored hash. */
export const verifyPassword = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
