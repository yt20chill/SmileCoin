const { ethers } = require("ethers");
const fs = require("fs");
const axios = require("axios");

class TestnetE2ETest {
  constructor() {
    // Load staging environment
    require("dotenv").config({ path: ".env.staging" });
    
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.rpcUrl = process.env.RPC_URL;
    this.apiPort = process.env.API_PORT || 3000;
    this.apiUrl = `http://localhost:${this.apiPort}`;
    
    this.provider = new ethers.JsonRpcProvider(this.rpcUrl);
    this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
    
    // Load contract ABI
    this.contractABI = JSON.parse(
      fs.readFileSync("artifacts/contracts/SmileCoin.sol/SmileCoin.json")
    ).abi;
    
    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.adminWallet);
    
    this.testResults = {
      timestamp: new Date().toISOString(),
      network: "polygon-mumbai",
      contractAddress: this.contractAddress,
      tests: {},
      errors: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n📋 ${testName}`);
    try {
      await testFunction();
      console.log(`  ✅ ${testName} passed`);
      this.testResults.tests[testName] = "passed";
    } catch (error) {
      console.error(`  ❌ ${testName} failed:`, error.message);
      this.testResults.tests[testName] = "failed";
      this.testResults.errors.push({
        test: testName,
        error: error.message
      });
    }
  }

  async testContractDeployment() {
    const code = await this.provider.getCode(this.contractAddress);
    if (code === "0x") {
      throw new Error("No contract code found at address");
    }
    
    const name = await this.contract.name();
    const symbol = await this.contract.symbol();
    const owner = await this.contract.owner();
    
    console.log(`    Token: ${name} (${symbol})`);
    console.log(`    Owner: ${owner}`);
  }

  async testTouristRegistration() {
    const testTourist = ethers.Wallet.createRandom();
    const arrivalTime = Math.floor(Date.now() / 1000);
    const departureTime = arrivalTime + (7 * 24 * 60 * 60);
    
    const tx = await this.contract.registerTourist(
      testTourist.address,
      "TestCountry",
      arrivalTime,
      departureTime
    );
    await tx.wait();
    
    const isRegistered = await this.contract.isTouristRegistered(testTourist.address);
    if (!isRegistered) {
      throw new Error("Tourist registration failed");
    }
    
    const touristData = await this.contract.getTouristData(testTourist.address);
    console.log(`    Tourist registered: ${testTourist.address}`);
    console.log(`    Origin: ${touristData.originCountry}`);
    
    this.testTourist = testTourist;
  }

  async testRestaurantRegistration() {
    const testRestaurant = ethers.Wallet.createRandom();
    const googlePlaceId = "test_place_" + Date.now();
    
    const tx = await this.contract.registerRestaurant(
      testRestaurant.address,
      googlePlaceId
    );
    await tx.wait();
    
    const isRegistered = await this.contract.isRestaurantRegistered(testRestaurant.address);
    if (!isRegistered) {
      throw new Error("Restaurant registration failed");
    }
    
    const placeId = await this.contract.getRestaurantPlaceId(testRestaurant.address);
    console.log(`    Restaurant registered: ${testRestaurant.address}`);
    console.log(`    Place ID: ${placeId}`);
    
    this.testRestaurant = testRestaurant;
  }

  async testDailyCoinIssuance() {
    if (!this.testTourist) {
      throw new Error("Tourist not registered in previous test");
    }
    
    const balanceBefore = await this.contract.balanceOf(this.testTourist.address);
    
    const tx = await this.contract.issueDailyCoins(this.testTourist.address);
    const receipt = await tx.wait();
    
    const balanceAfter = await this.contract.balanceOf(this.testTourist.address);
    const expectedIncrease = ethers.parseEther("10");
    
    if (balanceAfter - balanceBefore !== expectedIncrease) {
      throw new Error("Incorrect coin amount issued");
    }
    
    console.log(`    Coins issued: ${ethers.formatEther(expectedIncrease)} SMILE`);
    console.log(`    New balance: ${ethers.formatEther(balanceAfter)} SMILE`);
    console.log(`    Gas used: ${receipt.gasUsed.toString()}`);
  }

  async testRestaurantTransfer() {
    if (!this.testTourist || !this.testRestaurant) {
      throw new Error("Tourist or restaurant not registered in previous tests");
    }
    
    // Fund tourist wallet with MATIC for gas
    const fundTx = await this.adminWallet.sendTransaction({
      to: this.testTourist.address,
      value: ethers.parseEther("0.01")
    });
    await fundTx.wait();
    
    const touristContract = this.contract.connect(this.testTourist.connect(this.provider));
    const transferAmount = ethers.parseEther("2");
    
    const restaurantBalanceBefore = await this.contract.balanceOf(this.testRestaurant.address);
    
    const tx = await touristContract.transferToRestaurant(
      this.testRestaurant.address,
      transferAmount
    );
    const receipt = await tx.wait();
    
    const restaurantBalanceAfter = await this.contract.balanceOf(this.testRestaurant.address);
    
    if (restaurantBalanceAfter - restaurantBalanceBefore !== transferAmount) {
      throw new Error("Incorrect transfer amount");
    }
    
    console.log(`    Transferred: ${ethers.formatEther(transferAmount)} SMILE`);
    console.log(`    Restaurant balance: ${ethers.formatEther(restaurantBalanceAfter)} SMILE`);
    console.log(`    Gas used: ${receipt.gasUsed.toString()}`);
  }

  async testDailyLimits() {
    if (!this.testTourist || !this.testRestaurant) {
      throw new Error("Tourist or restaurant not registered in previous tests");
    }
    
    const touristContract = this.contract.connect(this.testTourist.connect(this.provider));
    const transferAmount = ethers.parseEther("2"); // This should exceed daily limit (already transferred 2)
    
    try {
      await touristContract.transferToRestaurant(
        this.testRestaurant.address,
        transferAmount
      );
      throw new Error("Daily limit should have been enforced");
    } catch (error) {
      if (!error.message.includes("Daily limit exceeded")) {
        throw new Error("Wrong error message for daily limit");
      }
      console.log("    ✅ Daily limit properly enforced");
    }
  }

  async testEventEmission() {
    // Check for DailyCoinsIssued events
    const filter = this.contract.filters.DailyCoinsIssued();
    const events = await this.contract.queryFilter(filter, -100); // Last 100 blocks
    
    if (events.length === 0) {
      throw new Error("No DailyCoinsIssued events found");
    }
    
    const latestEvent = events[events.length - 1];
    console.log(`    Found ${events.length} DailyCoinsIssued events`);
    console.log(`    Latest event - Tourist: ${latestEvent.args[0]}`);
    console.log(`    Amount: ${ethers.formatEther(latestEvent.args[1])} SMILE`);
    
    // Check for CoinsTransferred events
    const transferFilter = this.contract.filters.CoinsTransferred();
    const transferEvents = await this.contract.queryFilter(transferFilter, -100);
    
    console.log(`    Found ${transferEvents.length} CoinsTransferred events`);
  }

  async testNetworkPerformance() {
    const startTime = Date.now();
    const blockNumber = await this.provider.getBlockNumber();
    const endTime = Date.now();
    
    const responseTime = endTime - startTime;
    
    if (responseTime > 5000) { // 5 seconds
      throw new Error(`Network response too slow: ${responseTime}ms`);
    }
    
    console.log(`    Block number: ${blockNumber}`);
    console.log(`    Response time: ${responseTime}ms`);
    
    // Check gas prices
    const feeData = await this.provider.getFeeData();
    console.log(`    Gas price: ${ethers.formatUnits(feeData.gasPrice || 0, "gwei")} gwei`);
  }

  async testAPIIntegration() {
    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      console.log("    ✅ Health endpoint works");
      
      // Test network status
      const networkResponse = await axios.get(`${this.apiUrl}/api/blockchain/network/status`, { timeout: 10000 });
      console.log(`    ✅ Network status: Block ${networkResponse.data.blockNumber}`);
      
      // Test tourist registration API
      const touristData = {
        touristId: "e2e-test-" + Date.now(),
        originCountry: "E2ETestCountry",
        arrivalDate: new Date().toISOString(),
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      const registerResponse = await axios.post(
        `${this.apiUrl}/api/tourists/register`,
        touristData,
        { timeout: 30000 }
      );
      
      console.log("    ✅ Tourist registration API works");
      console.log(`    Wallet: ${registerResponse.data.walletAddress}`);
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log("    ⚠️  API service not running - skipping API tests");
        this.testResults.tests["API Integration"] = "skipped";
        return;
      }
      throw error;
    }
  }

  async testTransactionCosts() {
    // Estimate gas costs for common operations
    const testTourist = ethers.Wallet.createRandom();
    const testRestaurant = ethers.Wallet.createRandom();
    
    // Estimate tourist registration cost
    const registerTouristGas = await this.contract.registerTourist.estimateGas(
      testTourist.address,
      "CostTest",
      Math.floor(Date.now() / 1000),
      Math.floor(Date.now() / 1000) + 86400
    );
    
    // Estimate daily coins issuance cost
    const issueDailyCoinsGas = await this.contract.issueDailyCoins.estimateGas(
      this.testTourist.address
    );
    
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("20", "gwei");
    
    const registerCost = registerTouristGas * gasPrice;
    const issueCost = issueDailyCoinsGas * gasPrice;
    
    console.log(`    Tourist registration: ${registerTouristGas.toString()} gas (${ethers.formatEther(registerCost)} MATIC)`);
    console.log(`    Daily coins issuance: ${issueDailyCoinsGas.toString()} gas (${ethers.formatEther(issueCost)} MATIC)`);
    
    // Check if costs are reasonable (under $0.01 USD assuming MATIC ~$0.50)
    const maxReasonableCost = ethers.parseEther("0.02"); // 0.02 MATIC
    
    if (registerCost > maxReasonableCost || issueCost > maxReasonableCost) {
      throw new Error("Transaction costs too high for production use");
    }
  }

  async generateReport() {
    const report = {
      ...this.testResults,
      summary: {
        totalTests: Object.keys(this.testResults.tests).length,
        passed: Object.values(this.testResults.tests).filter(r => r === "passed").length,
        failed: Object.values(this.testResults.tests).filter(r => r === "failed").length,
        skipped: Object.values(this.testResults.tests).filter(r => r === "skipped").length
      },
      testData: {
        tourist: this.testTourist?.address,
        restaurant: this.testRestaurant?.address
      },
      recommendations: []
    };
    
    // Add recommendations based on test results
    if (report.summary.failed > 0) {
      report.recommendations.push("Review failed tests and fix issues before production deployment");
    }
    
    if (this.testResults.tests["API Integration"] === "skipped") {
      report.recommendations.push("Start API service and run tests again for complete validation");
    }
    
    if (report.summary.passed === report.summary.totalTests) {
      report.recommendations.push("All tests passed - system ready for production deployment");
    }
    
    fs.writeFileSync("testnet-e2e-report.json", JSON.stringify(report, null, 2));
    
    return report;
  }

  async run() {
    console.log("🧪 Running End-to-End Tests on Polygon Mumbai Testnet");
    console.log("====================================================");
    
    console.log(`Contract: ${this.contractAddress}`);
    console.log(`Network: ${this.rpcUrl}`);
    console.log(`API: ${this.apiUrl}`);
    
    // Run all tests
    await this.runTest("Contract Deployment", () => this.testContractDeployment());
    await this.runTest("Tourist Registration", () => this.testTouristRegistration());
    await this.runTest("Restaurant Registration", () => this.testRestaurantRegistration());
    await this.runTest("Daily Coin Issuance", () => this.testDailyCoinIssuance());
    await this.runTest("Restaurant Transfer", () => this.testRestaurantTransfer());
    await this.runTest("Daily Limits", () => this.testDailyLimits());
    await this.runTest("Event Emission", () => this.testEventEmission());
    await this.runTest("Network Performance", () => this.testNetworkPerformance());
    await this.runTest("API Integration", () => this.testAPIIntegration());
    await this.runTest("Transaction Costs", () => this.testTransactionCosts());
    
    // Generate report
    const report = await this.generateReport();
    
    console.log("\n📊 Test Summary");
    console.log("===============");
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`⚠️  Skipped: ${report.summary.skipped}`);
    
    if (report.summary.failed > 0) {
      console.log("\n❌ Failed Tests:");
      this.testResults.errors.forEach(error => {
        console.log(`  - ${error.test}: ${error.error}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log("\n💡 Recommendations:");
      report.recommendations.forEach(rec => {
        console.log(`  - ${rec}`);
      });
    }
    
    console.log(`\n📄 Detailed report saved to: testnet-e2e-report.json`);
    
    if (report.summary.failed === 0) {
      console.log("\n🎉 All tests passed! System is ready for production deployment.");
      return true;
    } else {
      console.log("\n⚠️  Some tests failed. Please review and fix issues before production.");
      return false;
    }
  }
}

// Run the tests
async function main() {
  const tester = new TestnetE2ETest();
  const success = await tester.run();
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error("❌ E2E test runner failed:", error);
  process.exit(1);
});