import request from 'supertest';
import App from '../app';

describe('Simple Auth Test', () => {
  let app: App;
  let server: any;

  beforeAll(async () => {
    app = new App();
    server = app.getApp();
  });

  it('should check API base endpoint', async () => {
    const response = await request(server)
      .get('/api/v1');

    console.log('API base response:', response.status, response.body);
    expect(response.status).toBe(200);
  });

  it('should test registration with detailed logging', async () => {
    const userData = {
      originCountry: 'United States',
      arrivalDate: '2025-12-01T00:00:00.000Z',
      departureDate: '2025-12-10T00:00:00.000Z',
      walletAddress: '0x1234567890123456789012345678901234567890',
    };

    console.log('Sending registration data:', userData);

    const response = await request(server)
      .post('/api/v1/auth/register')
      .send(userData);

    console.log('Registration response status:', response.status);
    console.log('Registration response body:', JSON.stringify(response.body, null, 2));

    // Don't assert anything, just log for debugging
  });

  it('should test a simple route that should work', async () => {
    const response = await request(server)
      .get('/api/v1/auth/verify')
      .set('Authorization', 'Bearer fake-token');

    console.log('Verify response status:', response.status);
    console.log('Verify response body:', JSON.stringify(response.body, null, 2));
  });
});