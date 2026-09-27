export const ROLE_OPTIONS = ['superadmin', 'executive', 'president', 'member'];

export const normalizeUserRole = (role) => {
  const normalized = String(role || 'member').trim().toLowerCase();

  if (normalized === 'admin') return 'executive';
  if (ROLE_OPTIONS.includes(normalized)) return normalized;

  return 'member';
};

export const canManageUsers = (role) => [
  'superadmin',
  'executive'
].includes(normalizeUserRole(role));

export const canAccessRegistry = (role) => [
  'superadmin',
  'executive',
  'president'
].includes(normalizeUserRole(role));

export const canAccessLedger = (role) => [
  'superadmin',
  'executive',
  'president'
].includes(normalizeUserRole(role));

export const canEditRegistry = (role) => [
  'superadmin',
  'executive'
].includes(normalizeUserRole(role));

export const canEditLedger = (role) => [
  'superadmin',
  'executive'
].includes(normalizeUserRole(role));
