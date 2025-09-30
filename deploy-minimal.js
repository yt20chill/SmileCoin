const { ethers, upgrades } = require("hardhat");
require("dotenv").config({ path: ".env.staging" });

async function main() {
  console.log("🚀 Minimal SmileCoin Deployment to Polygon Amoy");
  console.log("===============================================");

  // Get current balance
  const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.provider);
  const balance = await ethers.provider.getBalance(wallet.address);
  console.log("Wallet:", wallet.address);
  console.log("Balance:", ethers.utils.formatEther(balance), "MATIC");

  // Get the contract factory
  const SmileCoin = await ethers.getContractFactory("SmileCoin");
  console.log("✅ Contract factory loaded");

  // Deploy the contract using OpenZeppelin upgrades plugin
  console.log("\n📦 Deploying SmileCoin contract (minimal)...");
  
  try {
    const smileCoin = await upgrades.deployProxy(SmileCoin, [], {
      initializer: "initialize",
      kind: "uups"
    });

    console.log("⏳ Waiting for deployment confirmation...");
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

    console.log("\n🎉 Minimal Deployment Completed!");
    console.log("===============================");
    console.log("🔗 View on PolygonScan Amoy:");
    console.log(`   https://amoy.polygonscan.com/address/${contractAddress}`);

    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: "polygon-amoy",
      chainId: 80002,
      contractAddress: contractAddress,
      adminWallet: wallet.address,
      explorerUrl: `https://amoy.polygonscan.com/address/${contractAddress}`
    };

    require("fs").writeFileSync("amoy-minimal-deployment.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("\n📄 Deployment info saved to: amoy-minimal-deployment.json");

    return deploymentInfo;
  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
    throw error;
  }
}

main()
  .then((result) => {
    console.log("\n📊 Success! Contract deployed to:", result.contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });