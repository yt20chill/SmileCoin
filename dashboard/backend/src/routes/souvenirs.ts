import express from 'express';
import { protect } from '../middleware/auth';
import { PhysicalCoinService } from '../services/physicalCoinService';
import QRCode from 'qrcode';

const router = express.Router();

// @desc    Get user's souvenir progress
// @route   GET /api/souvenirs/progress
// @access  Private
router.get('/progress', protect, async (req, res) => {
  try {
    // In production, get userId from authenticated user
    const userId = (req as any).user?.id || 'demo-user-123';
    
    const progress = await PhysicalCoinService.getSouvenirProgress(userId);
    
    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Error fetching souvenir progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch souvenir progress'
    });
  }
});

// @desc    Track daily coin activity
// @route   POST /api/souvenirs/daily-activity
// @access  Private
router.post('/daily-activity', protect, async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user-123';
    const { date, coinsReceived, coinsGiven, restaurantsVisited } = req.body;
    
    if (!date || coinsReceived === undefined || coinsGiven === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Date, coinsReceived, and coinsGiven are required'
      });
    }

    const dailyProgress = await PhysicalCoinService.trackDailyActivity(
      userId,
      date,
      coinsReceived,
      coinsGiven,
      restaurantsVisited || []
    );
    
    res.status(200).json({
      success: true,
      data: dailyProgress
    });
  } catch (error) {
    console.error('Error tracking daily activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track daily activity'
    });
  }
});

// @desc    Get daily coin distribution
// @route   POST /api/souvenirs/daily-coins
// @access  Private
router.post('/daily-coins', protect, async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user-123';
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const distribution = await PhysicalCoinService.getDailyCoinDistribution(userId, date);
    
    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Error getting daily coin distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily coin distribution'
    });
  }
});

// @desc    Generate souvenir voucher
// @route   POST /api/souvenirs/generate-voucher
// @access  Private
router.post('/generate-voucher', protect, async (req, res) => {
  try {
    const userId = (req as any).user?.id || 'demo-user-123';
    const { userName, userOrigin, daysCompleted } = req.body;
    
    if (!userName || !userOrigin || !daysCompleted) {
      return res.status(400).json({
        success: false,
        message: 'userName, userOrigin, and daysCompleted are required'
      });
    }

    const voucher = await PhysicalCoinService.generateSouvenirVoucher(
      userId,
      daysCompleted,
      userName,
      userOrigin
    );
    
    res.status(200).json({
      success: true,
      data: voucher
    });
  } catch (error) {
    console.error('Error generating souvenir voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate souvenir voucher'
    });
  }
});

// @desc    Redeem souvenir voucher
// @route   POST /api/souvenirs/redeem-voucher
// @access  Public (tourism office staff need access)
router.post('/redeem-voucher', async (req, res) => {
  try {
    const { voucherCode } = req.body;
    
    if (!voucherCode) {
      return res.status(400).json({
        success: false,
        message: 'Voucher code is required'
      });
    }

    const result = await PhysicalCoinService.redeemVoucher(voucherCode);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.voucher,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        data: result.voucher
      });
    }
  } catch (error) {
    console.error('Error redeeming voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem voucher'
    });
  }
});

// @desc    Get voucher QR code image
// @route   GET /api/souvenirs/voucher/:code/qr
// @access  Private
router.get('/voucher/:code/qr', protect, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Generate QR code for the voucher
    const qrCodeData = JSON.stringify({
      voucherCode: code,
      type: 'physical_coin_souvenir',
      timestamp: Date.now()
    });
    
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
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
    
    res.status(200).json({
      success: true,
      data: {
        qrCodeImage,
        qrCodeData,
        voucherCode: code
      }
    });
  } catch (error) {
    console.error('Error generating voucher QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate voucher QR code'
    });
  }
});

// @desc    Get printable voucher
// @route   GET /api/souvenirs/voucher/:code/printable
// @access  Private
router.get('/voucher/:code/printable', protect, async (req, res) => {
  try {
    const { code } = req.params;
    
    // Generate QR code for the voucher
    const qrCodeData = JSON.stringify({
      voucherCode: code,
      type: 'physical_coin_souvenir',
      timestamp: Date.now()
    });
    
    const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      width: 200
    });
    
    const printableHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmileCoin Souvenir Voucher - ${code}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 20px;
            background: white;
            margin: 0;
          }
          .voucher-container {
            border: 3px solid #f59e0b;
            border-radius: 15px;
            padding: 30px;
            margin: 20px auto;
            max-width: 500px;
            background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 100%);
            box-shadow: 0 8px 16px rgba(0,0,0,0.1);
          }
          .header {
            color: #92400e;
            margin-bottom: 20px;
          }
          .title {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 16px;
            margin-bottom: 20px;
          }
          .voucher-code {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            background: white;
            padding: 10px 20px;
            border-radius: 8px;
            margin: 20px 0;
            border: 2px dashed #f59e0b;
          }
          .qr-code {
            margin: 20px 0;
            background: white;
            padding: 15px;
            border-radius: 10px;
            display: inline-block;
          }
          .instructions {
            font-size: 14px;
            color: #374151;
            margin-top: 20px;
            line-height: 1.5;
            background: rgba(255,255,255,0.8);
            padding: 15px;
            border-radius: 8px;
          }
          .footer {
            font-size: 12px;
            color: #6b7280;
            margin-top: 20px;
          }
          .coin-emoji {
            font-size: 40px;
            margin: 10px 0;
          }
          @media print {
            body { margin: 0; }
            .voucher-container { 
              box-shadow: none; 
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="voucher-container">
          <div class="header">
            <div class="coin-emoji">🪙</div>
            <div class="title">SmileCoin Souvenir Voucher</div>
            <div class="subtitle">Physical Coin Collection Voucher</div>
          </div>
          
          <div class="voucher-code">${code}</div>
          
          <div class="qr-code">
            <img src="${qrCodeImage}" alt="Voucher QR Code" />
          </div>
          
          <div class="instructions">
            <strong>Congratulations!</strong><br>
            You have successfully completed 7 days of giving all your smile coins to restaurants!<br><br>
            
            <strong>To collect your physical SmileCoin souvenir:</strong><br>
            1. Visit the Hong Kong Tourism Board Office in Central<br>
            2. Present this voucher (printed or on mobile)<br>
            3. Show your passport for verification<br>
            4. Receive your commemorative physical SmileCoin!<br><br>
            
            <strong>Collection Location:</strong><br>
            Hong Kong Tourism Board Office<br>
            Central District, Hong Kong<br><br>
            
            <em>This voucher expires 30 days from generation date.</em>
          </div>
          
          <div class="footer">
            Generated: ${new Date().toLocaleDateString()}<br>
            SmileCoin Tourist Rewards System
          </div>
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(printableHTML);
  } catch (error) {
    console.error('Error generating printable voucher:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate printable voucher'
    });
  }
});

export default router;