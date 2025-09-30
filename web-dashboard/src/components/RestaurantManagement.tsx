import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  generateRestaurants, 
  getRestaurantsByDistrict, 
  getRestaurantsByCuisine,
  getRestaurantsByPriceRange,
  searchRestaurants,
  getTopRatedRestaurants,
  getRestaurantStatistics,
  RestaurantData,
  DEMO_RESTAURANTS
} from '../services/restaurantDataGenerator';

const RestaurantManagement: React.FC = () => {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showStats, setShowStats] = useState(false);

  // Generate restaurants on component mount
  useEffect(() => {
    const generateData = async () => {
      setLoading(true);
      // Generate 1000+ restaurants
      const generatedRestaurants = generateRestaurants(1200);
      // Add demo restaurants at the beginning
      const allRestaurants = [...DEMO_RESTAURANTS, ...generatedRestaurants];
      setRestaurants(allRestaurants);
      setFilteredRestaurants(allRestaurants);
      setLoading(false);
    };

    generateData();
  }, []);

  // Filter restaurants based on search and filters
  useEffect(() => {
    let filtered = restaurants;

    if (searchQuery) {
      filtered = searchRestaurants(filtered, searchQuery);
    }

    if (selectedDistrict) {
      filtered = getRestaurantsByDistrict(filtered, selectedDistrict);
    }

    if (selectedCuisine) {
      filtered = getRestaurantsByCuisine(filtered, selectedCuisine);
    }

    if (selectedPriceRange) {
      filtered = getRestaurantsByPriceRange(filtered, selectedPriceRange);
    }

    setFilteredRestaurants(filtered);
    setCurrentPage(1);
  }, [restaurants, searchQuery, selectedDistrict, selectedCuisine, selectedPriceRange]);

  // Get unique values for filters
  const uniqueDistricts = useMemo(() => {
    return Array.from(new Set(restaurants.map(r => r.district))).sort();
  }, [restaurants]);

  const uniqueCuisines = useMemo(() => {
    return Array.from(new Set(restaurants.map(r => r.cuisine))).sort();
  }, [restaurants]);

  const uniquePriceRanges = useMemo(() => {
    return Array.from(new Set(restaurants.map(r => r.priceRange))).sort();
  }, [restaurants]);

  // Pagination
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRestaurants = filteredRestaurants.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    return getRestaurantStatistics(restaurants);
  }, [restaurants]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('');
    setSelectedCuisine('');
    setSelectedPriceRange('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-lg">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Restaurant Management</h2>
            <p className="text-gray-600">
              Managing {restaurants.length.toLocaleString()} restaurants across Hong Kong
            </p>
          </div>
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showStats ? 'Hide Statistics' : 'Show Statistics'}
          </button>
        </div>

        {/* Statistics Panel */}
        {showStats && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-4">Restaurant Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Total Restaurants</h4>
                <p className="text-2xl font-bold text-blue-600">{stats.total.toLocaleString()}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Average Rating</h4>
                <p className="text-2xl font-bold text-green-600">{stats.averageRating}/5.0</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Districts Covered</h4>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(stats.byDistrict).length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Cuisine Types</h4>
                <p className="text-2xl font-bold text-orange-600">{Object.keys(stats.byCuisine).length}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Districts</option>
              {uniqueDistricts.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedCuisine}
              onChange={(e) => setSelectedCuisine(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Cuisines</option>
              {uniqueCuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Price Ranges</option>
              {uniquePriceRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              onClick={clearFilters}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {filteredRestaurants.length.toLocaleString()} of {restaurants.length.toLocaleString()} restaurants
        </div>
      </div>

      {/* Restaurant List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  District
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuisine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.district}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.cuisine}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {restaurant.priceRange}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <span className="text-yellow-400">★</span>
                      <span className="ml-1">{restaurant.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">
                      View Dashboard
                    </button>
                    <button className="text-green-600 hover:text-green-900 mr-3">
                      Generate QR
                    </button>
                    <button className="text-purple-600 hover:text-purple-900">
                      Analytics
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredRestaurants.length)}</span> of{' '}
                  <span className="font-medium">{filteredRestaurants.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantManagement;