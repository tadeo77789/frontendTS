export type PasswordLevel = 'empty' | 'weak' | 'medium' | 'strong';

export interface PasswordChecks {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
}

export interface PasswordStrength {
  level: PasswordLevel;
  checks: PasswordChecks;
  meetsMinimum: boolean;
}

export const MIN_PASSWORD_LENGTH = 8;
const STRONG_LENGTH = 12;

export function evaluatePassword(password: string): PasswordStrength {
  const checks: PasswordChecks = {
    length: password.length >= MIN_PASSWORD_LENGTH,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  if (password.length === 0) {
    return { level: 'empty', checks, meetsMinimum: false };
  }

  const variety = [checks.upper, checks.lower, checks.number, checks.special].filter(Boolean).length;
  const meetsMinimum = checks.length && variety >= 3;

  let level: PasswordLevel;
  if (!meetsMinimum) {
    level = 'weak';
  } else if (variety >= 4 && password.length >= STRONG_LENGTH) {
    level = 'strong';
  } else {
    level = 'medium';
  }

  return { level, checks, meetsMinimum };
}
