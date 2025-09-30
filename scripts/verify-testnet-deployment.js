const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Verifying testnet deployment...");

  // Load environment variables
  require("dotenv").config({ path: ".env.staging" });

  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ CONTRACT_ADDRESS not found in environment");
    process.exit(1);
  }

  console.log("Contract Address:", contractAddress);
  console.log("Network:", process.env.NETWORK_NAME);
  console.log("RPC URL:", process.env.RPC_URL);

  // Connect to the network
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const network = await provider.getNetwork();
  console.log("Connected to network:", network.name, "Chain ID:", network.chainId.toString());

  // Load contract ABI
  const contractABI = JSON.parse(
    fs.readFileSync("artifacts/contracts/SmileCoin.sol/SmileCoin.json")
  ).abi;

  // Connect to deployed contract
  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  try {
    // Test 1: Check contract deployment
    console.log("\n📋 Test 1: Contract Deployment");
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      console.error("❌ No contract code found at address");
      process.exit(1);
    }
    console.log("✅ Contract code found");

    // Test 2: Check contract initialization
    console.log("\n📋 Test 2: Contract Initialization");
    const name = await contract.name();
    const symbol = await contract.symbol();
    const owner = await contract.owner();
    
    console.log("✅ Token name:", name);
    console.log("✅ Token symbol:", symbol);
    console.log("✅ Contract owner:", owner);

    // Test 3: Check contract constants
    console.log("\n📋 Test 3: Contract Constants");
    const dailyCoinAmount = await contract.DAILY_COIN_AMOUNT();
    const coinExpirationDays = await contract.COIN_EXPIRATION_DAYS();
    const maxCoinsPerRestaurant = await contract.MAX_COINS_PER_RESTAURANT_PER_DAY();

    console.log("✅ Daily coin amount:", ethers.formatEther(dailyCoinAmount), "SMILE");
    console.log("✅ Coin expiration days:", coinExpirationDays.toString());
    console.log("✅ Max coins per restaurant per day:", ethers.formatEther(maxCoinsPerRestaurant), "SMILE");

    // Test 4: Check admin wallet balance
    console.log("\n📋 Test 4: Admin Wallet");
    const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
    const adminBalance = await provider.getBalance(adminWallet.address);
    
    console.log("✅ Admin wallet address:", adminWallet.address);
    console.log("✅ Admin wallet balance:", ethers.formatEther(adminBalance), "MATIC");

    if (adminBalance < ethers.parseEther("0.01")) {
      console.warn("⚠️  Admin wallet balance is low. Consider funding from faucet:");
      console.warn("   https://faucet.polygon.technology/");
    }

    // Test 5: Test contract interaction (read-only)
    console.log("\n📋 Test 5: Contract Interaction");
    
    // Create a test tourist address
    const testTourist = ethers.Wallet.createRandom().address;
    const isRegistered = await contract.isTouristRegistered(testTourist);
    console.log("✅ Tourist registration check works:", !isRegistered);

    // Create a test restaurant address
    const testRestaurant = ethers.Wallet.createRandom().address;
    const isRestaurantRegistered = await contract.isRestaurantRegistered(testRestaurant);
    console.log("✅ Restaurant registration check works:", !isRestaurantRegistered);

    // Test 6: Network performance
    console.log("\n📋 Test 6: Network Performance");
    const startTime = Date.now();
    const blockNumber = await provider.getBlockNumber();
    const endTime = Date.now();
    
    console.log("✅ Current block number:", blockNumber);
    console.log("✅ RPC response time:", endTime - startTime, "ms");

    // Test 7: Gas price check
    console.log("\n📋 Test 7: Gas Price");
    const gasPrice = await provider.getFeeData();
    console.log("✅ Current gas price:", ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"), "gwei");
    console.log("✅ Max fee per gas:", ethers.formatUnits(gasPrice.maxFeePerGas || 0, "gwei"), "gwei");

    // Generate deployment summary
    const deploymentSummary = {
      timestamp: new Date().toISOString(),
      network: {
        name: network.name,
        chainId: network.chainId.toString(),
        rpcUrl: process.env.RPC_URL
      },
      contract: {
        address: contractAddress,
        name: name,
        symbol: symbol,
        owner: owner
      },
      constants: {
        dailyCoinAmount: ethers.formatEther(dailyCoinAmount),
        coinExpirationDays: coinExpirationDays.toString(),
        maxCoinsPerRestaurant: ethers.formatEther(maxCoinsPerRestaurant)
      },
      admin: {
        address: adminWallet.address,
        balance: ethers.formatEther(adminBalance)
      },
      network_performance: {
        blockNumber: blockNumber,
        responseTime: endTime - startTime,
        gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, "gwei")
      },
      verification_status: "passed"
    };

    // Save deployment summary
    fs.writeFileSync(
      "testnet-deployment-summary.json",
      JSON.stringify(deploymentSummary, null, 2)
    );

    console.log("\n🎉 All tests passed! Testnet deployment verified successfully.");
    console.log("📄 Deployment summary saved to: testnet-deployment-summary.json");
    
    console.log("\n🔗 Useful Links:");
    console.log(`   Contract on PolygonScan: https://mumbai.polygonscan.com/address/${contractAddress}`);
    console.log(`   Admin wallet on PolygonScan: https://mumbai.polygonscan.com/address/${adminWallet.address}`);
    console.log("   Mumbai Faucet: https://faucet.polygon.technology/");

  } catch (error) {
    console.error("❌ Verification failed:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });