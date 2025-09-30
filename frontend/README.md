# Smile Travel HK - Tourist Frontend PWA

A Progressive Web App (PWA) that gamifies the Hong Kong tourism experience using Smile Coins. Tourists can earn, spend, and redeem Smile Coins while exploring Hong Kong's merchants and attractions.

## Features

- 🪙 **Smile Coin Wallet** - Earn, spend, and track your Smile Coins
- 🏪 **Merchant Discovery** - Browse local businesses and their offers
- ⭐ **Rating System** - Rate merchants using Smile Coins (1-3 coins)
- 🎁 **Rewards Redemption** - Exchange coins for souvenirs and experiences
- 🌐 **Multilingual** - Support for English and Traditional Chinese
- 📱 **PWA Ready** - Install on mobile devices for native-like experience
- 🔄 **Offline Support** - Works offline with cached data

## Tech Stack

- **Framework**: Next.js 15 with App Router and Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Hong Kong-themed colors
- **UI Components**: Shadcn/ui
- **Animations**: Framer Motion
- **PWA**: next-pwa with service worker
- **Internationalization**: next-intl
- **Database**: IndexedDB via Dexie.js for offline storage
- **State Management**: React Context + useReducer

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run clean` - Clean build artifacts

## Project Structure

```
src/
├── app/                    # Next.js app router pages
├── components/             # React components
│   └── ui/                # Shadcn/ui components
├── lib/
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── db/                # IndexedDB configuration
├── i18n/                  # Internationalization setup
└── middleware.ts          # Next.js middleware

public/
├── icons/                 # PWA icons
├── manifest.json          # PWA manifest
└── sw.js                  # Service worker

messages/
├── en.json               # English translations
└── zh-TW.json           # Traditional Chinese translations
```

## Key Features Implementation

### PWA Configuration
- Manifest file with Hong Kong branding
- Service worker for offline caching
- Install prompts for mobile devices

### Internationalization
- English and Traditional Chinese support
- Automatic language detection
- Locale-based routing

### Offline Support
- IndexedDB for local data persistence
- Cached merchant and reward data
- Queue system for offline actions

### Hong Kong Theme
- Red and gold color palette
- Custom coin animations
- Cultural design elements

## Development Guidelines

### Adding New Components
1. Create component in appropriate directory under `src/components/`
2. Export types from `src/lib/types/index.ts`
3. Add translations to both language files
4. Follow Shadcn/ui patterns for consistency

### Database Operations
- Use `DatabaseService` class for all IndexedDB operations
- Cache frequently accessed data
- Handle offline scenarios gracefully

### Styling
- Use Tailwind CSS utility classes
- Leverage Hong Kong theme colors from `globals.css`
- Add custom animations for gamification elements

## Contributing

1. Follow TypeScript best practices
2. Add proper error handling
3. Include translations for new text
4. Test offline functionality
5. Maintain PWA compliance

## License

This project is part of the Smile Travel HK ecosystem.

---

## Original Project Overview

> **Elevator Pitch:**  
> Smile Travel HK x Smile Coin uses blockchain gamification to connect tourists and merchants in Hong Kong, turning smiles into coins for rewards, feedback, and a stronger local economy.

The project name was inspired by the iconic Hong Kong Tourism Board advertisement (2004) *《好客之道》*, which begins with the line: **"Your every smile…"** — a message that reflects Hong Kong's spirit of warmth and hospitality.