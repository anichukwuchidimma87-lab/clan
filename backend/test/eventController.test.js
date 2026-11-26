import test from 'node:test';
import assert from 'node:assert/strict';
import Event from '../src/models/Event.js';
import Lector from '../src/models/Lector.js';
import { createEvent, updateEvent } from '../src/controllers/eventController.js';
import {
  getPublicBirthdays,
  getUpcomingBirthdays,
  getBirthdayWhatsAppDraft,
  getRegistryData,
  updateLector
} from '../src/controllers/lectorController.js';

const makeResponse = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('create and update endpoints persist the same Africa/Lagos wall-clock time', async () => {
  const originalCreate = Event.create;
  const originalFindById = Event.findById;
  const created = {};
  const updated = {
    title: 'Existing meeting',
    description: '',
    date: new Date('2026-11-19T08:00:00.000Z'),
    location: '',
    coverImage: '',
    status: 'Upcoming',
    async save() {}
  };

  Event.create = async (values) => Object.assign(created, values);
  Event.findById = async () => updated;
  try {
    const createResponse = makeResponse();
    await createEvent({
      body: { title: 'Morning meeting', date: '2026-11-19T10:15' }
    }, createResponse);

    assert.equal(createResponse.statusCode, 201);
    assert.equal(created.date.toISOString(), '2026-11-19T09:15:00.000Z');

    const updateResponse = makeResponse();
    await updateEvent({
      params: { id: 'event-id' },
      body: { date: '2026-11-19T10:15' }
    }, updateResponse);

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updated.date.toISOString(), created.date.toISOString());
  } finally {
    Event.create = originalCreate;
    Event.findById = originalFindById;
  }
});

test('public birthday endpoint filters for active consent and omits full DOB', async () => {
  const originalFind = Lector.find;
  let filter;
  let selection;
  Lector.find = (query) => {
    filter = query;
    return {
      select(fields) {
        selection = fields;
        return this;
      },
      async lean() {
        return [{
          _id: 'private-id',
          firstName: 'Ada',
          lastName: 'Lector',
          parishName: 'Private Parish',
          publicBirthdayConsent: true,
          dateOfBirth: new Date(Date.UTC(1992, 1, 29))
        }];
      }
    };
  };

  try {
    const response = makeResponse();
    await getPublicBirthdays({}, response);

    assert.deepEqual(filter, {
      status: 'Active',
      publicBirthdayConsent: true,
      dateOfBirth: { $ne: null }
    });
    assert.equal(selection, 'firstName lastName parishName dateOfBirth');
    assert.deepEqual(response.body.data, [{ name: 'Ada Lector', parishName: 'Private Parish', month: 2, day: 29 }]);
  } finally {
    Lector.find = originalFind;
  }
});

test('upcoming birthday endpoint scopes parish presidents and omits contact and full DOB fields', async () => {
  const originalFind = Lector.find;
  let filter;
  let selection;
  Lector.find = (query) => {
    filter = query;
    return {
      select(fields) {
        selection = fields;
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve([{
          _id: '507f1f77bcf86cd799439013',
          firstName: 'Ada',
          lastName: 'Lector',
          parishName: 'St. Anne Parish',
          dateOfBirth: new Date(Date.UTC(1992, 1, 29)),
          phone: '08012345678'
        }]).then(resolve, reject);
      }
    };
  };

  try {
    const response = makeResponse();
    await getUpcomingBirthdays({
      user: { role: 'president', parish: 'St. Anne Parish', permissions: { view: true } },
      query: { days: '366' }
    }, response);

    assert.deepEqual(filter, {
      parishName: 'St. Anne Parish',
      deanery: 'Benin',
      status: 'Active',
      dateOfBirth: { $ne: null }
    });
    assert.equal(selection, 'firstName lastName parishName dateOfBirth phone');
    assert.deepEqual(Object.keys(response.body.data[0]).sort(), ['day', 'daysUntil', 'hasPhone', 'id', 'month', 'name', 'parishName']);
    assert.equal(response.body.data[0].hasPhone, true);
  } finally {
    Lector.find = originalFind;
  }
});

test('upcoming birthday endpoint limits deanery executives to the Benin deanery', async () => {
  const originalFind = Lector.find;
  let filter;
  Lector.find = (query) => {
    filter = query;
    return {
      select() {
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve([]).then(resolve, reject);
      }
    };
  };

  try {
    const response = makeResponse();
    await getUpcomingBirthdays({ user: { role: 'executive' }, query: { days: '366' } }, response);
    assert.deepEqual(filter, { deanery: 'Benin', status: 'Active', dateOfBirth: { $ne: null } });
  } finally {
    Lector.find = originalFind;
  }
});

