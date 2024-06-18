const express = require('express');
const { ensureTokenIsValid, getAccessToken } = require('./src/services/tokenManager'); 
const { 
  processSite24x7DataAndReturnPrometheusMetrics,
  processGlobalMonitorStatusAndReturnPrometheusMetrics,
  processSummaryReportAndReturnPrometheusMetrics,
  processCurrentStatusAndReturnPrometheusMetrics,
  processNewCurrentStatusAndReturnPrometheusMetrics,
  processTrendReportAndReturnPrometheusMetrics,
  processTopNAvailabilityAndReturnPrometheusMetrics,
  processTopNServerAndReturnPrometheusMetrics
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

let cachedCurrentStatusNewEndpointMetrics = null;
let lastFetchTimeCurrentStatusNewEndpoint = 0;

let cachedTrendReportMetrics = null;
let lastFetchTimeTrendReport = 0;

let cachedTopNAvailabilityMetrics = null;
let lastFetchTimeTopNAvailability = 0;

let cachedTopNServerMetrics = null;
let lastFetchTimeTopNServer = 0;

app.listen(PORT, async () => {
  try {
    await ensureTokenIsValid();
    setInterval(async () => {
      try {
        await ensureTokenIsValid();

        cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
        lastFetchTime = Date.now();

        cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
        lastFetchTimeMonitorStatus = Date.now();

        cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
        lastFetchTimeSummaryReport = Date.now();

        cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
        lastFetchTimeCurrentStatus = Date.now();

        cachedCurrentStatusNewEndpointMetrics = await processNewCurrentStatusAndReturnPrometheusMetrics();
        lastFetchTimeCurrentStatusNewEndpoint = Date.now();

        cachedTrendReportMetrics = await processTrendReportAndReturnPrometheusMetrics();
        lastFetchTimeTrendReport = Date.now();

        cachedTopNAvailabilityMetrics = await processTopNAvailabilityAndReturnPrometheusMetrics();
        lastFetchTimeTopNAvailability = Date.now();

        cachedTopNServerMetrics = await processTopNServerAndReturnPrometheusMetrics();
        lastFetchTimeTopNServer = Date.now();
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

    if (!cachedCurrentStatusNewEndpointMetrics || currentTime - lastFetchTimeCurrentStatusNewEndpoint > 3600000) {
      cachedCurrentStatusNewEndpointMetrics = await processNewCurrentStatusAndReturnPrometheusMetrics();
      lastFetchTimeCurrentStatusNewEndpoint = currentTime;
    }

    if (!cachedCurrentStatusNewEndpointMetrics || currentTime - lastFetchTimeCurrentStatusNewEndpoint > 3600000) {
        cachedCurrentStatusNewEndpointMetrics = await processTrendReportAndReturnPrometheusMetrics();
        lastFetchTimeCurrentStatusNewEndpoint = currentTime;
      }

    if (!cachedTrendReportMetrics || currentTime - lastFetchTimeTrendReport > 3600000) {
        cachedTrendReportMetrics = await processTrendReportAndReturnPrometheusMetrics();
        lastFetchTimeTrendReport = currentTime;
      }

    if (!cachedTopNAvailabilityMetrics || currentTime - lastFetchTimeTopNAvailability > 3600000) {
      cachedTopNAvailabilityMetrics = await processTopNAvailabilityAndReturnPrometheusMetrics();
      lastFetchTimeTopNAvailability = currentTime;
    }

    if (!cachedTopNServerMetrics || currentTime - lastFetchTimeTopNServer > 3600000) {
      cachedTopNServerMetrics = await processTopNServerAndReturnPrometheusMetrics();
      lastFetchTimeTopNServer = currentTime;
    }

    const allMetrics = `
${cachedMetrics}

${cachedMonitorStatusMetrics}

${cachedSummaryReportMetrics}

${cachedCurrentStatusMetrics}

${cachedCurrentStatusNewEndpointMetrics}

${cachedTrendReportMetrics}

${cachedTopNAvailabilityMetrics}

${cachedTopNServerMetrics}
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