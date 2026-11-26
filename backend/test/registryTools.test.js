import test from 'node:test';
import assert from 'node:assert/strict';
import { compareLectorsByRole, formatDateOfBirth } from '../../shared/registryTools.js';

test('parish role sorting orders by role and then by lector name', () => {
  const lectors = [
    { firstName: 'Ben', lastName: 'Zulu', roleInParish: 'Parish President' },
    { firstName: 'Zoe', lastName: 'Young', roleInParish: 'Active Member' },
    { firstName: 'Ada', lastName: 'Alpha', roleInParish: 'Active Member' },
    { firstName: 'Cal', lastName: 'Beta' }
  ];

  assert.deepEqual(lectors.sort(compareLectorsByRole).map(({ firstName }) => firstName), [
    'Ada',
    'Cal',
    'Zoe',
    'Ben'
  ]);
});

test('date-of-birth formatting preserves the calendar date across time zones', () => {
  assert.equal(formatDateOfBirth('1992-02-29T00:00:00.000Z'), '29/02/1992');
  assert.equal(formatDateOfBirth(null), null);
});
