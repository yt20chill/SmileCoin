# Tourist Rewards Backend API

Backend API for the Tourist Rewards System built with Node.js, Express.js, TypeScript, PostgreSQL, and Redis.

## Features

- **TypeScript** - Full TypeScript support with strict type checking
- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Robust relational database with Prisma ORM
- **Redis** - In-memory caching and session storage
- **JWT Authentication** - Secure token-based authentication
- **CORS** - Configurable cross-origin resource sharing
- **Rate Limiting** - Protection against abuse
- **Security** - Helmet.js security headers
- **Validation** - Request validation with express-validator
- **Testing** - Jest testing framework with TypeScript support
- **Logging** - Morgan HTTP request logger

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v13 or higher)
- Redis (v6 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your .env file).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the TypeScript code
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run generate` - Generate Prisma client
- `npm run studio` - Open Prisma Studio
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Endpoints

### Health Check
- `GET /health` - Check API and database connectivity

### API Base
- `GET /api/v1` - API information

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── routes/          # API routes
├── services/        # Business logic
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── scripts/         # Database seeds and scripts
├── test/            # Test setup and utilities
├── app.ts           # Express app configuration
└── server.ts        # Server entry point
```

## Environment Variables

See `.env.example` for all available environment variables.

## Database

This project uses PostgreSQL with Prisma ORM. The database schema is defined in `prisma/schema.prisma`.

## Caching

Redis is used for caching and session storage. The Redis client is configured in `src/config/redis.ts`.

## Security

- CORS protection with configurable origins
- Rate limiting to prevent abuse
- Helmet.js for security headers
- JWT token authentication
- Input validation and sanitization

## Testing

Run tests with:
```bash
npm test
```

Tests are located alongside source files with `.test.ts` or `.spec.ts` extensions.