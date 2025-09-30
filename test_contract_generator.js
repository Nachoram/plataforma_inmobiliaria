// Test script to verify contract generator works with new normalized schema
// Run with: node test_contract_generator.js

import { generateContractForApplication } from './src/lib/contractGenerator.js';

async function testContractGeneration() {
  console.log('🧪 Testing contract generation with new schema...');

  try {
    // Test with a sample application ID (you'll need to replace this with a real ID)
    const testApplicationId = 'your-test-application-id-here';

    console.log('📄 Generating contract for application:', testApplicationId);
    const contractId = await generateContractForApplication(testApplicationId);

    if (contractId) {
      console.log('✅ Contract generated successfully:', contractId);
    } else {
      console.log('❌ Contract generation failed - returned null');
    }
  } catch (error) {
    console.error('❌ Error during contract generation test:', error);
  }
}

// Only run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testContractGeneration();
}

export { testContractGeneration };
