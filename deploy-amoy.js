const { ethers, upgrades } = require("hardhat");
require("dotenv").config({ path: ".env.staging" });

async function main() {
  console.log("🚀 Deploying SmileCoin to Polygon Amoy Testnet");
  console.log("===============================================");

  // Load environment
  const rpcUrl = process.env.RPC_URL;
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
  const chainId = process.env.CHAIN_ID;

  console.log("📋 Configuration:");
  console.log("- Network: Polygon Amoy Testnet");
  console.log("- Chain ID:", chainId);
  console.log("- RPC URL:", rpcUrl);

  // Get admin wallet from environment
  const wallet = new ethers.Wallet(adminPrivateKey, ethers.provider);
  const adminAddress = wallet.address;
  console.log("- Admin Wallet:", adminAddress);

  // Check balance
  const balance = await ethers.provider.getBalance(adminAddress);
  console.log("- Admin Balance:", ethers.utils.formatEther(balance), "MATIC");

  if (parseFloat(ethers.utils.formatEther(balance)) < 0.01) {
    console.log("⚠️  Low balance! Please fund your wallet from Polygon Amoy faucet:");
    console.log("   https://faucet.polygon.technology/");
    console.log("   Your wallet address:", adminWallet.address);
  }

  // Get the contract factory
  const SmileCoin = await ethers.getContractFactory("SmileCoin");
  console.log("✅ Contract factory loaded");

  // Deploy the contract using OpenZeppelin upgrades plugin
  console.log("\n📦 Deploying SmileCoin contract...");
  const smileCoin = await upgrades.deployProxy(SmileCoin, [], {
    initializer: "initialize",
    kind: "uups"
  });

  console.log("⏳ Waiting for deployment confirmation...");
  await smileCoin.waitForDeployment();

  const contractAddress = await smileCoin.getAddress();
  console.log("✅ SmileCoin deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = smileCoin.deploymentTransaction();
  if (deploymentTx) {
    console.log("📄 Deployment transaction hash:", deploymentTx.hash);
    console.log("⛽ Gas used:", deploymentTx.gasLimit.toString());
  }

  // Get contract details
  const name = await smileCoin.name();
  const symbol = await smileCoin.symbol();
  const owner = await smileCoin.owner();

  console.log("\n📋 Contract Details:");
  console.log("- Name:", name);
  console.log("- Symbol:", symbol);
  console.log("- Owner:", owner);

  // Get contract constants
  const dailyCoinAmount = await smileCoin.DAILY_COIN_AMOUNT();
  const coinExpirationDays = await smileCoin.COIN_EXPIRATION_DAYS();
  const maxCoinsPerRestaurant = await smileCoin.MAX_COINS_PER_RESTAURANT_PER_DAY();

  console.log("\n⚙️  Contract Configuration:");
  console.log("- Daily coin amount:", ethers.utils.formatEther(dailyCoinAmount), "SMILE");
  console.log("- Coin expiration days:", coinExpirationDays.toString());
  console.log("- Max coins per restaurant per day:", ethers.utils.formatEther(maxCoinsPerRestaurant), "SMILE");

  // Demo: Register a tourist
  console.log("\n👤 Demo: Registering a tourist...");
  const testTourist = ethers.Wallet.createRandom();
  const arrivalTime = Math.floor(Date.now() / 1000);
  const departureTime = arrivalTime + (7 * 24 * 60 * 60); // 7 days

  const tx1 = await smileCoin.registerTourist(
    testTourist.address,
    "Demo Country",
    arrivalTime,
    departureTime
  );
  console.log("⏳ Waiting for tourist registration...");
  await tx1.wait();
  console.log("✅ Tourist registered:", testTourist.address);
  console.log("📄 Transaction hash:", tx1.hash);

  // Demo: Register a restaurant
  console.log("\n🍽️  Demo: Registering a restaurant...");
  const testRestaurant = ethers.Wallet.createRandom();
  const tx2 = await smileCoin.registerRestaurant(
    testRestaurant.address,
    "demo_place_id_123"
  );
  console.log("⏳ Waiting for restaurant registration...");
  await tx2.wait();
  console.log("✅ Restaurant registered:", testRestaurant.address);
  console.log("📄 Transaction hash:", tx2.hash);

  // Demo: Issue daily coins
  console.log("\n🪙 Demo: Issuing daily coins...");
  const tx3 = await smileCoin.issueDailyCoins(testTourist.address);
  console.log("⏳ Waiting for daily coins issuance...");
  await tx3.wait();
  console.log("✅ Daily coins issued");
  console.log("📄 Transaction hash:", tx3.hash);

  // Check balance
  const touristBalance = await smileCoin.balanceOf(testTourist.address);
  console.log("💰 Tourist balance:", ethers.utils.formatEther(touristBalance), "SMILE");

  console.log("\n🎉 Deployment and Demo Completed Successfully!");
  console.log("============================================");
  console.log("🔗 View on PolygonScan Amoy:");
  console.log(`   Contract: https://amoy.polygonscan.com/address/${contractAddress}`);
  console.log(`   Admin Wallet: https://amoy.polygonscan.com/address/${adminAddress}`);
  console.log(`   Tourist Registration: https://amoy.polygonscan.com/tx/${tx1.hash}`);
  console.log(`   Restaurant Registration: https://amoy.polygonscan.com/tx/${tx2.hash}`);
  console.log(`   Daily Coins Issuance: https://amoy.polygonscan.com/tx/${tx3.hash}`);

  // Save deployment info
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "polygon-amoy",
    chainId: 80002,
    contractAddress: contractAddress,
    adminWallet: adminAddress,
    transactions: {
      deployment: deploymentTx?.hash,
      touristRegistration: tx1.hash,
      restaurantRegistration: tx2.hash,
      dailyCoinsIssuance: tx3.hash
    },
    demoData: {
      tourist: testTourist.address,
      restaurant: testRestaurant.address,
      touristBalance: ethers.utils.formatEther(touristBalance)
    }
  };

  require("fs").writeFileSync("amoy-deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📄 Deployment info saved to: amoy-deployment.json");

  return deploymentInfo;
}

main()
  .then((result) => {
    console.log("\n📊 Final Summary:");
    console.log("Contract Address:", result.contractAddress);
    console.log("Network: Polygon Amoy Testnet");
    console.log("Chain ID: 80002");
    console.log("Tourist Balance:", result.demoData.touristBalance, "SMILE");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });