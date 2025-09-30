const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.staging" });

async function checkBalance() {
  console.log("🔍 Checking Wallet Balance on Polygon Amoy");
  console.log("==========================================");

  try {
    // Get network info
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name);
    console.log("Chain ID:", network.chainId.toString());

    // Get admin wallet from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY;
    if (!adminPrivateKey) {
      throw new Error("ADMIN_PRIVATE_KEY not found in .env.staging");
    }
    
    const wallet = new ethers.Wallet(adminPrivateKey, ethers.provider);
    const walletAddress = wallet.address;
    
    console.log("Wallet Address:", walletAddress);

    // Check balance
    const balance = await ethers.provider.getBalance(walletAddress);
    const balanceInMatic = ethers.utils.formatEther(balance);
    
    console.log("Balance:", balanceInMatic, "MATIC");

    if (parseFloat(balanceInMatic) < 0.01) {
      console.log("\n⚠️  Low Balance Warning!");
      console.log("You need MATIC tokens to deploy contracts.");
      console.log("Get free MATIC from Polygon Amoy faucet:");
      console.log("🔗 https://faucet.polygon.technology/");
      console.log("📋 Your wallet address:", walletAddress);
      return false;
    } else {
      console.log("\n✅ Sufficient balance for deployment!");
      return true;
    }
  } catch (error) {
    console.error("❌ Error checking balance:", error.message);
    return false;
  }
}

checkBalance()
  .then((hasBalance) => {
    if (hasBalance) {
      console.log("\n🚀 Ready to deploy! Run:");
      console.log("npx hardhat run deploy-amoy.js --network polygon-amoy");
    }
    process.exit(hasBalance ? 0 : 1);
  })
  .catch(console.error);