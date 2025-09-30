import React, { useState } from 'react';
import QRCodeGenerator from './QRCodeGenerator';

const QRCodeDemo: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<string>('demo-restaurant-123');

  const demoRestaurants = [
    { 
      id: 'demo-restaurant-123', 
      name: 'Golden Dragon Restaurant',
      placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      address: '123 Central District, Hong Kong'
    },
    { 
      id: 'demo-restaurant-456', 
      name: 'Harbour View Cafe',
      placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
      address: '456 Tsim Sha Tsui, Hong Kong'
    },
    { 
      id: 'demo-restaurant-789', 
      name: 'Peak Dining',
      placeId: 'ChIJ2eUgeAK6EmsRqRfr6hFrw-M',
      address: '789 The Peak, Hong Kong'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">QR Code Generator for Restaurants</h2>
        <p className="text-gray-600 mb-4">
          Generate QR codes for restaurants to enable tourists to give smile coins. Each QR code contains:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>Restaurant's Google Place ID</li>
          <li>Restaurant name and address</li>
          <li>Unique blockchain wallet address</li>
          <li>Security signature for validation</li>
        </ul>
      </div>

      {/* Demo Restaurant Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Try with Demo Restaurants</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoRestaurants.map((restaurant) => (
            <button
              key={restaurant.id}
              onClick={() => setSelectedDemo(restaurant.placeId)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedDemo === restaurant.placeId
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900">{restaurant.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{restaurant.address}</p>
              <p className="text-xs text-gray-500 mt-2">Place ID: {restaurant.placeId}</p>
            </button>
          ))}
        </div>
      </div>

      {/* QR Code Generator */}
      <QRCodeGenerator restaurantId={selectedDemo} />

      {/* How it Works */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How the QR Code System Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Restaurant Setup</h4>
            <p className="text-sm text-gray-600">
              Restaurant generates QR code using their Google Place ID and prints it
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Tourist Visits</h4>
            <p className="text-sm text-gray-600">
              Tourist dines at restaurant and scans the QR code with mobile app
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-yellow-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Give Coins</h4>
            <p className="text-sm text-gray-600">
              Tourist selects 1-3 smile coins to give to the restaurant
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Blockchain Transaction</h4>
            <p className="text-sm text-gray-600">
              Coins are transferred via blockchain and recorded transparently
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">QR Code Security</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Cryptographic signature validation</li>
              <li>• Time-based expiration (24 hours)</li>
              <li>• Google Place ID verification</li>
              <li>• Tamper-proof wallet addresses</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Transaction Limits</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Maximum 3 coins per restaurant per day</li>
              <li>• Tourist origin tracking for analytics</li>
              <li>• Blockchain transaction verification</li>
              <li>• Real-time fraud detection</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDemo;