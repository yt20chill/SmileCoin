// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

/**
 * @title SmileCoin
 * @dev ERC-20 token for the Tourist Rewards System
 * Implements upgradeable pattern for future enhancements
 */
contract SmileCoin is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    
    /**
     * @dev Tourist data structure
     */
    struct TouristData {
        string originCountry;
        uint256 arrivalTimestamp;
        uint256 departureTimestamp;
        uint256 lastDailyMint;
        uint256 totalDailyMints;
        bool physicalCoinEligible;
    }

    /**
     * @dev Coin metadata for tracking expiration
     */
    struct CoinBatch {
        uint256 amount;
        uint256 mintTimestamp;
        uint256 expirationTimestamp;
        string touristOrigin;
    }

    /**
     * @dev Restaurant data structure
     */
    struct RestaurantData {
        string googlePlaceId;
        uint256 totalCoinsReceived;
        mapping(address => mapping(uint256 => uint256)) dailyCoinsFromTourist; // tourist => day => coins
    }

    // Mapping from tourist address to their data
    mapping(address => TouristData) public tourists;
    
    // Mapping from restaurant address to their data
    mapping(address => RestaurantData) public restaurants;
    
    // Mapping from tourist to their coin batches (for expiration tracking)
    mapping(address => CoinBatch[]) public touristCoinBatches;

    // Constants
    uint256 public constant DAILY_COIN_AMOUNT = 10 * 10**18; // 10 coins
    uint256 public constant COIN_EXPIRATION_DAYS = 14;
    uint256 public constant MAX_COINS_PER_RESTAURANT_PER_DAY = 3 * 10**18; // 3 coins

    // Events
    event TouristRegistered(
        address indexed tourist,
        string originCountry,
        uint256 arrivalTimestamp,
        uint256 departureTimestamp
    );

    event RestaurantRegistered(
        address indexed restaurant,
        string googlePlaceId
    );

    event DailyCoinsIssued(
        address indexed tourist,
        uint256 amount,
        string originCountry,
        uint256 expirationTimestamp
    );

    event CoinsTransferred(
        address indexed from,
        address indexed to,
        uint256 amount,
        string restaurantPlaceId,
        string touristOriginCountry
    );

    event CoinsExpired(
        address indexed tourist,
        uint256 amount,
        uint256 expirationTimestamp
    );

    event PhysicalCoinEligibilityUpdated(
        address indexed tourist,
        bool eligible
    );

    /**
     * @dev Initialize the contract with token metadata
     * Uses proxy pattern instead of constructor
     */
    function initialize() public initializer {
        __ERC20_init("Smile Coin", "SMILE");
        __Ownable_init();
    }

    /**
     * @dev Register a tourist with their travel information
     * @param tourist The wallet address of the tourist
     * @param originCountry The country the tourist is from
     * @param arrivalTimestamp Unix timestamp of arrival
     * @param departureTimestamp Unix timestamp of departure
     */
    function registerTourist(
        address tourist,
        string memory originCountry,
        uint256 arrivalTimestamp,
        uint256 departureTimestamp
    ) external onlyOwner {
        require(tourist != address(0), "Invalid tourist address");
        require(bytes(originCountry).length > 0, "Origin country cannot be empty");
        require(arrivalTimestamp > 0, "Invalid arrival timestamp");
        require(departureTimestamp > arrivalTimestamp, "Departure must be after arrival");
        require(bytes(tourists[tourist].originCountry).length == 0, "Tourist already registered");

        tourists[tourist] = TouristData({
            originCountry: originCountry,
            arrivalTimestamp: arrivalTimestamp,
            departureTimestamp: departureTimestamp,
            lastDailyMint: 0,
            totalDailyMints: 0,
            physicalCoinEligible: false
        });

        emit TouristRegistered(tourist, originCountry, arrivalTimestamp, departureTimestamp);
    }

    /**
     * @dev Check if a tourist is registered
     * @param tourist The tourist address to check
     * @return bool True if tourist is registered
     */
    function isTouristRegistered(address tourist) external view returns (bool) {
        return bytes(tourists[tourist].originCountry).length > 0;
    }

    /**
     * @dev Get tourist data
     * @param tourist The tourist address
     * @return TouristData The tourist's data
     */
    function getTouristData(address tourist) external view returns (TouristData memory) {
        require(bytes(tourists[tourist].originCountry).length > 0, "Tourist not registered");
        return tourists[tourist];
    }

    /**
     * @dev Register a restaurant with their Google Place ID
     * @param restaurant The wallet address of the restaurant
     * @param googlePlaceId The Google Place ID of the restaurant
     */
    function registerRestaurant(
        address restaurant,
        string memory googlePlaceId
    ) external onlyOwner {
        require(restaurant != address(0), "Invalid restaurant address");
        require(bytes(googlePlaceId).length > 0, "Google Place ID cannot be empty");
        require(bytes(restaurants[restaurant].googlePlaceId).length == 0, "Restaurant already registered");

        restaurants[restaurant].googlePlaceId = googlePlaceId;
        restaurants[restaurant].totalCoinsReceived = 0;

        emit RestaurantRegistered(restaurant, googlePlaceId);
    }

    /**
     * @dev Check if a restaurant is registered
     * @param restaurant The restaurant address to check
     * @return bool True if restaurant is registered
     */
    function isRestaurantRegistered(address restaurant) external view returns (bool) {
        return bytes(restaurants[restaurant].googlePlaceId).length > 0;
    }

    /**
     * @dev Get restaurant Google Place ID
     * @param restaurant The restaurant address
     * @return string The restaurant's Google Place ID
     */
    function getRestaurantPlaceId(address restaurant) external view returns (string memory) {
        require(bytes(restaurants[restaurant].googlePlaceId).length > 0, "Restaurant not registered");
        return restaurants[restaurant].googlePlaceId;
    }

    /**
     * @dev Get restaurant total coins received
     * @param restaurant The restaurant address
     * @return uint256 Total coins received by the restaurant
     */
    function getRestaurantTotalCoins(address restaurant) external view returns (uint256) {
        require(bytes(restaurants[restaurant].googlePlaceId).length > 0, "Restaurant not registered");
        return restaurants[restaurant].totalCoinsReceived;
    }

    /**
     * @dev Get daily coins received from a specific tourist
     * @param restaurant The restaurant address
     * @param tourist The tourist address
     * @param day The day (timestamp / 1 days)
     * @return uint256 Coins received from tourist on that day
     */
    function getDailyCoinsFromTourist(
        address restaurant,
        address tourist,
        uint256 day
    ) external view returns (uint256) {
        require(bytes(restaurants[restaurant].googlePlaceId).length > 0, "Restaurant not registered");
        return restaurants[restaurant].dailyCoinsFromTourist[tourist][day];
    }

    /**
     * @dev Issue daily coins to a tourist
     * @param tourist The tourist address to issue coins to
     */
    function issueDailyCoins(address tourist) external onlyOwner {
        TouristData storage touristData = tourists[tourist];
        require(bytes(touristData.originCountry).length > 0, "Tourist not registered");
        require(block.timestamp >= touristData.arrivalTimestamp, "Tourist not arrived yet");
        require(block.timestamp <= touristData.departureTimestamp, "Tourist departure passed");
        
        uint256 today = block.timestamp / 1 days;
        require(touristData.lastDailyMint < today, "Daily coins already issued today");

        // Mint coins to tourist
        _mint(tourist, DAILY_COIN_AMOUNT);
        
        // Update tourist data
        touristData.lastDailyMint = today;
        touristData.totalDailyMints++;

        // Calculate expiration timestamp
        uint256 expirationTimestamp = block.timestamp + (COIN_EXPIRATION_DAYS * 1 days);

        // Add coin batch for expiration tracking
        touristCoinBatches[tourist].push(CoinBatch({
            amount: DAILY_COIN_AMOUNT,
            mintTimestamp: block.timestamp,
            expirationTimestamp: expirationTimestamp,
            touristOrigin: touristData.originCountry
        }));

        emit DailyCoinsIssued(tourist, DAILY_COIN_AMOUNT, touristData.originCountry, expirationTimestamp);
    }

    /**
     * @dev Check if tourist can receive daily coins today
     * @param tourist The tourist address
     * @return bool True if tourist can receive coins today
     */
    function canReceiveDailyCoins(address tourist) external view returns (bool) {
        TouristData memory touristData = tourists[tourist];
        
        if (bytes(touristData.originCountry).length == 0) {
            return false; // Not registered
        }
        
        if (block.timestamp < touristData.arrivalTimestamp || block.timestamp > touristData.departureTimestamp) {
            return false; // Not in travel period
        }
        
        uint256 today = block.timestamp / 1 days;
        return touristData.lastDailyMint < today;
    }

    /**
     * @dev Get the last day coins were issued to a tourist
     * @param tourist The tourist address
     * @return uint256 The last day coins were issued (0 if never)
     */
    function getLastDailyMint(address tourist) external view returns (uint256) {
        return tourists[tourist].lastDailyMint;
    }

    /**
     * @dev Get total daily mints for a tourist
     * @param tourist The tourist address
     * @return uint256 Total number of daily mints
     */
    function getTotalDailyMints(address tourist) external view returns (uint256) {
        return tourists[tourist].totalDailyMints;
    }

    /**
     * @dev Transfer coins to a restaurant with daily limits
     * @param restaurant The restaurant address
     * @param amount The amount of coins to transfer
     */
    function transferToRestaurant(
        address restaurant,
        uint256 amount
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= MAX_COINS_PER_RESTAURANT_PER_DAY, "Exceeds daily limit per restaurant");
        require(bytes(restaurants[restaurant].googlePlaceId).length > 0, "Restaurant not registered");
        require(bytes(tourists[msg.sender].originCountry).length > 0, "Tourist not registered");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        uint256 today = block.timestamp / 1 days;
        uint256 dailyTransferred = restaurants[restaurant].dailyCoinsFromTourist[msg.sender][today];
        require(dailyTransferred + amount <= MAX_COINS_PER_RESTAURANT_PER_DAY, "Daily limit exceeded for this restaurant");

        // Transfer tokens
        _transfer(msg.sender, restaurant, amount);
        
        // Update restaurant data
        restaurants[restaurant].dailyCoinsFromTourist[msg.sender][today] += amount;
        restaurants[restaurant].totalCoinsReceived += amount;

        emit CoinsTransferred(
            msg.sender,
            restaurant,
            amount,
            restaurants[restaurant].googlePlaceId,
            tourists[msg.sender].originCountry
        );
    }

    /**
     * @dev Check how many coins a tourist can still transfer to a restaurant today
     * @param tourist The tourist address
     * @param restaurant The restaurant address
     * @return uint256 Remaining coins that can be transferred today
     */
    function getRemainingDailyTransferLimit(
        address tourist,
        address restaurant
    ) external view returns (uint256) {
        require(bytes(restaurants[restaurant].googlePlaceId).length > 0, "Restaurant not registered");
        
        uint256 today = block.timestamp / 1 days;
        uint256 dailyTransferred = restaurants[restaurant].dailyCoinsFromTourist[tourist][today];
        
        if (dailyTransferred >= MAX_COINS_PER_RESTAURANT_PER_DAY) {
            return 0;
        }
        
        return MAX_COINS_PER_RESTAURANT_PER_DAY - dailyTransferred;
    }

    /**
     * @dev Check if a tourist can transfer a specific amount to a restaurant
     * @param tourist The tourist address
     * @param restaurant The restaurant address
     * @param amount The amount to check
     * @return bool True if transfer is allowed
     */
    function canTransferToRestaurant(
        address tourist,
        address restaurant,
        uint256 amount
    ) external view returns (bool) {
        if (bytes(restaurants[restaurant].googlePlaceId).length == 0) {
            return false; // Restaurant not registered
        }
        
        if (bytes(tourists[tourist].originCountry).length == 0) {
            return false; // Tourist not registered
        }
        
        if (balanceOf(tourist) < amount) {
            return false; // Insufficient balance
        }
        
        if (amount > MAX_COINS_PER_RESTAURANT_PER_DAY) {
            return false; // Exceeds max per transaction
        }
        
        uint256 today = block.timestamp / 1 days;
        uint256 dailyTransferred = restaurants[restaurant].dailyCoinsFromTourist[tourist][today];
        
        return (dailyTransferred + amount <= MAX_COINS_PER_RESTAURANT_PER_DAY);
    }

    /**
     * @dev Burn expired coins for a tourist
     * @param tourist The tourist address
     * @return uint256 Amount of coins burned
     */
    function burnExpiredCoins(address tourist) external onlyOwner returns (uint256) {
        require(bytes(tourists[tourist].originCountry).length > 0, "Tourist not registered");
        
        uint256 totalBurned = 0;
        CoinBatch[] storage batches = touristCoinBatches[tourist];
        
        for (uint256 i = 0; i < batches.length; i++) {
            if (block.timestamp >= batches[i].expirationTimestamp && batches[i].amount > 0) {
                uint256 burnAmount = batches[i].amount;
                
                // Check if tourist has enough balance to burn
                if (balanceOf(tourist) >= burnAmount) {
                    _burn(tourist, burnAmount);
                    totalBurned += burnAmount;
                    
                    emit CoinsExpired(tourist, burnAmount, batches[i].expirationTimestamp);
                }
                
                // Mark batch as burned
                batches[i].amount = 0;
            }
        }
        
        return totalBurned;
    }

    /**
     * @dev Check physical coin eligibility for a tourist
     * @param tourist The tourist address
     * @return bool True if eligible for physical coin
     */
    function checkPhysicalCoinEligibility(address tourist) external view returns (bool) {
        TouristData memory touristData = tourists[tourist];
        
        if (bytes(touristData.originCountry).length == 0) {
            return false; // Not registered
        }
        
        if (block.timestamp < touristData.arrivalTimestamp) {
            return false; // Not arrived yet
        }
        
        uint256 daysSinceArrival = (block.timestamp - touristData.arrivalTimestamp) / 1 days;
        
        // Must have received daily coins for all days since arrival (minimum 1 day)
        return touristData.totalDailyMints >= daysSinceArrival && daysSinceArrival > 0;
    }

    /**
     * @dev Update physical coin eligibility status
     * @param tourist The tourist address
     */
    function updatePhysicalCoinEligibility(address tourist) external onlyOwner {
        require(bytes(tourists[tourist].originCountry).length > 0, "Tourist not registered");
        
        bool eligible = this.checkPhysicalCoinEligibility(tourist);
        tourists[tourist].physicalCoinEligible = eligible;
        
        emit PhysicalCoinEligibilityUpdated(tourist, eligible);
    }

    /**
     * @dev Get expired coin batches for a tourist
     * @param tourist The tourist address
     * @return uint256 Total amount of expired coins
     */
    function getExpiredCoinsAmount(address tourist) external view returns (uint256) {
        CoinBatch[] memory batches = touristCoinBatches[tourist];
        uint256 expiredAmount = 0;
        
        for (uint256 i = 0; i < batches.length; i++) {
            if (block.timestamp >= batches[i].expirationTimestamp && batches[i].amount > 0) {
                expiredAmount += batches[i].amount;
            }
        }
        
        return expiredAmount;
    }

    /**
     * @dev Get number of coin batches for a tourist
     * @param tourist The tourist address
     * @return uint256 Number of coin batches
     */
    function getCoinBatchCount(address tourist) external view returns (uint256) {
        return touristCoinBatches[tourist].length;
    }

    /**
     * @dev Get coin batch details
     * @param tourist The tourist address
     * @param batchIndex The batch index
     * @return CoinBatch The coin batch details
     */
    function getCoinBatch(address tourist, uint256 batchIndex) external view returns (CoinBatch memory) {
        require(batchIndex < touristCoinBatches[tourist].length, "Batch index out of bounds");
        return touristCoinBatches[tourist][batchIndex];
    }

    /**
     * @dev Check if tourist is eligible for physical coin
     * @param tourist The tourist address
     * @return bool Physical coin eligibility status
     */
    function isPhysicalCoinEligible(address tourist) external view returns (bool) {
        return tourists[tourist].physicalCoinEligible;
    }
}