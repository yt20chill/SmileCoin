import React, { useState } from 'react';
import { RestaurantQRData } from '../types/qr-code';

interface QRCodeGeneratorProps {
  restaurantId?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ restaurantId }) => {
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
      setError('Please enter a Google Place ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For demo purposes, we'll generate mock QR code data
      // In production, this would call the backend API
      const mockQRData = {
        qrCodeImage: await generateMockQRCode(placeIdInput),
        qrData: {
          googlePlaceId: placeIdInput,
          restaurantName: getRestaurantName(placeIdInput),
          walletAddress: generateWalletAddress(placeIdInput),
          timestamp: Date.now(),
          signature: 'mock-signature-' + Date.now()
        },
        restaurant: {
          name: getRestaurantName(placeIdInput),
          address: getRestaurantAddress(placeIdInput),
          placeId: placeIdInput
        }
      };

      setQrData(mockQRData);
    } catch (err) {
      setError('Failed to generate QR code. Please try again.');
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
        <title>Restaurant QR Code - ${qrData.restaurant.name}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px;
            background: white;
          }
          .qr-container {
            border: 2px solid #333;
            border-radius: 10px;
            padding: 20px;
            margin: 20px auto;
            max-width: 400px;
            background: white;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .restaurant-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
          }
          .restaurant-address {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
          }
          .qr-code {
            margin: 20px 0;
          }
          .instructions {
            font-size: 16px;
            color: #444;
            margin-top: 15px;
            line-height: 1.4;
          }
          .smile-coin-logo {
            font-size: 20px;
            color: #f59e0b;
            margin-bottom: 10px;
          }
          .wallet-info {
            font-size: 10px;
            color: #888;
            margin-top: 15px;
            word-break: break-all;
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
            <img src="${qrData.qrCodeImage}" alt="Restaurant QR Code" />
          </div>
          <div class="instructions">
            <strong>For Tourists:</strong><br>
            Scan this QR code with the SmileCoin app to give smile coins to this restaurant!
          </div>
          <div class="wallet-info">
            Wallet: ${qrData.qrData.walletAddress}<br>
            Place ID: ${qrData.qrData.googlePlaceId}
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
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate Restaurant QR Code</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="place-id" className="block text-sm font-medium text-gray-700 mb-2">
            Google Place ID
          </label>
          <input
            type="text"
            id="place-id"
            value={placeIdInput}
            onChange={(e) => setPlaceIdInput(e.target.value)}
            placeholder="Enter Google Place ID (e.g., ChIJN1t_tDeuEmsRUsoyG83frY4)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            You can find your Google Place ID using the Google Place ID Finder tool
          </p>
        </div>

        <button
          onClick={generateQRCode}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Generating QR Code...' : 'Generate QR Code'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {qrData && (
          <div className="mt-6 space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Restaurant Information</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {qrData.restaurant.name}</p>
                <p><strong>Address:</strong> {qrData.restaurant.address}</p>
                <p><strong>Place ID:</strong> {qrData.restaurant.placeId}</p>
                <p><strong>Wallet Address:</strong> {qrData.qrData.walletAddress}</p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block p-4 bg-white border-2 border-gray-300 rounded-lg">
                <img 
                  src={qrData.qrCodeImage} 
                  alt="Restaurant QR Code" 
                  className="w-64 h-64 mx-auto"
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={downloadQRCode}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Download QR Code
              </button>
              <button
                onClick={printQRCode}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Print QR Code
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-medium text-yellow-800 mb-2">Instructions for Restaurant</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Print the QR code and place it prominently in your restaurant</li>
                <li>• Tourists will scan this code to give you smile coins</li>
                <li>• Each tourist can give 1-3 coins per day to your restaurant</li>
                <li>• Check your dashboard to see coins received and rankings</li>
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
  // Generate a deterministic wallet address based on Place ID
  let hash = 0;
  for (let i = 0; i < placeId.length; i++) {
    const char = placeId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  return '0x' + hexHash.repeat(5).substring(0, 40);
}

async function generateMockQRCode(placeId: string): Promise<string> {
  // Generate a simple QR code using canvas (for demo purposes)
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  canvas.width = 256;
  canvas.height = 256;

  // Fill with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 256, 256);

  // Draw a simple pattern representing QR code
  ctx.fillStyle = 'black';
  const blockSize = 8;
  const pattern = placeId.split('').map(char => char.charCodeAt(0) % 2);
  
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const index = (y * 32 + x) % pattern.length;
      if (pattern[index]) {
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      }
    }
  }

  // Add corner markers (typical QR code feature)
  const markerSize = 7 * blockSize;
  const positions = [[0, 0], [25 * blockSize, 0], [0, 25 * blockSize]];
  
  positions.forEach(([x, y]) => {
    // Outer square
    ctx.fillRect(x, y, markerSize, markerSize);
    // Inner white square
    ctx.fillStyle = 'white';
    ctx.fillRect(x + blockSize, y + blockSize, markerSize - 2 * blockSize, markerSize - 2 * blockSize);
    // Inner black square
    ctx.fillStyle = 'black';
    ctx.fillRect(x + 2 * blockSize, y + 2 * blockSize, markerSize - 4 * blockSize, markerSize - 4 * blockSize);
  });

  return canvas.toDataURL('image/png');
}

export default QRCodeGenerator;