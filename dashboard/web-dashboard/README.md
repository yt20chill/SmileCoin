# Restaurant Web Dashboard

A comprehensive web dashboard for restaurants in the Tourist Rewards System, providing analytics and insights on smile coin transactions and tourist activity.

## Features

### 📊 Statistics Overview
- **Total Smile Coins**: Display total coins received by the restaurant
- **Ranking Position**: Show restaurant's ranking among all participating restaurants
- **Total Transactions**: Count of all smile coin transactions
- **Daily Average**: Average coins received per day

### 📈 Daily Statistics Chart
- **Line Chart**: Shows daily coins received and unique tourists over time
- **Bar Chart**: Displays daily transaction counts
- **Interactive**: Built with Chart.js for smooth interactions
- **Time Series**: 7-day rolling view of restaurant performance

### 🌍 Tourist Origin Breakdown
- **Doughnut Chart**: Visual representation of tourist countries
- **Country Statistics**: Detailed breakdown by country with:
  - Total coins received from each country
  - Number of tourists from each country
  - Percentage distribution
- **Top Performers**: Highlights top 3 countries by coins received

### 📊 Performance Trends
- **Period Comparisons**: Week-over-week and month-over-month analysis
- **Trend Indicators**: Visual indicators for positive/negative trends
- **Change Metrics**: Absolute and percentage change calculations
- **Performance Insights**: Automated insights on best periods and growth

### 🔄 Real-time Features
- **Auto Refresh**: Manual refresh button to update all data
- **Loading States**: Skeleton loading animations
- **Error Handling**: Graceful error handling with retry options
- **Restaurant Switching**: Demo selector to view different restaurant data

## Technical Implementation

### 🏗️ Architecture
- **React 18** with TypeScript
- **React Router** for navigation
- **Chart.js** with react-chartjs-2 for visualizations
- **Tailwind CSS** for responsive styling
- **Axios** for API communication

### 📁 File Structure
```
src/
├── components/
│   ├── Dashboard.tsx           # Main dashboard container
│   ├── StatsOverview.tsx       # Statistics cards
│   ├── DailyStatsChart.tsx     # Chart.js charts
│   ├── OriginBreakdown.tsx     # Country analysis
│   ├── PerformanceTrends.tsx   # Trend analysis
│   └── RestaurantSelector.tsx  # Demo restaurant picker
├── services/
│   └── api.ts                  # API service layer
├── types/
│   └── dashboard.ts            # TypeScript interfaces
└── App.tsx                     # Main app component
```

### 🔌 API Integration
The dashboard connects to backend endpoints:
- `GET /api/restaurants/:id/dashboard/stats` - Overall statistics
- `GET /api/restaurants/:id/dashboard/origins` - Tourist origin data
- `GET /api/restaurants/:id/dashboard/trends` - Performance trends

Currently uses mock data since backend endpoints are not fully implemented.

### 📱 Responsive Design
- **Mobile First**: Optimized for mobile devices
- **Grid Layouts**: Responsive grid systems
- **Touch Friendly**: Large touch targets for mobile
- **Accessibility**: ARIA labels and semantic HTML

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation
```bash
cd web-dashboard
npm install
```

### Development
```bash
npm start
```
The dashboard will be available at `http://localhost:3001`

### Build
```bash
npm run build
```

## Demo Data

The dashboard includes three demo restaurants with different performance profiles:

1. **Golden Dragon Restaurant** (demo-restaurant-123)
   - Mid-tier performance
   - Diverse tourist origins
   - Steady growth trends

2. **Harbour View Cafe** (demo-restaurant-456)
   - Lower performance
   - Asian-focused tourist base
   - Mixed growth trends

3. **Peak Dining** (demo-restaurant-789)
   - High performance
   - Western tourist focus
   - Strong growth trends

## Integration with Backend

When the backend API endpoints are implemented, the dashboard will automatically switch from mock data to real data. The API service layer (`services/api.ts`) handles this transition seamlessly.

## Blockchain Integration

The dashboard includes a blockchain verification section that will display:
- Transaction verification status
- Links to blockchain explorer
- Smart contract interaction history

## Future Enhancements

- Real-time WebSocket updates
- Advanced filtering and date range selection
- Export functionality for reports
- Push notifications for significant events
- Multi-language support
- Advanced analytics and predictions