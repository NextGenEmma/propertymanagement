// Runtime validation coverage for: property management API
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import app from '../server.js';
import Property from '../models/Property.js';
import Tenant from '../models/Tenant.js';
import RentPayment from '../models/RentPayment.js';
import MaintenanceRequest from '../models/MaintenanceRequest.js';
import ManagerInvite from '../models/ManagerInvite.js';
import User from '../models/User.js';
import { createToken } from '../middleware/auth.js';

let server;
let baseUrl;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-vitest-only';
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  });
});

describe('property backend routes', () => {
  it('serves the health response with CORS enabled', async () => {
    const response = await fetch(baseUrl, { headers: { Origin: 'http://example.com' } });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('requires authentication to list properties', async () => {
    const response = await fetch(`${baseUrl}/api/properties`);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'A valid bearer token is required' });
  });

  it('lists properties only for the authenticated owner or manager', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const sort = vi.fn().mockResolvedValue([]);
    const find = vi.spyOn(Property, 'find').mockReturnValue({ sort });
    const token = createToken({ id: ownerId, email: 'owner@example.com', role: 'owner' });
    const response = await fetch(`${baseUrl}/api/properties`, {
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(find).toHaveBeenCalledWith({ $or: [{ owner: ownerId }, { managers: ownerId }] });
  });

  it('loads an authorized property before listing its tenants', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const propertyId = new mongoose.Types.ObjectId().toString();
    const findProperty = vi.spyOn(Property, 'findOne').mockResolvedValue({ id: propertyId });
    const sort = vi.fn().mockResolvedValue([]);
    const findTenants = vi.spyOn(Tenant, 'find').mockReturnValue({ sort });
    const token = createToken({ id: ownerId, email: 'owner@example.com', role: 'owner' });
    const response = await fetch(`${baseUrl}/api/properties/${propertyId}/tenants`, {
      headers: { authorization: `Bearer ${token}` }
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
    expect(findProperty).toHaveBeenCalledWith({
      _id: propertyId,
      $or: [{ owner: ownerId }, { managers: ownerId }]
    });
    expect(findTenants).toHaveBeenCalledWith({ property: propertyId });
  });

  it('creates a maintenance request for the authenticated user', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const propertyId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(Property, 'findOne').mockResolvedValue({ id: propertyId });
    const create = vi.spyOn(MaintenanceRequest, 'create').mockImplementation(async (record) => ({ ...record, id: 'request-id' }));
    const token = createToken({ id: ownerId, email: 'owner@example.com', role: 'owner' });
    const response = await fetch(`${baseUrl}/api/properties/${propertyId}/maintenance`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Water leak', description: 'Kitchen sink leak' })
    });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      property: propertyId,
      requestedBy: ownerId
    }));
  });

  it('creates expiring manager invitations only for an authorized property owner', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const propertyId = new mongoose.Types.ObjectId().toString();
    const property = { id: propertyId, managers: { addToSet: vi.fn() }, save: vi.fn() };
    vi.spyOn(Property, 'findOne').mockResolvedValue(property);
    vi.spyOn(User, 'findOne').mockReturnValue({ select: vi.fn().mockResolvedValue(null) });
    vi.spyOn(User, 'exists').mockResolvedValue(null);
    vi.spyOn(ManagerInvite, 'deleteMany').mockResolvedValue({ deletedCount: 0 });
    const createInvite = vi.spyOn(ManagerInvite, 'create').mockImplementation(async (invite) => invite);
    const token = createToken({ id: ownerId, email: 'owner@example.com', role: 'owner' });
    const response = await fetch(`${baseUrl}/api/properties/${propertyId}/managers`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'manager@example.com' })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.email).toBe('manager@example.com');
    expect(body.inviteToken).toHaveLength(64);
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(createInvite).toHaveBeenCalledWith(expect.objectContaining({
      email: 'manager@example.com',
      invitedBy: ownerId,
      tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/)
    }));
  });

  it('redeems an invitation and assigns the new manager to its property', async () => {
    const ownerId = new mongoose.Types.ObjectId().toString();
    const propertyId = new mongoose.Types.ObjectId().toString();
    const managerId = new mongoose.Types.ObjectId().toString();
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(ManagerInvite, 'findOneAndUpdate').mockResolvedValue({ property: propertyId, invitedBy: ownerId });
    vi.spyOn(User, 'create').mockResolvedValue({
      _id: managerId,
      id: managerId,
      fullName: 'Property Manager',
      email: 'manager@example.com',
      role: 'manager'
    });
    const updateProperty = vi.spyOn(Property, 'updateOne').mockResolvedValue({ modifiedCount: 1 });
    const response = await fetch(`${baseUrl}/api/auth/accept-manager-invite`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Property Manager',
        email: 'manager@example.com',
        password: 'long-enough-password',
        inviteToken: 'a'.repeat(64)
      })
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user).toMatchObject({ id: managerId, email: 'manager@example.com', role: 'manager' });
    expect(updateProperty).toHaveBeenCalledWith(
      { _id: propertyId, owner: ownerId },
      { $addToSet: { managers: managerId } }
    );
  });

  it('rejects public registration that attempts to select the manager role', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Manager', email: 'manager@example.com', password: 'long-enough-password', role: 'manager' })
    });

    expect(response.status).toBe(400);
  });

  it('validates registration input before accessing the database', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'NRI Owner', email: 'owner@example.com', password: 'short' })
    });

    expect(response.status).toBe(400);
  });

  it('defaults property finance and timezone to India', () => {
    const property = new Property({
      owner: new mongoose.Types.ObjectId(),
      name: 'Chennai Apartment',
      address: { line1: '12 Marina Road', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' }
    });

    expect(property.currency).toBe('INR');
    expect(property.timezone).toBe('Asia/Kolkata');
    expect(property.validateSync()).toBeUndefined();
  });

  it('defaults tenant, rent, and maintenance records to INR', () => {
    const propertyId = new mongoose.Types.ObjectId();
    const tenantId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();
    const tenant = new Tenant({
      property: propertyId,
      fullName: 'Tenant Name',
      phone: '+91 90000 00000',
      leaseStart: '2026-01-01',
      leaseEnd: '2026-12-31',
      monthlyRent: 30000
    });
    const rent = new RentPayment({
      property: propertyId,
      tenant: tenantId,
      period: '2026-10',
      amount: 30000,
      dueDate: '2026-10-05'
    });
    const maintenance = new MaintenanceRequest({
      property: propertyId,
      title: 'Water leak',
      description: 'Repair the kitchen sink leak',
      requestedBy: userId
    });

    expect(tenant.currency).toBe('INR');
    expect(rent.currency).toBe('INR');
    expect(maintenance.currency).toBe('INR');
    expect(tenant.validateSync()).toBeUndefined();
    expect(rent.validateSync()).toBeUndefined();
    expect(maintenance.validateSync()).toBeUndefined();
  });
});

afterEach(() => vi.restoreAllMocks());