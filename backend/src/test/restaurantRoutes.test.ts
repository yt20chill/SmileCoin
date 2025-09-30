import request from 'supertest';
import App from '../app';

const app = new App().getApp();

describe('Restaurant Routes - Basic Validation', () => {
  describe('POST /api/v1/restaurants/register', () => {
    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(Array.isArray(response.body.details)).toBe(true);
    });

    it('should validate Google Place ID format', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/register')
        .send({
          googlePlaceId: 'invalid',
          walletAddress: '0x1234567890123456789012345678901234567890'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate wallet address format', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/register')
        .send({
          googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
          walletAddress: 'invalid-wallet'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/restaurants', () => {
    it('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          page: 0,
          limit: 101
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate location parameters', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          lat: 'invalid',
          lng: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/v1/restaurants/place/:placeId', () => {
    it('should validate place ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/place/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/v1/restaurants/qr/verify', () => {
    it('should validate QR code data', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/qr/verify')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject invalid QR code format', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/qr/verify')
        .send({
          qrCodeData: 'invalid-qr-data'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid QR Code');
    });
  });

  describe('Route existence', () => {
    it('should have register endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/register')
        .send({});

      // Should not be 404 (route not found)
      expect(response.status).not.toBe(404);
    });

    it('should have QR verify endpoint', async () => {
      const response = await request(app)
        .post('/api/v1/restaurants/qr/verify')
        .send({});

      // Should not be 404 (route not found)
      expect(response.status).not.toBe(404);
    });

    it('should have search advanced endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/search/advanced');

      // Should not be 404 (route not found)
      expect(response.status).not.toBe(404);
    });

    it('should have place lookup endpoint', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/place/test');

      // Should not be 404 (route not found), should be validation error
      expect(response.status).not.toBe(404);
    });
  });
});