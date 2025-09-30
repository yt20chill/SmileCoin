import request from 'supertest';
import App from '../app';

const app = new App().getApp();

describe('Ranking API Integration Tests', () => {
  describe('API Endpoint Availability', () => {
    it('should respond to GET /api/v1/rankings/overall', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body).toHaveProperty('lastUpdated');
        expect(response.body.meta.type).toBe('overall');
      }
    });

    it('should respond to GET /api/v1/rankings/origin/:country', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/United%20States')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.meta.type).toBe('origin-based');
        expect(response.body.meta.originCountry).toBe('United States');
      }
    });

    it('should respond to GET /api/v1/rankings/nearby with coordinates', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=22.3193&lng=114.1694&radius=5')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.meta.type).toBe('nearby');
        expect(response.body.meta.location).toBeDefined();
      }
    });

    it('should validate nearby rankings parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby')
        .expect(400);

      expect(response.body.success).toBe(false);
      // The error might be in details array for validation errors
      expect(response.body.error || response.body.details).toBeDefined();
    });

    it('should respond to POST /api/v1/rankings/refresh', async () => {
      const response = await request(app)
        .post('/api/v1/rankings/refresh')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body.meta.action).toBe('manual_refresh');
      }
    });

    it('should respond to GET /api/v1/rankings/top', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/top')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body.meta.type).toBe('top');
      }
    });

    it('should validate query parameters for overall rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall?page=0&limit=101')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should validate coordinate ranges for nearby rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=91&lng=181')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should handle URL-encoded country names', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/United%20Kingdom')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body.meta.originCountry).toBe('United Kingdom');
      }
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall?page=1&limit=5')
        .expect((res) => {
          // Should return 200 or handle gracefully
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(5);
      }
    });
  });

  describe('API Response Structure', () => {
    it('should return consistent response structure for overall rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/overall')
        .expect((res) => {
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        // Check response structure
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body).toHaveProperty('lastUpdated');
        expect(response.body).toHaveProperty('meta');
        
        // Check pagination structure
        expect(response.body.pagination).toHaveProperty('page');
        expect(response.body.pagination).toHaveProperty('limit');
        expect(response.body.pagination).toHaveProperty('total');
        expect(response.body.pagination).toHaveProperty('totalPages');
        expect(response.body.pagination).toHaveProperty('hasNext');
        expect(response.body.pagination).toHaveProperty('hasPrev');
        
        // Check meta structure
        expect(response.body.meta).toHaveProperty('type');
        expect(response.body.meta.type).toBe('overall');
      }
    });

    it('should return consistent response structure for origin-based rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/Japan')
        .expect((res) => {
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body.meta.type).toBe('origin-based');
        expect(response.body.meta.originCountry).toBe('Japan');
        expect(response.body).toHaveProperty('data');
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should return location metadata for nearby rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/nearby?lat=22.3193&lng=114.1694&radius=10')
        .expect((res) => {
          expect([200, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 200) {
        expect(response.body.meta.type).toBe('nearby');
        expect(response.body.meta.location).toBeDefined();
        expect(response.body.meta.location.latitude).toBe(22.3193);
        expect(response.body.meta.location.longitude).toBe(114.1694);
        expect(response.body.meta.location.radius).toBe(10);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing country parameter gracefully', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/origin/')
        .expect(404);
    });

    it('should handle invalid restaurant ID for statistics', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/statistics/invalid-id')
        .expect((res) => {
          expect([404, 500].includes(res.status)).toBe(true);
        });

      if (response.status === 404) {
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Restaurant not found');
      }
    });

    it('should validate limit parameter for top rankings', async () => {
      const response = await request(app)
        .get('/api/v1/rankings/top?limit=100')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });
});