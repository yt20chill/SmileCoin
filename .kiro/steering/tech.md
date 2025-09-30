# Technology Stack

## Core Technologies

- **Node.js 18+** - Runtime environment
- **TypeScript** - Primary language with strict type checking
- **Hardhat** - Ethereum development framework
- **Solidity 0.8.19** - Smart contract language
- **Express.js** - REST API framework
- **PostgreSQL** - Primary database
- **Redis** - Caching and session management
- **Docker** - Containerization

## Blockchain Stack

- **Ethers.js v5** - Blockchain interaction library
- **OpenZeppelin Contracts** - Upgradeable smart contract patterns
- **TypeChain** - TypeScript bindings for contracts
- **Polygon** - Primary deployment network

## Development Tools

- **Jest** - Testing framework
- **ESLint** - Code linting with TypeScript rules
- **Swagger/OpenAPI** - API documentation
- **ts-node** - TypeScript execution

## Common Commands

### Development
```bash
npm run dev              # Start development server
npm run build           # Compile TypeScript
npm run compile         # Compile smart contracts
```

### Testing
```bash
npm test                # Run all tests
npm run test:contracts  # Smart contract tests only
npm run test:e2e        # End-to-end tests
npm run test:performance # Performance tests
```

### Deployment
```bash
npm run deploy:local    # Deploy to local Hardhat network
npm run deploy:mumbai   # Deploy to Polygon Mumbai testnet
npm run deploy:prod     # Production deployment
```

### Docker Management
```bash
npm run docker:dev      # Start development environment
npm run docker:staging  # Start staging environment
npm run docker:down     # Stop containers
npm run docker:logs     # View container logs
```

### Monitoring & Utilities
```bash
npm run monitoring      # Start monitoring CLI
npm run health          # Health check
npm run wallet:fund     # Fund wallets
npm run sample:create   # Create sample data
```

## Code Quality Standards

- Strict TypeScript configuration with `noImplicitAny`
- ESLint with TypeScript parser
- 100% type coverage for public APIs
- Comprehensive error handling with custom error types
- Rate limiting and security middleware (helmet, cors)
- API key authentication for all endpoints