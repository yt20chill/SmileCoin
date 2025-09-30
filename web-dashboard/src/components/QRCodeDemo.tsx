import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import QRCodeGenerator from './QRCodeGenerator';
import QRCodeComparison from './QRCodeComparison';
import { DEMO_RESTAURANTS, generateRestaurants } from '../services/restaurantDataGenerator';

const QRCodeDemo: React.FC = () => {
  const { t } = useTranslation();
  const [selectedDemo, setSelectedDemo] = useState<string>('ChIJN1t_tDeuEmsRUsoyG83frY4');
  const [allRestaurants, setAllRestaurants] = useState(DEMO_RESTAURANTS);

  useEffect(() => {
    // Generate additional restaurants for demo
    const additionalRestaurants = generateRestaurants(20);
    setAllRestaurants([...DEMO_RESTAURANTS, ...additionalRestaurants.slice(0, 12)]);
  }, []);

  const demoRestaurants = allRestaurants.slice(0, 15); // Show first 15 restaurants

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('qrGenerator.demo.title')}</h2>
        <p className="text-gray-600 mb-4">
          {t('qrGenerator.demo.description')}
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-1">
          <li>{t('qrGenerator.demo.feature1')}</li>
          <li>{t('qrGenerator.demo.feature2')}</li>
          <li>{t('qrGenerator.demo.feature3')}</li>
          <li>{t('qrGenerator.demo.feature4')}</li>
        </ul>
      </div>

      {/* Demo Restaurant Selector */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('qrGenerator.demo.tryDemo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
              <h4 className="font-medium text-gray-900 text-sm">{restaurant.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{restaurant.address}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-blue-600">{restaurant.cuisine}</span>
                <span className="text-xs text-gray-500">{restaurant.priceRange}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* QR Code Comparison */}
      {/* <QRCodeComparison /> */}

      {/* QR Code Generator */}
      <QRCodeGenerator restaurantId={selectedDemo} />

      {/* How it Works */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('qrGenerator.demo.howItWorks')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.demo.step1Title')}</h4>
            <p className="text-sm text-gray-600">
              {t('qrGenerator.demo.step1Desc')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.demo.step2Title')}</h4>
            <p className="text-sm text-gray-600">
              {t('qrGenerator.demo.step2Desc')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-yellow-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.demo.step3Title')}</h4>
            <p className="text-sm text-gray-600">
              {t('qrGenerator.demo.step3Desc')}
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">4</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.demo.step4Title')}</h4>
            <p className="text-sm text-gray-600">
              {t('qrGenerator.demo.step4Desc')}
            </p>
          </div>
        </div>
      </div>

      {/* Security Features */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('qrGenerator.security.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.security.qrSecurity')}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('qrGenerator.security.cryptoValidation')}</li>
              <li>• {t('qrGenerator.security.timeExpiration')}</li>
              <li>• {t('qrGenerator.security.placeIdVerification')}</li>
              <li>• {t('qrGenerator.security.tamperProof')}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.security.transactionLimits')}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('qrGenerator.security.maxCoins')}</li>
              <li>• {t('qrGenerator.security.originTracking')}</li>
              <li>• {t('qrGenerator.security.blockchainVerification')}</li>
              <li>• {t('qrGenerator.security.fraudDetection')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeDemo;