#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

class DeploymentTester {
    constructor() {
        this.testResults = [];
        this.projectRoot = process.cwd();
    }

    logResult(testName, status, details = '') {
        this.testResults.push({ testName, status, details });
        
        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
        
        log(color, `${icon} ${testName}: ${status}`);
        if (details) {
            log(color, `   ${details}`);
        }
    }

    async testFileStructure() {
        log('blue', '\n🗂️  Testing File Structure...');
        
        const requiredFiles = [
            'scripts/deploy.sh',
            'scripts/docker-manager.sh',
            'scripts/contract-manager.sh',
            'scripts/health-check.js',
            'scripts/wallet-funding.js',
            'scripts/create-sample-data.js',
            'scripts/backup.sh',
            'docker-compose.yml',
            'docker-compose.development.yml',
            'docker-compose.staging.yml',
            'docker-compose.production.yml',
            '.env.development',
            '.env.staging',
            '.env.production',
            'Dockerfile.api',
            'Dockerfile.hardhat',
            'database/init.sql',
            'DEPLOYMENT.md'
        ];

        let missingFiles = [];
        
        for (const file of requiredFiles) {
            if (fs.existsSync(path.join(this.projectRoot, file))) {
                this.logResult(`File: ${file}`, 'PASS');
            } else {
                this.logResult(`File: ${file}`, 'FAIL', 'File not found');
                missingFiles.push(file);
            }
        }

        if (missingFiles.length === 0) {
            this.logResult('File Structure', 'PASS', 'All required files present');
        } else {
            this.logResult('File Structure', 'FAIL', `Missing files: ${missingFiles.join(', ')}`);
        }
    }

    async testScriptPermissions() {
        log('blue', '\n🔐 Testing Script Permissions...');
        
        const executableScripts = [
            'scripts/deploy.sh',
            'scripts/docker-manager.sh',
            'scripts/contract-manager.sh',
            'scripts/health-check.js',
            'scripts/wallet-funding.js',
            'scripts/create-sample-data.js',
            'scripts/backup.sh',
            'scripts/test-deployment.sh'
        ];

        for (const script of executableScripts) {
            const scriptPath = path.join(this.projectRoot, script);
            if (fs.existsSync(scriptPath)) {
                try {
                    const stats = fs.statSync(scriptPath);
                    const isExecutable = !!(stats.mode & parseInt('111', 8));
                    
                    if (isExecutable) {
                        this.logResult(`Permissions: ${script}`, 'PASS');
                    } else {
                        this.logResult(`Permissions: ${script}`, 'FAIL', 'Not executable');
                    }
                } catch (error) {
                    this.logResult(`Permissions: ${script}`, 'FAIL', error.message);
                }
            } else {
                this.logResult(`Permissions: ${script}`, 'SKIP', 'File not found');
            }
        }
    }

    async testEnvironmentFiles() {
        log('blue', '\n🌍 Testing Environment Files...');
        
        const envFiles = ['.env.development', '.env.staging', '.env.production'];
        const requiredVars = [
            'NODE_ENV',
            'RPC_URL',
            'DATABASE_URL',
            'ADMIN_PRIVATE_KEY',
            'API_PORT'
        ];

        for (const envFile of envFiles) {
            const envPath = path.join(this.projectRoot, envFile);
            if (fs.existsSync(envPath)) {
                try {
                    const content = fs.readFileSync(envPath, 'utf8');
                    let missingVars = [];
                    
                    for (const varName of requiredVars) {
                        const regex = new RegExp(`^${varName}=`, 'm');
                        if (regex.test(content)) {
                            this.logResult(`${envFile}: ${varName}`, 'PASS');
                        } else {
                            this.logResult(`${envFile}: ${varName}`, 'FAIL', 'Variable not found');
                            missingVars.push(varName);
                        }
                    }
                    
                    if (missingVars.length === 0) {
                        this.logResult(`Environment File: ${envFile}`, 'PASS');
                    } else {
                        this.logResult(`Environment File: ${envFile}`, 'FAIL', `Missing: ${missingVars.join(', ')}`);
                    }
                } catch (error) {
                    this.logResult(`Environment File: ${envFile}`, 'FAIL', error.message);
                }
            } else {
                this.logResult(`Environment File: ${envFile}`, 'FAIL', 'File not found');
            }
        }
    }

