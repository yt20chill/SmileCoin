import React, { useState } from 'react';
import { SouvenirProgressService } from '../services/souvenirApi';
import { SouvenirVoucher } from '../types/souvenir';

const VoucherRedemption: React.FC = () => {
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    voucher?: SouvenirVoucher;
    message: string;
  } | null>(null);

  const handleRedeem = async () => {
    if (!voucherCode.trim()) {
      setResult({
        success: false,
        message: 'Please enter a voucher code'
      });
      return;
    }

    setLoading(true);
    try {
      const redemptionResult = await SouvenirProgressService.redeemVoucher(voucherCode.trim());
      setResult(redemptionResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to process voucher redemption'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVoucherCode('');
    setResult(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🏢 Voucher Redemption System</h2>
        <p className="text-gray-600">
          For Hong Kong Tourism Board staff to validate and redeem physical coin souvenir vouchers.
        </p>
      </div>

      {/* Voucher Input */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enter Voucher Code</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="voucher-code" className="block text-sm font-medium text-gray-700 mb-2">
              Voucher Code
            </label>
            <input
              type="text"
              id="voucher-code"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="SC-A1B2C3D4E5F6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the voucher code from the tourist's mobile app or printed voucher
            </p>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleRedeem}
              disabled={loading || !voucherCode.trim()}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Validating...' : 'Validate Voucher'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`p-6 rounded-lg shadow ${
          result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {result.success ? (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className={`text-lg font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Valid Voucher' : 'Invalid Voucher'}
              </h3>
              <p className={`mt-1 ${
                result.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {result.message}
              </p>

              {result.success && result.voucher && (
                <div className="mt-4 space-y-3">
                  <div className="bg-white p-4 rounded-lg border">
                    <h4 className="font-medium text-gray-900 mb-3">Tourist Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Name:</span>
                        <p className="text-gray-900">{result.voucher.userName}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Origin:</span>
                        <p className="text-gray-900">{result.voucher.userOrigin}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Days Completed:</span>
                        <p className="text-gray-900">{result.voucher.daysCompleted} days</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Generated:</span>
                        <p className="text-gray-900">
                          {new Date(result.voucher.generatedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Expires:</span>
                        <p className="text-gray-900">
                          {new Date(result.voucher.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-600">Status:</span>
                        <p className={`font-medium ${
                          result.voucher.isRedeemed ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {result.voucher.isRedeemed ? 'Already Redeemed' : 'Ready for Redemption'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!result.voucher.isRedeemed && (
                    <div className="bg-green-100 p-4 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">✅ Redemption Instructions</h4>
                      <ol className="text-sm text-green-700 space-y-1">
                        <li>1. Verify tourist's passport matches the name above</li>
                        <li>2. Check that the tourist has the SmileCoin mobile app</li>
                        <li>3. Give the tourist their physical SmileCoin souvenir</li>
                        <li>4. Mark this voucher as redeemed in the system</li>
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Demo Voucher Codes */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Demo Voucher Codes</h3>
        <p className="text-gray-600 mb-4">
          For testing purposes, you can use these demo voucher codes:
        </p>
        <div className="space-y-2">
          {[
            'SC-A1B2C3D4E5F6',
            'SC-X9Y8Z7W6V5U4',
            'SC-M1N2O3P4Q5R6'
          ].map((code) => (
            <button
              key={code}
              onClick={() => setVoucherCode(code)}
              className="block w-full text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded border font-mono text-sm transition-colors"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Staff Instructions</h3>
        <div className="space-y-3 text-blue-800">
          <div>
            <h4 className="font-medium">Voucher Validation Process:</h4>
            <ol className="list-decimal list-inside text-sm mt-1 space-y-1">
              <li>Tourist presents voucher (digital or printed)</li>
              <li>Enter voucher code in the system above</li>
              <li>Verify tourist's identity with passport</li>
              <li>Confirm tourist has completed 7 days of coin giving</li>
              <li>Issue physical SmileCoin souvenir</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium">Physical Souvenir Details:</h4>
            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
              <li>Commemorative coin featuring Hong Kong landmarks</li>
              <li>SmileCoin logo and tourist rewards branding</li>
              <li>Unique serial number for authenticity</li>
              <li>Presentation box with certificate</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherRedemption;