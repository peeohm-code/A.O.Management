import http from 'http';

const testEndpoint = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
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
};

console.log('🔍 Testing API Endpoints...\n');

// Test 1: Homepage
try {
  const home = await testEndpoint('/');
  console.log('✅ GET / -', home.status === 200 ? 'OK' : `Failed (${home.status})`);
} catch (err) {
  console.log('❌ GET / - Error:', err.message);
}

// Test 2: tRPC endpoint
try {
  const trpc = await testEndpoint('/api/trpc/auth.me');
  console.log('✅ GET /api/trpc/auth.me -', trpc.status === 200 ? 'OK' : `Status ${trpc.status}`);
} catch (err) {
  console.log('❌ GET /api/trpc/auth.me - Error:', err.message);
}

// Test 3: OAuth callback
try {
  const oauth = await testEndpoint('/api/oauth/callback');
  console.log('✅ GET /api/oauth/callback -', oauth.status ? `Status ${oauth.status}` : 'OK');
} catch (err) {
  console.log('❌ GET /api/oauth/callback - Error:', err.message);
}

// Test 4: Health check
try {
  const health = await testEndpoint('/api/health');
  console.log('✅ GET /api/health -', health.status === 200 ? 'OK' : `Status ${health.status}`);
} catch (err) {
  console.log('❌ GET /api/health - Error:', err.message);
}

console.log('\n✅ API endpoint tests completed');
