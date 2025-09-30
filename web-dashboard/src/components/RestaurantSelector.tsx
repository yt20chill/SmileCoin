import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const RestaurantSelector: React.FC = () => {
  const navigate = useNavigate();
  const { placeId } = useParams<{ placeId: string }>();

  const demoRestaurants = [
    { id: 'demo-restaurant-123', name: 'Golden Dragon Restaurant', address: 'Central, Hong Kong' },
    { id: 'demo-restaurant-456', name: 'Harbour View Cafe', address: 'Tsim Sha Tsui, Hong Kong' },
    { id: 'demo-restaurant-789', name: 'Peak Dining', address: 'The Peak, Hong Kong' },
  ];

  const handleRestaurantChange = (restaurantId: string) => {
    if (restaurantId === 'demo-restaurant-123') {
      navigate('/');
    } else {
      navigate(`/restaurant/${restaurantId}`);
    }
  };

  return (
    <div className="mb-6">
      <label htmlFor="restaurant-select" className="block text-sm font-medium text-gray-700 mb-2">
        Select Restaurant (Demo)
      </label>
      <select
        id="restaurant-select"
        value={placeId || 'demo-restaurant-123'}
        onChange={(e) => handleRestaurantChange(e.target.value)}
        className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        {demoRestaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name} - {restaurant.address}
          </option>
        ))}
      </select>
    </div>
  );
};

export default RestaurantSelector;