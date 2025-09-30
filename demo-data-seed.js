#!/usr/bin/env node

/**
 * Demo Data Seeding Script for SmileCoin Tourist Rewards System
 * Creates realistic demo data for the 3-minute video demonstration
 */

const fs = require('fs');
const path = require('path');

console.log('🎬 Setting up SmileCoin Demo Data...\n');

// Demo restaurants with compelling stories
const demoRestaurants = [
  {
    id: 'demo-restaurant-123',
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    name: 'Golden Dragon Restaurant',
    address: '123 Central District, Hong Kong',
    story: 'Traditional Cantonese restaurant, family-owned for 3 generations',
    totalCoins: 1247,
    ranking: 8,
    dailyAverage: 62.3,
    transactions: 456,
    uniqueTourists: 189,
    topCountries: ['United States', 'United Kingdom', 'Japan', 'Australia']
  },
  {
    id: 'demo-restaurant-456', 
    googlePlaceId: 'ChIJrTLr-GyuEmsRBfy61i59si0',
    name: 'Harbour View Cafe',
    address: '456 Tsim Sha Tsui, Hong Kong',
    story: 'Modern fusion cafe with stunning harbor views',
    totalCoins: 892,
    ranking: 23,
    dailyAverage: 44.6,
    transactions: 324,
    uniqueTourists: 142,
    topCountries: ['Japan', 'South Korea', 'United States', 'Singapore']
  },
  {
    id: 'demo-restaurant-789',
    googlePlaceId: 'ChIJ2eUgeAK6EmsRqRfr6hFrw-M', 
    name: 'Peak Dining',
    address: '789 The Peak, Hong Kong',
    story: 'Fine dining with panoramic city views, Michelin recommended',
    totalCoins: 1856,
    ranking: 3,
    dailyAverage: 92.8,
    transactions: 678,
    uniqueTourists: 234,
    topCountries: ['United States', 'United Kingdom', 'Australia', 'Germany']
  }
];

// Demo tourist with completed souvenir journey
const demoTourist = {
  id: 'demo-tourist-001',
  name: 'Sarah Johnson',
  origin: 'United States',
  arrivalDate: '2024-01-01',
  departureDate: '2024-01-14',
  totalCoinsReceived: 100,
  totalCoinsGiven: 87,
  restaurantsVisited: 12,
  daysCompleted: 7,
  souvenirEarned: true,
  voucherCode: 'SC-DEMO2024HKTB',
  currentStreak: 7,
  longestStreak: 7
};

// Generate realistic daily data for the past 10 days
function generateDailyData() {
  const dailyData = [];
  const startDate = new Date('2024-01-01');
  
  for (let i = 0; i < 10; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    // Golden Dragon - steady performer
    const goldenDragon = {
      date: date.toISOString().split('T')[0],
      coinsReceived: 45 + Math.floor(Math.random() * 30),
      uniqueTourists: 15 + Math.floor(Math.random() * 10),
      transactions: 18 + Math.floor(Math.random() * 12),
      topCountry: ['US', 'UK', 'JP', 'AU'][Math.floor(Math.random() * 4)]
    };
    
    // Harbour View - growing popularity
    const harbourView = {
      date: date.toISOString().split('T')[0],
      coinsReceived: 30 + Math.floor(Math.random() * 25) + (i * 2), // Growing trend
      uniqueTourists: 10 + Math.floor(Math.random() * 8) + Math.floor(i * 1.5),
      transactions: 12 + Math.floor(Math.random() * 10) + Math.floor(i * 1.2),
      topCountry: ['JP', 'KR', 'US', 'SG'][Math.floor(Math.random() * 4)]
    };
    
    // Peak Dining - premium performance
    const peakDining = {
      date: date.toISOString().split('T')[0],
      coinsReceived: 70 + Math.floor(Math.random() * 40),
      uniqueTourists: 25 + Math.floor(Math.random() * 15),
      transactions: 30 + Math.floor(Math.random() * 20),
      topCountry: ['US', 'UK', 'AU', 'DE'][Math.floor(Math.random() * 4)]
    };
    
    dailyData.push({
      date: date.toISOString().split('T')[0],
      restaurants: {
        'demo-restaurant-123': goldenDragon,
        'demo-restaurant-456': harbourView,
        'demo-restaurant-789': peakDining
      }
    });
  }
  
  return dailyData;
}

// Generate tourist origin data with realistic distributions
function generateOriginData() {
  return {
    'demo-restaurant-123': [
      { country: 'United States', coinsReceived: 324, touristCount: 89, percentage: 26.0 },
      { country: 'United Kingdom', coinsReceived: 287, touristCount: 76, percentage: 23.0 },
      { country: 'Japan', coinsReceived: 198, touristCount: 52, percentage: 15.9 },
      { country: 'Australia', coinsReceived: 156, touristCount: 41, percentage: 12.5 },
      { country: 'Canada', coinsReceived: 134, touristCount: 35, percentage: 10.7 },
      { country: 'Germany', coinsReceived: 89, touristCount: 23, percentage: 7.1 },
      { country: 'France', coinsReceived: 59, touristCount: 15, percentage: 4.7 }
    ],
    'demo-restaurant-456': [
      { country: 'Japan', coinsReceived: 267, touristCount: 71, percentage: 29.9 },
      { country: 'South Korea', coinsReceived: 178, touristCount: 47, percentage: 20.0 },
      { country: 'United States', coinsReceived: 156, touristCount: 42, percentage: 17.5 },
      { country: 'Australia', coinsReceived: 123, touristCount: 33, percentage: 13.8 },
      { country: 'Singapore', coinsReceived: 89, touristCount: 24, percentage: 10.0 },
      { country: 'Canada', coinsReceived: 56, touristCount: 15, percentage: 6.3 },
      { country: 'United Kingdom', coinsReceived: 23, touristCount: 6, percentage: 2.6 }
    ],
    'demo-restaurant-789': [
      { country: 'United States', coinsReceived: 556, touristCount: 148, percentage: 30.0 },
      { country: 'United Kingdom', coinsReceived: 445, touristCount: 118, percentage: 24.0 },
      { country: 'Australia', coinsReceived: 334, touristCount: 89, percentage: 18.0 },
      { country: 'Germany', coinsReceived: 223, touristCount: 59, percentage: 12.0 },
      { country: 'France', coinsReceived: 167, touristCount: 44, percentage: 9.0 },
      { country: 'Canada', coinsReceived: 93, touristCount: 25, percentage: 5.0 },
      { country: 'Japan', coinsReceived: 37, touristCount: 10, percentage: 2.0 }
    ]
  };
}

// Create demo blockchain transactions
function generateBlockchainTransactions() {
  const transactions = [];
  const startDate = new Date('2024-01-01');
  
  for (let day = 0; day < 10; day++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + day);
    
    // Generate 20-50 transactions per day
    const dailyTransactions = 20 + Math.floor(Math.random() * 30);
    
    for (let i = 0; i < dailyTransactions; i++) {
      const restaurant = demoRestaurants[Math.floor(Math.random() * demoRestaurants.length)];
      const hour = 10 + Math.floor(Math.random() * 12); // Business hours
      const minute = Math.floor(Math.random() * 60);
      
      const transactionTime = new Date(date);
      transactionTime.setHours(hour, minute);
      
      transactions.push({
        hash: '0x' + Math.random().toString(16).substring(2, 66),
        from: '0x' + Math.random().toString(16).substring(2, 42),
        to: restaurant.id,
        amount: Math.floor(Math.random() * 3) + 1, // 1-3 coins
        timestamp: transactionTime.toISOString(),
        restaurantName: restaurant.name,
        touristOrigin: ['US', 'UK', 'JP', 'AU', 'CA', 'DE', 'FR', 'KR', 'SG'][Math.floor(Math.random() * 9)],
        blockNumber: 1000000 + day * 100 + i,
        gasUsed: 21000 + Math.floor(Math.random() * 10000)
      });
    }
  }
  
  return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Create comprehensive demo dataset
const demoData = {
  restaurants: demoRestaurants,
  tourist: demoTourist,
  dailyData: generateDailyData(),
  originData: generateOriginData(),
  blockchainTransactions: generateBlockchainTransactions(),
  systemStats: {
    totalRestaurants: 150,
    totalTourists: 2847,
    totalTransactions: 15623,
    totalCoinsDistributed: 28470,
    totalCoinsGiven: 23891,
    averageCoinsPerTourist: 8.4,
    topPerformingDistrict: 'Central',
    mostPopularCuisine: 'Cantonese',
    averageStayDuration: 6.2,
    souvenirRedemptionRate: 23.4
  },
  demoFlow: {
    step1: 'Show restaurant dashboard with live data',
    step2: 'Generate QR code for restaurant',
    step3: 'Display tourist souvenir progress',
    step4: 'Show voucher redemption system',
    step5: 'Highlight blockchain transparency'
  }
};

// Save demo data to JSON file
const demoDataPath = path.join(__dirname, 'demo-data.json');
fs.writeFileSync(demoDataPath, JSON.stringify(demoData, null, 2));

console.log('✅ Demo data generated successfully!');
console.log(`📁 Saved to: ${demoDataPath}`);
console.log(`📊 Generated ${demoData.blockchainTransactions.length} blockchain transactions`);
console.log(`🏪 Created data for ${demoData.restaurants.length} restaurants`);
console.log(`🌍 Tourist origin data for ${Object.keys(demoData.originData).length} restaurants`);

// Create demo checklist
const checklistPath = path.join(__dirname, 'DEMO_CHECKLIST.md');
const checklist = `# SmileCoin Demo Checklist

## Pre-Demo Setup (5 minutes before)
- [ ] Start web dashboard: \`cd web-dashboard && npm start\`
- [ ] Verify localhost:3001 is accessible
- [ ] Load demo data in browser
- [ ] Test all navigation tabs
- [ ] Prepare screen recording software
- [ ] Close unnecessary applications
- [ ] Set browser to full screen
- [ ] Test audio recording

## Demo Flow Verification
- [ ] Restaurant Dashboard loads with Golden Dragon data
- [ ] Statistics show: 1,247 coins, Rank #8, 456 transactions
- [ ] Daily charts display properly
- [ ] Tourist origin breakdown shows 7 countries
- [ ] QR Code Generator creates valid codes
- [ ] Souvenir Progress shows 7/7 days completed
- [ ] Voucher displays with code SC-DEMO2024HKTB
- [ ] All transitions are smooth

## Recording Setup
- [ ] Screen resolution: 1920x1080
- [ ] Recording frame rate: 30fps
- [ ] Audio input tested
- [ ] Recording area set to browser window
- [ ] Backup recording method ready

## Demo Data Highlights
- **Golden Dragon**: ${demoData.restaurants[0].totalCoins} coins, rank #${demoData.restaurants[0].ranking}
- **Peak Dining**: ${demoData.restaurants[2].totalCoins} coins, rank #${demoData.restaurants[2].ranking}
- **Tourist Origins**: ${demoData.originData['demo-restaurant-123'].length} countries tracked
- **Blockchain Transactions**: ${demoData.blockchainTransactions.length} verified transactions
- **Souvenir Progress**: ${demoData.tourist.daysCompleted}/7 days completed

## Backup Plans
- [ ] Pre-recorded screen captures ready
- [ ] Demo script printed
- [ ] Technical FAQ prepared
- [ ] Alternative demo flow planned
- [ ] Contact information ready

## Post-Demo
- [ ] Save recording file
- [ ] Upload to video platform
- [ ] Share demo link
- [ ] Collect feedback
- [ ] Update based on questions

Generated: ${new Date().toISOString()}
`;

fs.writeFileSync(checklistPath, checklist);

console.log(`📋 Demo checklist created: ${checklistPath}`);

// Create video production script
const videoScriptPath = path.join(__dirname, 'video-production.sh');
const videoScript = `#!/bin/bash

# SmileCoin Demo Video Production Script
# Requires: ffmpeg, screen recording, audio file

echo "🎬 Starting SmileCoin demo video production..."

# Create intro slide (3 seconds)
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 -vf "drawtext=text='SmileCoin Tourist Rewards System':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-50,drawtext=text='Blockchain-Powered Tourism Innovation':fontcolor=0xf59e0b:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+50" -y intro.mp4

# Create outro slide (3 seconds)  
ffmpeg -f lavfi -i color=c=0x1f2937:s=1920x1080:d=3 -vf "drawtext=text='Thank You':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2-100,drawtext=text='SmileCoin - Transforming Tourism':fontcolor=0xf59e0b:fontsize=48:x=(w-text_w)/2:y=(h-text_h)/2,drawtext=text='github.com/smilecoin-hk':fontcolor=white:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+100" -y outro.mp4

# Combine screen recording with audio (replace with your files)
if [ -f "screen_recording.mov" ] && [ -f "narration.wav" ]; then
    ffmpeg -i screen_recording.mov -i narration.wav -c:v libx264 -c:a aac -strict experimental -y demo_main.mp4
    echo "✅ Combined screen recording with audio"
else
    echo "⚠️  Please provide screen_recording.mov and narration.wav files"
fi

# Create file list for concatenation
cat > file_list.txt << EOF
file 'intro.mp4'
file 'demo_main.mp4'  
file 'outro.mp4'
EOF

# Concatenate all parts
if [ -f "demo_main.mp4" ]; then
    ffmpeg -f concat -safe 0 -i file_list.txt -c copy -y smilecoin_demo_full.mp4
    echo "✅ Created full demo video: smilecoin_demo_full.mp4"
fi

# Create optimized version for web
if [ -f "smilecoin_demo_full.mp4" ]; then
    ffmpeg -i smilecoin_demo_full.mp4 -vcodec libx264 -acodec aac -vb 2000k -ab 192k -s 1280x720 -y smilecoin_demo_web.mp4
    echo "✅ Created web-optimized version: smilecoin_demo_web.mp4"
fi

# Create thumbnail
if [ -f "smilecoin_demo_full.mp4" ]; then
    ffmpeg -i smilecoin_demo_full.mp4 -ss 00:00:30 -vframes 1 -y thumbnail.jpg
    echo "✅ Created thumbnail: thumbnail.jpg"
fi

echo "🎉 Video production complete!"
echo "📁 Files created:"
echo "   - smilecoin_demo_full.mp4 (full quality)"
echo "   - smilecoin_demo_web.mp4 (web optimized)"
echo "   - thumbnail.jpg (video thumbnail)"

# Clean up temporary files
rm -f intro.mp4 outro.mp4 file_list.txt

echo "🧹 Cleaned up temporary files"
`;

fs.writeFileSync(videoScriptPath, videoScript);
fs.chmodSync(videoScriptPath, '755');

console.log(`🎥 Video production script created: ${videoScriptPath}`);
console.log('\n🎬 Demo preparation complete!');
console.log('\n📋 Next steps:');
console.log('1. Review DEMO_CHECKLIST.md');
console.log('2. Practice the demo flow 2-3 times');
console.log('3. Record screen and audio');
console.log('4. Run ./video-production.sh to create final video');
console.log('5. Upload and share your demo!');

console.log('\n✨ Ready to showcase SmileCoin to the world! ✨');