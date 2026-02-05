const axios = require('axios');
const crypto = require('crypto');

// Tuya API Configuration
const config = {
    clientId: (process.env.TUYA_CLIENT_ID || '').trim(),
    clientSecret: (process.env.TUYA_CLIENT_SECRET || '').trim(),
    baseUrl: 'https://openapi.tuyaus.com', // Western America Data Center
};

let accessToken = null;
let tokenExpireTime = 0;

/**
 * Get Access Token from Tuya
 */
async function getAccessToken() {
    const now = new Date().getTime();
    if (accessToken && now < tokenExpireTime) {
        return accessToken;
    }

    const timestamp = now.toString();
    const nonce = '';

    // Debug Logs
    console.log('--- Tuya Auth (Business Mode) ---');
    console.log('Timestamp:', timestamp);

    // Business Mode Signature for Token
    // Str = clientId + t + nonce + stringToSign
    // stringToSign = Method + \n + Content-Hash + \n + Headers + \n + Url
    const path = '/v1.0/token?grant_type=1';
    const contentHash = crypto.createHash('sha256').update('').digest('hex'); // Empty body for GET
    const stringToSign = ['GET', contentHash, '', path].join('\n');
    const str = config.clientId + timestamp + nonce + stringToSign;

    const sign = crypto.createHmac('sha256', config.clientSecret)
        .update(str)
        .digest('hex')
        .toUpperCase();

    try {
        const response = await axios.get(`${config.baseUrl}${path}`, {
            headers: {
                'client_id': config.clientId,
                'sign': sign,
                't': timestamp,
                'sign_method': 'HMAC-SHA256',
                'nonce': nonce,
                'stringToSign': ''
            }
        });

        if (response.data.success) {
            accessToken = response.data.result.access_token;
            // Expire time usually 7200 seconds. Remove 60s for safety.
            tokenExpireTime = now + (response.data.result.expire_time * 1000) - 60000;
            console.log('Tuya Token Acquired:', accessToken);
            return accessToken;
        } else {
            console.error('Tuya Token FAILING:', response.data);
            throw new Error(`Tuya Auth Failed: ${response.data.msg} (Code: ${response.data.code})`);
        }
    } catch (error) {
        console.error('CRITICAL: Tuya Auth Request Error:', error.message);
        throw error; // Propagate error to stop flow
    }
}

/**
 * Make Authenticated Request to Tuya
 */
async function request(method, path, body = null) {
    const token = await getAccessToken();
    const timestamp = new Date().getTime().toString();
    const nonce = '';

    // Business Mode Signature for Request
    // Str = clientId + accessToken + t + nonce + stringToSign
    // stringToSign = Method + \n + Content-Hash + \n + Headers + \n + Url

    // Simplification based on successful token logic logic from diagnostic script
    const contentHash = crypto.createHash('sha256').update(body ? JSON.stringify(body) : '').digest('hex');
    const stringToSign = [method, contentHash, '', path].join('\n');

    const strForSign = config.clientId + token + timestamp + nonce + stringToSign;
    const sign = crypto.createHmac('sha256', config.clientSecret).update(strForSign).digest('hex').toUpperCase();

    const headers = {
        'client_id': config.clientId,
        'access_token': token,
        'sign': sign,
        't': timestamp,
        'sign_method': 'HMAC-SHA256'
    };

    // Only add content type if we have body (Tuya diagnostic logic match)
    if (body) {
        headers['Content-Type'] = 'application/json';
    }

    try {
        const response = await axios({
            method,
            url: `${config.baseUrl}${path}`,
            headers,
            data: body
        });
        return response.data;
    } catch (error) {
        console.error(`Tuya Request Error [${path}]:`, error.message);
        if (error.response) {
            console.error('Tuya Error Response:', error.response.data);
            return error.response.data; // Return the error object to handle logic upstream
        }
        return { success: false, msg: error.message };
    }
}

module.exports = {
    request
};
