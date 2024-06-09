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
    throw new Error(`Failed to fetch data from Site24x7 API: ${error.response ? error.response.data : error.message}`);
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
    throw new Error(`Failed to fetch global monitor status from Site24x7 API: ${error.response ? error.response.data : error.message}`);
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
    throw new Error(`Failed to fetch summary report from Site24x7 API: ${error.response ? error.response.data : error.message}`);
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
    throw new Error(`Failed to fetch current status from Site24x7 API: ${error.response ? error.response.data : error.message}`);
  }
}

module.exports = {
  fetchDataFromSite24x7,
  fetchGlobalMonitorStatus,
  fetchSummaryReport,
  fetchCurrentStatusData
};
