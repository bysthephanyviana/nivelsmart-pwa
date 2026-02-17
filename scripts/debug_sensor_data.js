const tuyaService = require('../src/services/tuya.service');
const tuya = require('../src/config/tuya');

async function debugDevice(devId) {
    console.log(`\n--- Debugging Device: ${devId} ---`);

    try {
        console.log('\nFetching PROCESSED data via Service (Updated Logic)...');
        const processed = await tuyaService.getDeviceStatus(devId);
        console.log('Processed Output:', JSON.stringify(processed, null, 2));

    } catch (error) {
        console.error('Error debugging device:', error);
    }
}

// Run with known device ID
debugDevice('eb5961daada3fea21cvjau');
