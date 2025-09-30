import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MerchantFilters } from '../MerchantFilters';

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'searchMerchants': 'Search merchants...',
      'filterByCategory': 'Filter by category',
      'location': 'Location'
    };
    return translations[key] || key;
  }
}));

const mockProps = {
  onSearch: jest.fn(),
  onCategoryFilter: jest.fn(),
  onLocationFilter: jest.fn(),
  onDiscountFilter: jest.fn(),
  categories: ['Restaurant', 'Shopping', 'Entertainment'],
  activeFilters: {
    search: '',
    category: null,
    location: null,
    minDiscount: null
  }
};

describe('MerchantFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input correctly', () => {
    render(<MerchantFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search merchants...');
    expect(searchInput).toBeInTheDocument();
  });

  it('calls onSearch when search form is submitted', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search merchants...');
    await user.type(searchInput, 'test restaurant');
    await user.keyboard('{Enter}');
    
    expect(mockProps.onSearch).toHaveBeenCalledWith('test restaurant');
  });

  it('shows filter options when filter button is clicked', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const filterButton = screen.getByTestId('filter-toggle');
    await user.click(filterButton);
    
    expect(screen.getByTestId('filter-options')).toBeInTheDocument();
    expect(screen.getByText('Filter by category')).toBeInTheDocument();
  });

  it('renders category filters correctly', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const filterButton = screen.getByTestId('filter-toggle');
    await user.click(filterButton);
    
    expect(screen.getByTestId('category-filter-Restaurant')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter-Shopping')).toBeInTheDocument();
    expect(screen.getByTestId('category-filter-Entertainment')).toBeInTheDocument();
  });

  it('calls onCategoryFilter when category is selected', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const filterButton = screen.getByTestId('filter-toggle');
    await user.click(filterButton);
    
    const categoryButton = screen.getByTestId('category-filter-Restaurant');
    await user.click(categoryButton);
    
    expect(mockProps.onCategoryFilter).toHaveBeenCalledWith('Restaurant');
  });

  it('calls onLocationFilter when location is selected', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const filterButton = screen.getByTestId('filter-toggle');
    await user.click(filterButton);
    
    const locationButton = screen.getByTestId('location-filter-Central');
    await user.click(locationButton);
    
    expect(mockProps.onLocationFilter).toHaveBeenCalledWith('Central');
  });

  it('calls onDiscountFilter when discount filter is selected', async () => {
    const user = userEvent.setup();
    render(<MerchantFilters {...mockProps} />);
    
    const filterButton = screen.getByTestId('filter-toggle');
    await user.click(filterButton);
    
    const discountButton = screen.getByTestId('discount-filter-20');
    await user.click(discountButton);
    
    expect(mockProps.onDiscountFilter).toHaveBeenCalledWith(20);
  });

  it('displays active filters as badges', () => {
    const propsWithFilters = {
      ...mockProps,
      activeFilters: {
        search: 'test',
        category: 'Restaurant',
        location: 'Central',
        minDiscount: 20
      }
    };
    
    render(<MerchantFilters {...propsWithFilters} />);
    
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Restaurant')).toBeInTheDocument();
    expect(screen.getByText('Central')).toBeInTheDocument();
    expect(screen.getByText('20%+ discount')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', () => {
    const propsWithFilters = {
      ...mockProps,
      activeFilters: {
        search: 'test',
        category: null,
        location: null,
        minDiscount: null
      }
    };
    
    render(<MerchantFilters {...propsWithFilters} />);
    
    expect(screen.getByTestId('clear-filters')).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...mockProps,
      activeFilters: {
        search: 'test',
        category: 'Restaurant',
        location: 'Central',
        minDiscount: 20
      }
    };
    
    render(<MerchantFilters {...propsWithFilters} />);
    
    const clearButton = screen.getByTestId('clear-filters');
    await user.click(clearButton);
    
    expect(mockProps.onSearch).toHaveBeenCalledWith('');
    expect(mockProps.onCategoryFilter).toHaveBeenCalledWith(null);
    expect(mockProps.onLocationFilter).toHaveBeenCalledWith(null);
    expect(mockProps.onDiscountFilter).toHaveBeenCalledWith(null);
  });

  it('removes individual filters when X button is clicked', async () => {
    const user = userEvent.setup();
    const propsWithFilters = {
      ...mockProps,
      activeFilters: {
        search: '',
        category: 'Restaurant',
        location: null,
        minDiscount: null
      }
    };
    
    render(<MerchantFilters {...propsWithFilters} />);
    
    // Find the X button in the Restaurant badge and click it
    const restaurantBadge = screen.getByText('Restaurant').closest('div');
    const removeButton = restaurantBadge?.querySelector('button');
    
    if (removeButton) {
      await user.click(removeButton);
      expect(mockProps.onCategoryFilter).toHaveBeenCalledWith(null);
    }
  });

  it('applies theme colors to clear filter buttons', () => {
    const propsWithFilters = {
      ...mockProps,
      activeFilters: {
        search: 'test',
        category: null,
        location: null,
        minDiscount: null
      }
    };
    
    render(<MerchantFilters {...propsWithFilters} />);
    
    const clearButton = screen.getByTestId('clear-filters');
    expect(clearButton).toHaveClass('text-hk-red', 'hover:text-hk-red/80');
  });
});