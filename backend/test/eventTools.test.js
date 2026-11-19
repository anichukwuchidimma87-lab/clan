import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatEventTime,
  formatBirthdayMonthDay,
  getBirthdayOccurrence,
  parseEventCsv,
  parseEventDateTime,
  serializePublicBirthday,
  toEventDateTimeInput,
  validateEventImportRows
} from '../../shared/eventTools.js';

test('Lagos wall-clock event times round-trip through the stored instant', () => {
  const instant = parseEventDateTime('2026-11-19T10:15');
  assert.equal(instant.toISOString(), '2026-11-19T09:15:00.000Z');
  assert.equal(toEventDateTimeInput(instant), '2026-11-19T10:15');
  assert.equal(formatEventTime(instant), formatEventTime('2026-11-19T09:15:00.000Z'));
  assert.match(formatEventTime(instant), /^10:15/);
});

test('event date parser rejects missing, malformed, and impossible wall-clock values', () => {
  for (const value of ['', '2026-11-19', '2026-02-30T10:00', '2026-11-19T25:00', '2026-11-19T10:00+15:00']) {
    assert.throws(() => parseEventDateTime(value), TypeError);
  }
});

test('CSV import honors quoted commas and escaped quotes', () => {
  const rows = parseEventCsv([
    'title,date,description,location,status,coverImage',
    '"Parish Seminar",2026-11-19T18:00,"Formation, prayer, and ""service""","St. Mary, Benin",Upcoming,'
  ].join('\r\n'));
  const result = validateEventImportRows(rows);

  assert.equal(result.errors.length, 0);
  assert.equal(result.valid.length, 1);
  assert.equal(result.valid[0].data.description, 'Formation, prayer, and "service"');
  assert.equal(result.valid[0].data.location, 'St. Mary, Benin');
  assert.equal(result.valid[0].data.date.toISOString(), '2026-11-19T17:00:00.000Z');
});

test('CSV import reports row-specific date validation errors', () => {
  const rows = parseEventCsv([
    'title,date',
    'Valid event,2026-11-19T18:00',
    'Invalid event,2026-02-30T09:00'
  ].join('\n'));
  const result = validateEventImportRows(rows);

  assert.equal(result.valid.length, 1);
  assert.deepEqual(result.errors.map(({ row, field }) => ({ row, field })), [{ row: 3, field: 'date' }]);
});

test('public birthday serialization excludes identifier, birth year, and full date of birth', () => {
  const birthday = serializePublicBirthday({
    _id: 'private-id',
    firstName: 'Ada',
    lastName: 'Lector',
    parishName: 'Private Parish',
    dateOfBirth: new Date(Date.UTC(1992, 1, 29))
  });

  assert.deepEqual(birthday, { name: 'Ada Lector', month: 2, day: 29 });
  assert.equal(Object.keys(birthday).some((key) => /year|date|id|parish/i.test(key)), false);
});

test('February 29 birthdays are observed on March 1 in non-leap years', () => {
  assert.deepEqual(getBirthdayOccurrence(2024, 2, 29), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(getBirthdayOccurrence(2025, 2, 29), { year: 2025, month: 3, day: 1 });
  assert.throws(() => formatBirthdayMonthDay(2, 30), TypeError);
});
