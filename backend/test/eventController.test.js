import test from 'node:test';
import assert from 'node:assert/strict';
import Event from '../src/models/Event.js';
import Lector from '../src/models/Lector.js';
import { createEvent, updateEvent } from '../src/controllers/eventController.js';
import { getPublicBirthdays } from '../src/controllers/lectorController.js';

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
    assert.equal(selection, 'firstName lastName dateOfBirth');
    assert.deepEqual(response.body.data, [{ name: 'Ada Lector', month: 2, day: 29 }]);
  } finally {
    Lector.find = originalFind;
  }
});
