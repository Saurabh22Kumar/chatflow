#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testUsernameCheck() {
  console.log('🧪 Testing Username Checking API...\n');
  
  const testCases = [
    { username: 'validuser123', expectedAvailable: true },
    { username: 'test_user', expectedAvailable: true },
    { username: 'a', expectedAvailable: false }, // Too short
    { username: 'thisusernameiswaywaytoolong', expectedAvailable: false }, // Too long
    { username: 'invalid-chars!', expectedAvailable: false }, // Invalid chars
    { username: 'normaluser', expectedAvailable: true },
  ];
  
  for (const testCase of testCases) {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/api/auth/check-username/${testCase.username}`, {
        timeout: 10000
      });
      const endTime = Date.now();
      
      const { available, msg } = response.data;
      const responseTime = endTime - startTime;
      
      const status = testCase.expectedAvailable === available ? '✅ PASS' : '❌ FAIL';
      
      console.log(`${status} Username: "${testCase.username}"`);
      console.log(`   Available: ${available}`);
      console.log(`   Message: "${msg}"`);
      console.log(`   Response time: ${responseTime}ms\n`);
      
    } catch (error) {
      console.log(`❌ ERROR Username: "${testCase.username}"`);
      console.log(`   Error: ${error.message}\n`);
    }
  }
  
  console.log('✨ Username checking test completed!');
}

testUsernameCheck().catch(console.error);
