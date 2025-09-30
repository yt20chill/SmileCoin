// Type definitions for the mobile app

export interface User {
  id: string;
  email: string;
  name: string;
  originCountry: string;
  arrivalDate: Date;
  departureDate: Date;
  walletAddress: string;
}

export interface Restaurant {
  id: string;
  googlePlaceId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  totalCoinsReceived: number;
  distance?: number;
}

export interface Transaction {
  id: string;
  blockchainHash: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  transactionDate: Date;
  restaurantName: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}