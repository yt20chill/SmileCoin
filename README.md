# Tourist Rewards Blockchain Infrastructure

A blockchain infrastructure system specifically designed to support the Tourist Rewards System. This system provides a cost-effective, developer-friendly API/SDK for backend developers to handle smile coin transactions, tourist wallet management, and restaurant reward tracking on a cheap blockchain network.

## Features

- **SmileCoin Smart Contract**: ERC-20 token with tourist rewards specific features
- **Wallet Management**: Automatic wallet creation and management for tourists and restaurants
- **REST API**: Simple endpoints for tourist and restaurant operations
- **JavaScript SDK**: Easy-to-use SDK for backend integration
- **Transaction Monitoring**: Real-time blockchain transaction tracking
- **Cost-Effective**: Optimized for low-cost networks like Polygon

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tourist-rewards-blockchain-infrastructure
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment configuration:
```bash
cp .env.example .env.development
```

4. Start local development environment:
```bash
docker-compose up -d
```

5. Compile and deploy smart contracts:
```bash
npm run compile
npm run deploy:local
```

6. Start the API server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
├── contracts/              # Smart contracts
├── src/
│   ├── api/                # REST API implementation
│   ├── services/           # Core services (Wallet, Contract management)
│   └── sdk/                # JavaScript SDK
├── scripts/                # Deployment and utility scripts
├── test/                   # Test files
├── database/               # Database schemas and migrations
└── docker-compose.yml      # Local development environment
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run smart contract tests
npm run test:contracts

# Run API tests
npm run test:api
```

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Deployment

### Local Development
```bash
docker-compose up -d
npm run deploy:local
```

### Polygon Mumbai Testnet
```bash
npm run deploy:mumbai
```

## API Documentation

Once the server is running, visit `http://localhost:3000/docs` for interactive API documentation.

## SDK Usage

```javascript
import { SmileCoinSDK } from './src/sdk/SmileCoinSDK';

const sdk = new SmileCoinSDK({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key'
});

// Register a tourist
const tourist = await sdk.registerTourist({
  touristId: 'tourist-123',
  originCountry: 'USA',
  arrivalDate: '2024-01-15',
  departureDate: '2024-01-22'
});

// Issue daily coins
const coins = await sdk.issueDailyCoins('tourist-123');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details