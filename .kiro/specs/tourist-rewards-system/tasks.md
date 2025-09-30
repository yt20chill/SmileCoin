# Implementation Plan

- [x] 1. Project Setup and Infrastructure
  - Set up project structure with separate folders for mobile app, web dashboard, and backend
  - Configure Docker Compose for PostgreSQL and Redis containers
  - Initialize React Native project with NativeWind (Tailwind CSS)
  - Initialize React.js project for restaurant web dashboard with Tailwind CSS
  - Set up Node.js backend with Express.js and basic folder structure
  - _Requirements: All requirements depend on basic project setup_

- [ ] 2. Database Schema and Models
  - Create PostgreSQL database schema with users, restaurants, transactions, and daily_rewards tables
  - Create database migration files for all tables and indexes
  - Implement restaurant analytics view for dashboard queries
  - Set up database service layer with connection pooling
  - _Requirements: 1, 2, 3, 4, 5, 6, 7_

- [ ] 3. Backend API Core Authentication Implementation
  - Implement user registration endpoint with origin country and travel dates validation
  - Create JWT-based authentication with proper token generation and validation
  - Build login/logout endpoints with database integration
  - Add user profile management and session handling
  - _Requirements: 1_

- [ ] 4. Blockchain Smart Contract Development
  - Write Solidity smart contract for smile coin system with tourist and restaurant structs
  - Implement functions for tourist registration, daily coin distribution, and coin transfers
  - Add smart contract functions for coin expiration after 14 days
  - Deploy smart contract to local Ganache or testnet
  - Create contract interaction utilities for backend
  - _Requirements: 1, 2, 5, 6_

- [ ] 5. Restaurant Management and Google Maps Integration
  - Set up Google Maps Places API configuration and API keys
  - Implement nearby restaurants search using GPS coordinates with database caching
  - Create restaurant registration system using Google Place IDs
  - Generate unique QR codes for restaurants with Place ID and wallet address
  - Build restaurant data caching system with Redis
  - _Requirements: 3.1, 4_

- [ ] 6. Backend API Restaurant Endpoints Implementation
  - Implement nearby restaurants endpoint with Google Maps API integration
  - Create restaurant details fetching and caching
  - Build global restaurant rankings endpoint based on smile coins received
  - Implement origin-based restaurant recommendation system
  - Add restaurant dashboard statistics endpoints
  - _Requirements: 3, 3.1, 3.2, 7_

- [ ] 7. Blockchain Integration in Backend
  - Create wallet service for generating user and restaurant blockchain addresses
  - Implement daily coin distribution API endpoint with blockchain transactions
  - Build coin transfer endpoint that creates blockchain transactions
  - Add blockchain transaction verification and status checking
  - Create transaction history endpoints with blockchain data
  - _Requirements: 1, 2, 5, 6_

- [ ] 8. Mobile App Navigation and Core Structure
  - Set up React Navigation with bottom tabs for main pages
  - Create navigation structure for Dashboard, Nearby, Recommendations, Profile, QR Scanner
  - Implement basic screen components with proper routing
  - Add authentication flow and protected routes
  - _Requirements: All mobile app requirements_

- [ ] 9. Mobile App Authentication and Profile
  - Build user registration screen with origin country and travel date inputs
  - Create login/logout screens with JWT token storage using AsyncStorage
  - Implement user profile screen showing coin balance and blockchain transaction history
  - Add physical coin souvenir progress tracking display
  - Connect authentication to backend API endpoints
  - _Requirements: 1, 6_

- [ ] 10. Mobile App Dashboard Page
  - Create dashboard screen showing overall restaurant rankings by total smile coins
  - Display restaurant names, coin totals, and ranking positions
  - Implement manual refresh functionality to update rankings
  - Add mock tourist coupons and attraction information section
  - Connect to backend restaurant rankings API
  - _Requirements: 3_

- [ ] 11. Mobile App Nearby Restaurants Page
  - Build GPS location service integration with permissions
  - Create nearby restaurants list using backend API
  - Display restaurant names, distances, and current smile coin totals
  - Add restaurant detail view with Google Maps information and directions
  - Implement location permission handling and error states
  - _Requirements: 3.1_

- [ ] 12. Mobile App Recommendations Page
  - Create origin-based restaurant recommendations using user's country
  - Display restaurants ranked by smile coins from same-origin tourists
  - Show distance and popularity information for recommended restaurants
  - Add fallback to general popular restaurants when no origin data exists
  - Connect to backend origin-based recommendations API
  - _Requirements: 3.2_

- [ ] 13. Mobile App QR Code Scanner
  - Implement QR code scanner screen using React Native QR Code Scanner
  - Add QR code validation to ensure it contains valid restaurant data
  - Create coin giving interface allowing 1-3 coins selection
  - Implement daily limit validation (max 3 coins per restaurant per day)
  - Connect to blockchain transaction creation for coin transfers
  - _Requirements: 2, 4_

- [ ] 14. Restaurant Web Dashboard Frontend Implementation
  - Implement restaurant statistics overview page showing total coins and ranking
  - Build daily statistics chart showing coins received over time using Chart.js
  - Create tourist origin breakdown visualization with country statistics
  - Add performance trends and comparison metrics display
  - Connect dashboard to backend API endpoints
  - _Requirements: 7_

- [ ] 15. Physical Coin Souvenir System Implementation
  - Implement daily coin distribution tracking for each user in backend
  - Create voucher generation system for users who give all coins daily
  - Build progress tracking API showing days completed and remaining
  - Add voucher display with QR code for souvenir collection in mobile app
  - Connect mobile app profile to show souvenir progress
  - _Requirements: 6_

- [ ] 16. Error Handling and Validation Implementation
  - Add comprehensive error handling for blockchain transaction failures in backend
  - Implement GPS and location service error handling with fallbacks in mobile app
  - Create user-friendly error messages for all API failures
  - Add input validation for all forms and API endpoints using Joi
  - Implement proper error boundaries and loading states in React components
  - _Requirements: All requirements need proper error handling_

- [ ] 17. Testing and Demo Preparation
  - Create database seed script with test data for restaurants, users, and transactions
  - Test all blockchain interactions with real transaction creation
  - Verify Google Maps API integration with nearby restaurant discovery
  - Test QR code generation and scanning functionality end-to-end
  - Prepare demo script with sample user flows and blockchain verification
  - _Requirements: All requirements need testing for demo_

- [ ] 18. Integration and Final Polish
  - Test end-to-end user flows from registration to coin giving
  - Verify blockchain explorer links work for transaction verification
  - Add loading states and smooth transitions for better user experience
  - Ensure consistent styling across mobile app and web dashboard
  - Final testing of all features and bug fixes
  - _Requirements: All requirements need integration testing_