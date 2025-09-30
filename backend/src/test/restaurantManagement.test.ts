import request from 'supertest';
import App from '../app';

const app = new App().getApp();

describe('Restaurant Management Endpoints', () => {

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
    it('should return paginated restaurant list', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

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

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          search: 'restaurant',
          page: 1,
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support location-based filtering', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          lat: 22.3193,
          lng: 114.1694,
          radius: 5,
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants')
        .query({
          sortBy: 'totalCoins',
          sortOrder: 'desc',
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/restaurants/search/advanced', () => {
    it('should search restaurants by multiple criteria', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/search/advanced')
        .query({
          q: 'chinese',
          name: 'restaurant',
          location: 'hong kong',
          cuisine: 'chinese',
          page: 1,
          limit: 10
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.searchParams).toBeDefined();
    });

    it('should support location-based search', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/search/advanced')
        .query({
          q: 'dim sum',
          lat: 22.3193,
          lng: 114.1694,
          radius: 2,
          page: 1,
          limit: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/v1/restaurants/:id/profile', () => {
    it('should return 404 for non-existent restaurant', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/non-existent-id/profile');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

    it('should validate restaurant ID parameter', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants//profile');

      expect(response.status).toBe(404); // This will be 404 because the route doesn't match
    });
  });

  describe('GET /api/v1/restaurants/place/:placeId', () => {
    it('should return 404 for non-existent place ID', async () => {
      const response = await request(app)
        .get('/api/v1/restaurants/place/ChIJN1t_tDeuEmsRUsoyG83frY4');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Not Found');
    });

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

    it('should reject QR code with invalid hash', async () => {
      const invalidQRData = JSON.stringify({
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        walletAddress: '0x1234567890123456789012345678901234567890',
        timestamp: Date.now(),
        version: '1.0',
        hash: 'invalid-hash'
      });

      const response = await request(app)
        .post('/api/v1/restaurants/qr/verify')
        .send({
          qrCodeData: invalidQRData
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid QR Code');
    });
  });
});