#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Configuration
const FUNDING_AMOUNT = process.env.WALLET_FUNDING_AMOUNT || '0.1';
const AUTO_FUND_THRESHOLD = process.env.AUTO_FUND_THRESHOLD || '0.01';
const NETWORK = process.env.NETWORK || 'polygon-mumbai';

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

class WalletFunder {
    constructor() {
        this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
        this.fundedWallets = new Set();
        this.loadFundingHistory();
    }

    loadFundingHistory() {
        const historyFile = path.join(__dirname, '..', 'data', 'funding-history.json');
        try {
            if (fs.existsSync(historyFile)) {
                const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
                this.fundedWallets = new Set(history.fundedWallets || []);
                log('green', `✅ Loaded funding history: ${this.fundedWallets.size} wallets`);
            }
        } catch (error) {
            log('yellow', '⚠️  Could not load funding history, starting fresh');
        }
    }

    saveFundingHistory() {
        const historyFile = path.join(__dirname, '..', 'data', 'funding-history.json');
        const dataDir = path.dirname(historyFile);
        
        // Create data directory if it doesn't exist
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        const history = {
            network: NETWORK,
            lastUpdated: new Date().toISOString(),
            fundedWallets: Array.from(this.fundedWallets)
        };
        
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
        log('green', `✅ Saved funding history: ${this.fundedWallets.size} wallets`);
    }

    async getBalance(address) {
        try {
            const balance = await this.provider.getBalance(address);
            return parseFloat(ethers.formatEther(balance));
        } catch (error) {
            log('red', `❌ Error getting balance for ${address}: ${error.message}`);
            return 0;
        }
    }

