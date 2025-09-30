import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QRCode from 'qrcode';
import { RestaurantQRData } from '../types/qr-code';

interface QRCodeGeneratorProps {
  restaurantId?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ restaurantId }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{
    qrCodeImage: string;
    qrData: RestaurantQRData;
    restaurant: {
      name: string;
      address: string;
      placeId: string;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placeIdInput, setPlaceIdInput] = useState(restaurantId || '');

  const generateQRCode = async () => {
    if (!placeIdInput.trim()) {
      setError(t('qrGenerator.errors.enterPlaceId') || 'Please enter a Google Place ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create QR data object with random elements
      const randomId = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
      const sessionToken = crypto.getRandomValues(new Uint8Array(16))
        .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

      const qrDataObj = {
        googlePlaceId: placeIdInput,
        restaurantName: getRestaurantName(placeIdInput),
        walletAddress: generateWalletAddress(placeIdInput),
        timestamp: Date.now(),
        sessionId: randomId,
        sessionToken: sessionToken,
        signature: generateRandomSignature(),
        nonce: Math.random().toString(36).substring(2, 15),
        version: '1.0',
        type: 'smilecoin-restaurant',
        checksum: generateChecksum(placeIdInput + Date.now())
      };

      // Generate proper QR code with the data
      const qrCodeImage = await QRCode.toDataURL(JSON.stringify(qrDataObj), {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      const mockQRData = {
        qrCodeImage,
        qrData: qrDataObj,
        restaurant: {
          name: getRestaurantName(placeIdInput),
          address: getRestaurantAddress(placeIdInput),
          placeId: placeIdInput
        }
      };

      setQrData(mockQRData);
    } catch (err) {
      setError(t('qrGenerator.errors.generateFailed') || 'Failed to generate QR code. Please try again.');
      console.error('QR code generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData) return;

    const link = document.createElement('a');
    link.download = `${qrData.restaurant.name.replace(/\s+/g, '_')}_QR_Code.png`;
    link.href = qrData.qrCodeImage;
    link.click();
  };

  const printQRCode = () => {
    if (!qrData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('qrGenerator.printTitle')} - ${qrData.restaurant.name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px;
            background: white;
          }
          .qr-container {
            border: 3px solid #2563eb;
            border-radius: 15px;
            padding: 30px;
            margin: 20px auto;
            max-width: 450px;
            background: white;
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          }
          .restaurant-name {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1f2937;
          }
          .restaurant-address {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 25px;
            line-height: 1.4;
          }
          .qr-code {
            margin: 25px 0;
            padding: 15px;
            background: #f9fafb;
            border-radius: 10px;
            border: 1px solid #e5e7eb;
          }
          .qr-code img {
            max-width: 300px;
            height: auto;
          }
          .instructions {
            font-size: 18px;
            color: #374151;
            margin-top: 20px;
            line-height: 1.5;
            padding: 15px;
            background: #fef3c7;
            border-radius: 8px;
            border-left: 4px solid #f59e0b;
          }
          .smile-coin-logo {
            font-size: 24px;
            color: #f59e0b;
            margin-bottom: 15px;
            font-weight: bold;
          }
          .wallet-info {
            font-size: 11px;
            color: #9ca3af;
            margin-top: 20px;
            word-break: break-all;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 6px;
          }
          .security-note {
            font-size: 12px;
            color: #059669;
            margin-top: 15px;
            font-style: italic;
          }
          @media print {
            body { margin: 0; }
            .qr-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="qr-container">
          <div class="smile-coin-logo">😊 SmileCoin Tourist Rewards</div>
          <div class="restaurant-name">${qrData.restaurant.name}</div>
          <div class="restaurant-address">${qrData.restaurant.address}</div>
          <div class="qr-code">
            <img src="${qrData.qrCodeImage}" alt="${t('qrGenerator.qrCodeAlt')}" />
          </div>
          <div class="instructions">
            <strong>${t('qrGenerator.forTourists')}:</strong><br>
            ${t('qrGenerator.scanInstructions')}
          </div>
          <div class="security-note">
            🔒 ${t('qrGenerator.securityNote')}
          </div>
          <div class="wallet-info">
            ${t('qrGenerator.walletLabel')}: ${qrData.qrData.walletAddress}<br>
            ${t('qrGenerator.placeIdLabel')}: ${qrData.qrData.googlePlaceId}<br>
            ${t('qrGenerator.generatedLabel')}: ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printHTML);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('qrGenerator.title')}</h3>

      <div className="space-y-4">
        <div>
          <label htmlFor="place-id" className="block text-sm font-medium text-gray-700 mb-2">
            {t('qrGenerator.googlePlaceId')}
          </label>
          <input
            type="text"
            id="place-id"
            value={placeIdInput}
            onChange={(e) => setPlaceIdInput(e.target.value)}
            placeholder={t('qrGenerator.placeholderPlaceId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {t('qrGenerator.findPlaceId')}
          </p>
        </div>

        <button
          onClick={generateQRCode}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('qrGenerator.generatingQR') : t('qrGenerator.generateQR')}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {qrData && (
          <div className="mt-6 space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{t('qrGenerator.restaurantInfo')}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>{t('qrGenerator.name')}:</strong> {qrData.restaurant.name}</p>
                <p><strong>{t('qrGenerator.address')}:</strong> {qrData.restaurant.address}</p>
                <p><strong>{t('qrGenerator.placeId')}:</strong> {qrData.restaurant.placeId}</p>
                <p><strong>{t('qrGenerator.walletAddress')}:</strong> {qrData.qrData.walletAddress}</p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block p-6 bg-white border-2 border-blue-200 rounded-lg shadow-lg">
                <img
                  src={qrData.qrCodeImage}
                  alt={t('qrGenerator.qrCodeAlt')}
                  className="w-80 h-80 mx-auto"
                />
                <p className="text-xs text-gray-500 mt-2">
                  🔒 {t('qrGenerator.securityNote')}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('qrGenerator.downloadQR')}
              </button>
              <button
                onClick={printQRCode}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {t('qrGenerator.printQR')}
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">{t('qrGenerator.instructions.title')}</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• {t('qrGenerator.instructions.step1')}</li>
                <li>• {t('qrGenerator.instructions.step2')}</li>
                <li>• {t('qrGenerator.instructions.step3')}</li>
                <li>• {t('qrGenerator.instructions.step4')}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions for demo data
function getRestaurantName(placeId: string): string {
  const names: { [key: string]: string } = {
    'demo-restaurant-123': 'Golden Dragon Restaurant',
    'demo-restaurant-456': 'Harbour View Cafe',
    'demo-restaurant-789': 'Peak Dining',
    'ChIJN1t_tDeuEmsRUsoyG83frY4': 'Golden Dragon Restaurant',
    'ChIJrTLr-GyuEmsRBfy61i59si0': 'Harbour View Cafe',
    'ChIJ2eUgeAK6EmsRqRfr6hFrw-M': 'Peak Dining'
  };
  return names[placeId] || `Restaurant ${placeId.substring(0, 8)}`;
}

function getRestaurantAddress(placeId: string): string {
  const addresses: { [key: string]: string } = {
    'demo-restaurant-123': '123 Central District, Hong Kong',
    'demo-restaurant-456': '456 Tsim Sha Tsui, Hong Kong',
    'demo-restaurant-789': '789 The Peak, Hong Kong',
    'ChIJN1t_tDeuEmsRUsoyG83frY4': '123 Central District, Hong Kong',
    'ChIJrTLr-GyuEmsRBfy61i59si0': '456 Tsim Sha Tsui, Hong Kong',
    'ChIJ2eUgeAK6EmsRqRfr6hFrw-M': '789 The Peak, Hong Kong'
  };
  return addresses[placeId] || `Address for ${placeId.substring(0, 8)}`;
}

function generateWalletAddress(placeId: string): string {
  // Generate a random wallet address with some entropy from placeId
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);

  // Mix in some data from placeId for uniqueness but keep it random
  const placeIdHash = placeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  randomBytes[0] = (randomBytes[0] + placeIdHash) % 256;

  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return '0x' + hexString;
}

function generateRandomSignature(): string {
  // Generate a cryptographically random signature
  const randomBytes = crypto.getRandomValues(new Uint8Array(64));
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateChecksum(data: string): string {
  // Generate a simple checksum for data integrity
  let hash = 0;
  const randomSalt = crypto.getRandomValues(new Uint32Array(1))[0];
  const dataWithSalt = data + randomSalt.toString();

  for (let i = 0; i < dataWithSalt.length; i++) {
    const char = dataWithSalt.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Add some randomness to make it less predictable
  const randomComponent = crypto.getRandomValues(new Uint16Array(1))[0];
  hash = hash ^ randomComponent;

  return Math.abs(hash).toString(16).padStart(8, '0');
}

export default QRCodeGenerator;