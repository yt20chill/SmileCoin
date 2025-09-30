// API endpoints testing utility

import ApiClient from './client';

/**
 * Test all API endpoints to ensure they're working correctly
 */
export async function testApiEndpoints(): Promise<{
  success: boolean;
  results: Record<string, { success: boolean; error?: string; duration?: number }>;
}> {
  const results: Record<string, { success: boolean; error?: string; duration?: number }> = {};
  
  // Helper function to test an endpoint
  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    const startTime = Date.now();
    try {
      await testFn();
      results[name] = { 
        success: true, 
        duration: Date.now() - startTime 
      };
    } catch (error) {
      results[name] = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime 
      };
    }
  };
  
  // Test health check
  await testEndpoint('health', () => ApiClient.healthCheck());
  
  // Test user registration
  let testUserId: string | undefined;
  await testEndpoint('user-registration', async () => {
    const result = await ApiClient.registerUser({
      preferredLanguage: 'en',
      registrationMethod: 'manual',
      flightNumber: 'TEST123',
    });
    testUserId = result.user.id;
    return result;
  });
  
  // Test get user (if registration succeeded)
  if (results['user-registration'].success && testUserId) {
    await testEndpoint('get-user', () => ApiClient.getUser(testUserId!));
    
    // Test wallet balance
    await testEndpoint('wallet-balance', () => ApiClient.getWalletBalance(testUserId!));
    
    // Test transactions
    await testEndpoint('wallet-transactions', () => ApiClient.getTransactions(testUserId!, 10));
  }
  
  // Test merchants
  await testEndpoint('get-merchants', () => ApiClient.getMerchants());
  
  // Test merchants with filters
  await testEndpoint('get-merchants-filtered', () => ApiClient.getMerchants('restaurant'));
  
  // Test offers
  await testEndpoint('get-offers', () => ApiClient.getOffers());
  
  // Test rewards
  await testEndpoint('get-rewards', () => ApiClient.getRewards());
  
  // Test rewards by category
  await testEndpoint('get-rewards-by-category', () => ApiClient.getRewards('souvenir'));
  
  // Test boarding pass upload (mock file)
  await testEndpoint('boarding-pass-upload', async () => {
    const mockFile = new File(['mock boarding pass'], 'boarding-pass.jpg', { type: 'image/jpeg' });
    return ApiClient.uploadBoardingPass(mockFile);
  });
  
  // Calculate overall success
  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  const success = successCount === totalCount;
  
  console.log(`API Test Results: ${successCount}/${totalCount} endpoints passed`);
  
  return { success, results };
}

/**
 * Test specific user flow: register → get merchants → rate merchant
 */
export async function testUserFlow(): Promise<{
  success: boolean;
  steps: Record<string, { success: boolean; error?: string; data?: any }>;
}> {
  const steps: Record<string, { success: boolean; error?: string; data?: any }> = {};
  
  try {
    // Step 1: Register user
    console.log('Testing user flow: Step 1 - Register user');
    const registrationResult = await ApiClient.registerUser({
      preferredLanguage: 'en',
      registrationMethod: 'manual',
      flightNumber: 'FLOW123',
    });
    steps['register'] = { success: true, data: registrationResult };
    
    const userId = registrationResult.user.id;
    
    // Step 2: Get merchants
    console.log('Testing user flow: Step 2 - Get merchants');
    const merchants = await ApiClient.getMerchants();
    steps['get-merchants'] = { success: true, data: merchants };
    
    if (merchants.length === 0) {
      throw new Error('No merchants available for testing');
    }
    
    // Step 3: Get merchant details
    console.log('Testing user flow: Step 3 - Get merchant details');
    const merchant = await ApiClient.getMerchant(merchants[0].id);
    steps['get-merchant'] = { success: true, data: merchant };
    
    // Step 4: Rate merchant (this might fail due to insufficient balance in fresh registration)
    console.log('Testing user flow: Step 4 - Rate merchant');
    try {
      const ratingResult = await ApiClient.rateMerchant(merchants[0].id, userId, 2);
      steps['rate-merchant'] = { success: true, data: ratingResult };
    } catch (error) {
      // This is expected if the user doesn't have enough coins
      steps['rate-merchant'] = { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
    
    // Step 5: Get updated balance
    console.log('Testing user flow: Step 5 - Get updated balance');
    const balance = await ApiClient.getWalletBalance(userId);
    steps['get-balance'] = { success: true, data: balance };
    
    // Step 6: Get rewards
    console.log('Testing user flow: Step 6 - Get rewards');
    const rewards = await ApiClient.getRewards();
    steps['get-rewards'] = { success: true, data: rewards };
    
    const successCount = Object.values(steps).filter(s => s.success).length;
    const totalCount = Object.keys(steps).length;
    
    console.log(`User Flow Test: ${successCount}/${totalCount} steps passed`);
    
    return { 
      success: successCount >= totalCount - 1, // Allow rating to fail
      steps 
    };
    
  } catch (error) {
    const currentStep = Object.keys(steps).length;
    const stepNames = ['register', 'get-merchants', 'get-merchant', 'rate-merchant', 'get-balance', 'get-rewards'];
    const failedStep = stepNames[currentStep] || 'unknown';
    
    steps[failedStep] = { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
    
    return { success: false, steps };
  }
}

/**
 * Performance test for API endpoints
 */
export async function performanceTest(): Promise<{
  averageResponseTime: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  results: Record<string, number>;
}> {
  const results: Record<string, number> = {};
  
  // Test multiple calls to each endpoint
  const endpoints = [
    { name: 'health', fn: () => ApiClient.healthCheck() },
    { name: 'merchants', fn: () => ApiClient.getMerchants() },
    { name: 'offers', fn: () => ApiClient.getOffers() },
    { name: 'rewards', fn: () => ApiClient.getRewards() },
  ];
  
  for (const endpoint of endpoints) {
    const times: number[] = [];
    
    // Run each endpoint 3 times
    for (let i = 0; i < 3; i++) {
      const startTime = Date.now();
      try {
        await endpoint.fn();
        times.push(Date.now() - startTime);
      } catch (error) {
        console.warn(`Performance test failed for ${endpoint.name}:`, error);
        times.push(10000); // Penalty for failed requests
      }
    }
    
    // Calculate average
    results[endpoint.name] = times.reduce((sum, time) => sum + time, 0) / times.length;
  }
  
  const averageResponseTime = Object.values(results).reduce((sum, time) => sum + time, 0) / Object.values(results).length;
  const slowestEndpoint = Object.entries(results).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  const fastestEndpoint = Object.entries(results).reduce((a, b) => a[1] < b[1] ? a : b)[0];
  
  console.log('Performance Test Results:', {
    averageResponseTime: Math.round(averageResponseTime),
    slowestEndpoint,
    fastestEndpoint,
    results: Object.fromEntries(
      Object.entries(results).map(([name, time]) => [name, Math.round(time)])
    ),
  });
  
  return {
    averageResponseTime,
    slowestEndpoint,
    fastestEndpoint,
    results,
  };
}