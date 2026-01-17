/**
 * Railway Deployment Checker
 * Checks if the Railway backend is deployed and working
 */

const https = require('https');

const RAILWAY_URL = 'https://web-production-e66fb.up.railway.app';
const PROJECT_ID = '9d312170-bd55-4f9d-b139-1bd7998f825c';

function checkEndpoint(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function main() {
  console.log('\n🚂 Railway Deployment Checker\n');
  console.log('Project ID:', PROJECT_ID);
  console.log('Railway URL:', RAILWAY_URL);
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 1: Health endpoint
  console.log('📊 Test 1: Health Endpoint');
  console.log('URL:', RAILWAY_URL + '/health');
  try {
    const result = await checkEndpoint(RAILWAY_URL + '/health');
    console.log('Status Code:', result.statusCode);
    console.log('Response:', result.data);
    
    if (result.statusCode === 200) {
      console.log('✅ Health endpoint is working!\n');
    } else if (result.statusCode === 404) {
      console.log('❌ Backend not deployed (404 - Application not found)\n');
    } else {
      console.log('⚠️  Unexpected status code\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n⚠️  Backend is not accessible\n');
  }

  // Test 2: PayMongo endpoint
  console.log('📊 Test 2: PayMongo API Endpoint');
  console.log('URL:', RAILWAY_URL + '/api/paymongo/create-payment-intent');
  try {
    const result = await checkEndpoint(
      RAILWAY_URL + '/api/paymongo/create-payment-intent',
      'POST',
      {
        amount: 10000,
        description: 'Test Payment',
        metadata: {}
      }
    );
    console.log('Status Code:', result.statusCode);
    console.log('Response:', result.data.substring(0, 200) + '...');
    
    if (result.statusCode === 200) {
      console.log('✅ PayMongo endpoint is working!\n');
    } else {
      console.log('⚠️  PayMongo endpoint returned error\n');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('\n⚠️  PayMongo endpoint is not accessible\n');
  }

  console.log('='.repeat(60) + '\n');
  console.log('🔍 Diagnosis:\n');
  console.log('If you see "404 - Application not found":');
  console.log('  1. Your Railway project exists but the backend is not deployed');
  console.log('  2. Railway needs to detect and deploy your backend code\n');
  
  console.log('📋 Next Steps:\n');
  console.log('1. Go to Railway Dashboard:');
  console.log('   https://railway.app/project/' + PROJECT_ID);
  console.log('\n2. Check if deployment is in progress or failed');
  console.log('\n3. Verify environment variables are set:');
  console.log('   - PAYMONGO_SECRET_KEY');
  console.log('   - PAYMONGO_PUBLIC_KEY');
  console.log('   - PORT=3000');
  console.log('\n4. Check deployment logs for errors');
  console.log('\n5. If needed, manually trigger a redeploy\n');
  
  console.log('='.repeat(60) + '\n');
}

main().catch(console.error);
