#!/usr/bin/env node

// Simple test script to verify the database reset API works
async function testReset() {
  console.log('🧪 Testing database reset API...');

  const baseUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000';
  console.log(`🔗 Testing ${baseUrl}/api/dev/reset-database`);

  try {
    const response = await fetch(`${baseUrl}/api/dev/reset-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm: 'RESET_DATABASE' }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Reset API test passed');
      console.log('📄 Response:', result);
    } else {
      console.error('❌ Reset API test failed');
      console.error('📄 Error:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test with wrong confirmation
async function testWrongConfirmation() {
  console.log('🧪 Testing wrong confirmation...');

  const baseUrl = process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/dev/reset-database`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ confirm: 'WRONG' }),
    });

    const result = await response.json();

    if (response.status === 400) {
      console.log('✅ Wrong confirmation test passed (correctly rejected)');
    } else {
      console.error('❌ Wrong confirmation test failed (should have been rejected)');
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting database reset API tests...');
  console.log('');

  await testWrongConfirmation();
  console.log('');
  await testReset();

  console.log('');
  console.log('🏁 Tests completed');
}

runTests().catch(console.error);
