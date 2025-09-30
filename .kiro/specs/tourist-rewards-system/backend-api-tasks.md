# Backend API Tasks - User & Restaurant Endpoints

## Your Focus: Backend API Development (No Blockchain)

This task list covers the backend API endpoints for users and restaurants, excluding blockchain integration which will be handled by your teammate.

- [x] 1. Project Setup and Database Configuration

  - Set up Node.js Express.js project structure with proper folder organization
  - Configure PostgreSQL connection using environment variables
  - Set up Redis connection for caching
  - Create database migration system (using Prisma)
  - Configure CORS for mobile app and web dashboard access
  - _Focus: Core backend infrastructure_

- [x] 2. Database Schema Implementation

  - Create users table without email/name fields (privacy-first approach)
  - Create restaurants table with Google Place ID integration
  - Create transactions table structure (blockchain teammate will populate)
  - Create daily_rewards table for tracking user activity
  - Set up proper indexes for performance optimization
  - Create restaurant analytics view for dashboard queries
  - _Focus: Database structure and migrations_

- [x] 3. User Registration and Authentication System

  - Implement user registration endpoint accepting origin country, arrival/departure dates, and wallet address
  - Create JWT-based authentication system without email/password
  - Build user profile endpoint returning user data and statistics
  - Add middleware for protected routes and user identification
  - Implement user session management with Redis
  - _Focus: Privacy-first user management_

- [x] 4. Google Maps API Integration Service

  - Set up Google Maps Places API configuration and error handling
  - Create nearby restaurants search endpoint using GPS coordinates and radius
  - Implement restaurant details fetching using Google Place IDs
  - Build restaurant search and filtering functionality
  - Add Google Maps API response caching with Redis (24-hour TTL)
  - Create distance calculation utilities for restaurant ranking
  - _Focus: Restaurant discovery and location services_

- [x] 5. Restaurant Management Endpoints

  - Create restaurant registration endpoint using Google Place ID
  - Generate unique QR codes containing Place ID and wallet address
  - Implement restaurant profile endpoint with Google Maps data
  - Build restaurant listing endpoints with pagination
  - Add restaurant search functionality by name, location, cuisine type
  - _Focus: Restaurant data management_

- [x] 6. Restaurant Ranking and Statistics APIs

  - Create overall restaurant rankings endpoint based on total smile coins
  - Implement origin-based restaurant recommendations using user country data
  - Build manual ranking refresh endpoint for demo purposes
  - Create restaurant statistics endpoints for web dashboard
  - Add nearby restaurants ranking with GPS integration
  - Implement caching strategy for ranking data with Redis
  - _Focus: Restaurant discovery and ranking logic_

- [x] 7. Transaction Recording Endpoints (Non-Blockchain)

  - Create transaction recording endpoint for smile coin transfers
  - Implement daily coin limit validation (max 3 coins per restaurant per day)
  - Build transaction history endpoints for users and restaurants
  - Add transaction validation and business logic
  - Create endpoints for tracking user daily coin distribution
  - _Focus: Transaction business logic without blockchain calls_

- [x] 8. Restaurant Web Dashboard APIs

  - Create restaurant daily statistics endpoint with date filtering
  - Implement total statistics endpoint (total coins, ranking, trends)
  - Build tourist origin breakdown endpoint showing country statistics
  - Add performance trends endpoint with historical data analysis
  - Create restaurant comparison and benchmarking endpoints
  - _Focus: Analytics and reporting for restaurant managers_

- [-] 9. Physical Coin Souvenir Tracking APIs

  - Implement daily coin distribution tracking for each user
  - Create progress tracking endpoint showing completion status
  - Build voucher eligibility checking logic
  - Add voucher generation endpoint (without actual voucher creation)
  - Create progress display endpoints for mobile app
  - _Focus: Gamification and reward tracking_

- [ ] 10. Caching and Performance Optimization

  - Implement Redis caching for frequently accessed restaurant data
  - Add caching for Google Maps API responses
  - Create cache invalidation strategies for ranking updates
  - Optimize database queries with proper indexing
  - Add connection pooling for database performance
  - Implement API response compression
  - _Focus: Performance and scalability_

- [ ] 11. Error Handling and Validation

  - Add comprehensive input validation for all endpoints
  - Implement proper error response formatting with consistent structure
  - Create error handling middleware for common scenarios
  - Add rate limiting to prevent API abuse
  - Implement request logging and monitoring
  - Create health check endpoints for system monitoring
  - _Focus: Robustness and reliability_

- [ ] 12. API Documentation and Testing
  - Create API documentation using Swagger/OpenAPI
  - Write unit tests for all endpoint logic
  - Create integration tests for database operations
  - Add test data seeding for development and testing
  - Implement API endpoint testing with sample requests/responses
  - Create Postman collection for manual testing
  - _Focus: Documentation and quality assurance_

## Integration Points with Blockchain Teammate

### Data You'll Provide:

- User registration data (origin country, dates, wallet address)
- Restaurant data (Google Place ID, wallet address, QR codes)
- Transaction validation (daily limits, user/restaurant verification)
- Transaction recording structure (ready for blockchain hash insertion)

### Data You'll Receive:

- Blockchain transaction hashes for completed transfers
- Daily coin distribution confirmations
- Blockchain wallet addresses for new users/restaurants
- Transaction verification status from blockchain

### Shared Endpoints:

- `POST /api/transactions` - You handle validation, they handle blockchain
- `GET /api/users/balance` - They provide blockchain data, you format response
- `POST /api/users/daily-coins` - They handle blockchain, you update database

## Environment Variables Needed:

```env
DATABASE_URL=postgresql://dev:dev@localhost:5432/tourist_rewards
REDIS_URL=redis://localhost:6379
GOOGLE_MAPS_API_KEY=your_google_maps_key
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=development
```

## API Base Structure:

```
/api/auth/*          - Authentication endpoints
/api/users/*         - User management endpoints
/api/restaurants/*   - Restaurant management endpoints
/api/transactions/*  - Transaction recording endpoints
/api/rankings/*      - Restaurant ranking endpoints
/api/dashboard/*     - Restaurant dashboard endpoints
/api/health         - Health check endpoint
```

This task breakdown focuses specifically on your backend API responsibilities while clearly defining integration points with your blockchain teammate.
