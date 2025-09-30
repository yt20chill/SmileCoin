# Requirements Document - Hackathon MVP

## Introduction

A Tourist Rewards System mobile app that demonstrates blockchain-based smile coin transactions between tourists and restaurants. This MVP showcases the key innovation of blockchain traceability while including essential features for a compelling demo presentation.

## Requirements

### Requirement 1

**User Story:** As a tourist, I want to register with my travel details and receive blockchain-tracked smile coins, so that I can participate in a transparent rewards system and earn a physical souvenir.

#### Acceptance Criteria

1. WHEN a tourist registers THEN the system SHALL capture their origin location, Hong Kong arrival timestamp, and departure date
2. WHEN a tourist logs in daily THEN the system SHALL give them 10 smile coins and record the transaction on blockchain
3. WHEN a tourist views their profile THEN the system SHALL display their coin balance, blockchain transaction history, and progress toward physical coin reward
4. WHEN coins are issued THEN the system SHALL create a blockchain record with origin and arrival metadata
5. WHEN a tourist gives out all daily coins every day until departure THEN the system SHALL generate a voucher for a physical smile coin souvenir

### Requirement 2

**User Story:** As a tourist, I want to give blockchain-verified smile coins to restaurants, so that my appreciation is permanently recorded and traceable.

#### Acceptance Criteria

1. WHEN a tourist scans a restaurant QR code THEN the system SHALL allow them to give 1-3 smile coins with blockchain verification
2. WHEN a tourist gives coins THEN the system SHALL create an immutable blockchain transaction record
3. WHEN a tourist tries to give more than 3 coins per day to the same restaurant THEN the system SHALL prevent the transaction
4. WHEN coins expire after 14 days THEN the smart contract SHALL automatically destroy unused coins

### Requirement 3

**User Story:** As a tourist, I want to see a dashboard showing restaurant rankings and smile coin statistics, so that I can track the overall performance and my contributions.

#### Acceptance Criteria

1. WHEN a tourist opens the dashboard THEN the system SHALL display top restaurants ranked by total smile coins received
2. WHEN a tourist views the dashboard THEN the system SHALL show how many smile coins each restaurant has received and their ranking position
3. WHEN a tourist taps refresh THEN the system SHALL update rankings with current smile coin totals from blockchain
4. WHEN a tourist browses the dashboard THEN the system SHALL provide mock tourist coupons and attraction information (can be static data for demo)

### Requirement 3.1

**User Story:** As a tourist, I want to find nearby restaurants using GPS, so that I can discover dining options close to my current location.

#### Acceptance Criteria

1. WHEN a tourist opens the nearby restaurants page THEN the system SHALL use GPS and Google Maps API to show restaurants within a specified radius
2. WHEN a tourist views nearby restaurants THEN the system SHALL display restaurant names, distances, and their smile coin totals
3. WHEN a tourist selects a restaurant THEN the system SHALL show detailed Google Maps information, current smile coin total, and directions to the restaurant
4. WHEN a tourist changes location THEN the system SHALL update the nearby restaurants list accordingly

### Requirement 3.2

**User Story:** As a tourist, I want to see recommended restaurants popular with people from my origin country, so that I can discover places that others from my region have appreciated.

#### Acceptance Criteria

1. WHEN a tourist opens the recommendations page THEN the system SHALL show restaurants ranked by smile coins received from tourists of the same origin country
2. WHEN a tourist views recommendations THEN the system SHALL display restaurants sorted by distance and popularity among their countrymen
3. WHEN a tourist selects a recommended restaurant THEN the system SHALL show why it's recommended (smile coins from same origin) and distance information
4. WHEN no data exists for the tourist's origin THEN the system SHALL show general popular restaurants as fallback

### Requirement 4

**User Story:** As a restaurant, I want blockchain-verified smile coin tracking linked to my Google Maps listing, so that I can prove my service quality with immutable records.

#### Acceptance Criteria

1. WHEN a restaurant from Google Maps is registered THEN the system SHALL generate a unique QR code using the Google Place ID and blockchain wallet address
2. WHEN tourists scan the QR code THEN the system SHALL identify the restaurant using Google Place ID and record blockchain transactions
3. WHEN a restaurant views their dashboard THEN the system SHALL display Google Maps info, blockchain-verified coin history and rankings
4. WHEN auditing occurs THEN the system SHALL provide complete blockchain transaction history linked to Google Place ID for verification

### Requirement 5

**User Story:** As the Tourism Board, I want blockchain transparency and smart contract automation, so that the system operates with credibility and automatic governance.

#### Acceptance Criteria

1. WHEN any transaction occurs THEN the system SHALL record it on blockchain with full traceability
2. WHEN the smart contract executes THEN it SHALL automatically handle coin expiration and validation rules
3. WHEN disputes arise THEN the system SHALL provide immutable blockchain evidence
4. WHEN demonstrating the system THEN it SHALL show real blockchain transactions and smart contract interactions (not mocked)

### Requirement 6

**User Story:** As a tourist, I want to earn a physical smile coin souvenir by being an active participant, so that I have a memorable keepsake from my Hong Kong visit.

#### Acceptance Criteria

1. WHEN a tourist gives out all 10 daily coins every day THEN the system SHALL track their daily completion status
2. WHEN a tourist maintains perfect daily coin distribution until their departure date THEN the system SHALL generate a physical coin voucher
3. WHEN a voucher is generated THEN the system SHALL provide QR code and instructions for souvenir collection
4. WHEN a tourist views their progress THEN the system SHALL display days completed, days remaining, and voucher eligibility status

### Requirement 7

**User Story:** As a restaurant manager, I want to access a web dashboard showing my restaurant's smile coin statistics, so that I can track customer satisfaction and performance metrics.

#### Acceptance Criteria

1. WHEN a restaurant manager accesses the web dashboard THEN the system SHALL display daily smile coins received with date breakdown
2. WHEN viewing statistics THEN the system SHALL show total smile coins received, ranking among all restaurants, and trend analysis
3. WHEN analyzing customer origins THEN the system SHALL display which countries/regions tourists are from and their contribution to smile coins
4. WHEN reviewing performance THEN the system SHALL show meaningful metrics like average coins per day, peak days, and comparison with similar restaurants
5. WHEN accessing blockchain data THEN the system SHALL provide links to verify all transactions on the blockchain explorer

### Requirement 8

**User Story:** As a demo viewer, I want to see the blockchain innovation in action, so that I can understand the system's key differentiator.

#### Acceptance Criteria

1. WHEN the demo is presented THEN the system SHALL show live blockchain transaction creation
2. WHEN transactions are made THEN the system SHALL display blockchain hashes and confirmation status
3. WHEN viewing transaction history THEN the system SHALL show blockchain explorer links for verification
4. WHEN explaining the innovation THEN the system SHALL demonstrate smart contract functionality and immutable records