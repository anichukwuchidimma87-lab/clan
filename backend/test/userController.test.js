import test from 'node:test';
import assert from 'node:assert/strict';
import User from '../src/models/User.js';
import Parish from '../src/models/Parish.js';
import AuditLog from '../src/models/AuditLog.js';
import {
  getCurrentUserProfile,
  updateUserAccount,
  updateUserProfile
} from '../src/controllers/userController.js';

const userId = '507f1f77bcf86cd799439011';
const adminId = '507f1f77bcf86cd799439012';

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

const makeUser = (overrides = {}) => ({
  _id: userId,
  name: 'Ada Member',
  title: '',
  firstName: 'Ada',
  middleName: '',
  lastName: 'Member',
  email: 'ada@example.com',
  role: 'member',
  status: 'approved',
  position: 'Member',
  parish: '',
  phone: '',
  tokenVersion: 0,
  permissions: {},
  saveCount: 0,
  async save() {
    this.saveCount += 1;
  },
  ...overrides
});

const mockUserQuery = (user) => ({
  select() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(user).then(resolve, reject);
  }
});

const withControllerMocks = async (user, { parishName = 'St. Anne Parish' } = {}, run) => {
  const originals = {
    findById: User.findById,
    findOne: User.findOne,
    countDocuments: User.countDocuments,
    parishFindOne: Parish.findOne,
    auditCreate: AuditLog.create,
    jwtSecret: process.env.JWT_SECRET
  };

  User.findById = () => mockUserQuery(user);
  User.findOne = () => ({
    select() {
      return this;
    },
    async lean() {
      return null;
    }
  });
  User.countDocuments = async () => 2;
  Parish.findOne = () => ({
    select() {
      return this;
    },
    async lean() {
      return parishName ? { name: parishName } : null;
    }
  });
  AuditLog.create = async () => {};
  process.env.JWT_SECRET = 'test-secret';

  try {
    await run();
  } finally {
    User.findById = originals.findById;
    User.findOne = originals.findOne;
    User.countDocuments = originals.countDocuments;
    Parish.findOne = originals.parishFindOne;
    AuditLog.create = originals.auditCreate;
    if (originals.jwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originals.jwtSecret;
  }
};

test('member parish changes are saved and returned by the profile reload endpoint', async () => {
  const user = makeUser();
  await withControllerMocks(user, {}, async () => {
    const updateResponse = makeResponse();
    await updateUserProfile({
      params: { userId },
      user: { _id: userId, role: 'member' },
      body: { parish: 'St. Anne Parish' }
    }, updateResponse);

    assert.equal(updateResponse.statusCode, 200);
    assert.equal(updateResponse.body.user.parish, 'St. Anne Parish');
    assert.equal(user.saveCount, 1);

    const reloadResponse = makeResponse();
    await getCurrentUserProfile({ user: { _id: userId } }, reloadResponse);
    assert.equal(reloadResponse.body.user.parish, 'St. Anne Parish');
  });
});

test('member parish updates reject parishes outside the master directory', async () => {
  const user = makeUser();
  await withControllerMocks(user, { parishName: null }, async () => {
    const response = makeResponse();
    await updateUserProfile({
      params: { userId },
      user: { _id: userId, role: 'member' },
      body: { parish: 'Unknown Parish' }
    }, response);

    assert.equal(response.statusCode, 400);
    assert.equal(user.saveCount, 0);
  });
});

test('account management updates role and parish together', async () => {
  const user = makeUser({ _id: userId, role: 'member' });
  await withControllerMocks(user, {}, async () => {
    const response = makeResponse();
    await updateUserAccount({
      params: { id: userId },
      user: { _id: adminId, role: 'superadmin' },
      body: {
        role: 'president',
        parish: 'St. Anne Parish',
        permissions: { view: true, export: false, add: false, update: true, suspend: false, delete: false }
      }
    }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.user.role, 'president');
    assert.equal(response.body.user.parish, 'St. Anne Parish');
    assert.equal(user.saveCount, 1);
  });
});

test('account management rejects invalid role, parish, and unauthorized superadmin changes', async () => {
  const invalidRoleUser = makeUser();
  await withControllerMocks(invalidRoleUser, {}, async () => {
    const response = makeResponse();
    await updateUserAccount({
      params: { id: userId },
      user: { _id: adminId, role: 'superadmin' },
      body: { role: 'not-a-role', parish: '' }
    }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(invalidRoleUser.saveCount, 0);
  });

  const invalidParishUser = makeUser();
  await withControllerMocks(invalidParishUser, { parishName: null }, async () => {
    const response = makeResponse();
    await updateUserAccount({
      params: { id: userId },
      user: { _id: adminId, role: 'superadmin' },
      body: { role: 'president', parish: 'Unknown Parish' }
    }, response);
    assert.equal(response.statusCode, 400);
    assert.equal(invalidParishUser.saveCount, 0);
  });

  const superadminUser = makeUser({ role: 'superadmin' });
  await withControllerMocks(superadminUser, {}, async () => {
    const response = makeResponse();
    await updateUserAccount({
      params: { id: userId },
      user: { _id: adminId, role: 'executive' },
      body: { role: 'member', parish: '' }
    }, response);
    assert.equal(response.statusCode, 403);
    assert.equal(superadminUser.saveCount, 0);
  });
});
