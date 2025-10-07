// Test script to diagnose Edge Function issues
const SUPABASE_URL = 'https://kzmvofreoarbyaxsplto.supabase.co';
const FUNCTION_NAME = 'create-staff-with-auth';

async function testEdgeFunction() {
  console.log('🔍 Testing Edge Function: ' + FUNCTION_NAME);
  console.log('📍 Supabase URL:', SUPABASE_URL);
  console.log('');

  const url = `${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`;
  
  // Test 1: OPTIONS request (CORS preflight)
  console.log('Test 1: OPTIONS request (CORS preflight)');
  console.log('----------------------------------------');
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5174',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });
    
    console.log('Status:', response.status, response.statusText);
    console.log('Headers:');
    for (const [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    }
    
    if (response.status === 200) {
      console.log('✅ CORS preflight successful!');
    } else {
      console.log('❌ CORS preflight failed!');
      const text = await response.text();
      console.log('Response body:', text);
    }
  } catch (error) {
    console.log('❌ OPTIONS request failed:', error.message);
  }
  
  console.log('');
  
  // Test 2: Check if function exists
  console.log('Test 2: POST request (without auth)');
  console.log('----------------------------------------');
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });
    
    console.log('Status:', response.status, response.statusText);
    
    if (response.status === 401) {
      console.log('✅ Function exists! (401 = auth required, which is expected)');
    } else if (response.status === 404) {
      console.log('❌ Function NOT FOUND - needs to be deployed!');
    } else {
      console.log('ℹ️  Unexpected status:', response.status);
    }
    
    try {
      const json = await response.json();
      console.log('Response:', JSON.stringify(json, null, 2));
    } catch {
      const text = await response.text();
      console.log('Response (text):', text);
    }
  } catch (error) {
    console.log('❌ POST request failed:', error.message);
  }
  
  console.log('');
  console.log('='.repeat(50));
  console.log('📋 DIAGNOSIS:');
  console.log('='.repeat(50));
  console.log('');
  console.log('If you see:');
  console.log('  ❌ "CORS preflight failed" or "Function NOT FOUND"');
  console.log('     → The Edge Function needs to be deployed');
  console.log('');
  console.log('  ✅ "CORS preflight successful" + "Function exists"');
  console.log('     → Edge Function is working! Issue is elsewhere');
  console.log('');
  console.log('To deploy the Edge Function:');
  console.log('  1. Run: npx supabase login');
  console.log('  2. Run: npx supabase link --project-ref kzmvofreoarbyaxsplto');
  console.log('  3. Run: npx supabase functions deploy create-staff-with-auth');
}

testEdgeFunction().catch(console.error);