    async fundWallet(address, amount = FUNDING_AMOUNT) {
        try {
            log('blue', `💰 Funding wallet ${address} with ${amount} MATIC...`);
            
            const tx = await this.adminWallet.sendTransaction({
                to: address,
                value: ethers.parseEther(amount.toString())
            });
            
            log('yellow', `⏳ Transaction sent: ${tx.hash}`);
            
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                log('green', `✅ Wallet funded successfully! Gas used: ${receipt.gasUsed}`);
                this.fundedWallets.add(address);
                return true;
            } else {
                log('red', `❌ Transaction failed`);
                return false;
            }
        } catch (error) {
            log('red', `❌ Error funding wallet ${address}: ${error.message}`);
            return false;
        }
    }

    async checkAndFundWallet(address) {
        const balance = await this.getBalance(address);
        
        log('blue', `📊 Wallet ${address}: ${balance} MATIC`);
        
        if (balance < parseFloat(AUTO_FUND_THRESHOLD)) {
            log('yellow', `⚠️  Balance below threshold (${AUTO_FUND_THRESHOLD} MATIC)`);
            
            if (this.fundedWallets.has(address)) {
                log('yellow', `⚠️  Wallet already funded before, skipping auto-funding`);
                return false;
            }
            
            return await this.fundWallet(address);
        } else {
            log('green', `✅ Wallet has sufficient balance`);
            return true;
        }
    }

    async fundMultipleWallets(addresses) {
        log('blue', `🚀 Starting batch funding for ${addresses.length} wallets...`);
        
        let successCount = 0;
        let failureCount = 0;
        
        for (const address of addresses) {
            const success = await this.checkAndFundWallet(address);
            if (success) {
                successCount++;
            } else {
                failureCount++;
            }
            
            // Small delay between transactions to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        log('blue', `📊 Batch funding complete:`);
        log('green', `  ✅ Successful: ${successCount}`);
        log('red', `  ❌ Failed: ${failureCount}`);
        
        this.saveFundingHistory();
    }

    async generateTestWallets(count = 5) {
        log('blue', `🔧 Generating ${count} test wallets...`);
        
        const wallets = [];
        for (let i = 0; i < count; i++) {
            const wallet = ethers.Wallet.createRandom();
            wallets.push({
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic.phrase
            });
        }
        
        // Save test wallets
        const walletsFile = path.join(__dirname, '..', 'data', 'test-wallets.json');
        const dataDir = path.dirname(walletsFile);
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        
        fs.writeFileSync(walletsFile, JSON.stringify(wallets, null, 2));
        log('green', `✅ Test wallets saved to: ${walletsFile}`);
        
        // Fund the test wallets
        const addresses = wallets.map(w => w.address);
        await this.fundMultipleWallets(addresses);
        
        return wallets;
    }

    async checkAdminBalance() {
        const balance = await this.getBalance(this.adminWallet.address);
        log('blue', `👤 Admin wallet balance: ${balance} MATIC`);
        
        if (balance < 1.0) {
            log('yellow', `⚠️  Admin wallet balance is low!`);
            
            if (NETWORK.includes('mumbai')) {
                log('yellow', `💡 Fund your admin wallet from Mumbai faucet:`);
                log('yellow', `   https://faucet.polygon.technology/`);
                log('yellow', `   Address: ${this.adminWallet.address}`);
            }
        }
        
        return balance;
    }

    async monitorWallets(addresses, intervalMs = 60000) {
        log('blue', `👀 Starting wallet monitoring (checking every ${intervalMs/1000}s)...`);
        
        const checkWallets = async () => {
            log('blue', `🔍 Checking ${addresses.length} wallets...`);
            
            for (const address of addresses) {
                await this.checkAndFundWallet(address);
            }
            
            this.saveFundingHistory();
        };
        
        // Initial check
        await checkWallets();
        
        // Set up interval
        setInterval(checkWallets, intervalMs);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY) {
        log('red', '❌ Missing required environment variables: RPC_URL, ADMIN_PRIVATE_KEY');
        process.exit(1);
    }
    
    const funder = new WalletFunder();
    
    // Check admin balance first
    await funder.checkAdminBalance();
    
    switch (command) {
        case 'fund':
            const address = args[1];
            const amount = args[2] || FUNDING_AMOUNT;
            
            if (!address) {
                log('red', '❌ Usage: node wallet-funding.js fund <address> [amount]');
                process.exit(1);
            }
            
            await funder.fundWallet(address, amount);
            break;
            
        case 'check':
            const checkAddress = args[1];
            
            if (!checkAddress) {
                log('red', '❌ Usage: node wallet-funding.js check <address>');
                process.exit(1);
            }
            
            await funder.checkAndFundWallet(checkAddress);
            break;
            
        case 'batch':
            const addressesFile = args[1];
            
            if (!addressesFile || !fs.existsSync(addressesFile)) {
                log('red', '❌ Usage: node wallet-funding.js batch <addresses-file.json>');
                process.exit(1);
            }
            
            const addresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
            await funder.fundMultipleWallets(addresses);
            break;
            
        case 'generate':
            const count = parseInt(args[1]) || 5;
            await funder.generateTestWallets(count);
            break;
            
        case 'monitor':
            const monitorFile = args[1];
            const interval = parseInt(args[2]) || 60000;
            
            if (!monitorFile || !fs.existsSync(monitorFile)) {
                log('red', '❌ Usage: node wallet-funding.js monitor <addresses-file.json> [interval-ms]');
                process.exit(1);
            }
            
            const monitorAddresses = JSON.parse(fs.readFileSync(monitorFile, 'utf8'));
            await funder.monitorWallets(monitorAddresses, interval);
            break;
            
        default:
            log('blue', '💰 Wallet Funding Tool for Tourist Rewards System');
            log('blue', '================================================');
            console.log('');
            console.log('Commands:');
            console.log('  fund <address> [amount]     - Fund a specific wallet');
            console.log('  check <address>             - Check and auto-fund if needed');
            console.log('  batch <addresses-file>      - Fund multiple wallets from JSON file');
            console.log('  generate [count]            - Generate and fund test wallets');
            console.log('  monitor <addresses-file>    - Monitor and auto-fund wallets');
            console.log('');
            console.log('Examples:');
            console.log('  node wallet-funding.js fund 0x1234... 0.5');
            console.log('  node wallet-funding.js generate 10');
            console.log('  node wallet-funding.js batch wallets.json');
            console.log('  node wallet-funding.js monitor wallets.json 30000');
            break;
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

module.exports = WalletFunder;