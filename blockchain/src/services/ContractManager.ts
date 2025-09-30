import { ethers } from 'ethers';
import { WalletManager } from './WalletManager';
import SmileCoinArtifact from '../../artifacts/contracts/SmileCoin.sol/SmileCoin.json';

export interface TouristRegistrationData {
  touristAddress: string;
  originCountry: string;
  arrivalTimestamp: number;
  departureTimestamp: number;
}

export interface RestaurantRegistrationData {
  restaurantAddress: string;
  googlePlaceId: string;
}

export interface TransactionResult {
  hash: string;
  blockNumber?: number;
  gasUsed?: ethers.BigNumber;
  status?: number;
}

export interface TouristData {
  originCountry: string;
  arrivalTimestamp: number;
  departureTimestamp: number;
  lastDailyMint: number;
  totalDailyMints: number;
  physicalCoinEligible: boolean;
}

export interface RestaurantData {
  googlePlaceId: string;
  totalCoinsReceived: ethers.BigNumber;
}

export class ContractManagerError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'ContractManagerError';
  }
}

export class ContractManager {
  private static contract: ethers.Contract;
  private static provider: ethers.providers.Provider;
  private static adminWallet: ethers.Wallet;
  private static contractAddress: string;
  private static initialized = false;

  /**
   * Initialize the ContractManager with provider and admin wallet
   */
  static initialize(
    contractAddress: string,
    rpcUrl: string,
    adminPrivateKey?: string
  ): void {
    try {
      this.contractAddress = contractAddress;
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Initialize admin wallet if private key provided
      if (adminPrivateKey) {
        this.adminWallet = new ethers.Wallet(adminPrivateKey, this.provider);
      } else if (process.env.ADMIN_PRIVATE_KEY) {
        this.adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, this.provider);
      } else {
        throw new Error('Admin private key is required for contract operations');
      }

      // Create contract instance with admin wallet
      this.contract = new ethers.Contract(
        contractAddress,
        SmileCoinArtifact.abi,
        this.adminWallet
      );

      this.initialized = true;
    } catch (error) {
      throw new ContractManagerError(
        'INITIALIZATION_FAILED',
        `Failed to initialize ContractManager: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check if ContractManager is initialized
   */
  static isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get contract address
   */
  static getContractAddress(): string {
    this.ensureInitialized();
    return this.contractAddress;
  }

  /**
   * Register a tourist on the blockchain
   */
  static async registerTourist(data: TouristRegistrationData): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      // Validate input data
      this.validateTouristRegistrationData(data);

      // Check if tourist is already registered
      const isRegistered = await this.contract.isTouristRegistered(data.touristAddress);
      if (isRegistered) {
        throw new ContractManagerError(
          'TOURIST_ALREADY_REGISTERED',
          `Tourist ${data.touristAddress} is already registered`
        );
      }

      // Execute registration transaction
      const tx = await this.contract.registerTourist(
        data.touristAddress,
        data.originCountry,
        data.arrivalTimestamp,
        data.departureTimestamp,
        {
          gasLimit: 200000 // Set reasonable gas limit
        }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      };
    } catch (error) {
      if (error instanceof ContractManagerError) {
        throw error;
      }
      
      throw new ContractManagerError(
        'TOURIST_REGISTRATION_FAILED',
        `Failed to register tourist: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Register a restaurant on the blockchain
   */
  static async registerRestaurant(data: RestaurantRegistrationData): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      // Validate input data
      this.validateRestaurantRegistrationData(data);

      // Check if restaurant is already registered
      const isRegistered = await this.contract.isRestaurantRegistered(data.restaurantAddress);
      if (isRegistered) {
        throw new ContractManagerError(
          'RESTAURANT_ALREADY_REGISTERED',
          `Restaurant ${data.restaurantAddress} is already registered`
        );
      }

      // Execute registration transaction
      const tx = await this.contract.registerRestaurant(
        data.restaurantAddress,
        data.googlePlaceId,
        {
          gasLimit: 150000 // Set reasonable gas limit
        }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      };
    } catch (error) {
      if (error instanceof ContractManagerError) {
        throw error;
      }
      
      throw new ContractManagerError(
        'RESTAURANT_REGISTRATION_FAILED',
        `Failed to register restaurant: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check if a tourist is registered
   */
  static async isTouristRegistered(touristAddress: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract.isTouristRegistered(touristAddress);
    } catch (error) {
      throw new ContractManagerError(
        'TOURIST_CHECK_FAILED',
        `Failed to check tourist registration: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check if a restaurant is registered
   */
  static async isRestaurantRegistered(restaurantAddress: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract.isRestaurantRegistered(restaurantAddress);
    } catch (error) {
      throw new ContractManagerError(
        'RESTAURANT_CHECK_FAILED',
        `Failed to check restaurant registration: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get tourist data from the contract
   */
  static async getTouristData(touristAddress: string): Promise<TouristData> {
    this.ensureInitialized();
    
    try {
      const data = await this.contract.getTouristData(touristAddress);
      
      return {
        originCountry: data.originCountry,
        arrivalTimestamp: data.arrivalTimestamp.toNumber(),
        departureTimestamp: data.departureTimestamp.toNumber(),
        lastDailyMint: data.lastDailyMint.toNumber(),
        totalDailyMints: data.totalDailyMints.toNumber(),
        physicalCoinEligible: data.physicalCoinEligible
      };
    } catch (error) {
      throw new ContractManagerError(
        'TOURIST_DATA_FETCH_FAILED',
        `Failed to get tourist data: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get restaurant data from the contract
   */
  static async getRestaurantData(restaurantAddress: string): Promise<RestaurantData> {
    this.ensureInitialized();
    
    try {
      const placeId = await this.contract.getRestaurantPlaceId(restaurantAddress);
      const totalCoins = await this.contract.getRestaurantTotalCoins(restaurantAddress);
      
      return {
        googlePlaceId: placeId,
        totalCoinsReceived: totalCoins
      };
    } catch (error) {
      throw new ContractManagerError(
        'RESTAURANT_DATA_FETCH_FAILED',
        `Failed to get restaurant data: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get token balance for an address
   */
  static async getBalance(address: string): Promise<ethers.BigNumber> {
    this.ensureInitialized();
    
    try {
      return await this.contract.balanceOf(address);
    } catch (error) {
      throw new ContractManagerError(
        'BALANCE_FETCH_FAILED',
        `Failed to get balance: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get formatted balance in SMILE tokens
   */
  static async getFormattedBalance(address: string): Promise<string> {
    const balance = await this.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Get network information
   */
  static async getNetworkInfo(): Promise<{
    chainId: number;
    blockNumber: number;
    gasPrice: ethers.BigNumber;
  }> {
    this.ensureInitialized();
    
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      const gasPrice = await this.provider.getGasPrice();

      return {
        chainId: network.chainId,
        blockNumber,
        gasPrice
      };
    } catch (error) {
      throw new ContractManagerError(
        'NETWORK_INFO_FAILED',
        `Failed to get network info: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Estimate gas for a transaction
   */
  static async estimateGas(
    method: string,
    params: any[]
  ): Promise<ethers.BigNumber> {
    this.ensureInitialized();
    
    try {
      return await this.contract.estimateGas[method](...params);
    } catch (error) {
      throw new ContractManagerError(
        'GAS_ESTIMATION_FAILED',
        `Failed to estimate gas for ${method}: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get transaction receipt
   */
  static async getTransactionReceipt(txHash: string): Promise<ethers.providers.TransactionReceipt | null> {
    this.ensureInitialized();
    
    try {
      return await this.provider.getTransactionReceipt(txHash);
    } catch (error) {
      throw new ContractManagerError(
        'RECEIPT_FETCH_FAILED',
        `Failed to get transaction receipt: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Wait for transaction confirmation
   */
  static async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.providers.TransactionReceipt> {
    this.ensureInitialized();
    
    try {
      return await this.provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      throw new ContractManagerError(
        'TRANSACTION_WAIT_FAILED',
        `Failed to wait for transaction: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Validate tourist registration data
   */
  private static validateTouristRegistrationData(data: TouristRegistrationData): void {
    if (!ethers.utils.isAddress(data.touristAddress)) {
      throw new ContractManagerError(
        'INVALID_TOURIST_ADDRESS',
        'Invalid tourist address format'
      );
    }

    if (!data.originCountry || data.originCountry.trim().length === 0) {
      throw new ContractManagerError(
        'INVALID_ORIGIN_COUNTRY',
        'Origin country cannot be empty'
      );
    }

    if (data.arrivalTimestamp <= 0) {
      throw new ContractManagerError(
        'INVALID_ARRIVAL_TIMESTAMP',
        'Arrival timestamp must be positive'
      );
    }

    if (data.departureTimestamp <= data.arrivalTimestamp) {
      throw new ContractManagerError(
        'INVALID_DEPARTURE_TIMESTAMP',
        'Departure timestamp must be after arrival timestamp'
      );
    }
  }

  /**
   * Validate restaurant registration data
   */
  private static validateRestaurantRegistrationData(data: RestaurantRegistrationData): void {
    if (!ethers.utils.isAddress(data.restaurantAddress)) {
      throw new ContractManagerError(
        'INVALID_RESTAURANT_ADDRESS',
        'Invalid restaurant address format'
      );
    }

    if (!data.googlePlaceId || data.googlePlaceId.trim().length === 0) {
      throw new ContractManagerError(
        'INVALID_GOOGLE_PLACE_ID',
        'Google Place ID cannot be empty'
      );
    }
  }

  /**
   * Issue daily coins to a tourist
   */
  static async issueDailyCoins(touristAddress: string): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      // Validate tourist address
      if (!ethers.utils.isAddress(touristAddress)) {
        throw new ContractManagerError(
          'INVALID_TOURIST_ADDRESS',
          'Invalid tourist address format'
        );
      }

      // Check if tourist is registered
      const isRegistered = await this.contract.isTouristRegistered(touristAddress);
      if (!isRegistered) {
        throw new ContractManagerError(
          'TOURIST_NOT_REGISTERED',
          `Tourist ${touristAddress} is not registered`
        );
      }

      // Check if tourist can receive daily coins
      const canReceive = await this.contract.canReceiveDailyCoins(touristAddress);
      if (!canReceive) {
        throw new ContractManagerError(
          'DAILY_COINS_NOT_AVAILABLE',
          'Tourist cannot receive daily coins at this time'
        );
      }

      // Execute daily coin issuance
      const tx = await this.contract.issueDailyCoins(touristAddress, {
        gasLimit: 300000 // Higher gas limit for minting operation
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      };
    } catch (error) {
      if (error instanceof ContractManagerError) {
        throw error;
      }
      
      throw new ContractManagerError(
        'DAILY_COINS_ISSUANCE_FAILED',
        `Failed to issue daily coins: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Transfer coins from tourist to restaurant
   */
  static async transferToRestaurant(
    touristId: string,
    restaurantAddress: string,
    amount: ethers.BigNumber
  ): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      // Get tourist wallet
      const touristWallet = await WalletManager.getWallet(touristId);
      
      // Validate restaurant address
      if (!ethers.utils.isAddress(restaurantAddress)) {
        throw new ContractManagerError(
          'INVALID_RESTAURANT_ADDRESS',
          'Invalid restaurant address format'
        );
      }

      // Check if restaurant is registered
      const isRestaurantRegistered = await this.contract.isRestaurantRegistered(restaurantAddress);
      if (!isRestaurantRegistered) {
        throw new ContractManagerError(
          'RESTAURANT_NOT_REGISTERED',
          `Restaurant ${restaurantAddress} is not registered`
        );
      }

      // Check if tourist is registered
      const isTouristRegistered = await this.contract.isTouristRegistered(touristWallet.address);
      if (!isTouristRegistered) {
        throw new ContractManagerError(
          'TOURIST_NOT_REGISTERED',
          `Tourist ${touristWallet.address} is not registered`
        );
      }

      // Check if transfer is allowed (balance, daily limits, etc.)
      const canTransfer = await this.contract.canTransferToRestaurant(
        touristWallet.address,
        restaurantAddress,
        amount
      );
      if (!canTransfer) {
        throw new ContractManagerError(
          'TRANSFER_NOT_ALLOWED',
          'Transfer not allowed due to balance or daily limit restrictions'
        );
      }

      // Create contract instance with tourist wallet
      const contractWithTourist = this.contract.connect(touristWallet);

      // Execute transfer
      const tx = await contractWithTourist.transferToRestaurant(
        restaurantAddress,
        amount,
        {
          gasLimit: 250000 // Set reasonable gas limit
        }
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      };
    } catch (error) {
      if (error instanceof ContractManagerError) {
        throw error;
      }
      
      throw new ContractManagerError(
        'RESTAURANT_TRANSFER_FAILED',
        `Failed to transfer coins to restaurant: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check if tourist can receive daily coins
   */
  static async canReceiveDailyCoins(touristAddress: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract.canReceiveDailyCoins(touristAddress);
    } catch (error) {
      throw new ContractManagerError(
        'DAILY_COINS_CHECK_FAILED',
        `Failed to check daily coins availability: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check if tourist can transfer to restaurant
   */
  static async canTransferToRestaurant(
    touristAddress: string,
    restaurantAddress: string,
    amount: ethers.BigNumber
  ): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract.canTransferToRestaurant(
        touristAddress,
        restaurantAddress,
        amount
      );
    } catch (error) {
      throw new ContractManagerError(
        'TRANSFER_CHECK_FAILED',
        `Failed to check transfer availability: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get remaining daily transfer limit for tourist to restaurant
   */
  static async getRemainingDailyTransferLimit(
    touristAddress: string,
    restaurantAddress: string
  ): Promise<ethers.BigNumber> {
    this.ensureInitialized();
    
    try {
      return await this.contract.getRemainingDailyTransferLimit(
        touristAddress,
        restaurantAddress
      );
    } catch (error) {
      throw new ContractManagerError(
        'DAILY_LIMIT_CHECK_FAILED',
        `Failed to get daily transfer limit: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get daily coins received by restaurant from specific tourist
   */
  static async getDailyCoinsFromTourist(
    restaurantAddress: string,
    touristAddress: string,
    day?: number
  ): Promise<ethers.BigNumber> {
    this.ensureInitialized();
    
    try {
      const dayToCheck = day || Math.floor(Date.now() / 1000 / 86400); // Current day if not specified
      return await this.contract.getDailyCoinsFromTourist(
        restaurantAddress,
        touristAddress,
        dayToCheck
      );
    } catch (error) {
      throw new ContractManagerError(
        'DAILY_COINS_FETCH_FAILED',
        `Failed to get daily coins from tourist: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get tourist's last daily mint day
   */
  static async getLastDailyMint(touristAddress: string): Promise<number> {
    this.ensureInitialized();
    
    try {
      const lastMint = await this.contract.getLastDailyMint(touristAddress);
      return lastMint.toNumber();
    } catch (error) {
      throw new ContractManagerError(
        'LAST_MINT_FETCH_FAILED',
        `Failed to get last daily mint: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get tourist's total daily mints
   */
  static async getTotalDailyMints(touristAddress: string): Promise<number> {
    this.ensureInitialized();
    
    try {
      const totalMints = await this.contract.getTotalDailyMints(touristAddress);
      return totalMints.toNumber();
    } catch (error) {
      throw new ContractManagerError(
        'TOTAL_MINTS_FETCH_FAILED',
        `Failed to get total daily mints: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Check physical coin eligibility for tourist
   */
  static async checkPhysicalCoinEligibility(touristAddress: string): Promise<boolean> {
    this.ensureInitialized();
    
    try {
      return await this.contract.checkPhysicalCoinEligibility(touristAddress);
    } catch (error) {
      throw new ContractManagerError(
        'PHYSICAL_COIN_CHECK_FAILED',
        `Failed to check physical coin eligibility: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get expired coins amount for tourist
   */
  static async getExpiredCoinsAmount(touristAddress: string): Promise<ethers.BigNumber> {
    this.ensureInitialized();
    
    try {
      return await this.contract.getExpiredCoinsAmount(touristAddress);
    } catch (error) {
      throw new ContractManagerError(
        'EXPIRED_COINS_FETCH_FAILED',
        `Failed to get expired coins amount: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Burn expired coins for a tourist
   */
  static async burnExpiredCoins(touristAddress: string): Promise<TransactionResult> {
    this.ensureInitialized();
    
    try {
      // Check if tourist has expired coins
      const expiredAmount = await this.getExpiredCoinsAmount(touristAddress);
      if (expiredAmount.isZero()) {
        throw new ContractManagerError(
          'NO_EXPIRED_COINS',
          'Tourist has no expired coins to burn'
        );
      }

      // Execute burn transaction
      const tx = await this.contract.burnExpiredCoins(touristAddress, {
        gasLimit: 200000
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        status: receipt.status
      };
    } catch (error) {
      if (error instanceof ContractManagerError) {
        throw error;
      }
      
      throw new ContractManagerError(
        'BURN_EXPIRED_COINS_FAILED',
        `Failed to burn expired coins: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get transaction status with detailed information
   */
  static async getTransactionStatus(txHash: string): Promise<{
    hash: string;
    status: 'pending' | 'confirmed' | 'failed';
    blockNumber?: number;
    gasUsed?: ethers.BigNumber;
    gasPrice?: ethers.BigNumber;
    confirmations?: number;
    timestamp?: number;
  }> {
    this.ensureInitialized();
    
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      if (!receipt) {
        return {
          hash: txHash,
          status: 'pending'
        };
      }

      const block = await this.provider.getBlock(receipt.blockNumber);
      const currentBlock = await this.provider.getBlockNumber();
      
      return {
        hash: txHash,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        gasPrice: receipt.effectiveGasPrice,
        confirmations: currentBlock - receipt.blockNumber + 1,
        timestamp: block.timestamp
      };
    } catch (error) {
      throw new ContractManagerError(
        'TRANSACTION_STATUS_FAILED',
        `Failed to get transaction status: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get comprehensive balance information for an address
   */
  static async getBalanceInfo(address: string): Promise<{
    balance: ethers.BigNumber;
    formattedBalance: string;
    nativeBalance: ethers.BigNumber;
    formattedNativeBalance: string;
  }> {
    this.ensureInitialized();
    
    try {
      const [tokenBalance, nativeBalance] = await Promise.all([
        this.contract.balanceOf(address),
        this.provider.getBalance(address)
      ]);

      return {
        balance: tokenBalance,
        formattedBalance: ethers.utils.formatEther(tokenBalance),
        nativeBalance,
        formattedNativeBalance: ethers.utils.formatEther(nativeBalance)
      };
    } catch (error) {
      throw new ContractManagerError(
        'BALANCE_INFO_FAILED',
        `Failed to get balance info: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get contract constants
   */
  static async getContractConstants(): Promise<{
    dailyCoinAmount: ethers.BigNumber;
    coinExpirationDays: ethers.BigNumber;
    maxCoinsPerRestaurantPerDay: ethers.BigNumber;
  }> {
    this.ensureInitialized();
    
    try {
      const [dailyCoinAmount, coinExpirationDays, maxCoinsPerRestaurantPerDay] = await Promise.all([
        this.contract.DAILY_COIN_AMOUNT(),
        this.contract.COIN_EXPIRATION_DAYS(),
        this.contract.MAX_COINS_PER_RESTAURANT_PER_DAY()
      ]);

      return {
        dailyCoinAmount,
        coinExpirationDays,
        maxCoinsPerRestaurantPerDay
      };
    } catch (error) {
      throw new ContractManagerError(
        'CONSTANTS_FETCH_FAILED',
        `Failed to get contract constants: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Monitor contract events
   */
  static async getContractEvents(
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest'
  ): Promise<ethers.Event[]> {
    this.ensureInitialized();
    
    try {
      const filter = this.contract.filters[eventName]();
      return await this.contract.queryFilter(filter, fromBlock, toBlock);
    } catch (error) {
      throw new ContractManagerError(
        'EVENTS_FETCH_FAILED',
        `Failed to get contract events: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get tourist-specific events
   */
  static async getTouristEvents(
    touristAddress: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest'
  ): Promise<{
    registrations: ethers.Event[];
    dailyCoinsIssued: ethers.Event[];
    coinsTransferred: ethers.Event[];
    coinsExpired: ethers.Event[];
  }> {
    this.ensureInitialized();
    
    try {
      const [registrations, dailyCoinsIssued, coinsTransferred, coinsExpired] = await Promise.all([
        this.contract.queryFilter(
          this.contract.filters.TouristRegistered(touristAddress),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.DailyCoinsIssued(touristAddress),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.CoinsTransferred(touristAddress),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.CoinsExpired(touristAddress),
          fromBlock,
          toBlock
        )
      ]);

      return {
        registrations,
        dailyCoinsIssued,
        coinsTransferred,
        coinsExpired
      };
    } catch (error) {
      throw new ContractManagerError(
        'TOURIST_EVENTS_FETCH_FAILED',
        `Failed to get tourist events: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get restaurant-specific events
   */
  static async getRestaurantEvents(
    restaurantAddress: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest'
  ): Promise<{
    registrations: ethers.Event[];
    coinsReceived: ethers.Event[];
  }> {
    this.ensureInitialized();
    
    try {
      const [registrations, coinsReceived] = await Promise.all([
        this.contract.queryFilter(
          this.contract.filters.RestaurantRegistered(restaurantAddress),
          fromBlock,
          toBlock
        ),
        this.contract.queryFilter(
          this.contract.filters.CoinsTransferred(null, restaurantAddress),
          fromBlock,
          toBlock
        )
      ]);

      return {
        registrations,
        coinsReceived
      };
    } catch (error) {
      throw new ContractManagerError(
        'RESTAURANT_EVENTS_FETCH_FAILED',
        `Failed to get restaurant events: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get network status information
   */
  static async getNetworkStatus(): Promise<{
    blockNumber: number;
    gasPrice: string;
    isHealthy: boolean;
    lastBlockTime: string;
  }> {
    this.ensureInitialized();
    
    try {
      const [blockNumber, gasPrice, block] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getGasPrice(),
        this.provider.getBlock('latest')
      ]);

      // Check if network is healthy (block is recent)
      const now = Math.floor(Date.now() / 1000);
      const isHealthy = (now - block.timestamp) < 300; // Less than 5 minutes old

      return {
        blockNumber,
        gasPrice: gasPrice.toString(),
        isHealthy,
        lastBlockTime: new Date(block.timestamp * 1000).toISOString()
      };
    } catch (error) {
      throw new ContractManagerError(
        'NETWORK_STATUS_FAILED',
        `Failed to get network status: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Get contract information and statistics
   */
  static async getContractInfo(): Promise<{
    totalSupply: string;
    totalTourists: number;
    totalRestaurants: number;
    dailyCoinsIssued: string;
  }> {
    this.ensureInitialized();
    
    try {
      // Get total supply
      const totalSupply = await this.contract.totalSupply();
      
      // Get contract statistics (these would need to be implemented in the contract)
      // For now, we'll use mock data or basic queries
      const totalTourists = 0; // This would come from contract events or state
      const totalRestaurants = 0; // This would come from contract events or state
      const dailyCoinsIssued = '0'; // This would come from today's events
      
      return {
        totalSupply: totalSupply.toString(),
        totalTourists,
        totalRestaurants,
        dailyCoinsIssued
      };
    } catch (error) {
      throw new ContractManagerError(
        'CONTRACT_INFO_FAILED',
        `Failed to get contract info: ${this.getErrorMessage(error)}`,
        error
      );
    }
  }

  /**
   * Register a tourist (API interface)
   */
  static async registerTouristAPI(
    address: string,
    originCountry: string,
    arrivalTimestamp: number,
    departureTimestamp: number
  ): Promise<{ hash: string }> {
    const result = await this.registerTourist({
      touristAddress: address,
      originCountry,
      arrivalTimestamp,
      departureTimestamp
    });
    return { hash: result.hash };
  }

  /**
   * Register a restaurant (API interface)
   */
  static async registerRestaurantAPI(
    address: string,
    googlePlaceId: string
  ): Promise<{ hash: string }> {
    const result = await this.registerRestaurant({
      restaurantAddress: address,
      googlePlaceId
    });
    return { hash: result.hash };
  }

  /**
   * Issue daily coins (API interface)
   */
  static async issueDailyCoinsAPI(address: string): Promise<{ hash: string }> {
    const result = await this.issueDailyCoins(address);
    return { hash: result.hash };
  }

  /**
   * Transfer coins to restaurant (API interface)
   */
  static async transferToRestaurantAPI(
    touristId: string,
    restaurantAddress: string,
    amount: number,
    googlePlaceId: string
  ): Promise<{ hash: string }> {
    const amountWei = ethers.utils.parseEther(amount.toString());
    const result = await this.transferToRestaurant(touristId, restaurantAddress, amountWei);
    return { hash: result.hash };
  }

  /**
   * Get balance as number (API interface)
   */
  static async getBalanceAPI(address: string): Promise<number> {
    const balance = await this.getBalance(address);
    return parseFloat(ethers.utils.formatEther(balance));
  }

  /**
   * Helper function to extract error message from unknown error
   */
  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  /**
   * Ensure ContractManager is initialized
   */
  private static ensureInitialized(): void {
    if (!this.initialized) {
      throw new ContractManagerError(
        'NOT_INITIALIZED',
        'ContractManager must be initialized before use'
      );
    }
  }
}