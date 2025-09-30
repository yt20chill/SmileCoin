'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, MapPin, Tag } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MerchantFiltersProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string | null) => void;
  onLocationFilter: (location: string | null) => void;
  onDiscountFilter: (minDiscount: number | null) => void;
  categories: string[];
  activeFilters: {
    search: string;
    category: string | null;
    location: string | null;
    minDiscount: number | null;
  };
}

export function MerchantFilters({
  onSearch,
  onCategoryFilter,
  onLocationFilter,
  onDiscountFilter,
  categories,
  activeFilters
}: MerchantFiltersProps) {
  const t = useTranslations('merchants');
  const [showFilters, setShowFilters] = useState(false);
  const [searchValue, setSearchValue] = useState(activeFilters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const clearAllFilters = () => {
    setSearchValue('');
    onSearch('');
    onCategoryFilter(null);
    onLocationFilter(null);
    onDiscountFilter(null);
  };

  const hasActiveFilters = activeFilters.search || activeFilters.category || 
                          activeFilters.location || activeFilters.minDiscount;

  const discountOptions = [
    { label: '10%+', value: 10 },
    { label: '20%+', value: 20 },
    { label: '30%+', value: 30 },
    { label: '50%+', value: 50 }
  ];

  const locationOptions = [
    'Central',
    'Tsim Sha Tsui',
    'Causeway Bay',
    'Mong Kok',
    'Wan Chai',
    'Admiralty'
  ];

  return (
    <div className="space-y-4" data-testid="merchant-filters">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={t('searchMerchants')}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-10 pr-20"
          data-testid="search-input"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="p-1 h-8 w-8"
            data-testid="filter-toggle"
          >
            <Filter className="w-4 h-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="p-1 h-8 w-8 text-hk-red hover:text-hk-red/80"
              data-testid="clear-filters"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              {activeFilters.search}
              <button
                onClick={() => {
                  setSearchValue('');
                  onSearch('');
                }}
                className="ml-1 hover:text-hk-red"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {activeFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {activeFilters.category}
              <button
                onClick={() => onCategoryFilter(null)}
                className="ml-1 hover:text-hk-red"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {activeFilters.location && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {activeFilters.location}
              <button
                onClick={() => onLocationFilter(null)}
                className="ml-1 hover:text-hk-red"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {activeFilters.minDiscount && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {activeFilters.minDiscount}%+ discount
              <button
                onClick={() => onDiscountFilter(null)}
                className="ml-1 hover:text-hk-red"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4" data-testid="filter-options">
          {/* Categories */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
              <Tag className="w-4 h-4 mr-1" />
              {t('filterByCategory')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={activeFilters.category === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => onCategoryFilter(
                    activeFilters.category === category ? null : category
                  )}
                  className="text-xs"
                  data-testid={`category-filter-${category}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Locations */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {t('location')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {locationOptions.map((location) => (
                <Button
                  key={location}
                  variant={activeFilters.location === location ? "default" : "outline"}
                  size="sm"
                  onClick={() => onLocationFilter(
                    activeFilters.location === location ? null : location
                  )}
                  className="text-xs"
                  data-testid={`location-filter-${location}`}
                >
                  {location}
                </Button>
              ))}
            </div>
          </div>

          {/* Discount Filters */}
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">
              Minimum Discount
            </h4>
            <div className="flex flex-wrap gap-2">
              {discountOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={activeFilters.minDiscount === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => onDiscountFilter(
                    activeFilters.minDiscount === option.value ? null : option.value
                  )}
                  className="text-xs"
                  data-testid={`discount-filter-${option.value}`}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}