const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("Starting SmileCoin contract deployment...");

  // Get the contract factory
  const SmileCoin = await ethers.getContractFactory("SmileCoin");

  // Deploy the contract using OpenZeppelin upgrades plugin
  console.log("Deploying SmileCoin contract...");
  const smileCoin = await upgrades.deployProxy(SmileCoin, [], {
    initializer: "initialize",
    kind: "uups"
  });

  await smileCoin.waitForDeployment();

  const contractAddress = await smileCoin.getAddress();
  console.log("SmileCoin deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = smileCoin.deploymentTransaction();
  if (deploymentTx) {
    console.log("Deployment transaction hash:", deploymentTx.hash);
    console.log("Gas used:", deploymentTx.gasLimit.toString());
  }

  // Verify contract on block explorer (if not local network)
  const network = await ethers.provider.getNetwork();
  console.log("Deployed on network:", network.name, "Chain ID:", network.chainId);

  if (network.chainId !== 1337n && network.chainId !== 31337n) {
    console.log("Waiting for block confirmations...");
    await smileCoin.deploymentTransaction()?.wait(5);
    
    try {
      console.log("Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("Contract verification failed:", error.message);
    }
  }

  // Get contract owner
  const owner = await smileCoin.owner();
  console.log("Contract owner:", owner);

  // Display contract constants
  const dailyCoinAmount = await smileCoin.DAILY_COIN_AMOUNT();
  const coinExpirationDays = await smileCoin.COIN_EXPIRATION_DAYS();
  const maxCoinsPerRestaurant = await smileCoin.MAX_COINS_PER_RESTAURANT_PER_DAY();

  console.log("\nContract Configuration:");
  console.log("- Daily coin amount:", ethers.formatEther(dailyCoinAmount), "SMILE");
  console.log("- Coin expiration days:", coinExpirationDays.toString());
  console.log("- Max coins per restaurant per day:", ethers.formatEther(maxCoinsPerRestaurant), "SMILE");

  return contractAddress;
}

// Execute deployment
main()
  .then((contractAddress) => {
    console.log("\n✅ Deployment completed successfully!");
    console.log("Contract address:", contractAddress);
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });