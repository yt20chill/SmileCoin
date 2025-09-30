import { POST, GET } from '../route';

// Mock Next.js Request and Response
global.Request = class MockRequest {
  constructor(public url: string, public init?: RequestInit) {}
  
  async json() {
    return this.init?.body ? JSON.parse(this.init.body as string) : {};
  }
} as any;

global.Response = class MockResponse {
  constructor(public body: any, public init?: ResponseInit) {}
  
  get status() {
    return this.init?.status || 200;
  }
  
  async json() {
    return this.body;
  }
} as any;

// Mock NextRequest
const createMockRequest = (body: any, method: string = 'POST') => {
  return {
    json: jest.fn().mockResolvedValue(body),
    method,
  } as any;
};

// Mock NextRequest for GET with URL
const createMockGetRequest = (searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost/api/qr-code/validate');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    url: url.toString(),
    method: 'GET',
  } as any;
};

describe('/api/qr-code/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should validate a valid QR code successfully', async () => {
      const mockBody = {
        qrData: 'SMILE_MERCHANT_001_RATING_ACCESS',
        userId: 'user-123',
      };

      const request = createMockRequest(mockBody);
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.isValid).toBe(true);
      expect(data.merchantId).toBe('merchant-001');
      expect(data.merchantName).toBe('Golden Dragon Restaurant');
      expect(data.merchantNameZh).toBe('金龍餐廳');
      expect(data.category).toBe('restaurant');
      expect(data.location).toBe('Central');
      expect(data.qrCodeData).toBe('SMILE_MERCHANT_001_RATING_ACCESS');
    });

    it('should validate different merchant QR codes', async () => {
      const mockBody = {
        qrData: 'SMILE_MERCHANT_002_RATING_ACCESS',
        userId: 'user-123',
      };

      const request = createMockRequest(mockBody);
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.merchantId).toBe('merchant-002');
      expect(data.merchantName).toBe('Dim Sum Palace');
      expect(data.category).toBe('restaurant');
      expect(data.location).toBe('Tsim Sha Tsui');
    });

    it('should reject invalid QR code', async () => {
      const mockBody = {
        qrData: 'INVALID_QR_CODE',
        userId: 'user-123',
      };

      const request = createMockRequest(mockBody);
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(false);
      expect(data.isValid).toBe(false);
      expect(data.message).toBe('Invalid QR code. Please scan a valid merchant QR code.');
    });

    it('should return 400 for missing required fields', async () => {
      const mockBody = {
        userId: 'user-123',
      };

      const request = createMockRequest(mockBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('QR data and user ID are required');
    });

    it('should return 400 for missing user ID', async () => {
      const mockBody = {
        qrData: 'SMILE_MERCHANT_001_RATING_ACCESS',
      };

      const request = createMockRequest(mockBody);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toBe('QR data and user ID are required');
    });
  });

  describe('GET', () => {
    it('should generate QR code for specific merchant', async () => {
      const request = createMockGetRequest({ merchantId: 'merchant-001' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.merchantId).toBe('merchant-001');
      expect(data.qrData).toBe('SMILE_MERCHANT_001_RATING_ACCESS');
      expect(data.merchantName).toBe('Golden Dragon Restaurant');
      expect(data.merchantNameZh).toBe('金龍餐廳');
      expect(data.category).toBe('restaurant');
      expect(data.location).toBe('Central');
      expect(data.isActive).toBe(true);
      expect(data.qrCodeUrl).toContain('SMILE_MERCHANT_001_RATING_ACCESS');
    });

    it('should return 400 for missing merchant ID', async () => {
      const request = createMockGetRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Merchant ID is required');
    });

    it('should return 404 for non-existent merchant', async () => {
      const request = createMockGetRequest({ merchantId: 'non-existent' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Merchant not found');
    });

    it('should list all merchants when action is list', async () => {
      const request = createMockGetRequest({ action: 'list' });
      const response = await GET(request);
      const data = await response.json();

      expect(data.merchants).toBeDefined();
      expect(Array.isArray(data.merchants)).toBe(true);
      expect(data.merchants.length).toBeGreaterThan(0);
      expect(data.total).toBe(data.merchants.length);
      
      // Check first merchant structure
      const firstMerchant = data.merchants[0];
      expect(firstMerchant).toHaveProperty('merchantId');
      expect(firstMerchant).toHaveProperty('merchantName');
      expect(firstMerchant).toHaveProperty('merchantNameZh');
      expect(firstMerchant).toHaveProperty('category');
      expect(firstMerchant).toHaveProperty('location');
      expect(firstMerchant).toHaveProperty('qrData');
      expect(firstMerchant).toHaveProperty('isActive');
    });

    it('should generate QR codes for different merchant categories', async () => {
      // Test restaurant
      const restaurantRequest = createMockGetRequest({ merchantId: 'merchant-001' });
      const restaurantResponse = await GET(restaurantRequest);
      const restaurantData = await restaurantResponse.json();
      expect(restaurantData.category).toBe('restaurant');

      // Test cafe
      const cafeRequest = createMockGetRequest({ merchantId: 'merchant-003' });
      const cafeResponse = await GET(cafeRequest);
      const cafeData = await cafeResponse.json();
      expect(cafeData.category).toBe('cafe');

      // Test shopping
      const shoppingRequest = createMockGetRequest({ merchantId: 'merchant-008' });
      const shoppingResponse = await GET(shoppingRequest);
      const shoppingData = await shoppingResponse.json();
      expect(shoppingData.category).toBe('shopping');
    });
  });
});