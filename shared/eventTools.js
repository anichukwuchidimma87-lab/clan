export const EVENT_TIME_ZONE = 'Africa/Lagos';

const DAY_MS = 24 * 60 * 60 * 1000;
const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const ZONED_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/i;
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

const timeZoneFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: EVENT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

const pad = (value) => String(value).padStart(2, '0');

const parseParts = (match) => ({
  year: Number(match[1]),
  month: Number(match[2]),
  day: Number(match[3]),
  hour: Number(match[4]),
  minute: Number(match[5]),
  second: Number(match[6] || 0),
  millisecond: Number((match[7] || '').padEnd(3, '0') || 0)
});

const isLeapYear = (year) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);

const isValidDateTimeParts = ({ year, month, day, hour, minute, second, millisecond }) => {
  if (year < 1000 || year > 9999 || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59 || millisecond > 999) {
    return false;
  }
  const daysInMonth = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  return day >= 1 && day <= daysInMonth;
};

const partsForInstant = (instant) => {
  const values = Object.fromEntries(
    timeZoneFormatter.formatToParts(instant)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
};

const toZonedInstant = (parts) => {
  const targetEpoch = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond
  );
  let candidateEpoch = targetEpoch;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const formatted = partsForInstant(new Date(candidateEpoch));
    const formattedEpoch = Date.UTC(
      formatted.year,
      formatted.month - 1,
      formatted.day,
      formatted.hour,
      formatted.minute,
      formatted.second,
      parts.millisecond
    );
    candidateEpoch += targetEpoch - formattedEpoch;
  }

  const result = new Date(candidateEpoch);
  const actual = partsForInstant(result);
  if (
    actual.year !== parts.year ||
    actual.month !== parts.month ||
    actual.day !== parts.day ||
    actual.hour !== parts.hour ||
    actual.minute !== parts.minute ||
    actual.second !== parts.second
  ) {
    throw new TypeError(`The date and time do not exist in ${EVENT_TIME_ZONE}.`);
  }
  return result;
};

const ensureInstant = (value) => {
  const instant = value instanceof Date ? new Date(value.getTime()) : parseEventDateTime(value);
  if (Number.isNaN(instant.getTime())) throw new TypeError('Enter a valid event date and time.');
  return instant;
};

export function parseEventDateTime(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new TypeError('Enter a valid event date and time.');
    return new Date(value.getTime());
  }
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Event date and time are required.');
  }

  const input = value.trim();
  const localMatch = input.match(LOCAL_DATE_TIME);
  if (localMatch) {
    const parts = parseParts(localMatch);
    if (!isValidDateTimeParts(parts)) {
      throw new TypeError('Enter a real date and time in YYYY-MM-DDTHH:mm format.');
    }
    return toZonedInstant(parts);
  }

  const zonedMatch = input.match(ZONED_DATE_TIME);
  if (zonedMatch) {
    const parts = parseParts(zonedMatch);
    if (!isValidDateTimeParts(parts)) {
      throw new TypeError('Enter a valid ISO date and time with a timezone offset.');
    }
    const offset = zonedMatch[8].toUpperCase();
    if (offset !== 'Z') {
      const [, hours, minutes] = offset.match(/^[+-](\d{2}):(\d{2})$/) || [];
      const offsetHours = Number(hours);
      const offsetMinutes = Number(minutes);
      if (offsetHours > 14 || offsetMinutes > 59 || (offsetHours === 14 && offsetMinutes !== 0)) {
        throw new TypeError('Enter a valid ISO timezone offset.');
      }
    }
    const instant = new Date(input);
    if (Number.isNaN(instant.getTime())) throw new TypeError('Enter a valid ISO date and time with a timezone offset.');
    return instant;
  }

  throw new TypeError(`Enter event date and time as YYYY-MM-DDTHH:mm in ${EVENT_TIME_ZONE}, or provide an ISO timestamp with an explicit timezone.`);
}

