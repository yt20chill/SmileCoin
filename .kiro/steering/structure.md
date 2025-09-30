# Project Structure

## Root Level Organization

```
├── contracts/           # Solidity smart contracts
├── src/                # TypeScript source code
├── test/               # All test files
├── scripts/            # Deployment and utility scripts
├── docs/               # Documentation files
├── database/           # Database schemas and migrations
├── nginx/              # Nginx configuration files
├── redis/              # Redis configuration
└── docker-compose.*.yml # Environment-specific Docker configs
```

## Source Code Structure (`src/`)

```
src/
├── api/                # REST API implementation
│   ├── app.ts         # Main Express application
│   ├── middleware/    # Custom middleware (validation, auth)
│   ├── routes/        # API route handlers
│   └── types/         # API-specific TypeScript types
├── services/          # Core business logic services
├── sdk/               # JavaScript SDK for external use
├── utils/             # Shared utility functions
├── scripts/           # CLI tools and scripts
└── examples/          # Usage examples
```

## Test Organization (`test/`)

```
test/
├── api/               # API integration tests
├── contracts/         # Smart contract unit tests
├── sdk/               # SDK functionality tests
├── e2e/               # End-to-end business flow tests
├── performance/       # Load and performance tests
└── setup.ts           # Global test configuration
```

## Key Architectural Patterns

### Service Layer Pattern
- `ContractManager.ts` - Smart contract interactions
- `WalletManager.ts` - Wallet creation and management
- `MonitoringService.ts` - System health monitoring
- `TransactionIndexer.ts` - Blockchain event tracking

### API Route Organization
- `/api/tourists` - Tourist registration and coin operations
- `/api/restaurants` - Restaurant registration and earnings
- `/api/blockchain` - Direct blockchain queries
- `/api/monitoring` - System health and metrics

### Environment Configuration
- `.env.development` - Local development settings
- `.env.staging` - Staging environment
- `.env.production` - Production configuration
- `.env.test` - Test environment overrides

### Docker Composition
- `docker-compose.yml` - Base services (PostgreSQL, Redis)
- `docker-compose.development.yml` - Development overrides
- `docker-compose.staging.yml` - Staging configuration
- `docker-compose.production.yml` - Production setup

## File Naming Conventions

- **Services**: PascalCase with descriptive names (`ContractManager.ts`)
- **Routes**: kebab-case matching API endpoints (`tourists.ts`)
- **Tests**: Match source file with `.test.ts` suffix
- **Scripts**: kebab-case with clear purpose (`deploy-production.sh`)
- **Types**: Grouped in `index.ts` files for easy imports

## Import Path Aliases

```typescript
"@/*": ["src/*"]           # Source code
"@contracts/*": ["contracts/*"]  # Smart contracts
"@test/*": ["test/*"]      # Test utilities
```

## Generated Code Locations

- `artifacts/` - Hardhat compilation artifacts
- `typechain-types/` - TypeScript contract bindings
- `cache/` - Hardhat cache files
- `dist/` - Compiled TypeScript output

## Documentation Structure

- `README.md` - Project overview and quick start
- `docs/API_DOCUMENTATION.md` - Detailed API reference
- `docs/SDK_EXAMPLES.md` - SDK usage examples
- `docs/DEPLOYMENT_GUIDE.md` - Deployment instructions
- `docs/TROUBLESHOOTING.md` - Common issues and solutions