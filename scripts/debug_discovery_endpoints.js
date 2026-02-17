const tuya = require('../src/config/tuya');

async function testEndpoint(path, name) {
    console.log(`\nTesting ${name}: ${path}`);
    try {
        const response = await tuya.request('GET', path);
        if (response.success) {
            console.log(`[SUCCESS] ${name}: Found ${response.result.total || (Array.isArray(response.result) ? response.result.length : 'Unknown')} items`);
            console.log(JSON.stringify(response.result).substring(0, 200) + '...');
            return true;
        } else {
            console.log(`[FAIL] ${name}: Code ${response.code} - ${response.msg}`);
            return false;
        }
    } catch (e) {
        console.log(`[ERROR] ${name}: ${e.message}`);
        return false;
    }
}

async function run() {
    console.log('--- Tuya User Endpoint Probe ---');
    await testEndpoint('/v1.0/users?page_no=1&page_size=50', 'List Users');

    // Also try managing users if above fails?
    // But usually for App Account linking, listing users is restricted.
    // If this fails, we must rely on Seed Device.
}

run();
