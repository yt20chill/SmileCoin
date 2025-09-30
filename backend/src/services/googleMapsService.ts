import axios from 'axios';

export interface GooglePlaceDetails {
  placeId: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  priceLevel?: number;
  photos?: string[];
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  types: string[];
}

export interface NearbyRestaurant extends GooglePlaceDetails {
  distance?: number;
}

export class GoogleMapsService {
  private static readonly API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'demo-api-key';
  private static readonly BASE_URL = 'https://maps.googleapis.com/maps/api/place';

  /**
   * Search for nearby restaurants using GPS coordinates
   */
  static async getNearbyRestaurants(
    lat: number, 
    lng: number, 
    radius: number = 1000
  ): Promise<NearbyRestaurant[]> {
    try {
      // For demo purposes, return mock data since we don't have a real API key
      if (this.API_KEY === 'demo-api-key') {
        return this.getMockNearbyRestaurants(lat, lng);
      }

      const response = await axios.get(`${this.BASE_URL}/nearbysearch/json`, {
        params: {
          location: `${lat},${lng}`,
          radius,
          type: 'restaurant',
          key: this.API_KEY
        }
      });

      const places = response.data.results || [];
      return places.map((place: any) => this.formatPlaceDetails(place));
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      // Return mock data as fallback
      return this.getMockNearbyRestaurants(lat, lng);
    }
  }

  /**
   * Get detailed information about a specific restaurant
   */
  static async getRestaurantDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    try {
      // For demo purposes, return mock data
      if (this.API_KEY === 'demo-api-key') {
        return this.getMockRestaurantDetails(placeId);
      }

      const response = await axios.get(`${this.BASE_URL}/details/json`, {
        params: {
          place_id: placeId,
          fields: 'place_id,name,formatted_address,geometry,rating,price_level,photos,formatted_phone_number,website,opening_hours,types',
          key: this.API_KEY
        }
      });

      const place = response.data.result;
      return place ? this.formatPlaceDetails(place) : null;
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
      return this.getMockRestaurantDetails(placeId);
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1000; // Return distance in meters
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static formatPlaceDetails(place: any): GooglePlaceDetails {
    return {
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity,
      location: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      rating: place.rating,
      priceLevel: place.price_level,
      photos: place.photos ? place.photos.map((photo: any) => 
        `${this.BASE_URL}/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.API_KEY}`
      ) : [],
      phoneNumber: place.formatted_phone_number,
      website: place.website,
      openingHours: place.opening_hours?.weekday_text,
      types: place.types || []
    };
  }

  /**
   * Mock data for demo purposes
   */
  private static getMockNearbyRestaurants(lat: number, lng: number): NearbyRestaurant[] {
    const mockRestaurants = [
      {
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Golden Dragon Restaurant',
        address: '123 Central District, Hong Kong',
        location: { lat: lat + 0.001, lng: lng + 0.001 },
        rating: 4.5,
        priceLevel: 2,
        photos: [],
        types: ['restaurant', 'food', 'establishment'],
        distance: 150
      },
      {
        placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
        name: 'Harbour View Cafe',
        address: '456 Tsim Sha Tsui, Hong Kong',
        location: { lat: lat + 0.002, lng: lng - 0.001 },
        rating: 4.2,
        priceLevel: 1,
        photos: [],
        types: ['restaurant', 'cafe', 'food'],
        distance: 280
      },
      {
        placeId: 'ChIJ2eUgeAK6EmsRqRfr6hFrw-M',
        name: 'Peak Dining',
        address: '789 The Peak, Hong Kong',
        location: { lat: lat - 0.001, lng: lng + 0.002 },
        rating: 4.8,
        priceLevel: 4,
        photos: [],
        types: ['restaurant', 'fine_dining', 'food'],
        distance: 420
      },
      {
        placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
        name: 'Dim Sum Palace',
        address: '321 Wan Chai, Hong Kong',
        location: { lat: lat - 0.002, lng: lng - 0.001 },
        rating: 4.3,
        priceLevel: 2,
        photos: [],
        types: ['restaurant', 'chinese_restaurant', 'food'],
        distance: 350
      },
      {
        placeId: 'ChIJd8BlQ2BZwokRAFUEcm_qrcA',
        name: 'Seafood Harbor',
        address: '654 Aberdeen, Hong Kong',
        location: { lat: lat + 0.003, lng: lng + 0.002 },
        rating: 4.1,
        priceLevel: 3,
        photos: [],
        types: ['restaurant', 'seafood_restaurant', 'food'],
        distance: 520
      }
    ];

    return mockRestaurants;
  }

  private static getMockRestaurantDetails(placeId: string): GooglePlaceDetails | null {
    const mockDetails: { [key: string]: GooglePlaceDetails } = {
      'ChIJN1t_tDeuEmsRUsoyG83frY4': {
        placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        name: 'Golden Dragon Restaurant',
        address: '123 Central District, Hong Kong',
        location: { lat: 22.2819, lng: 114.1577 },
        rating: 4.5,
        priceLevel: 2,
        photos: [],
        phoneNumber: '+852 2234 5678',
        website: 'https://goldendragon.hk',
        openingHours: [
          'Monday: 11:00 AM – 10:00 PM',
          'Tuesday: 11:00 AM – 10:00 PM',
          'Wednesday: 11:00 AM – 10:00 PM',
          'Thursday: 11:00 AM – 10:00 PM',
          'Friday: 11:00 AM – 11:00 PM',
          'Saturday: 11:00 AM – 11:00 PM',
          'Sunday: 11:00 AM – 10:00 PM'
        ],
        types: ['restaurant', 'food', 'establishment']
      },
      'ChIJrTLr-GyuEmsRBfy61i59si0': {
        placeId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
        name: 'Harbour View Cafe',
        address: '456 Tsim Sha Tsui, Hong Kong',
        location: { lat: 22.2944, lng: 114.1722 },
        rating: 4.2,
        priceLevel: 1,
        photos: [],
        phoneNumber: '+852 2345 6789',
        website: 'https://harbourview.hk',
        openingHours: [
          'Monday: 7:00 AM – 9:00 PM',
          'Tuesday: 7:00 AM – 9:00 PM',
          'Wednesday: 7:00 AM – 9:00 PM',
          'Thursday: 7:00 AM – 9:00 PM',
          'Friday: 7:00 AM – 10:00 PM',
          'Saturday: 8:00 AM – 10:00 PM',
          'Sunday: 8:00 AM – 9:00 PM'
        ],
        types: ['restaurant', 'cafe', 'food']
      },
      'ChIJ2eUgeAK6EmsRqRfr6hFrw-M': {
        placeId: 'ChIJ2eUgeAK6EmsRqRfr6hFrw-M',
        name: 'Peak Dining',
        address: '789 The Peak, Hong Kong',
        location: { lat: 22.2707, lng: 114.1499 },
        rating: 4.8,
        priceLevel: 4,
        photos: [],
        phoneNumber: '+852 2456 7890',
        website: 'https://peakdining.hk',
        openingHours: [
          'Monday: 6:00 PM – 11:00 PM',
          'Tuesday: 6:00 PM – 11:00 PM',
          'Wednesday: 6:00 PM – 11:00 PM',
          'Thursday: 6:00 PM – 11:00 PM',
          'Friday: 6:00 PM – 12:00 AM',
          'Saturday: 6:00 PM – 12:00 AM',
          'Sunday: 6:00 PM – 11:00 PM'
        ],
        types: ['restaurant', 'fine_dining', 'food']
      }
    };

    return mockDetails[placeId] || null;
  }
}