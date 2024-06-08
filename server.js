const express = require('express');
const { ensureTokenIsValid, getAccessToken } = require('./src/services/tokenManager'); 
const { 
  processSite24x7DataAndReturnPrometheusMetrics,
  processGlobalMonitorStatusAndReturnPrometheusMetrics,
  processSummaryReportAndReturnPrometheusMetrics,
  processCurrentStatusAndReturnPrometheusMetrics 
} = require('./src/controllers/metricsController');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cachedMetrics = null;
let lastFetchTime = 0;

let cachedMonitorStatusMetrics = null;
let lastFetchTimeMonitorStatus = 0;

let cachedSummaryReportMetrics = null;
let lastFetchTimeSummaryReport = 0;

let cachedCurrentStatusMetrics = null;
let lastFetchTimeCurrentStatus = 0;

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  try {
    await ensureTokenIsValid();
    const currentToken = getAccessToken();
    console.log('Active token:', currentToken); // Display the active token

    setInterval(async () => {
      try {
        await ensureTokenIsValid();

        cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
        lastFetchTime = Date.now();
        console.log('Data has been fetched from Site24x7:', new Date());

        cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
        lastFetchTimeMonitorStatus = Date.now();
        console.log('Monitor status data has been fetched from Site24x7:', new Date());

        cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
        lastFetchTimeSummaryReport = Date.now();
        console.log('Summary report data has been fetched from Site24x7:', new Date());

        cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
        lastFetchTimeCurrentStatus = Date.now();
        console.log('Current status data has been fetched from Site24x7:', new Date());
      } catch (error) {
        console.error('Error processing and returning Prometheus metrics:', error);
      }
    }, 3600000);
  } catch (error) {
    console.error('Failed to ensure token is valid on server start:', error);
  }
});

app.get('/metrics', async (req, res) => {
  try {
    const currentTime = Date.now();

    await ensureTokenIsValid();

    if (!cachedMetrics || currentTime - lastFetchTime > 3600000) {
      cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
      lastFetchTime = currentTime;
    }

    if (!cachedMonitorStatusMetrics || currentTime - lastFetchTimeMonitorStatus > 3600000) {
      cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
      lastFetchTimeMonitorStatus = currentTime;
    }

    if (!cachedSummaryReportMetrics || currentTime - lastFetchTimeSummaryReport > 3600000) {
      cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
      lastFetchTimeSummaryReport = currentTime;
    }

    if (!cachedCurrentStatusMetrics || currentTime - lastFetchTimeCurrentStatus > 3600000) {
      cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
      lastFetchTimeCurrentStatus = currentTime;
    }

    const allMetrics = `
${cachedMetrics}

${cachedMonitorStatusMetrics}

${cachedSummaryReportMetrics}

${cachedCurrentStatusMetrics}
`.trim();

    res.set('Content-Type', 'text/plain');
    res.send(allMetrics);
  } catch (error) {
    console.error('Error processing and returning Prometheus metrics:', error);
    res.status(500).send('Internal server error');
  }
});

app.get('/', (req, res) => {
  res.send('Server is running on http://localhost:3001');
});

module.exports = app;
