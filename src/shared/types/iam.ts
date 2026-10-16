// Contrato IAM del backend (GET /iam/me/access). Los literales deben coincidir con el seed del servidor.
export const PERMISSIONS = {
  TRANSLATION_CREATE: 'translation.create',
  TRANSLATION_READ_OWN: 'translation.read.own',
  TRANSLATION_DELETE_OWN: 'translation.delete.own',
  LEXICON_READ: 'lexicon.read',
  LEXICON_WRITE: 'lexicon.write',
  PROFILE_MANAGE_OWN: 'profile.manage.own',
  SAMPLES_CAPTURE: 'samples.capture',
  SAMPLES_VALIDATE: 'samples.validate',
  USERS_MANAGE: 'users.manage',
  STATS_READ: 'stats.read',
  MODELS_MANAGE: 'models.manage',
  NOTIFICATIONS_MANAGE: 'notifications.manage',
  SECURITY_POLICY_MANAGE: 'security.policy.manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface MyAccess {
  roles: string[];
  permissions: string[];
}
