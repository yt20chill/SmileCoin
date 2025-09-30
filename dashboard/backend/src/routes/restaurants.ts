import express from 'express';
import { protect } from '../middleware/auth';
import { GoogleMapsService } from '../services/googleMapsService';
import { QRCodeService } from '../services/qrCodeService';
const router = express.Router();

// @desc    Get nearby restaurants
// @route   GET /api/restaurants/nearby
// @access  Private
router.get('/nearby', protect, async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const searchRadius = radius ? parseInt(radius as string) : 1000;

    const restaurants = await GoogleMapsService.getNearbyRestaurants(latitude, longitude, searchRadius);
    
    res.status(200).json({
      success: true,
      data: restaurants,
      count: restaurants.length
    });
  } catch (error) {
    console.error('Error fetching nearby restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby restaurants'
    });
  }
});

// @desc    Get restaurant details
// @route   GET /api/restaurants/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await GoogleMapsService.getRestaurantDetails(id);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error fetching restaurant details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant details'
    });
  }
});

// @desc    Get global restaurant rankings
// @route   GET /api/restaurants/rankings/global
// @access  Private
router.get('/rankings/global', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Global restaurant rankings endpoint - to be implemented'
  });
});

// @desc    Get origin-based restaurant recommendations
// @route   GET /api/restaurants/rankings/origin
// @access  Private
router.get('/rankings/origin', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Origin-based restaurant recommendations endpoint - to be implemented'
  });
});

// @desc    Give coins to restaurant
// @route   POST /api/restaurants/:id/coins
// @access  Private
router.post('/:id/coins', protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Give coins to restaurant endpoint - to be implemented'
  });
});

// Restaurant Dashboard Endpoints

// @desc    Get restaurant dashboard stats
// @route   GET /api/restaurants/:id/dashboard/stats
// @access  Private
router.get('/:id/dashboard/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant dashboard stats endpoint - to be implemented'
  });
});

// @desc    Get restaurant tourist origins
// @route   GET /api/restaurants/:id/dashboard/origins
// @access  Private
router.get('/:id/dashboard/origins', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant tourist origins endpoint - to be implemented'
  });
});

// @desc    Get restaurant performance trends
// @route   GET /api/restaurants/:id/dashboard/trends
// @access  Private
router.get('/:id/dashboard/trends', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant performance trends endpoint - to be implemented'
  });
});

// QR Code Management Endpoints

// @desc    Generate QR code for restaurant
// @route   POST /api/restaurants/:id/qr-code
// @access  Public (restaurants need to access this)
router.post('/:id/qr-code', async (req, res) => {
  try {
    const { id: googlePlaceId } = req.params;
    
    // Get restaurant details from Google Maps
    const restaurant = await GoogleMapsService.getRestaurantDetails(googlePlaceId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Generate QR code data and image
    const qrData = QRCodeService.createQRData(googlePlaceId, restaurant.name);
    const qrCodeImage = await QRCodeService.generateQRCodeImage(qrData);

    res.status(200).json({
      success: true,
      data: {
        qrData,
        qrCodeImage,
        restaurant: {
          name: restaurant.name,
          address: restaurant.address,
          placeId: googlePlaceId
        }
      }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate QR code'
    });
  }
});

// @desc    Generate printable QR code for restaurant
// @route   GET /api/restaurants/:id/qr-code/printable
// @access  Public
router.get('/:id/qr-code/printable', async (req, res) => {
  try {
    const { id: googlePlaceId } = req.params;
    
    // Get restaurant details from Google Maps
    const restaurant = await GoogleMapsService.getRestaurantDetails(googlePlaceId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Generate printable QR code
    const printableQR = await QRCodeService.generatePrintableQRCode(
      googlePlaceId, 
      restaurant.name, 
      restaurant.address
    );

    // Return HTML for printing
    res.setHeader('Content-Type', 'text/html');
    res.send(printableQR.printableHTML);
  } catch (error) {
    console.error('Error generating printable QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate printable QR code'
    });
  }
});

// @desc    Validate QR code data
// @route   POST /api/restaurants/qr-code/validate
// @access  Private
router.post('/qr-code/validate', protect, (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({
        success: false,
        message: 'QR data is required'
      });
    }

    const isValid = QRCodeService.validateQRData(qrData);
    
    res.status(200).json({
      success: true,
      data: {
        isValid,
        qrData: isValid ? qrData : null
      }
    });
  } catch (error) {
    console.error('Error validating QR code:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate QR code'
    });
  }
});

// @desc    Get restaurant wallet address
// @route   GET /api/restaurants/:id/wallet
// @access  Public
router.get('/:id/wallet', async (req, res) => {
  try {
    const { id: googlePlaceId } = req.params;
    
    // Get restaurant details to verify it exists
    const restaurant = await GoogleMapsService.getRestaurantDetails(googlePlaceId);
    
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const walletAddress = QRCodeService.generateWalletAddress(googlePlaceId);
    
    res.status(200).json({
      success: true,
      data: {
        googlePlaceId,
        restaurantName: restaurant.name,
        walletAddress
      }
    });
  } catch (error) {
    console.error('Error getting restaurant wallet:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get restaurant wallet'
    });
  }
});

export default router;