export interface RestaurantQRData {
  googlePlaceId: string;
  restaurantName: string;
  walletAddress: string;
  timestamp: number;
  signature?: string;
}

export interface QRCodeGenerationResult {
  qrCodeImage: string;
  qrData: RestaurantQRData;
  printableHTML: string;
}

export interface RestaurantInfo {
  placeId: string;
  name: string;
  address: string;
  walletAddress: string;
}