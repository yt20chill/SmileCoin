const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("🚀 Starting SmileCoin Demo Deployment");
  console.log("=====================================");

  // Get the contract factory
  const SmileCoin = await ethers.getContractFactory("SmileCoin");
  console.log("✅ Contract factory loaded");

  // Deploy the contract using OpenZeppelin upgrades plugin
  console.log("📦 Deploying SmileCoin contract...");
  const smileCoin = await upgrades.deployProxy(SmileCoin, [], {
    initializer: "initialize",
    kind: "uups"
  });

  await smileCoin.waitForDeployment();
  const contractAddress = await smileCoin.getAddress();
  
  console.log("✅ SmileCoin deployed to:", contractAddress);

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
  console.log("- Daily coin amount:", ethers.formatEther(dailyCoinAmount), "SMILE");
  console.log("- Coin expiration days:", coinExpirationDays.toString());
  console.log("- Max coins per restaurant per day:", ethers.formatEther(maxCoinsPerRestaurant), "SMILE");

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
  await tx1.wait();
  console.log("✅ Tourist registered:", testTourist.address);

  // Demo: Register a restaurant
  console.log("\n🍽️  Demo: Registering a restaurant...");
  const testRestaurant = ethers.Wallet.createRandom();
  const tx2 = await smileCoin.registerRestaurant(
    testRestaurant.address,
    "demo_place_id_123"
  );
  await tx2.wait();
  console.log("✅ Restaurant registered:", testRestaurant.address);

  // Demo: Issue daily coins
  console.log("\n🪙 Demo: Issuing daily coins...");
  const tx3 = await smileCoin.issueDailyCoins(testTourist.address);
  await tx3.wait();
  console.log("✅ Daily coins issued");

  // Check balance
  const balance = await smileCoin.balanceOf(testTourist.address);
  console.log("💰 Tourist balance:", ethers.formatEther(balance), "SMILE");

  console.log("\n🎉 Demo deployment completed successfully!");
  console.log("=====================================");
  console.log("Contract Address:", contractAddress);
  console.log("Network: Hardhat Local");
  console.log("Chain ID: 31337");
  
  return {
    contractAddress,
    touristAddress: testTourist.address,
    restaurantAddress: testRestaurant.address,
    balance: ethers.formatEther(balance)
  };
}

main()
  .then((result) => {
    console.log("\n📊 Deployment Summary:");
    console.log("Contract:", result.contractAddress);
    console.log("Tourist:", result.touristAddress);
    console.log("Restaurant:", result.restaurantAddress);
    console.log("Balance:", result.balance, "SMILE");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });