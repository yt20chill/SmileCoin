#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Sample data configuration
const SAMPLE_TOURISTS = [
    { id: 'tourist-001', country: 'USA', name: 'John Smith' },
    { id: 'tourist-002', country: 'Canada', name: 'Sarah Johnson' },
    { id: 'tourist-003', country: 'UK', name: 'David Wilson' },
    { id: 'tourist-004', country: 'Germany', name: 'Anna Mueller' },
    { id: 'tourist-005', country: 'France', name: 'Pierre Dubois' }
];

const SAMPLE_RESTAURANTS = [
    { id: 'restaurant-001', name: 'Pizza Palace', placeId: 'ChIJN1t_tDeuEmsRUsoyG83frY4' },
    { id: 'restaurant-002', name: 'Burger Barn', placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI' },
    { id: 'restaurant-003', name: 'Sushi Spot', placeId: 'ChIJOwg_06VPwokRYv534QaPC8g' },
    { id: 'restaurant-004', name: 'Taco Town', placeId: 'ChIJ2eUgeAK6j4ARbn5u_wAGqWA' },
    { id: 'restaurant-005', name: 'Pasta Place', placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo' }
];

// Colors for output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

class SampleDataCreator {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        this.contract = null;
        this.sampleData = {
            tourists: [],
            restaurants: [],
            wallets: [],
            transactions: []
        };
    }

    async initialize() {
        // Load contract
        const contractPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'SmileCoin.sol', 'SmileCoin.json');
        if (!fs.existsSync(contractPath)) {
            throw new Error('Contract artifacts not found. Please compile contracts first.');
        }

        const contractABI = JSON.parse(fs.readFileSync(contractPath)).abi;
        this.contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractABI, this.adminWallet);
        
        log('green', '✅ Contract initialized');
    }

    generateWallet(userId) {
        // Generate deterministic wallet from user ID (similar to WalletManager)
        const seed = ethers.keccak256(ethers.toUtf8Bytes(userId + (process.env.WALLET_SEED || 'sample-seed')));
        const wallet = new ethers.Wallet(seed, this.provider);
        return wallet;
    }

    async createSampleTourists() {
        log('blue', '👥 Creating sample tourists...');
        
        for (const touristData of SAMPLE_TOURISTS) {
            try {
                const wallet = this.generateWallet(touristData.id);
                const arrivalTime = Math.floor(Date.now() / 1000) - (Math.random() * 7 * 24 * 60 * 60); // Random arrival in last 7 days
                const departureTime = arrivalTime + (14 * 24 * 60 * 60); // 14 days stay
                
                log('yellow', `  Registering ${touristData.name} from ${touristData.country}...`);
                
                const tx = await this.contract.registerTourist(
                    wallet.address,
                    touristData.country,
                    arrivalTime,
                    departureTime
                );
                
                await tx.wait();
                
                this.sampleData.tourists.push({
                    ...touristData,
                    walletAddress: wallet.address,
                    privateKey: wallet.privateKey,
                    arrivalTime,
                    departureTime,
                    registrationTx: tx.hash
                });
                
                log('green', `    ✅ Registered: ${wallet.address}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                log('red', `    ❌ Failed to register ${touristData.name}: ${error.message}`);
            }
        }
    }

    async createSampleRestaurants() {
        log('blue', '🍽️  Creating sample restaurants...');
        
        for (const restaurantData of SAMPLE_RESTAURANTS) {
            try {
                const wallet = this.generateWallet(restaurantData.id);
                
                log('yellow', `  Registering ${restaurantData.name}...`);
                
                const tx = await this.contract.registerRestaurant(
                    wallet.address,
                    restaurantData.placeId
                );
                
                await tx.wait();
                
                this.sampleData.restaurants.push({
                    ...restaurantData,
                    walletAddress: wallet.address,
                    privateKey: wallet.privateKey,
                    registrationTx: tx.hash
                });
                
                log('green', `    ✅ Registered: ${wallet.address}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                log('red', `    ❌ Failed to register ${restaurantData.name}: ${error.message}`);
            }
        }
    }

    async issueSampleCoins() {
        log('blue', '🪙 Issuing sample coins to tourists...');
        
        for (const tourist of this.sampleData.tourists) {
            try {
                log('yellow', `  Issuing coins to ${tourist.name}...`);
                
                const tx = await this.contract.issueDailyCoins(tourist.walletAddress);
                await tx.wait();
                
                this.sampleData.transactions.push({
                    type: 'daily_issuance',
                    from: this.adminWallet.address,
                    to: tourist.walletAddress,
                    amount: '10.0',
                    transactionHash: tx.hash,
                    timestamp: new Date().toISOString()
                });
                
                log('green', `    ✅ Issued 10 coins: ${tx.hash}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                log('red', `    ❌ Failed to issue coins to ${tourist.name}: ${error.message}`);
            }
        }
    }

    async createSampleTransfers() {
        log('blue', '💸 Creating sample transfers...');
        
        if (this.sampleData.tourists.length === 0 || this.sampleData.restaurants.length === 0) {
            log('yellow', '⚠️  No tourists or restaurants available for transfers');
            return;
        }
        
        // Create some random transfers
        const numTransfers = Math.min(10, this.sampleData.tourists.length * 2);
        
        for (let i = 0; i < numTransfers; i++) {
            try {
                const tourist = this.sampleData.tourists[Math.floor(Math.random() * this.sampleData.tourists.length)];
                const restaurant = this.sampleData.restaurants[Math.floor(Math.random() * this.sampleData.restaurants.length)];
                const amount = Math.floor(Math.random() * 3) + 1; // 1-3 coins
                
                log('yellow', `  Transfer ${amount} coins from ${tourist.name} to ${restaurant.name}...`);
                
                // Create tourist wallet instance
                const touristWallet = new ethers.Wallet(tourist.privateKey, this.provider);
                const contractWithTourist = this.contract.connect(touristWallet);
                
                const tx = await contractWithTourist.transferToRestaurant(
                    restaurant.walletAddress,
                    ethers.parseEther(amount.toString()),
                    restaurant.placeId
                );
                
                await tx.wait();
                
                this.sampleData.transactions.push({
                    type: 'restaurant_transfer',
                    from: tourist.walletAddress,
                    to: restaurant.walletAddress,
                    amount: amount.toString(),
                    transactionHash: tx.hash,
                    timestamp: new Date().toISOString(),
                    touristId: tourist.id,
                    restaurantId: restaurant.id
                });
                
                log('green', `    ✅ Transferred ${amount} coins: ${tx.hash}`);
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                log('red', `    ❌ Transfer failed: ${error.message}`);
            }
        }
    }

    async saveSampleData() {
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const sampleDataFile = path.join(dataDir, 'sample-data.json');
        
        // Add metadata
        this.sampleData.metadata = {
            network: process.env.NETWORK || 'unknown',
            contractAddress: process.env.CONTRACT_ADDRESS,
            createdAt: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development'
        };
        
        fs.writeFileSync(sampleDataFile, JSON.stringify(this.sampleData, null, 2));
        log('green', `✅ Sample data saved to: ${sampleDataFile}`);
        
        // Create separate files for easy access
        const walletsFile = path.join(dataDir, 'sample-wallets.json');
        const wallets = [
            ...this.sampleData.tourists.map(t => ({ 
                type: 'tourist', 
                id: t.id, 
                name: t.name, 
                address: t.walletAddress, 
                privateKey: t.privateKey 
            })),
            ...this.sampleData.restaurants.map(r => ({ 
                type: 'restaurant', 
                id: r.id, 
                name: r.name, 
                address: r.walletAddress, 
                privateKey: r.privateKey 
            }))
        ];
        
        fs.writeFileSync(walletsFile, JSON.stringify(wallets, null, 2));
        log('green', `✅ Sample wallets saved to: ${walletsFile}`);
    }

    async displaySummary() {
        log('blue', '\n📊 Sample Data Summary');
        log('blue', '=====================');
        
        console.log(`👥 Tourists: ${this.sampleData.tourists.length}`);
        console.log(`🍽️  Restaurants: ${this.sampleData.restaurants.length}`);
        console.log(`💸 Transactions: ${this.sampleData.transactions.length}`);
        
        if (this.sampleData.tourists.length > 0) {
            console.log('\n👥 Sample Tourists:');
            this.sampleData.tourists.forEach(t => {
                console.log(`  ${t.name} (${t.country}): ${t.walletAddress}`);
            });
        }
        
        if (this.sampleData.restaurants.length > 0) {
            console.log('\n🍽️  Sample Restaurants:');
            this.sampleData.restaurants.forEach(r => {
                console.log(`  ${r.name}: ${r.walletAddress}`);
            });
        }
        
        if (this.sampleData.transactions.length > 0) {
            console.log('\n💸 Recent Transactions:');
            this.sampleData.transactions.slice(-5).forEach(tx => {
                console.log(`  ${tx.type}: ${tx.amount} coins (${tx.transactionHash.substring(0, 10)}...)`);
            });
        }
    }

    async createAllSampleData() {
        log('blue', '🚀 Creating comprehensive sample data...\n');
        
        await this.initialize();
        await this.createSampleTourists();
        await this.createSampleRestaurants();
        await this.issueSampleCoins();
        await this.createSampleTransfers();
        await this.saveSampleData();
        await this.displaySummary();
        
        log('green', '\n🎉 Sample data creation completed!');
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0] || 'all';
    
    // Validate environment
    if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
        log('red', '❌ Missing required environment variables:');
        log('red', '   RPC_URL, ADMIN_PRIVATE_KEY, CONTRACT_ADDRESS');
        process.exit(1);
    }
    
    const creator = new SampleDataCreator();
    
    try {
        switch (command) {
            case 'tourists':
                await creator.initialize();
                await creator.createSampleTourists();
                await creator.saveSampleData();
                break;
                
            case 'restaurants':
                await creator.initialize();
                await creator.createSampleRestaurants();
                await creator.saveSampleData();
                break;
                
            case 'coins':
                await creator.initialize();
                // Load existing data if available
                const dataFile = path.join(__dirname, '..', 'data', 'sample-data.json');
                if (fs.existsSync(dataFile)) {
                    creator.sampleData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
                }
                await creator.issueSampleCoins();
                await creator.saveSampleData();
                break;
                
            case 'transfers':
                await creator.initialize();
                // Load existing data if available
                const transferDataFile = path.join(__dirname, '..', 'data', 'sample-data.json');
                if (fs.existsSync(transferDataFile)) {
                    creator.sampleData = JSON.parse(fs.readFileSync(transferDataFile, 'utf8'));
                }
                await creator.createSampleTransfers();
                await creator.saveSampleData();
                break;
                
            case 'all':
            default:
                await creator.createAllSampleData();
                break;
        }
    } catch (error) {
        log('red', `❌ Error: ${error.message}`);
        process.exit(1);
    }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    log('red', `❌ Unhandled error: ${error.message}`);
    process.exit(1);
});

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        log('red', `❌ Error: ${error.message}`);
        process.exit(1);
    });
}

module.exports = SampleDataCreator;