const axios = require('axios');
const { getAccessToken } = require('./tokenManager');
require('dotenv').config();

async function fetchDataFromSite24x7() {
  try {
    const accessToken = getAccessToken();
    const zaaid = process.env.ZAAID; 

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Cookie': `zaaid=${zaaid}`
      }
    };

    const response = await axios.get('https://www.site24x7.com/api/reports/performance/type/SERVER?period=0&metric_aggregation=0', config);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch data from Site24x7 API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function fetchGlobalMonitorStatus() {
  try {
    const accessToken = getAccessToken();
    const zaaid = process.env.ZAAID;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`
        // 'Cookie': `zaaid=${zaaid}`
      }
    };

    const response = await axios.get('https://www.site24x7.com/api/msp/monitors/status', config);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch global monitor status from Site24x7 API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function fetchSummaryReport() {
  try {
    const accessToken = getAccessToken();
    const zaaid = process.env.ZAAID; 

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Cookie': `zaaid=${zaaid}`
      }
    };

    const response = await axios.get('https://www.site24x7.com/api/reports/summary?period=0', config);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch summary report from Site24x7 API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

async function fetchCurrentStatusData() {
  try {
    const accessToken = getAccessToken();
    const zaaid = process.env.ZAAID; 

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Cookie': `zaaid=${zaaid}`
      }
    };

    const response = await axios.get('https://www.site24x7.com/api/current_status?apm_required=true&group_required=true&locations_required=true&suspended_required=true', config);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch current status from Site24x7 API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = {
  fetchDataFromSite24x7,
  fetchGlobalMonitorStatus,
  fetchSummaryReport,
  fetchCurrentStatusData
};








// const axios = require('axios');
// const { getAccessToken, isTokenExpired, refreshAccessToken } = require('./tokenManager');
// require('dotenv').config();

// async function fetchDataFromSite24x7() {
//   try {
//     // Check if the access token is expired and refresh if necessary
//     if (isTokenExpired()) {
//       await refreshAccessToken();
//     }

//     const accessToken = getAccessToken();
//     const zaaid = process.env.ZAAID; 

//     const config = {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Zoho-oauthtoken ${accessToken}`,
//         'Cookie': `zaaid=${zaaid}`
//       }
//     };

//     const response = await axios.get('https://www.site24x7.com/api/reports/performance/type/SERVER?period=0&metric_aggregation=0', config);
//     return response.data;
//   } catch (error) {
//     // If the access token is invalid or expired, refresh the token and retry
//     if (error.response && error.response.status === 401) {
//       console.error('Access token expired, refreshing token and retrying request...');
//       await refreshAccessToken();
//       return fetchDataFromSite24x7();
//     } else {
//       console.error('Failed to fetch data from Site24x7 API:', error.response ? error.response.data : error.message);
//       throw error;
//     }
//   }
// }

// module.exports = {
//   fetchDataFromSite24x7
// };



// const axios = require('axios');
// const { getAccessToken } = require('./tokenManager');
// require('dotenv').config();

// async function fetchDataFromSite24x7() {
//   try {
//     const accessToken = getAccessToken();
//     const zaaid = process.env.ZAAID; // Pastikan ZAAID ada di dalam file .env Anda

//     const config = {
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Zoho-oauthtoken ${accessToken}`,
//         'Cookie': `zaaid=${zaaid}`
//       }
//     };

//     const response = await axios.get('https://www.site24x7.com/api/reports/performance/type/SERVER?period=0&metric_aggregation=0', config);
//     return response.data;
//   } catch (error) {
//     console.error('Failed to fetch data from Site24x7 API:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// module.exports = {
//   fetchDataFromSite24x7
// };



// const axios = require('axios');
// const { getAccessToken } = require('./tokenManager');
// require('dotenv').config();

// async function fetchDataFromSite24x7() {
//     try {
//         const accessToken = getAccessToken();
//         const zaaid = process.env.ZAAID;

//         const config = {
//             headers: {
//                 'Content-Type': 'application/x-www-form-urlencoded',
//                 'Authorization': `Bearer ${accessToken}`,
//                 'zaaid': zaaid
//             }
//         };

//         const response = await axios.get('https://www.site24x7.com/api/reports/performance/type/SERVER?period=0&metric_aggregation=0', config);
//         return response.data;
//     } catch (error) {
//         console.error('Failed to fetch data from Site24x7 API:', error.response ? error.response.data : error.message);
//         throw error;
//     }
// }

// module.exports = {
//     fetchDataFromSite24x7
// };




// const axios = require('axios');
// const { getAccessToken } = require('./tokenManager');
// require('dotenv').config();


// async function fetchDataFromSite24x7() {
//   try {
//     // Sistem akan mengecek bahwa access token masih berlaku atau tidak (bakal diperiksa di tokenManager.js)
//     // Sistem akan mengambil access token yang dikelola oleh tokenManager.js
//     const accessToken = getAccessToken();
//     const zaaid = process.env.ZAAID;

//     // Menyiapkan konfigurasi untuk permintaan HTTP
//     const config = {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded', // application/x-www-form-urlencoded atau json
//         'Authorization': `Bearer ${accessToken}`,
//         'zaaid': zaaid
//       }
//     };

//     // Sistem akan melakukan req ke API Site24x7 menggunakan access token yang dikelola sebelumnya
//     const response = await axios.get('https://www.site24x7.com/api/reports/performance/type/SERVER?period=0&metric_aggregation=0', config);

//     // Mengembalikan data yang diperoleh dari respons API
//     return response.data;
//   } catch (error) {
//     console.error('Failed to fetch data from Site24x7 API:', error.response ? error.response.data : error.message);
//     throw error;
//   }
// }

// module.exports = {
//   fetchDataFromSite24x7
// };