'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Merchant, Offer } from '@/lib/types';

interface MerchantFilters {
  search: string;
  category: string | null;
  location: string | null;
  minDiscount: number | null;
}

interface UseMerchantsReturn {
  merchants: Merchant[];
  offers: Offer[];
  filteredMerchants: Merchant[];
  isLoading: boolean;
  error: string | null;
  filters: MerchantFilters;
  categories: string[];
  setSearch: (search: string) => void;
  setCategoryFilter: (category: string | null) => void;
  setLocationFilter: (location: string | null) => void;
  setDiscountFilter: (minDiscount: number | null) => void;
  refreshData: () => void;
  getMerchantById: (id: string) => Merchant | undefined;
  getOffersByMerchant: (merchantId: string) => Offer[];
}

export function useMerchants(): UseMerchantsReturn {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<MerchantFilters>({
    search: '',
    category: null,
    location: null,
    minDiscount: null
  });

  // Fetch merchants and offers
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [merchantsResponse, offersResponse] = await Promise.all([
        fetch('/api/merchants'),
        fetch('/api/offers')
      ]);

      if (!merchantsResponse.ok) {
        throw new Error('Failed to fetch merchants');
      }
      if (!offersResponse.ok) {
        throw new Error('Failed to fetch offers');
      }

      const [merchantsData, offersData] = await Promise.all([
        merchantsResponse.json(),
        offersResponse.json()
      ]);

      setMerchants(Array.isArray(merchantsData) ? merchantsData : []);
      setOffers(Array.isArray(offersData) ? offersData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Get unique categories from merchants
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(merchants.map(m => m.category))];
    return uniqueCategories.sort();
  }, [merchants]);

  // Filter merchants based on current filters
  const filteredMerchants = useMemo(() => {
    let filtered = [...merchants];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(merchant =>
        merchant.name.toLowerCase().includes(searchLower) ||
        merchant.nameZh.includes(filters.search) ||
        merchant.description.toLowerCase().includes(searchLower) ||
        merchant.descriptionZh.includes(filters.search) ||
        merchant.location.address.toLowerCase().includes(searchLower) ||
        merchant.location.addressZh.includes(filters.search)
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(merchant =>
        merchant.category === filters.category
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(merchant =>
        merchant.location.address.includes(filters.location!) ||
        merchant.location.addressZh.includes(filters.location!)
      );
    }

    // Discount filter - only show merchants with offers meeting minimum discount
    if (filters.minDiscount !== null && Array.isArray(offers)) {
      const merchantsWithGoodOffers = new Set(
        offers
          .filter(offer =>
            offer.isActive &&
            new Date(offer.validUntil) > new Date() &&
            offer.discountPercentage >= filters.minDiscount!
          )
          .map(offer => offer.merchantId)
      );

      filtered = filtered.filter(merchant =>
        merchantsWithGoodOffers.has(merchant.id)
      );
    }

    // Sort by rating (highest first), then by name
    return filtered.sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      return a.name.localeCompare(b.name);
    });
  }, [merchants, offers, filters]);

  // Filter setters
  const setSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const setCategoryFilter = useCallback((category: string | null) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setLocationFilter = useCallback((location: string | null) => {
    setFilters(prev => ({ ...prev, location }));
  }, []);

  const setDiscountFilter = useCallback((minDiscount: number | null) => {
    setFilters(prev => ({ ...prev, minDiscount }));
  }, []);

  // Helper functions
  const getMerchantById = useCallback((id: string) => {
    return merchants.find(merchant => merchant.id === id);
  }, [merchants]);

  const getOffersByMerchant = useCallback((merchantId: string) => {
    if (!Array.isArray(offers) || !offers.length) return [];
    return offers.filter(offer =>
      offer.merchantId === merchantId &&
      offer.isActive &&
      new Date(offer.validUntil) > new Date()
    );
  }, [offers]);

  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    merchants,
    offers,
    filteredMerchants,
    isLoading,
    error,
    filters,
    categories,
    setSearch,
    setCategoryFilter,
    setLocationFilter,
    setDiscountFilter,
    refreshData,
    getMerchantById,
    getOffersByMerchant
  };
}