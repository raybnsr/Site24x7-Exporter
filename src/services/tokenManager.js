const axios = require('axios');
require('dotenv').config();

const API_DOMAIN = 'https://accounts.zoho.com';
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let accessToken = '';
let accessTokenTimestamp = 0;

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
    } catch (error) {
        console.error('Failed to authenticate:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function refreshAccessToken() {
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
            throw new Error('Failed to refresh access token: No access token received');
        }

        accessToken = response.data.access_token;
        accessTokenTimestamp = Math.floor(Date.now() / 1000);
    } catch (error) {
        console.error('Failed to refresh access token:', error.response ? error.response.data : error.message);
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

module.exports = {
    authenticate,
    refreshAccessToken,
    getAccessToken,
    isAccessTokenValid,
    isTokenExpired
};






// const axios = require('axios');
// require('dotenv').config();

// const API_DOMAIN = 'https://accounts.zoho.com';
// const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;

// let accessToken = '';
// let refreshToken = '';
// let accessTokenTimestamp = 0;

// async function authenticate() {
//     try {
//         const response = await axios.post(`${API_DOMAIN}/oauth/v2/token`, null, {
//             params: {
//                 client_id: CLIENT_ID,
//                 client_secret: CLIENT_SECRET,
//                 refresh_token: REFRESH_TOKEN,
//                 grant_type: 'refresh_token'
//             }
//         });

//         if (!response.data.access_token) {
//             throw new Error('Failed to authenticate: No access token received');
//         }

//         accessToken = response.data.access_token;
//         refreshToken = response.data.refresh_token;
//         accessTokenTimestamp = Math.floor(Date.now() / 1000);
//     } catch (error) {
//         console.error('Failed to authenticate:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// async function refreshAccessToken() {
//     try {
//         const response = await axios.post(`${API_DOMAIN}/oauth/v2/token`, null, {
//             params: {
//                 client_id: CLIENT_ID,
//                 client_secret: CLIENT_SECRET,
//                 refresh_token: refreshToken,
//                 grant_type: 'refresh_token'
//             }
//         });

//         if (!response.data.access_token) {
//             throw new Error('Failed to refresh access token: No access token received');
//         }

//         accessToken = response.data.access_token;
//         accessTokenTimestamp = Math.floor(Date.now() / 1000);
//     } catch (error) {
//         console.error('Failed to refresh access token:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// function getAccessToken() {
//     return accessToken;
// }

// function isAccessTokenValid() {
//     return accessToken !== '' && !isTokenExpired();
// }

// function isTokenExpired() {
//     const expiryTime = 3600; // 1 hour in seconds
//     const currentTime = Math.floor(Date.now() / 1000);
//     return (currentTime - accessTokenTimestamp) >= expiryTime;
// }

// module.exports = {
//     authenticate,
//     refreshAccessToken,
//     getAccessToken,
//     isAccessTokenValid
// };




























// const axios = require('axios');
// require('dotenv').config();

// // const ACCOUNT_DOMAIN = 'https://accounts.zoho.com';
// const API_DOMAIN = 'https://www.zohoapis.com';
// const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
// const CLIENT_ID = process.env.CLIENT_ID;
// const CLIENT_SECRET = process.env.CLIENT_SECRET;

// let accessToken = '';
// let refreshToken = '';
// let accessTokenTimestamp = 0;

// async function authenticate() {
//     try {
//         const response = await axios.post(`${API_DOMAIN}/oauth/v2/token`, {
//             client_id: CLIENT_ID,
//             client_secret: CLIENT_SECRET,
//             refresh_token: REFRESH_TOKEN,
//             grant_type: 'refresh_token'
//         });
//         accessToken = response.data.access_token;
//         refreshToken = response.data.refresh_token;
//         accessTokenTimestamp = Math.floor(Date.now() / 1000); 
//     } catch (error) {
//         console.error('Failed to authenticate:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// async function refreshAccessToken() {
//     try {
//         const response = await axios.post(`${API_DOMAIN}/oauth/v2/token`, {
//             client_id: CLIENT_ID,
//             client_secret: CLIENT_SECRET,
//             refresh_token: refreshToken,
//             grant_type: 'refresh_token'
//         });
//         accessToken = response.data.access_token;
//         // Setelah token akses baru diperoleh, kita juga memperbarui accessTokenTimestamp untuk mencatat waktu terbaru
//         accessTokenTimestamp = Math.floor(Date.now() / 1000); // Update waktu terbaru
//     } catch (error) {
//         console.error('Failed to refresh access token:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// function getAccessToken() {
//     return accessToken;
// }

// function isAccessTokenValid() {
//     return accessToken !== '' && !isTokenExpired();
// }

// function isTokenExpired() {
//     // Logika untuk mengecek apakah access token telah kedaluwarsa
//     // Berdasarkan waktu kadaluarsanya
//     // Menggunakan accessTokenTimestamp untuk menentukan waktunya
//     const expiryTime = 3600; // setiap token akses akan aktif selama 1 jam (3600 detik) yang dideklarasikan pada variabel expiryTime
//     const currentTime = Math.floor(Date.now() / 1000); // waktu saat ini dalam detik
//     return (currentTime - accessTokenTimestamp) >= expiryTime;
// }

// module.exports = {
//     authenticate,
//     refreshAccessToken,
//     getAccessToken,
//     isAccessTokenValid
// };