    async testDockerConfiguration() {
        log('blue', '\n🐳 Testing Docker Configuration...');
        
        try {
            // Test base docker-compose.yml syntax
            execSync('docker-compose -f docker-compose.yml config', { 
                stdio: 'pipe',
                cwd: this.projectRoot 
            });
            this.logResult('Docker Compose Base Config', 'PASS');
        } catch (error) {
            this.logResult('Docker Compose Base Config', 'FAIL', 'Syntax error in base config');
        }

        // Test environment-specific configurations
        const envConfigs = ['development', 'staging', 'production'];
        
        for (const env of envConfigs) {
            try {
                execSync(`docker-compose -f docker-compose.yml -f docker-compose.${env}.yml config`, {
                    stdio: 'pipe',
                    cwd: this.projectRoot
                });
                this.logResult(`Docker Compose ${env} Config`, 'PASS');
            } catch (error) {
                this.logResult(`Docker Compose ${env} Config`, 'FAIL', `Syntax error in ${env} config`);
            }
        }
    }

    async testPackageJsonScripts() {
        log('blue', '\n📦 Testing Package.json Scripts...');
        
        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const scripts = packageJson.scripts || {};
                
                const expectedScripts = [
                    'deploy',
                    'deploy:dev',
                    'deploy:staging',
                    'deploy:prod',
                    'docker',
                    'docker:dev',
                    'contract:deploy',
                    'wallet:fund',
                    'sample:create',
                    'backup',
                    'health'
                ];
                
                let missingScripts = [];
                
                for (const script of expectedScripts) {
                    if (scripts[script]) {
                        this.logResult(`NPM Script: ${script}`, 'PASS');
                    } else {
                        this.logResult(`NPM Script: ${script}`, 'FAIL', 'Script not found');
                        missingScripts.push(script);
                    }
                }
                
                if (missingScripts.length === 0) {
                    this.logResult('Package.json Scripts', 'PASS');
                } else {
                    this.logResult('Package.json Scripts', 'FAIL', `Missing: ${missingScripts.join(', ')}`);
                }
            } catch (error) {
                this.logResult('Package.json Scripts', 'FAIL', error.message);
            }
        } else {
            this.logResult('Package.json Scripts', 'FAIL', 'package.json not found');
        }
    }

    async testContractCompilation() {
        log('blue', '\n🔨 Testing Contract Compilation...');
        
        try {
            // Check if hardhat.config.ts exists
            if (fs.existsSync(path.join(this.projectRoot, 'hardhat.config.ts'))) {
                this.logResult('Hardhat Config', 'PASS');
                
                // Check if contracts directory exists
                if (fs.existsSync(path.join(this.projectRoot, 'contracts'))) {
                    this.logResult('Contracts Directory', 'PASS');
                    
                    // Try to compile contracts
                    try {
                        execSync('npx hardhat compile', {
                            stdio: 'pipe',
                            cwd: this.projectRoot,
                            timeout: 30000
                        });
                        this.logResult('Contract Compilation', 'PASS');
                        
                        // Check if artifacts were generated
                        if (fs.existsSync(path.join(this.projectRoot, 'artifacts'))) {
                            this.logResult('Contract Artifacts', 'PASS');
                        } else {
                            this.logResult('Contract Artifacts', 'FAIL', 'Artifacts not generated');
                        }
                    } catch (error) {
                        this.logResult('Contract Compilation', 'FAIL', 'Compilation failed');
                    }
                } else {
                    this.logResult('Contracts Directory', 'FAIL', 'contracts/ directory not found');
                }
            } else {
                this.logResult('Hardhat Config', 'FAIL', 'hardhat.config.ts not found');
            }
        } catch (error) {
            this.logResult('Contract Compilation Test', 'FAIL', error.message);
        }
    }

    async testScriptExecution() {
        log('blue', '\n⚙️  Testing Script Execution...');
        
        // Test deployment script execution (basic check)
        const deployScriptPath = path.join(this.projectRoot, 'scripts', 'deploy.sh');
        if (fs.existsSync(deployScriptPath)) {
            try {
                const stats = fs.statSync(deployScriptPath);
                const isExecutable = !!(stats.mode & parseInt('111', 8));
                
                if (isExecutable) {
                    // Check if script contains expected content
                    const content = fs.readFileSync(deployScriptPath, 'utf8');
                    if (content.includes('Starting Tourist Rewards Blockchain Infrastructure Deployment')) {
                        this.logResult('Deploy Script Content', 'PASS');
                    } else {
                        this.logResult('Deploy Script Content', 'FAIL', 'Expected content not found');
                    }
                } else {
                    this.logResult('Deploy Script Content', 'FAIL', 'Script not executable');
                }
            } catch (error) {
                this.logResult('Deploy Script Content', 'FAIL', error.message);
            }
        } else {
            this.logResult('Deploy Script Content', 'FAIL', 'Script not found');
        }

        // Test docker manager script help
        try {
            const output = execSync('./scripts/docker-manager.sh', {
                stdio: 'pipe',
                cwd: this.projectRoot,
                timeout: 10000
            }).toString();
            
            if (output.includes('Docker Manager for Tourist Rewards Blockchain Infrastructure')) {
                this.logResult('Docker Manager Help', 'PASS');
            } else {
                this.logResult('Docker Manager Help', 'FAIL', 'Unexpected help output');
            }
        } catch (error) {
            this.logResult('Docker Manager Help', 'FAIL', 'Script execution failed');
        }

        // Test contract manager script help
        try {
            const output = execSync('./scripts/contract-manager.sh', {
                stdio: 'pipe',
                cwd: this.projectRoot,
                timeout: 10000
            }).toString();
            
            if (output.includes('Contract Manager for Tourist Rewards System')) {
                this.logResult('Contract Manager Help', 'PASS');
            } else {
                this.logResult('Contract Manager Help', 'FAIL', 'Unexpected help output');
            }
        } catch (error) {
            this.logResult('Contract Manager Help', 'FAIL', 'Script execution failed');
        }
    }

    async testDatabaseSchema() {
        log('blue', '\n🗄️  Testing Database Schema...');
        
        const schemaPath = path.join(this.projectRoot, 'database', 'init.sql');
        if (fs.existsSync(schemaPath)) {
            try {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                
                const requiredTables = ['wallets', 'blockchain_transactions', 'api_usage', 'network_status'];
                let missingTables = [];
                
                for (const table of requiredTables) {
                    if (schema.includes(`CREATE TABLE ${table}`)) {
                        this.logResult(`Database Table: ${table}`, 'PASS');
                    } else {
                        this.logResult(`Database Table: ${table}`, 'FAIL', 'Table definition not found');
                        missingTables.push(table);
                    }
                }
                
                if (missingTables.length === 0) {
                    this.logResult('Database Schema', 'PASS');
                } else {
                    this.logResult('Database Schema', 'FAIL', `Missing tables: ${missingTables.join(', ')}`);
                }
            } catch (error) {
                this.logResult('Database Schema', 'FAIL', error.message);
            }
        } else {
            this.logResult('Database Schema', 'FAIL', 'database/init.sql not found');
        }
    }

    generateReport() {
        log('blue', '\n📊 Test Report');
        log('blue', '=============');
        
        const summary = this.testResults.reduce((acc, result) => {
            acc[result.status] = (acc[result.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { total: 0, PASS: 0, FAIL: 0, SKIP: 0 });

        log('green', `✅ Passed: ${summary.PASS || 0}`);
        log('red', `❌ Failed: ${summary.FAIL || 0}`);
        log('yellow', `⏭️  Skipped: ${summary.SKIP || 0}`);
        log('blue', `📊 Total: ${summary.total}`);

        if (summary.total > 0) {
            const successRate = Math.round((summary.PASS / summary.total) * 100);
            log('blue', `📈 Success Rate: ${successRate}%`);
        }

        // Show failed tests
        const failedTests = this.testResults.filter(r => r.status === 'FAIL');
        if (failedTests.length > 0) {
            log('red', '\n❌ Failed Tests:');
            failedTests.forEach(test => {
                log('red', `  • ${test.testName}: ${test.details}`);
            });
        }

        return summary.FAIL === 0;
    }

    async runAllTests() {
        log('blue', '🧪 Starting Deployment Integration Tests');
        log('blue', '========================================');

        await this.testFileStructure();
        await this.testScriptPermissions();
        await this.testEnvironmentFiles();
        await this.testDockerConfiguration();
        await this.testPackageJsonScripts();
        await this.testContractCompilation();
        await this.testScriptExecution();
        await this.testDatabaseSchema();

        const success = this.generateReport();
        
        if (success) {
            log('green', '\n🎉 All deployment tests passed!');
            log('green', '🚀 Deployment automation is ready for use.');
        } else {
            log('red', '\n❌ Some deployment tests failed.');
            log('red', '🔧 Please fix the issues above before deploying.');
        }

        return success;
    }
}

// CLI execution
async function main() {
    const tester = new DeploymentTester();
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
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

module.exports = DeploymentTester;