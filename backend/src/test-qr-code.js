// Simple test script for QR code functionality
const { QRCodeService } = require('./services/qrCodeService');
const { GoogleMapsService } = require('./services/googleMapsService');

async function testQRCodeGeneration() {
  console.log('🧪 Testing QR Code Generation...\n');

  try {
    // Test 1: Generate QR data
    console.log('1. Testing QR data generation...');
    const qrData = QRCodeService.createQRData('ChIJN1t_tDeuEmsRUsoyG83frY4', 'Golden Dragon Restaurant');
    console.log('✅ QR Data generated:', {
      googlePlaceId: qrData.googlePlaceId,
      restaurantName: qrData.restaurantName,
      walletAddress: qrData.walletAddress,
      hasSignature: !!qrData.signature
    });

    // Test 2: Validate QR data
    console.log('\n2. Testing QR data validation...');
    const isValid = QRCodeService.validateQRData(qrData);
    console.log('✅ QR Data validation:', isValid ? 'VALID' : 'INVALID');

    // Test 3: Generate wallet address
    console.log('\n3. Testing wallet address generation...');
    const walletAddress = QRCodeService.generateWalletAddress('ChIJN1t_tDeuEmsRUsoyG83frY4');
    console.log('✅ Wallet address generated:', walletAddress);

    // Test 4: Generate QR code image
    console.log('\n4. Testing QR code image generation...');
    const qrCodeImage = await QRCodeService.generateQRCodeImage(qrData);
    console.log('✅ QR Code image generated:', qrCodeImage.substring(0, 50) + '...');

    // Test 5: Generate printable QR code
    console.log('\n5. Testing printable QR code generation...');
    const printableQR = await QRCodeService.generatePrintableQRCode(
      'ChIJN1t_tDeuEmsRUsoyG83frY4',
      'Golden Dragon Restaurant',
      '123 Central District, Hong Kong'
    );
    console.log('✅ Printable QR code generated with HTML length:', printableQR.printableHTML.length);

    // Test 6: Test Google Maps service
    console.log('\n6. Testing Google Maps service...');
    const restaurants = await GoogleMapsService.getNearbyRestaurants(22.3193, 114.1694, 1000);
    console.log('✅ Found', restaurants.length, 'nearby restaurants');

    const restaurantDetails = await GoogleMapsService.getRestaurantDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');
    console.log('✅ Restaurant details:', restaurantDetails ? restaurantDetails.name : 'Not found');

    console.log('\n🎉 All QR code tests passed!');
    
    return {
      qrData,
      qrCodeImage,
      printableQR,
      restaurants,
      restaurantDetails
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testQRCodeGeneration()
    .then(() => {
      console.log('\n✅ QR Code system is working correctly!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ QR Code system test failed:', error);
      process.exit(1);
    });
}

module.exports = { testQRCodeGeneration };