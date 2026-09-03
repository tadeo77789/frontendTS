
import type { User } from '../types';

const ADMIN_EMAILS = new Set<string>([
  'aleosea777@gmail.com',
]);

export const isAdmin = (user: User | null | undefined): boolean => {
  if (!user?.email) return false;
  return ADMIN_EMAILS.has(user.email.trim().toLowerCase());
};
