const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

const API_DOMAIN = 'https://accounts.zoho.com';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TOKEN_FILE = './token.json';

let accessToken = '';
let accessTokenTimestamp = 0;

function loadTokenFromFile() {
    if (fs.existsSync(TOKEN_FILE)) {
        const data = fs.readFileSync(TOKEN_FILE);
        const tokenData = JSON.parse(data);
        accessToken = tokenData.accessToken;
        accessTokenTimestamp = tokenData.accessTokenTimestamp;
    }
}

function saveTokenToFile() {
    const tokenData = {
        accessToken,
        accessTokenTimestamp
    };
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData));
}

async function authenticate() {
    try {
        const response = await axios.post(`${API_DOMAIN}/oauth/v2/token`, null, {
            params: {
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                refresh_token: REFRESH_TOKEN,
                grant_type: 'refresh_token'
            }
        });

        if (!response.data.access_token) {
            throw new Error('Failed to authenticate: No access token received');
        }

        accessToken = response.data.access_token;
        accessTokenTimestamp = Math.floor(Date.now() / 1000);
        saveTokenToFile();
        console.log('Token has been refreshed:', new Date().toISOString());
    } catch (error) {
        console.error('Failed to authenticate:', error.response ? error.response.data : error.message);
        throw error;
    }
}

function getAccessToken() {
    return accessToken;
}

function isAccessTokenValid() {
    return accessToken !== '' && !isTokenExpired();
}

function isTokenExpired() {
    const expiryTime = 3600; // 1 hour in seconds
    const currentTime = Math.floor(Date.now() / 1000);
    return (currentTime - accessTokenTimestamp) >= expiryTime;
}

async function ensureTokenIsValid() {
    if (!isAccessTokenValid()) {
        await authenticate();
    }
}

// Load token from file on startup
loadTokenFromFile();

module.exports = {
    authenticate,
    getAccessToken,
    ensureTokenIsValid,
    isAccessTokenValid,
    isTokenExpired
};