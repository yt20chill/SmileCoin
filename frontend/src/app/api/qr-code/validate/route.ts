import { NextRequest, NextResponse } from 'next/server';

// Mock merchant QR codes for validation - Enhanced with more merchants
const MERCHANT_QR_CODES = {
  'merchant-001': {
    qrData: 'SMILE_MERCHANT_001_RATING_ACCESS',
    name: 'Golden Dragon Restaurant',
    nameZh: '金龍餐廳',
    isActive: true,
    category: 'restaurant',
    location: 'Central',
  },
  'merchant-002': {
    qrData: 'SMILE_MERCHANT_002_RATING_ACCESS',
    name: 'Dim Sum Palace',
    nameZh: '點心皇宮',
    isActive: true,
    category: 'restaurant',
    location: 'Tsim Sha Tsui',
  },
  'merchant-003': {
    qrData: 'SMILE_MERCHANT_003_RATING_ACCESS',
    name: 'Tea House Central',
    nameZh: '中環茶樓',
    isActive: true,
    category: 'cafe',
    location: 'Central',
  },
  'merchant-004': {
    qrData: 'SMILE_MERCHANT_004_RATING_ACCESS',
    name: 'Noodle Master',
    nameZh: '麵條大師',
    isActive: true,
    category: 'restaurant',
    location: 'Mong Kok',
  },
  'merchant-005': {
    qrData: 'SMILE_MERCHANT_005_RATING_ACCESS',
    name: 'Roast Duck House',
    nameZh: '燒鴨之家',
    isActive: true,
    category: 'restaurant',
    location: 'Wan Chai',
  },
  'merchant-006': {
    qrData: 'SMILE_MERCHANT_006_RATING_ACCESS',
    name: 'Harbor View Cafe',
    nameZh: '海景咖啡廳',
    isActive: true,
    category: 'cafe',
    location: 'Admiralty',
  },
  'merchant-007': {
    qrData: 'SMILE_MERCHANT_007_RATING_ACCESS',
    name: 'Street Food Corner',
    nameZh: '街頭美食角',
    isActive: true,
    category: 'street_food',
    location: 'Temple Street',
  },
  'merchant-008': {
    qrData: 'SMILE_MERCHANT_008_RATING_ACCESS',
    name: 'Luxury Shopping Mall',
    nameZh: '豪華購物中心',
    isActive: true,
    category: 'shopping',
    location: 'Causeway Bay',
  },
  'merchant-009': {
    qrData: 'SMILE_MERCHANT_009_RATING_ACCESS',
    name: 'Traditional Market',
    nameZh: '傳統市場',
    isActive: true,
    category: 'market',
    location: 'Sham Shui Po',
  },
  'merchant-010': {
    qrData: 'SMILE_MERCHANT_010_RATING_ACCESS',
    name: 'Rooftop Bar',
    nameZh: '天台酒吧',
    isActive: true,
    category: 'bar',
    location: 'Lan Kwai Fong',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { qrData, userId } = body;

    // Validate required fields
    if (!qrData || !userId) {
      return NextResponse.json(
        { 
          success: false,
          isValid: false,
          message: 'QR data and user ID are required',
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Find merchant by QR code
    const merchantEntry = Object.entries(MERCHANT_QR_CODES).find(
      ([_, merchant]) => merchant.qrData === qrData && merchant.isActive
    );

    if (!merchantEntry) {
      return NextResponse.json({
        success: false,
        isValid: false,
        message: 'Invalid QR code. Please scan a valid merchant QR code.',
        error: 'QR code not found or inactive'
      });
    }

    const [merchantId, merchant] = merchantEntry;

    // Simulate validation delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return successful validation with enhanced data
    return NextResponse.json({
      success: true,
      isValid: true,
      merchantId,
      merchantName: merchant.name,
      merchantNameZh: merchant.nameZh,
      category: merchant.category,
      location: merchant.location,
      message: `QR code validated for ${merchant.name}`,
      validatedAt: new Date().toISOString(),
      qrCodeData: qrData, // Include the scanned QR data for tracking
    });

  } catch (error) {
    console.error('QR validation error:', error);
    return NextResponse.json(
      { 
        success: false,
        isValid: false,
        message: 'Failed to validate QR code',
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Generate QR code for a merchant (for testing and merchant setup)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');
  const action = searchParams.get('action'); // 'generate' or 'list'

  // List all available merchants and their QR codes
  if (action === 'list') {
    const merchantList = Object.entries(MERCHANT_QR_CODES).map(([id, merchant]) => ({
      merchantId: id,
      merchantName: merchant.name,
      merchantNameZh: merchant.nameZh,
      category: merchant.category,
      location: merchant.location,
      qrData: merchant.qrData,
      isActive: merchant.isActive,
    }));

    return NextResponse.json({
      merchants: merchantList,
      total: merchantList.length,
      generatedAt: new Date().toISOString(),
    });
  }

  // Generate QR code for specific merchant
  if (!merchantId) {
    return NextResponse.json(
      { error: 'Merchant ID is required' },
      { status: 400 }
    );
  }

  const merchant = MERCHANT_QR_CODES[merchantId as keyof typeof MERCHANT_QR_CODES];
  
  if (!merchant) {
    return NextResponse.json(
      { error: 'Merchant not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    merchantId,
    qrData: merchant.qrData,
    merchantName: merchant.name,
    merchantNameZh: merchant.nameZh,
    category: merchant.category,
    location: merchant.location,
    isActive: merchant.isActive,
    generatedAt: new Date().toISOString(),
    // QR code display format for easy testing
    qrCodeUrl: `data:text/plain;charset=utf-8,${encodeURIComponent(merchant.qrData)}`,
  });
}