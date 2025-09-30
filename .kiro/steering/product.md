# Product Overview

## SmileCoin Tourist Rewards System

A blockchain infrastructure system designed to support tourist rewards through a cost-effective, developer-friendly API/SDK. The system enables tourists to earn and spend digital coins at participating restaurants during their travels.

### Core Features

- **SmileCoin ERC-20 Token**: Upgradeable smart contract with tourist-specific features
- **Daily Coin Issuance**: Tourists receive 10 coins daily during their stay
- **Restaurant Transfers**: Maximum 3 coins per restaurant per day with 14-day expiration
- **Wallet Management**: Automatic wallet creation for tourists and restaurants
- **Physical Coin Eligibility**: Tracking for potential physical coin rewards

### Business Rules

- Tourists must be registered with arrival/departure dates
- Daily coins expire after 14 days if unused
- Maximum 3 coins can be transferred to any restaurant per day per tourist
- Restaurants are identified by Google Place ID
- Physical coin eligibility requires consistent daily coin collection

### Target Networks

- Primary: Polygon (low-cost transactions)
- Development: Hardhat local network
- Testing: Polygon Mumbai testnet