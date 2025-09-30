# Restaurant QR Code System

A comprehensive QR code generation and management system for restaurants in the Tourist Rewards System.

## Overview

The QR code system enables restaurants to generate unique, secure QR codes that tourists can scan to give smile coins. Each QR code contains encrypted restaurant information and blockchain wallet details.

## Features

### 🏷️ **QR Code Generation**
- **Unique QR Codes**: Each restaurant gets a unique QR code based on their Google Place ID
- **Blockchain Integration**: QR codes contain restaurant's blockchain wallet address
- **Security Signatures**: Cryptographic signatures prevent tampering
- **Time-based Validation**: QR codes have expiration timestamps for security

### 🗺️ **Google Maps Integration**
- **Place ID Lookup**: Fetch restaurant details using Google Place ID
- **Nearby Search**: Find restaurants within specified radius
- **Location Services**: GPS-based restaurant discovery
- **Restaurant Validation**: Verify restaurant exists in Google Maps

### 🔐 **Security Features**
- **HMAC Signatures**: Prevent QR code tampering
- **Time Expiration**: QR codes expire after 24 hours
- **Wallet Address Generation**: Deterministic wallet addresses based on Place ID
- **Input Validation**: Comprehensive validation of all inputs

## API Endpoints

### Restaurant QR Code Management

#### Generate QR Code
```http
POST /api/restaurants/:id/qr-code
```
Generates a QR code for a restaurant.

**Parameters:**
- `id` (path): Google Place ID of the restaurant

**Response:**
```json
{
  "success": true,
  "data": {
    "qrData": {
      "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
      "restaurantName": "Golden Dragon Restaurant",
      "walletAddress": "0x1234567890abcdef...",
      "timestamp": 1640995200000,
      "signature": "abc123..."
    },
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "restaurant": {
      "name": "Golden Dragon Restaurant",
      "address": "123 Central District, Hong Kong",
      "placeId": "ChIJN1t_tDeuEmsRUsoyG83frY4"
    }
  }
}
```

#### Get Printable QR Code
```http
GET /api/restaurants/:id/qr-code/printable
```
Returns HTML page with printable QR code.

**Parameters:**
- `id` (path): Google Place ID of the restaurant

**Response:** HTML page ready for printing

#### Validate QR Code
```http
POST /api/restaurants/qr-code/validate
```
Validates QR code data for security.

**Body:**
```json
{
  "qrData": {
    "googlePlaceId": "ChIJN1t_tDeuEmsRUsoyG83frY4",
    "restaurantName": "Golden Dragon Restaurant",
    "walletAddress": "0x1234567890abcdef...",
    "timestamp": 1640995200000,
    "signature": "abc123..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "qrData": { ... }
  }
}
```

#### Get Restaurant Wallet
```http
GET /api/restaurants/:id/wallet
```
Gets the blockchain wallet address for a restaurant.

### Google Maps Integration

#### Get Nearby Restaurants
```http
GET /api/restaurants/nearby?lat=22.3193&lng=114.1694&radius=1000
```
Find restaurants near specified coordinates.

**Query Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in meters (default: 1000)

#### Get Restaurant Details
```http
GET /api/restaurants/:id
```
Get detailed information about a specific restaurant.

## QR Code Data Structure

Each QR code contains the following JSON data:

```typescript
interface RestaurantQRData {
  googlePlaceId: string;      // Google Maps Place ID
  restaurantName: string;     // Restaurant name
  walletAddress: string;      // Blockchain wallet address
  timestamp: number;          // Generation timestamp
  signature?: string;         // Security signature
}
```

## Security Implementation

### Wallet Address Generation
```typescript
// Deterministic wallet generation based on Place ID
static generateWalletAddress(googlePlaceId: string): string {
  const hash = crypto.createHash('sha256').update(googlePlaceId).digest('hex');
  return '0x' + hash.substring(0, 40); // Ethereum-style address
}
```

### Signature Generation
```typescript
// HMAC signature for tamper protection
const secret = process.env.QR_SECRET || 'demo-secret-key';
const dataToSign = `${googlePlaceId}:${walletAddress}:${timestamp}`;
const signature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex');
```

### Validation Rules
- ✅ All required fields present
- ✅ Valid signature verification
- ✅ QR code not expired (< 24 hours old)
- ✅ Google Place ID format validation

## Web Dashboard Integration

The system includes a web interface for restaurants to:

### QR Code Generator Page
- **Restaurant Selection**: Choose from demo restaurants or enter Place ID
- **QR Code Generation**: Generate secure QR codes instantly
- **Download Options**: Download PNG image or print-ready HTML
- **Security Information**: Display wallet address and validation details

### Features
- **Real-time Generation**: Instant QR code creation
- **Print-ready Format**: Professional printable layout
- **Security Validation**: Visual confirmation of QR code security
- **Demo Mode**: Test with sample restaurants

## Installation & Setup

### Backend Dependencies
```bash
npm install qrcode @types/qrcode axios crypto
```

### Environment Variables
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
QR_SECRET=your_secret_key_for_signatures
```

### File Structure
```
backend/src/
├── services/
│   ├── qrCodeService.ts      # QR code generation and validation
│   └── googleMapsService.ts  # Google Maps API integration
├── routes/
│   └── restaurants.ts        # Restaurant and QR code endpoints
└── test-qr-code.js          # Test script
```

## Testing

Run the test script to verify functionality:

```bash
cd backend
node src/test-qr-code.js
```

**Test Coverage:**
- ✅ QR data generation
- ✅ QR data validation  
- ✅ Wallet address generation
- ✅ QR code image generation
- ✅ Printable QR code generation
- ✅ Google Maps integration

## Usage Flow

### For Restaurants

1. **Get Google Place ID**
   - Use Google Place ID Finder tool
   - Or get it from Google My Business

2. **Generate QR Code**
   - Visit web dashboard QR generator
   - Enter Google Place ID
   - Generate and download QR code

3. **Print and Display**
   - Print the QR code using provided template
   - Place prominently in restaurant
   - Ensure good lighting for scanning

### For Tourists (Mobile App)

1. **Scan QR Code**
   - Open SmileCoin mobile app
   - Use QR scanner feature
   - Point camera at restaurant QR code

2. **Validate and Give Coins**
   - App validates QR code security
   - Select 1-3 coins to give
   - Confirm blockchain transaction

3. **Transaction Complete**
   - Coins transferred to restaurant wallet
   - Transaction recorded on blockchain
   - Restaurant ranking updated

## Mock Data

For demo purposes, the system includes mock data for:

- **Demo Restaurants**: 5 sample Hong Kong restaurants
- **Google Maps Responses**: Realistic restaurant data
- **QR Code Generation**: Functional QR codes with proper validation

## Production Considerations

### Security
- Use strong secret keys for HMAC signatures
- Implement rate limiting on QR generation
- Add additional validation layers
- Monitor for suspicious activity

### Performance
- Cache Google Maps API responses
- Optimize QR code image generation
- Implement CDN for QR code images
- Add database caching layer

### Scalability
- Database storage for generated QR codes
- Batch QR code generation for chains
- API rate limiting and throttling
- Monitoring and analytics

## Integration Points

### Blockchain System
- QR codes contain wallet addresses for transactions
- Validation ensures legitimate restaurants
- Transaction history tracking

### Mobile App
- QR scanner validates codes before transactions
- Security checks prevent fraud
- Real-time transaction processing

### Analytics Dashboard
- Track QR code usage statistics
- Monitor restaurant performance
- Generate insights and reports

This QR code system provides a secure, scalable foundation for the Tourist Rewards System's restaurant-tourist interaction mechanism.