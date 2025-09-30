export interface RestaurantQRData {
  googlePlaceId: string;
  restaurantName: string;
  walletAddress: string;
  timestamp: number;
  signature: string;
}

export interface QRCodeResponse {
  qrCodeImage: string;
  qrData: RestaurantQRData;
  restaurant: {
    name: string;
    address: string;
    placeId: string;
  };
}