# Tourist Rewards System 🪙

A blockchain-powered mobile application that enables tourists to show appreciation to Hong Kong restaurants through "smile coins" - creating a transparent, gamified experience that supports local businesses and rewards positive customer interactions.

## 🌟 The Concept

Imagine visiting Hong Kong and having a digital way to instantly reward restaurants that provide exceptional service. The Tourist Rewards System makes this possible through blockchain-verified "smile coins" that tourists can give to restaurants, creating a transparent reputation system that benefits everyone:

- **Tourists** earn daily smile coins and can reward great service
- **Restaurants** build verifiable reputation through blockchain records
- **Tourism Board** promotes positive experiences and supports local businesses

## 🚀 Key Innovation: Blockchain Transparency

Unlike traditional review systems, every smile coin transaction is recorded on the blockchain, providing:

- **Immutable Records**: All transactions are permanently recorded and verifiable
- **Complete Transparency**: Anyone can verify restaurant ratings through blockchain explorer
- **Fraud Prevention**: Smart contracts prevent gaming the system
- **Credible Data**: Tourism boards and restaurants have trustworthy performance metrics

## 📱 How It Works

### For Tourists

1. **Register** with your travel details (origin country, arrival/departure dates)
2. **Receive** 10 smile coins daily during your Hong Kong visit
3. **Discover** nearby restaurants through GPS and Google Maps integration
4. **Visit** restaurants and scan their QR codes to give 1-3 smile coins
5. **Earn** a physical smile coin souvenir by giving all coins daily

### For Restaurants

1. **Register** your restaurant using Google Maps Place ID
2. **Display** your unique QR code for tourists to scan
3. **Receive** smile coins from satisfied customers
4. **Track** performance through blockchain-verified analytics dashboard
5. **Build** reputation through transparent, immutable customer feedback

## 🏗️ Technical Architecture

### Mobile App (React Native + NativeWind)

- **Dashboard**: Overall restaurant rankings and statistics
- **Nearby**: GPS-based restaurant discovery with Google Maps
- **Recommendations**: Restaurants popular with your countrymen
- **QR Scanner**: In-restaurant coin giving (QR codes only inside restaurants)
- **Profile**: Coin balance, transaction history, souvenir progress

### Restaurant Web Dashboard (React + Tailwind CSS)

- **Analytics**: Daily coin statistics and performance trends
- **Origins**: Tourist country breakdown and demographics
- **Rankings**: Position among all Hong Kong restaurants
- **Blockchain**: Direct links to verify all transactions

### Backend (Node.js + Express)

- **Authentication**: JWT-based user management
- **Google Maps**: Restaurant discovery and location services
- **Blockchain**: Smart contract integration for coin transactions
- **Analytics**: Real-time ranking and statistics calculation

### Blockchain (Ethereum/Testnet)

- **Smart Contracts**: Automated coin distribution and expiration
- **Transparency**: All transactions publicly verifiable
- **Security**: Immutable records prevent manipulation
- **Innovation**: Demonstrates real-world blockchain utility

## 🎯 Demo Features

### Core Functionality

- ✅ User registration with travel details
- ✅ Daily blockchain-verified coin distribution
- ✅ GPS restaurant discovery with Google Maps
- ✅ QR code scanning for coin transfers
- ✅ Real-time blockchain transaction creation
- ✅ Restaurant rankings and analytics

### Blockchain Innovation Showcase

- ✅ Live blockchain transaction creation during demo
- ✅ Smart contract automation (coin expiration, validation)
- ✅ Blockchain explorer links for transaction verification
- ✅ Immutable reputation system demonstration

## 🛠️ Technology Stack

**Frontend**

- React Native with NativeWind (Tailwind CSS)
- React.js with Tailwind CSS for web dashboard
- React Navigation, React Native Maps, QR Scanner

**Backend**

- Node.js with Express.js
- PostgreSQL with Redis caching
- Google Maps Places API
- JWT authentication

**Blockchain**

- Ethereum testnet (Goerli/Sepolia)
- Solidity smart contracts
- Web3.js for blockchain interaction
- MetaMask or custom wallet integration

**Development**

- Docker Compose for local databases
- Localhost development environment
- Hot reloading for rapid development

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- React Native development environment
- Google Maps API key
- Ethereum testnet access

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd tourist-rewards-system

# Start databases
docker-compose up -d

# Install backend dependencies
cd backend
npm install
npm run migrate
npm run dev

# Install mobile app dependencies
cd ../mobile
npm install
npx react-native run-ios  # or run-android

# Install web dashboard dependencies
cd ../web-dashboard
npm install
npm run dev
```

## 📊 Project Structure

```
tourist-rewards-system/
├── mobile/                 # React Native mobile app
├── web-dashboard/          # React.js restaurant dashboard
├── backend/               # Node.js API server
├── blockchain/            # Smart contracts and deployment
├── docs/                  # Additional documentation
├── .kiro/specs/          # Kiro specification files
└── docker-compose.yml    # Local database setup
```

## 🎪 Demo Highlights

1. **User Registration**: Show blockchain wallet creation and travel data capture
2. **Daily Coins**: Demonstrate automatic coin distribution with blockchain verification
3. **Restaurant Discovery**: GPS-based search with Google Maps integration
4. **QR Code Scanning**: Live coin transfer with blockchain transaction creation
5. **Real-time Rankings**: Restaurant performance updates based on blockchain data
6. **Analytics Dashboard**: Restaurant manager view with origin breakdowns
7. **Blockchain Verification**: Direct links to blockchain explorer for transparency

## 🌍 Impact & Vision

### For Hong Kong Tourism

- **Quality Assurance**: Transparent restaurant quality metrics
- **Tourist Satisfaction**: Gamified way to reward good service
- **Data Insights**: Real tourism patterns and preferences
- **Local Business Support**: Drive traffic to quality establishments

### Blockchain Innovation

- **Real-world Utility**: Practical blockchain application beyond speculation
- **Transparency**: Public, verifiable reputation system
- **Automation**: Smart contracts handle complex business logic
- **Trust**: Immutable records build confidence in the system

## 🏆 Hackathon Achievement

Built in 36 hours by a 4-person team with Kiro AI assistance, this project demonstrates:

- **Rapid Blockchain Development**: From concept to working dApp
- **Full-stack Integration**: Mobile, web, backend, and blockchain
- **Real-world Application**: Solving actual tourism industry challenges
- **Technical Excellence**: Production-ready architecture and code quality

---

**Ready to revolutionize how tourists and restaurants connect in Hong Kong? Let's build the future of transparent, blockchain-powered hospitality! 🚀**
