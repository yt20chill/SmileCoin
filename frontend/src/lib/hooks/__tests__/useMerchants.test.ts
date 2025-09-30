import { renderHook, act, waitFor } from '@testing-library/react';
import { useMerchants } from '../useMerchants';
import { Merchant, Offer } from '@/lib/types';

// Mock fetch
global.fetch = jest.fn();

const mockMerchants: Merchant[] = [
  {
    id: 'merchant-1',
    name: 'Test Restaurant',
    nameZh: '測試餐廳',
    description: 'Great food',
    descriptionZh: '美味食物',
    logo: '/logo1.jpg',
    category: 'Restaurant',
    location: {
      address: '123 Central Street',
      addressZh: '中環街123號',
      coordinates: [22.2783, 114.1747]
    },
    rating: 4.5,
    totalRatings: 100,
    isActive: true
  },
  {
    id: 'merchant-2',
    name: 'Shopping Mall',
    nameZh: '購物中心',
    description: 'Great shopping',
    descriptionZh: '很棒的購物',
    logo: '/logo2.jpg',
    category: 'Shopping',
    location: {
      address: '456 Tsim Sha Tsui Road',
      addressZh: '尖沙咀道456號',
      coordinates: [22.2783, 114.1747]
    },
    rating: 4.2,
    totalRatings: 80,
    isActive: true
  },
  {
    id: 'merchant-3',
    name: 'Coffee Shop',
    nameZh: '咖啡店',
    description: 'Best coffee in town',
    descriptionZh: '城中最佳咖啡',
    logo: '/logo3.jpg',
    category: 'Restaurant',
    location: {
      address: '789 Causeway Bay',
      addressZh: '銅鑼灣789號',
      coordinates: [22.2783, 114.1747]
    },
    rating: 4.8,
    totalRatings: 200,
    isActive: true
  }
];

const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    merchantId: 'merchant-1',
    title: '20% Off Food',
    titleZh: '食物8折',
    description: 'Discount on all food',
    descriptionZh: '所有食物折扣',
    discountPercentage: 20,
    validUntil: new Date('2025-12-31'), // Future date
    termsAndConditions: 'Dine-in only',
    termsAndConditionsZh: '僅限堂食',
    isActive: true
  },
  {
    id: 'offer-2',
    merchantId: 'merchant-2',
    title: '30% Off Shopping',
    titleZh: '購物7折',
    description: 'Big discount on shopping',
    descriptionZh: '購物大折扣',
    discountPercentage: 30,
    validUntil: new Date('2025-12-31'), // Future date
    termsAndConditions: 'Min purchase $100',
    termsAndConditionsZh: '最低消費$100',
    isActive: true
  }
];

const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('useMerchants', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('fetches merchants and offers on mount', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.merchants).toEqual(mockMerchants);
    expect(result.current.offers).toEqual(mockOffers);
    expect(result.current.error).toBe(null);
  });

  it('handles fetch errors correctly', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.merchants).toEqual([]);
    expect(result.current.offers).toEqual([]);
  });

  it('filters merchants by search query', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setSearch('coffee');
    });

    expect(result.current.filteredMerchants).toHaveLength(1);
    expect(result.current.filteredMerchants[0].name).toBe('Coffee Shop');
  });

  it('filters merchants by category', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setCategoryFilter('Shopping');
    });

    expect(result.current.filteredMerchants).toHaveLength(1);
    expect(result.current.filteredMerchants[0].category).toBe('Shopping');
  });

  it('filters merchants by location', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setLocationFilter('Central');
    });

    expect(result.current.filteredMerchants).toHaveLength(1);
    expect(result.current.filteredMerchants[0].location.address).toContain('Central');
  });

  it('filters merchants by minimum discount', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.setDiscountFilter(25);
    });

    // Only merchant-2 has an offer with 30% discount (>= 25%)
    expect(result.current.filteredMerchants).toHaveLength(1);
    expect(result.current.filteredMerchants[0].id).toBe('merchant-2');
  });

  it('sorts merchants by rating then by name', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should be sorted by rating: Coffee Shop (4.8), Test Restaurant (4.5), Shopping Mall (4.2)
    expect(result.current.filteredMerchants[0].name).toBe('Coffee Shop');
    expect(result.current.filteredMerchants[1].name).toBe('Test Restaurant');
    expect(result.current.filteredMerchants[2].name).toBe('Shopping Mall');
  });

  it('returns unique categories', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.categories).toEqual(['Restaurant', 'Shopping']);
  });

  it('getMerchantById returns correct merchant', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const merchant = result.current.getMerchantById('merchant-1');
    expect(merchant?.name).toBe('Test Restaurant');
  });

  it('getOffersByMerchant returns correct offers', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const offers = result.current.getOffersByMerchant('merchant-1');
    expect(offers).toHaveLength(1);
    expect(offers[0].title).toBe('20% Off Food');
  });

  it('refreshData refetches merchants and offers', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockMerchants
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockOffers
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => []
      } as Response);

    const { result } = renderHook(() => useMerchants());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.merchants).toHaveLength(3);

    act(() => {
      result.current.refreshData();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.merchants).toHaveLength(0);
    expect(mockFetch).toHaveBeenCalledTimes(4); // 2 initial + 2 refresh
  });
});