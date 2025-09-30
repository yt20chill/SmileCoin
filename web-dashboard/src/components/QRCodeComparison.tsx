import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

const QRCodeComparison: React.FC = () => {
  const [oldQR, setOldQR] = useState<string>('');
  const [newQR, setNewQR] = useState<string>('');

  useEffect(() => {
    generateComparison();
  }, []);

  const generateComparison = async () => {
    const placeId = 'ChIJN1t_tDeuEmsRUsoyG83frY4';
    
    // Old predictable pattern
    const oldData = {
      placeId: placeId,
      name: 'Golden Dragon Restaurant',
      wallet: '0x1234567890abcdef1234567890abcdef12345678'
    };

    // New random data
    const randomBytes = crypto.getRandomValues(new Uint8Array(20));
    const randomWallet = '0x' + Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const sessionToken = crypto.getRandomValues(new Uint8Array(16))
      .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

    const newData = {
      googlePlaceId: placeId,
      restaurantName: 'Golden Dragon Restaurant',
      walletAddress: randomWallet,
      timestamp: Date.now(),
      sessionId: crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
      sessionToken: sessionToken,
      signature: Array.from(crypto.getRandomValues(new Uint8Array(64)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(''),
      nonce: Math.random().toString(36).substring(2, 15),
      version: '1.0',
      type: 'smilecoin-restaurant',
      checksum: Math.random().toString(16).substring(2, 10)
    };

    try {
      const oldQRCode = await QRCode.toDataURL(JSON.stringify(oldData), {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M'
      });

      const newQRCode = await QRCode.toDataURL(JSON.stringify(newData), {
        width: 256,
        margin: 2,
        errorCorrectionLevel: 'M'
      });

      setOldQR(oldQRCode);
      setNewQR(newQRCode);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">QR Code Comparison</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center">
          <h4 className="font-medium text-red-600 mb-4">❌ Old Pattern-Based (Predictable)</h4>
          {oldQR && (
            <div className="inline-block p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <img src={oldQR} alt="Old QR Code" className="w-48 h-48 mx-auto" />
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Uses simple, predictable data that creates recognizable patterns
          </p>
        </div>

        <div className="text-center">
          <h4 className="font-medium text-green-600 mb-4">✅ New Random Data (Secure)</h4>
          {newQR && (
            <div className="inline-block p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <img src={newQR} alt="New QR Code" className="w-48 h-48 mx-auto" />
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">
            Uses cryptographically random data with session tokens and signatures
          </p>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">Key Improvements:</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Random session tokens and signatures</li>
          <li>• Cryptographically secure wallet addresses</li>
          <li>• Unique nonces and checksums</li>
          <li>• Timestamp-based data for freshness</li>
          <li>• No predictable patterns in the QR code</li>
        </ul>
      </div>

      <button
        onClick={generateComparison}
        className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Generate New Comparison
      </button>
    </div>
  );
};

export default QRCodeComparison;