test('WhatsApp birthday draft validates scope and prepares role-appropriate greeting', async () => {
  const originalFindOne = Lector.findOne;
  const lectorId = '507f1f77bcf86cd799439013';
  let filter;
  Lector.findOne = (query) => {
    filter = query;
    return {
      select() {
        return this;
      },
      async lean() {
        return {
          firstName: 'Ada',
          lastName: 'Lector',
          parishName: 'St. Anne Parish',
          phone: '08012345678',
          dateOfBirth: new Date(Date.UTC(1992, 1, 29))
        };
      }
    };
  };

  try {
    const response = makeResponse();
    await getBirthdayWhatsAppDraft({
      params: { lectorId },
      user: { role: 'president', parish: 'St. Anne Parish', permissions: { view: true } }
    }, response);

    assert.deepEqual(filter, {
      _id: lectorId,
      parishName: 'St. Anne Parish',
      deanery: 'Benin',
      status: 'Active',
      dateOfBirth: { $ne: null }
    });
    assert.equal(response.statusCode, 200);
    const draftUrl = new URL(response.body.url);
    assert.equal(draftUrl.hostname, 'wa.me');
    assert.equal(draftUrl.pathname, '/2348012345678');
    assert.match(draftUrl.searchParams.get('text'), /St\. Anne Parish/);

    const executiveResponse = makeResponse();
    await getBirthdayWhatsAppDraft({
      params: { lectorId },
      user: { role: 'executive' }
    }, executiveResponse);
    const executiveMessage = new URL(executiveResponse.body.url).searchParams.get('text');
    assert.match(executiveMessage, /deanery family/);
    assert.doesNotMatch(executiveMessage, /St\. Anne Parish/);
  } finally {
    Lector.findOne = originalFindOne;
  }
});

test('WhatsApp birthday draft rejects missing or invalid contact details', async () => {
  const originalFindOne = Lector.findOne;
  const lectorId = '507f1f77bcf86cd799439013';
  Lector.findOne = (query) => ({
    select() {
      return this;
    },
    async lean() {
      return query.parishName === 'St. Anne Parish'
        ? { firstName: 'Ada', lastName: 'Lector', parishName: 'St. Anne Parish', phone: 'not-a-phone' }
        : null;
    }
  });

  try {
    const invalidPhoneResponse = makeResponse();
    await getBirthdayWhatsAppDraft({
      params: { lectorId },
      user: { role: 'president', parish: 'St. Anne Parish', permissions: { view: true } }
    }, invalidPhoneResponse);
    assert.equal(invalidPhoneResponse.statusCode, 400);

    const outOfScopeResponse = makeResponse();
    await getBirthdayWhatsAppDraft({
      params: { lectorId },
      user: { role: 'president', parish: 'Another Parish', permissions: { view: true } }
    }, outOfScopeResponse);
    assert.equal(outOfScopeResponse.statusCode, 404);
  } finally {
    Lector.findOne = originalFindOne;
  }
});

test('upcoming birthday endpoint rejects members', async () => {
  const originalFind = Lector.find;
  Lector.find = () => {
    throw new Error('Birthday query should not run for a member.');
  };

  try {
    const response = makeResponse();
    await getUpcomingBirthdays({ user: { role: 'member' }, query: {} }, response);
    assert.equal(response.statusCode, 403);
  } finally {
    Lector.find = originalFind;
  }
});

test('parish president registry records include date of birth for details and editing', async () => {
  const originals = {
    countDocuments: Lector.countDocuments,
    find: Lector.find
  };
  const dateOfBirth = new Date('1992-02-29T00:00:00.000Z');
  const lector = { _id: 'lector-id', dateOfBirth };
  let selectedFields;

  Lector.countDocuments = async () => 1;
  Lector.find = () => ({
    select(fields) {
      selectedFields = fields;
      return this;
    },
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    async limit() {
      return [lector];
    }
  });

  try {
    const response = makeResponse();
    await getRegistryData({
      user: {
        role: 'president',
        parish: 'St. Anne Parish',
        permissions: { view: true }
      },
      query: { limit: '1000', page: '1' }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.notEqual(selectedFields, '-dateOfBirth');
    assert.equal(response.body.ownParish[0].dateOfBirth, dateOfBirth);
  } finally {
    Lector.countDocuments = originals.countDocuments;
    Lector.find = originals.find;
  }
});

test('parish president can update own-parish lector birth date without parish fields', async () => {
  const originalFindById = Lector.findById;
  const originalFindByIdAndUpdate = Lector.findByIdAndUpdate;
  const target = { parishName: 'St. Anne Parish', dateOfBirth: null };
  let updatedFields;
  Lector.findById = async () => target;
  Lector.findByIdAndUpdate = (id, fields) => {
    updatedFields = fields;
    return {
      async populate() {
        return { ...target, ...fields };
      }
    };
  };

  try {
    const response = makeResponse();
    await updateLector({
      params: { id: 'lector-id' },
      user: {
        role: 'president',
        parish: 'St. Anne Parish',
        permissions: { update: true }
      },
      body: { dateOfBirth: '1992-02-29' }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.ok(updatedFields.dateOfBirth instanceof Date);
    assert.equal(updatedFields.parishId, undefined);
    assert.equal(updatedFields.deanery, undefined);
  } finally {
    Lector.findById = originalFindById;
    Lector.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test('parish president cannot transfer a lector by changing parish fields', async () => {
  const response = makeResponse();
  await updateLector({
    params: { id: 'lector-id' },
    user: {
      role: 'president',
      parish: 'St. Anne Parish',
      permissions: { update: true }
    },
    body: { parishId: 'other-parish-id', dateOfBirth: '1992-02-29' }
  }, response);

  assert.equal(response.statusCode, 403);
});