export function parseBirthDate(value) {
  if (typeof value !== 'string') throw new TypeError('Enter a valid date of birth.');
  const match = value.trim().match(DATE_ONLY);
  if (!match) throw new TypeError('Enter date of birth as YYYY-MM-DD.');
  const [year, month, day] = match.slice(1).map(Number);
  const parts = { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 };
  if (!isValidDateTimeParts(parts)) throw new TypeError('Enter a real date of birth.');
  return new Date(Date.UTC(year, month - 1, day));
}

export function getEventDateParts(value) {
  return partsForInstant(ensureInstant(value));
}

export function getEventDateKey(value) {
  const { year, month, day } = getEventDateParts(value);
  return `${year}-${pad(month)}-${pad(day)}`;
}

export function toEventDateTimeInput(value) {
  const { year, month, day, hour, minute } = getEventDateParts(value);
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function formatEventDate(value) {
  return ensureInstant(value).toLocaleDateString('en-GB', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export function formatEventTime(value) {
  return ensureInstant(value).toLocaleTimeString('en-GB', {
    timeZone: EVENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function formatEventDateTime(value) {
  return ensureInstant(value).toLocaleString('en-GB', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

export function getBirthdayParts(dateOfBirth) {
  const value = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(value.getTime())) throw new TypeError('Stored date of birth is invalid.');
  return { month: value.getUTCMonth() + 1, day: value.getUTCDate() };
}

export function getBirthdayOccurrence(year, month, day) {
  const leapYear = isLeapYear(year);
  if (month === 2 && day === 29 && !leapYear) return { year, month: 3, day: 1 };
  const parts = { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 };
  if (!isValidDateTimeParts(parts)) throw new TypeError('Birthday month and day are invalid.');
  return { year, month, day };
}

export function getNextBirthdayOccurrence(month, day, now = new Date()) {
  const today = getEventDateParts(now);
  let occurrence = getBirthdayOccurrence(today.year, month, day);
  let daysUntil = Math.round(
    (Date.UTC(occurrence.year, occurrence.month - 1, occurrence.day) - Date.UTC(today.year, today.month - 1, today.day)) / DAY_MS
  );

  if (daysUntil < 0) {
    occurrence = getBirthdayOccurrence(today.year + 1, month, day);
    daysUntil = Math.round(
      (Date.UTC(occurrence.year, occurrence.month - 1, occurrence.day) - Date.UTC(today.year, today.month - 1, today.day)) / DAY_MS
    );
  }

  return { ...occurrence, daysUntil };
}

export function formatBirthdayMonthDay(month, day) {
  if (!isValidDateTimeParts({ year: 2020, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 })) {
    throw new TypeError('Birthday month and day are invalid.');
  }
  const calendarDate = new Date(Date.UTC(2020, month - 1, day, 12));
  return calendarDate.toLocaleDateString('en-GB', {
    timeZone: EVENT_TIME_ZONE,
    day: 'numeric',
    month: 'short'
  });
}

export function serializePublicBirthday(lector) {
  const { month, day } = getBirthdayParts(lector.dateOfBirth);
  return {
    name: `${lector.firstName || ''} ${lector.lastName || ''}`.trim(),
    parishName: lector.parishName || '',
    month,
    day
  };
}

function csvError(message, row = 1, field) {
  const error = new Error(message);
  error.row = row;
  if (field) error.field = field;
  return error;
}

function parseCsvGrid(raw) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let closedQuote = false;
  let line = 1;
  let rowLine = 1;

  const finishField = () => {
    row.push(field);
    field = '';
    closedQuote = false;
  };
  const finishRow = () => {
    finishField();
    if (row.some((cell) => cell.trim() !== '')) rows.push({ line: rowLine, cells: row });
    row = [];
    rowLine = line + 1;
  };

  for (let index = 0; index < raw.length; index += 1) {
    const character = raw[index];
    if (inQuotes) {
      if (character === '"') {
        if (raw[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += character;
        if (character === '\n' || (character === '\r' && raw[index + 1] !== '\n')) {
          line += 1;
        } else if (character === '\r' && raw[index + 1] === '\n') {
          field += raw[index + 1];
          index += 1;
          line += 1;
        }
      }
      continue;
    }

    if (closedQuote && character !== ',' && character !== '\r' && character !== '\n' && character !== ' ' && character !== '\t') {
      throw csvError('Unexpected character after a quoted CSV field.', rowLine);
    }
    if (closedQuote && (character === ' ' || character === '\t')) continue;
    if (character === '"') {
      if (field.length !== 0) throw csvError('A quote must start at the beginning of a CSV field.', rowLine);
      inQuotes = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && raw[index + 1] === '\n') index += 1;
      finishRow();
      line += 1;
      rowLine = line;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw csvError('A quoted CSV field was not closed.', rowLine);
  if (field.length > 0 || row.length > 0 || closedQuote) finishRow();
  return rows;
}

export function parseEventCsv(raw) {
  if (typeof raw !== 'string' || !raw.trim()) throw csvError('Paste CSV data with a header row.');
  const rows = parseCsvGrid(raw);
  if (rows.length < 2) throw csvError('CSV must include a header and at least one event row.');

  const aliases = {
    title: 'title',
    name: 'title',
    date: 'date',
    description: 'description',
    desc: 'description',
    location: 'location',
    venue: 'location',
    status: 'status',
    coverimage: 'coverImage',
    cover_image: 'coverImage'
  };
  const headers = rows[0].cells.map((header) => {
    const normalized = header.replace(/^\uFEFF/, '').trim().toLowerCase();
    const mapped = aliases[normalized];
    if (!mapped) throw csvError(`Unsupported CSV column "${header.trim()}".`, rows[0].line, header.trim());
    return mapped;
  });
  if (!headers.includes('title') || !headers.includes('date')) {
    throw csvError('CSV headers must include title and date.', rows[0].line);
  }
  if (new Set(headers).size !== headers.length) {
    throw csvError('CSV contains duplicate columns after header normalization.', rows[0].line);
  }

  return rows.slice(1).map(({ line: rowNumber, cells }) => {
    if (cells.length > headers.length) {
      throw csvError('This row has more fields than the header.', rowNumber);
    }
    const item = {};
    headers.forEach((header, index) => {
      item[header] = (cells[index] || '').trim();
    });
    return { row: rowNumber, item };
  });
}

export function validateEventImportRows(rows) {
  const valid = [];
  const errors = [];
  const addError = (row, field, message) => errors.push({ row, field, message });

  rows.forEach(({ row, item }) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      addError(row, 'record', 'Each event must be an object.');
      return;
    }

    const title = item.title ?? item.name;
    if (typeof title !== 'string' || !title.trim()) {
      addError(row, 'title', 'Title is required.');
    }

    let date;
    try {
      date = parseEventDateTime(item.date);
    } catch (error) {
      addError(row, 'date', error.message);
    }

    const status = item.status === undefined || item.status === '' ? 'Upcoming' : item.status;
    if (!['Upcoming', 'Completed'].includes(status)) {
      addError(row, 'status', 'Status must be Upcoming or Completed.');
    }

    const description = item.description ?? item.desc ?? '';
    const location = item.location ?? item.venue ?? '';
    const coverImage = item.coverImage ?? item.cover_image ?? '';
    for (const [field, value] of Object.entries({ description, location, coverImage })) {
      if (typeof value !== 'string') addError(row, field, `${field} must be text.`);
    }

    if (errors.some((error) => error.row === row)) return;
    valid.push({
      row,
      data: {
        title: title.trim(),
        description,
        date,
        location,
        status,
        coverImage
      }
    });
  });

  return { valid, errors };
}
