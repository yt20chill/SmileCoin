const { ethers } = require("hardhat");
require("dotenv").config({ path: ".env.staging" });

async function estimateGas() {
  console.log("⛽ Estimating Gas Costs for SmileCoin Deployment");
  console.log("===============================================");

  try {
    // Get current balance
    const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, ethers.provider);
    const balance = await ethers.provider.getBalance(wallet.address);
    const balanceInMatic = parseFloat(ethers.utils.formatEther(balance));
    
    console.log("Current Balance:", balanceInMatic, "MATIC");

    // Get gas price
    const gasPrice = await ethers.provider.getGasPrice();
    const gasPriceInGwei = parseFloat(ethers.utils.formatUnits(gasPrice, "gwei"));
    
    console.log("Current Gas Price:", gasPriceInGwei, "gwei");

    // Estimate deployment cost
    const SmileCoin = await ethers.getContractFactory("SmileCoin");
    
    // Estimate gas for proxy deployment (upgradeable contracts use more gas)
    const estimatedGas = 3500000; // Typical for upgradeable ERC20 deployment
    const estimatedCost = gasPrice.mul(estimatedGas);
    const estimatedCostInMatic = parseFloat(ethers.utils.formatEther(estimatedCost));
    
    console.log("\n📊 Deployment Estimates:");
    console.log("Estimated Gas:", estimatedGas.toLocaleString());
    console.log("Estimated Cost:", estimatedCostInMatic.toFixed(4), "MATIC");
    
    // Add buffer for multiple transactions (tourist, restaurant, daily coins)
    const totalTransactions = 4; // deployment + 3 demo transactions
    const totalEstimatedCost = estimatedCostInMatic * totalTransactions;
    
    console.log("Total for Demo (4 transactions):", totalEstimatedCost.toFixed(4), "MATIC");
    
    const recommended = totalEstimatedCost * 1.5; // 50% buffer
    console.log("Recommended Balance:", recommended.toFixed(4), "MATIC");
    
    if (balanceInMatic < recommended) {
      const needed = recommended - balanceInMatic;
      console.log("\n⚠️  Insufficient Balance!");
      console.log("You need", needed.toFixed(4), "more MATIC");
      console.log("\n🔗 Get more MATIC from Polygon Amoy faucet:");
      console.log("   https://faucet.polygon.technology/");
      console.log("📋 Your wallet address:", wallet.address);
      return false;
    } else {
      console.log("\n✅ Sufficient balance for deployment!");
      return true;
    }
    
  } catch (error) {
    console.error("❌ Error estimating gas:", error.message);
    return false;
  }
}

estimateGas()
  .then((canDeploy) => {
    if (canDeploy) {
      console.log("\n🚀 Ready to deploy!");
    }
    process.exit(canDeploy ? 0 : 1);
  })
  .catch(console.error);