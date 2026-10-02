const http = require('http');
const { connectDB, disconnectDB } = require('./src/config/db');
const LabItem = require('./src/models/LabItem');
const labItemsData = require('./seed/labItems.json');
const { app } = require('./src/index');

let server;
const PORT = 5099;

function request(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${PORT}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PRD ACCEPTANCE TEST SUITE');
  console.log('========================================\n');

  await connectDB();
  await LabItem.deleteMany({});
  await LabItem.insertMany(labItemsData);
  console.log('✅ Database seeded with test data.\n');

  await new Promise(resolve => {
    server = app.listen(PORT, resolve);
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Lipid Profile & 110001
    console.log('Test 1: "Lipid Profile" in pincode 110001');
    {
      const res = await request('/api/search?search_query=Lipid%20Profile&pincode=110001');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 4, `Count is 4 (got ${res.body.count})`);
      const providers = res.body.results.map(r => `${r.provider_name} ₹${r.total_final_price}`);
      console.log('    Order:', providers.join(' → '));
      assert(res.body.results[0].provider_name === 'Local City Lab' && res.body.results[0].total_final_price === 450, '1st: Local City Lab ₹450');
      assert(res.body.results[1].provider_name === 'Apollo Diagnostics' && res.body.results[1].total_final_price === 900, '2nd: Apollo ₹900');
      assert(res.body.results[2].provider_name === 'Lal PathLabs' && res.body.results[2].total_final_price === 1650, '3rd: Lal PathLabs ₹1650');
      assert(res.body.results[3].provider_name === 'Tata 1mg' && res.body.results[3].total_final_price === 1999, '4th: Tata 1mg ₹1999');
    }

    // Test 2: Lipid Profile & 110002
    console.log('\nTest 2: "Lipid Profile" in pincode 110002');
    {
      const res = await request('/api/search?search_query=Lipid%20Profile&pincode=110002');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 2, `Count is 2 (got ${res.body.count})`);
      assert(res.body.results[0].provider_name === 'Apollo Diagnostics' && res.body.results[0].total_final_price === 900, '1st: Apollo ₹900');
      assert(res.body.results[1].provider_name === 'Tata 1mg' && res.body.results[1].total_final_price === 1999, '2nd: Tata 1mg ₹1999');
    }

    // Test 3: Lipid Profile & 560034
    console.log('\nTest 3: "Lipid Profile" in pincode 560034');
    {
      const res = await request('/api/search?search_query=Lipid%20Profile&pincode=560034');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 2, `Count is 2 (got ${res.body.count})`);
      assert(res.body.results[0].provider_name === 'Lal PathLabs' && res.body.results[0].total_final_price === 1650, '1st: Lal PathLabs ₹1650');
      assert(res.body.results[1].provider_name === 'Tata 1mg' && res.body.results[1].total_final_price === 1999, '2nd: Tata 1mg ₹1999');
    }

    // Test 4: lipid profile (lowercase) & 110001
    console.log('\nTest 4: "lipid profile" (lowercase) in pincode 110001');
    {
      const res = await request('/api/search?search_query=lipid%20profile&pincode=110001');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 4, `Count is 4 (got ${res.body.count})`);
      assert(res.body.results[0].provider_name === 'Local City Lab' && res.body.results[0].total_final_price === 450, 'Case-insensitive matching works');
    }

    // Test 5: MRI Brain & 560034
    console.log('\nTest 5: "MRI Brain" in pincode 560034');
    {
      const res = await request('/api/search?search_query=MRI%20Brain&pincode=560034');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 1, `Count is 1 (got ${res.body.count})`);
      assert(res.body.results[0].provider_name === 'Local Scan Centre' && res.body.results[0].total_final_price === 4200, 'Local Scan Centre ₹4200');
      assert(res.body.results[0].logistics.home_collection === false, 'Confirmed lab visit only / no home collection');
    }

    // Test 6: MRI Brain & 110001 (Empty State)
    console.log('\nTest 6: "MRI Brain" in pincode 110001 (Expected empty state)');
    {
      const res = await request('/api/search?search_query=MRI%20Brain&pincode=110001');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 0, 'Count is 0');
      assert(Array.isArray(res.body.results) && res.body.results.length === 0, 'Results is empty array');
    }

    // Test 7: HbA1c & 110001 (Packages only containing HbA1c)
    console.log('\nTest 7: "HbA1c" in pincode 110001');
    {
      const res = await request('/api/search?search_query=HbA1c&pincode=110001');
      assert(res.status === 200, 'HTTP status is 200');
      assert(res.body.count === 2, `Count is 2 (got ${res.body.count})`);
      assert(res.body.results.every(r => r.item_type === 'package'), 'All returned items are packages');
      assert(res.body.results[0].provider_name === 'Lal PathLabs' && res.body.results[0].total_final_price === 1650, '1st: Lal PathLabs ₹1650');
      assert(res.body.results[1].provider_name === 'Tata 1mg' && res.body.results[1].total_final_price === 1999, '2nd: Tata 1mg ₹1999');
    }

    // Test 8: Validation Error (Invalid pincode 12345)
    console.log('\nTest 8: "Lipid Profile" with 5-digit pincode 12345 (Validation error)');
    {
      const res = await request('/api/search?search_query=Lipid%20Profile&pincode=12345');
      assert(res.status === 400, 'HTTP status is 400');
      assert(res.body.error && res.body.error.includes('6 digits'), `Error message mentions 6 digits: "${res.body.error}"`);
    }

    // Test 9: Validation Error (Empty search query)
    console.log('\nTest 9: Empty search query with pincode 110001 (Validation error)');
    {
      const res = await request('/api/search?search_query=%20&pincode=110001');
      assert(res.status === 400, 'HTTP status is 400');
      assert(res.body.error && res.body.error.length > 0, `Error message returned: "${res.body.error}"`);
    }

    // Accreditation & Features Check
    console.log('\nExtra: NABL Accreditation & Badge Accuracy Check');
    {
      const res = await request('/api/search?search_query=Lipid%20Profile&pincode=110001');
      const localCityLab = res.body.results.find(r => r.provider_name === 'Local City Lab');
      const apollo = res.body.results.find(r => r.provider_name === 'Apollo Diagnostics');
      assert(localCityLab && localCityLab.nabl_accredited === false, 'Local City Lab has nabl_accredited: false');
      assert(apollo && apollo.nabl_accredited === true, 'Apollo Diagnostics has nabl_accredited: true');
    }

  } finally {
    if (server) server.close();
    await disconnectDB();
  }

  console.log('\n========================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
