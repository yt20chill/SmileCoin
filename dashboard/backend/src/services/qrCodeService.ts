import QRCode from 'qrcode';
import crypto from 'crypto';

export interface RestaurantQRData {
  googlePlaceId: string;
  restaurantName: string;
  walletAddress: string;
  timestamp: number;
  signature?: string;
}

export class QRCodeService {
  /**
   * Generate a unique wallet address for a restaurant
   * In production, this would integrate with actual blockchain wallet generation
   */
  static generateWalletAddress(googlePlaceId: string): string {
    // Generate a deterministic wallet address based on Google Place ID
    const hash = crypto.createHash('sha256').update(googlePlaceId).digest('hex');
    return '0x' + hash.substring(0, 40); // Ethereum-style address
  }

  /**
   * Create QR code data for a restaurant
   */
  static createQRData(googlePlaceId: string, restaurantName: string): RestaurantQRData {
    const walletAddress = this.generateWalletAddress(googlePlaceId);
    const timestamp = Date.now();
    
    const qrData: RestaurantQRData = {
      googlePlaceId,
      restaurantName,
      walletAddress,
      timestamp,
    };

    // Add signature for security (simple HMAC for demo)
    const secret = process.env.QR_SECRET || 'demo-secret-key';
    const dataToSign = `${googlePlaceId}:${walletAddress}:${timestamp}`;
    qrData.signature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');

    return qrData;
  }

  /**
   * Generate QR code image as base64 string
   */
  static async generateQRCodeImage(qrData: RestaurantQRData): Promise<string> {
    try {
      const qrString = JSON.stringify(qrData);
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256
      });
      
      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Validate QR code data
   */
  static validateQRData(qrData: RestaurantQRData): boolean {
    try {
      const { googlePlaceId, walletAddress, timestamp, signature } = qrData;
      
      // Check required fields
      if (!googlePlaceId || !walletAddress || !timestamp || !signature) {
        return false;
      }

      // Verify signature
      const secret = process.env.QR_SECRET || 'demo-secret-key';
      const dataToSign = `${googlePlaceId}:${walletAddress}:${timestamp}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
      
      if (signature !== expectedSignature) {
        return false;
      }

      // Check if QR code is not too old (24 hours for demo)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - timestamp > maxAge) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating QR data:', error);
      return false;
    }
  }

  /**
   * Generate printable QR code with restaurant info
   */
  static async generatePrintableQRCode(googlePlaceId: string, restaurantName: string, address: string): Promise<{
    qrCodeImage: string;
    qrData: RestaurantQRData;
    printableHTML: string;
  }> {
    const qrData = this.createQRData(googlePlaceId, restaurantName);
    const qrCodeImage = await this.generateQRCodeImage(qrData);
    
    const printableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Restaurant QR Code - ${restaurantName}</title>
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
          <div class="restaurant-name">${restaurantName}</div>
          <div class="restaurant-address">${address}</div>
          <div class="qr-code">
            <img src="${qrCodeImage}" alt="Restaurant QR Code" />
          </div>
          <div class="instructions">
            <strong>For Tourists:</strong><br>
            Scan this QR code with the SmileCoin app to give smile coins to this restaurant!
          </div>
          <div class="wallet-info">
            Wallet: ${qrData.walletAddress}<br>
            Place ID: ${googlePlaceId}
          </div>
        </div>
      </body>
      </html>
    `;

    return {
      qrCodeImage,
      qrData,
      printableHTML
    };
  }
}