#!/usr/bin/env node

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function runHealthChecks() {
    console.log('🏥 Running comprehensive health checks...\n');
    
    let allPassed = true;
    const results = [];

    // Load environment
    require('dotenv').config();
    
    const {
        RPC_URL,
        CONTRACT_ADDRESS,
        DATABASE_URL,
        API_PORT = 3000
    } = process.env;

    // 1. Check environment variables
    console.log('1. Checking environment configuration...');
    const requiredVars = ['RPC_URL', 'CONTRACT_ADDRESS', 'DATABASE_URL', 'ADMIN_PRIVATE_KEY'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('❌ Missing environment variables:', missingVars.join(', '));
        results.push({ check: 'Environment Variables', status: 'FAILED', details: `Missing: ${missingVars.join(', ')}` });
        allPassed = false;
    } else {
        console.log('✅ All required environment variables present');
        results.push({ check: 'Environment Variables', status: 'PASSED' });
    }

    // 2. Check blockchain network connectivity
    console.log('\n2. Checking blockchain network connectivity...');
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const network = await provider.getNetwork();
        const blockNumber = await provider.getBlockNumber();
        
        console.log(`✅ Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
        console.log(`✅ Latest block: ${blockNumber}`);
        results.push({ 
            check: 'Blockchain Connectivity', 
            status: 'PASSED', 
            details: `Network: ${network.name}, Block: ${blockNumber}` 
        });
    } catch (error) {
        console.log('❌ Blockchain connectivity failed:', error.message);
        results.push({ check: 'Blockchain Connectivity', status: 'FAILED', details: error.message });
        allPassed = false;
    }

    // 3. Check smart contract deployment
    console.log('\n3. Checking smart contract deployment...');
    try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const code = await provider.getCode(CONTRACT_ADDRESS);
        
        if (code === '0x') {
            console.log('❌ No contract code found at address:', CONTRACT_ADDRESS);
            results.push({ check: 'Contract Deployment', status: 'FAILED', details: 'No code at address' });
            allPassed = false;
        } else {
            console.log('✅ Contract deployed successfully');
            
            // Try to interact with contract
            try {
                const contractPath = path.join(__dirname, '../artifacts/contracts/SmileCoin.sol/SmileCoin.json');
                if (fs.existsSync(contractPath)) {
                    const contractABI = JSON.parse(fs.readFileSync(contractPath)).abi;
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
                    
                    const name = await contract.name();
                    const symbol = await contract.symbol();
                    console.log(`✅ Contract interaction successful: ${name} (${symbol})`);
                    results.push({ 
                        check: 'Contract Deployment', 
                        status: 'PASSED', 
                        details: `${name} (${symbol})` 
                    });
                } else {
                    console.log('⚠️  Contract ABI not found, basic deployment check passed');
                    results.push({ check: 'Contract Deployment', status: 'PASSED', details: 'Basic check only' });
                }
            } catch (contractError) {
                console.log('⚠️  Contract deployed but interaction failed:', contractError.message);
                results.push({ 
                    check: 'Contract Deployment', 
                    status: 'PARTIAL', 
                    details: 'Deployed but interaction failed' 
                });
            }
        }
    } catch (error) {
        console.log('❌ Contract check failed:', error.message);
        results.push({ check: 'Contract Deployment', status: 'FAILED', details: error.message });
        allPassed = false;
    }

    // 4. Check database connectivity
    console.log('\n4. Checking database connectivity...');
    try {
        const { Client } = require('pg');
        const client = new Client({ connectionString: DATABASE_URL });
        
        await client.connect();
        const result = await client.query('SELECT NOW()');
        await client.end();
        
        console.log('✅ Database connection successful');
        console.log(`✅ Database time: ${result.rows[0].now}`);
        results.push({ check: 'Database Connectivity', status: 'PASSED' });
    } catch (error) {
        console.log('❌ Database connection failed:', error.message);
        results.push({ check: 'Database Connectivity', status: 'FAILED', details: error.message });
        allPassed = false;
    }

    // 5. Check required database tables
    console.log('\n5. Checking database schema...');
    try {
        const { Client } = require('pg');
        const client = new Client({ connectionString: DATABASE_URL });
        
        await client.connect();
        
        const requiredTables = ['wallets', 'blockchain_transactions', 'api_usage', 'network_status'];
        const tableCheck = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ANY($1)
        `, [requiredTables]);
        
        const existingTables = tableCheck.rows.map(row => row.table_name);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        await client.end();
        
        if (missingTables.length > 0) {
            console.log('❌ Missing database tables:', missingTables.join(', '));
            results.push({ 
                check: 'Database Schema', 
                status: 'FAILED', 
                details: `Missing tables: ${missingTables.join(', ')}` 
            });
            allPassed = false;
        } else {
            console.log('✅ All required database tables present');
            results.push({ check: 'Database Schema', status: 'PASSED' });
        }
    } catch (error) {
        console.log('❌ Database schema check failed:', error.message);
        results.push({ check: 'Database Schema', status: 'FAILED', details: error.message });
        allPassed = false;
    }

    // 6. Check API service (if running)
    console.log('\n6. Checking API service...');
    try {
        const response = await fetch(`http://localhost:${API_PORT}/health`);
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API service is running and healthy');
            results.push({ check: 'API Service', status: 'PASSED', details: data });
        } else {
            console.log('⚠️  API service responded but not healthy');
            results.push({ check: 'API Service', status: 'PARTIAL', details: `Status: ${response.status}` });
        }
    } catch (error) {
        console.log('⚠️  API service not running (this is normal for fresh deployment)');
        results.push({ check: 'API Service', status: 'SKIPPED', details: 'Service not running' });
    }

    // 7. Check file structure
    console.log('\n7. Checking project file structure...');
    const requiredFiles = [
        'package.json',
        'hardhat.config.ts',
        'contracts/SmileCoin.sol',
        'database/init.sql',
        'src/api/app.ts',
        'src/sdk/SmileCoinSDK.ts'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));
    
    if (missingFiles.length > 0) {
        console.log('❌ Missing required files:', missingFiles.join(', '));
        results.push({ 
            check: 'File Structure', 
            status: 'FAILED', 
            details: `Missing: ${missingFiles.join(', ')}` 
        });
        allPassed = false;
    } else {
        console.log('✅ All required files present');
        results.push({ check: 'File Structure', status: 'PASSED' });
    }

    // Generate summary
    console.log('\n' + '='.repeat(50));
    console.log('🏥 HEALTH CHECK SUMMARY');
    console.log('='.repeat(50));
    
    results.forEach(result => {
        const icon = result.status === 'PASSED' ? '✅' : 
                    result.status === 'PARTIAL' ? '⚠️' : 
                    result.status === 'SKIPPED' ? '⏭️' : '❌';
        console.log(`${icon} ${result.check}: ${result.status}`);
        if (result.details) {
            console.log(`   ${result.details}`);
        }
    });
    
    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('🎉 ALL CRITICAL HEALTH CHECKS PASSED!');
        console.log('🚀 System is ready for operation');
        process.exit(0);
    } else {
        console.log('❌ SOME HEALTH CHECKS FAILED');
        console.log('🔧 Please address the issues above before proceeding');
        process.exit(1);
    }
}

// Handle missing dependencies gracefully
try {
    runHealthChecks().catch(error => {
        console.error('❌ Health check failed with error:', error.message);
        process.exit(1);
    });
} catch (error) {
    console.error('❌ Failed to start health checks:', error.message);
    console.log('💡 Make sure all dependencies are installed: npm install');
    process.exit(1);
}