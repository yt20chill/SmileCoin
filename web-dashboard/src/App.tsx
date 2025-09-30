import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Dashboard from './components/Dashboard';
import QRCodeDemo from './components/QRCodeDemo';
import SouvenirProgress from './components/SouvenirProgress';
import VoucherRedemption from './components/VoucherRedemption';
import LanguageSelector from './components/LanguageSelector';

function Navigation() {
  const location = useLocation();
  const { t } = useTranslation();
  
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <Link
            to="/"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/' || location.pathname.startsWith('/restaurant')
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('navigation.dashboard')}
          </Link>
          <Link
            to="/qr-generator"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/qr-generator'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('navigation.qrGenerator')}
          </Link>
          <Link
            to="/souvenir-progress"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/souvenir-progress'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('navigation.souvenirProgress')}
          </Link>
          <Link
            to="/voucher-redemption"
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/voucher-redemption'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('navigation.voucherRedemption')}
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const { t } = useTranslation();
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('dashboard.title')}
                </h1>
                <p className="text-sm text-gray-500">{t('dashboard.subtitle')}</p>
              </div>
              <LanguageSelector />
            </div>
          </div>
        </header>
        
        <Navigation />
        
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/restaurant/:placeId" element={<Dashboard />} />
            <Route path="/qr-generator" element={<QRCodeDemo />} />
            <Route path="/souvenir-progress" element={<SouvenirProgress />} />
            <Route path="/voucher-redemption" element={<VoucherRedemption />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;