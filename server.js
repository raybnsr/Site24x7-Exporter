const express = require('express');
const { ensureTokenIsValid } = require('./src/services/tokenManager');
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
const CACHE_DURATION = 3600000; // 1 hour in milliseconds

const fetchAllMetrics = async () => {
  await ensureTokenIsValid();

  const [
    site24x7Metrics,
    globalMonitorStatusMetrics,
    summaryReportMetrics,
    currentStatusMetrics,
    newCurrentStatusMetrics,
    trendReportMetrics,
    topNAvailabilityMetrics,
    topNServerMetrics
  ] = await Promise.all([
    processSite24x7DataAndReturnPrometheusMetrics(),
    processGlobalMonitorStatusAndReturnPrometheusMetrics(),
    processSummaryReportAndReturnPrometheusMetrics(),
    processCurrentStatusAndReturnPrometheusMetrics(),
    processNewCurrentStatusAndReturnPrometheusMetrics(),
    processTrendReportAndReturnPrometheusMetrics(),
    processTopNAvailabilityAndReturnPrometheusMetrics(),
    processTopNServerAndReturnPrometheusMetrics()
  ]);

  cachedMetrics = {
    site24x7Metrics,
    globalMonitorStatusMetrics,
    summaryReportMetrics,
    currentStatusMetrics,
    newCurrentStatusMetrics,
    trendReportMetrics,
    topNAvailabilityMetrics,
    topNServerMetrics
  };
  lastFetchTime = Date.now();
};

app.listen(PORT, async () => {
  try {
    await ensureTokenIsValid();
    setInterval(fetchAllMetrics, CACHE_DURATION);
    console.log(`Server is running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Failed to ensure token is valid on server start:', error);
  }
});

app.get('/metrics', async (req, res) => {
  try {
    const currentTime = Date.now();

    if (!cachedMetrics || currentTime - lastFetchTime > CACHE_DURATION) {
      await fetchAllMetrics();
    }

    const allMetrics = `
${cachedMetrics.site24x7Metrics}

${cachedMetrics.globalMonitorStatusMetrics}

${cachedMetrics.summaryReportMetrics}

${cachedMetrics.currentStatusMetrics}

${cachedMetrics.newCurrentStatusMetrics}

${cachedMetrics.trendReportMetrics}

${cachedMetrics.topNAvailabilityMetrics}

${cachedMetrics.topNServerMetrics}
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
