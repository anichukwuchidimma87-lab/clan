export function compareLectorsByRole(left, right) {
  const roleComparison = (left.roleInParish || 'Active Member').localeCompare(
    right.roleInParish || 'Active Member',
    undefined,
    { sensitivity: 'base' }
  );
  if (roleComparison !== 0) return roleComparison;

  const leftName = `${left.lastName || ''} ${left.firstName || ''}`;
  const rightName = `${right.lastName || ''} ${right.firstName || ''}`;
  return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' });
}

export function formatDateOfBirth(value) {
  return value ? new Date(value).toLocaleDateString('en-GB', { timeZone: 'UTC' }) : null;
}
