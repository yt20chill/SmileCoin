import { NextRequest, NextResponse } from 'next/server';

// Mock offers data
const mockOffers = [
  {
    id: 'offer-1',
    merchantId: 'merchant-1',
    title: '20% Off Dim Sum',
    description: 'Get 20% off your next dim sum order',
    discount: 20,
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isActive: true,
    coinsRequired: 50,
  },
  {
    id: 'offer-2',
    merchantId: 'merchant-2',
    title: 'Free Tea with Purchase',
    description: 'Get a free tea with any meal purchase',
    discount: 0,
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    isActive: true,
    coinsRequired: 30,
  },
  {
    id: 'offer-3',
    merchantId: 'merchant-3',
    title: '15% Off Roast Duck',
    description: 'Special discount on our famous roast duck',
    discount: 15,
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isActive: true,
    coinsRequired: 40,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    let offers = mockOffers;

    // Filter by merchant if specified
    if (merchantId) {
      offers = offers.filter(offer => offer.merchantId === merchantId);
    }

    // Only return active offers
    offers = offers.filter(offer => offer.isActive && new Date(offer.validUntil) > new Date());

    return NextResponse.json({
      success: true,
      offers,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, title, description, discount, coinsRequired, validUntil } = body;

    // Validate required fields
    if (!merchantId || !title || !description || coinsRequired === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new offer
    const newOffer = {
      id: `offer-${Date.now()}`,
      merchantId,
      title,
      description,
      discount: discount || 0,
      validUntil: validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      coinsRequired,
    };

    // In a real app, this would be saved to a database
    mockOffers.push(newOffer);

    return NextResponse.json({
      success: true,
      offer: newOffer,
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}