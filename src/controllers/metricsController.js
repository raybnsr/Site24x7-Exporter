const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport, fetchCurrentStatusData, fetchNewCurrentStatusData, fetchTrendReport, fetchTopNAvailability, fetchTopNServer } = require('../services/metricsService');

async function processSite24x7DataAndReturnPrometheusMetrics() {
  try {
    const site24x7Data = await fetchDataFromSite24x7();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const prometheusMetrics = `
# HELP site24x7_server_disk_used_percent Disk Used Percentage
# TYPE site24x7_server_disk_used_percent gauge
${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}`
)).join('\n')}

# HELP site24x7_server_mem_used_percent Memory Used Percentage
# TYPE site24x7_server_mem_used_percent gauge
${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}`
)).join('\n')}

# HELP site24x7_server_cpu_used_percent CPU Used Percentage
# TYPE site24x7_server_cpu_used_percent gauge
${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}`
)).join('\n')}
`;

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing Site24x7 data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
  try {
    const monitorStatusData = await fetchGlobalMonitorStatus();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const prometheusMetrics = `
# HELP site24x7_monitor_status Monitor Status
# TYPE site24x7_monitor_status gauge
${monitorStatusData.data.map((monitor) => (
  `site24x7_monitor_status{monitor_id="${monitor.monitor_id}", monitor_name="${monitor.monitor_name}", customer_name="${monitor.customer_name}", status_name="${monitor.status_name}", monitor_type="${monitor.monitor_type}"} ${sanitizeMetricValue(monitor.status)}`
)).join('\n')}
`;

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing Global Monitor Status data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processSummaryReportAndReturnPrometheusMetrics() {
  try {
    const summaryData = await fetchSummaryReport();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const sanitizeMetricName = (name) => {
      return name.replace(/[^a-zA-Z0-9_]/g, '_');
    };

    const summaryDetails = summaryData.data.summary_details;
    const performanceDetails = summaryData.data.performance_details;

    let prometheusMetrics = `
# HELP site24x7_summary_availability_percentage Availability Percentage
# TYPE site24x7_summary_availability_percentage gauge
site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryDetails.availability_percentage)}

# HELP site24x7_summary_downtime_duration_total Downtime Duration Total
# TYPE site24x7_summary_downtime_duration_total gauge
site24x7_summary_downtime_duration_total ${sanitizeMetricValue(summaryDetails.downtime_duration)}

# HELP site24x7_summary_downtime_count_total Downtime Count Total
# TYPE site24x7_summary_downtime_count_total gauge
site24x7_summary_downtime_count_total ${sanitizeMetricValue(summaryDetails.down_count)}

# HELP site24x7_summary_alarm_count_total Alarm Count Total
# TYPE site24x7_summary_alarm_count_total gauge
site24x7_summary_alarm_count_total ${sanitizeMetricValue(summaryDetails.alarm_count)}

# HELP site24x7_summary_maintenance_percentage Maintenance Percentage
# TYPE site24x7_summary_maintenance_percentage gauge
site24x7_summary_maintenance_percentage ${sanitizeMetricValue(summaryDetails.maintenance_percentage)}

# HELP site24x7_summary_unmanaged_percentage Unmanaged Percentage
# TYPE site24x7_summary_unmanaged_percentage gauge
site24x7_summary_unmanaged_percentage ${sanitizeMetricValue(summaryDetails.unmanaged_percentage)}
`;

    const addPerformanceMetrics = (category, metrics) => {
      metrics.forEach((metric, index) => {
        const name = sanitizeMetricName(performanceDetails[category].name[index]);
        prometheusMetrics += `
# HELP site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_availability Availability for ${name}
# TYPE site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_availability gauge
site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_availability ${sanitizeMetricValue(performanceDetails[category].availability[index])}
        `;

        const attributes = performanceDetails[category].attribute_data[index]['0'];
        for (const [key, value] of Object.entries(attributes)) {
          prometheusMetrics += `
# HELP site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_${sanitizeMetricName(key.toLowerCase())} ${key} for ${name}
# TYPE site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_${sanitizeMetricName(key.toLowerCase())} gauge
site24x7_${sanitizeMetricName(category.toLowerCase())}_${name}_${sanitizeMetricName(key.toLowerCase())} ${sanitizeMetricValue(value)}
          `;
        }
      });
    };

    for (const category of Object.keys(performanceDetails)) {
      addPerformanceMetrics(category, performanceDetails[category].name);
    }


    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing summary report data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processCurrentStatusAndReturnPrometheusMetrics() {
  try {
    const currentStatusData = await fetchCurrentStatusData();

    if (!currentStatusData.data || !Array.isArray(currentStatusData.data.monitor_groups)) {
      throw new Error('Expected currentStatusData.data.monitor_groups to be an array');
    }

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    let prometheusMetrics = `
# HELP site24x7_monitor_current_status Monitor Current Status
# TYPE site24x7_monitor_current_status gauge
`;

    currentStatusData.data.monitor_groups.forEach(group => {
      if (group.group_name === "Server") {
        group.monitors?.forEach(monitor => {
          const labels = {
            monitor_id: monitor.monitor_id,
            monitor_name: monitor.name,
            group_name: group.group_name,
            status: monitor.status,
            last_polled_time: monitor.last_polled_time,
            duration:monitor.duration,
            device_info: monitor.device_info,
            server_info: monitor.serverinfo,
            server_version: monitor.server_version,
            server_category: monitor.server_category,
            attribute_key: monitor.attribute_key,
            attribute_label: monitor.attribute_label,
            monitor_type: monitor.monitor_type,
            server_type: monitor.server_type,
            unit:monitor.unit
          };

          const labelString = Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(', ');

          prometheusMetrics += `
site24x7_monitor_current_status{${labelString}} ${sanitizeMetricValue(monitor.status)}
`;
        });
      } else {
        group.monitors?.forEach(monitor => {
          const labels = {
            monitor_id: monitor.monitor_id,
            monitor_name: monitor.name,
            group_name: group.group_name,
            status: monitor.status,
            last_polled_time: monitor.last_polled_time,
            device_info: monitor.device_info,
            type: monitor.type,
            category: monitor.category
          };

          const labelString = Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(', ');

          prometheusMetrics += `
site24x7_monitor_current_status{${labelString}} ${sanitizeMetricValue(monitor.status)}
`;
        });
      }
    });

    return prometheusMetrics.trim();
  } catch (error) {
    console.error('Error processing Current Status data and returning Prometheus metrics:', error);
    throw new Error(`Error processing current status data and returning Prometheus metrics: ${error.message}`);
  }
}

const escapePrometheusString = (str) => {
  if (typeof str !== 'string') {
    return str;
  }
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
};

async function processNewCurrentStatusAndReturnPrometheusMetrics() {
  try {
    const currentStatusData = await fetchNewCurrentStatusData();

    if (!currentStatusData.data || !Array.isArray(currentStatusData.data.monitors)) {
      throw new Error('Expected currentStatusData.data.monitors to be an array');
    }

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const monitorsCount = currentStatusData.data.monitors_count;
    let prometheusMetrics = `
# HELP site24x7_monitor_count_total Total number of monitors
# TYPE site24x7_monitor_count_total gauge
site24x7_monitor_count_total ${sanitizeMetricValue(monitorsCount.total)}

# HELP site24x7_monitor_hidden_alarms Hidden alarms
# TYPE site24x7_monitor_hidden_alarms gauge
site24x7_monitor_hidden_alarms ${sanitizeMetricValue(monitorsCount.hidden_alarms)}

# HELP site24x7_monitor_critical Monitors critical
# TYPE site24x7_monitor_critical gauge
site24x7_monitor_critical ${sanitizeMetricValue(monitorsCount.critical)}

# HELP site24x7_monitor_configuration_error Configuration error monitors
# TYPE site24x7_monitor_configuration_error gauge
site24x7_monitor_configuration_error ${sanitizeMetricValue(monitorsCount.configuration_error)}

# HELP site24x7_monitor_discovery Discovery monitors
# TYPE site24x7_monitor_discovery gauge
site24x7_monitor_discovery ${sanitizeMetricValue(monitorsCount.discovery)}

# HELP site24x7_monitor_trouble Monitors in trouble
# TYPE site24x7_monitor_trouble gauge
site24x7_monitor_trouble ${sanitizeMetricValue(monitorsCount.trouble)}

# HELP site24x7_monitor_up Monitors up
# TYPE site24x7_monitor_up gauge
site24x7_monitor_up ${sanitizeMetricValue(monitorsCount.up)}

# HELP site24x7_monitor_down Monitors down
# TYPE site24x7_monitor_down gauge
site24x7_monitor_down ${sanitizeMetricValue(monitorsCount.down)}

# HELP site24x7_monitor_maintenance Monitors in maintenance
# TYPE site24x7_monitor_maintenance gauge
site24x7_monitor_maintenance ${sanitizeMetricValue(monitorsCount.maintenance)}

# HELP site24x7_monitor_suspended Monitors suspended
# TYPE site24x7_monitor_suspended gauge
site24x7_monitor_suspended ${sanitizeMetricValue(monitorsCount.suspended)}
`;

    currentStatusData.data.monitors.forEach(monitor => {
      const labels = {
        outage_id: escapePrometheusString(monitor.outage_id),
        uptime_monitor: monitor.uptime_monitor,
        is_upgrade_available: monitor.is_upgrade_available,
        monitor_id: escapePrometheusString(monitor.monitor_id),
        serverinfo: escapePrometheusString(monitor.serverinfo),
        server_version: escapePrometheusString(monitor.server_version),
        last_polled_time: escapePrometheusString(monitor.last_polled_time),
        duration: escapePrometheusString(monitor.duration),
        unit: escapePrometheusString(monitor.unit),
        down_reason: escapePrometheusString(monitor.down_reason),
        downtime_millis: escapePrometheusString(monitor.downtime_millis),
        name: escapePrometheusString(monitor.name),
        server_category: escapePrometheusString(monitor.server_category),
        attribute_key: escapePrometheusString(monitor.attribute_key),
        attribute_label: escapePrometheusString(monitor.attribute_label),
        attribute_name: escapePrometheusString(monitor.attribute_name),
        attribute_value: sanitizeMetricValue(monitor.attribute_value),
        server_poll: monitor.server_poll,
        monitor_type: escapePrometheusString(monitor.monitor_type),
        server_type: escapePrometheusString(monitor.server_type),
        status: monitor.status
      };

      const labelString = Object.entries(labels)
        .map(([key, value]) => `${key}="${value}"`)
        .join(', ');

      prometheusMetrics += `
site24x7_current_status_details{${labelString}} ${labels.attribute_value}
site24x7_current_status{${labelString}} ${labels.status}
`;
    });

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing new current status data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processTrendReportAndReturnPrometheusMetrics() {
  try {
    const trendData = await fetchTrendReport();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    let prometheusMetrics = `
# HELP site24x7_trend_alarm_count Alarm Count
# TYPE site24x7_trend_alarm_count gauge
# HELP site24x7_trend_down_count Down Count
# TYPE site24x7_trend_down_count gauge
# HELP site24x7_trend_availability_percentage Availability Percentage
# TYPE site24x7_trend_availability_percentage gauge
`;

    trendData.data.trend.forEach((trend) => {
      const labels = `year="${trend.year}", month="${trend.month}"`;

      prometheusMetrics += `
site24x7_trend_alarm_count{${labels}} ${sanitizeMetricValue(trend.alarm_count)}
site24x7_trend_down_count{${labels}} ${sanitizeMetricValue(trend.down_count)}
site24x7_trend_availability_percentage{${labels}} ${sanitizeMetricValue(trend.availability_percentage)}
`;
    });

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing trend report data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processTopNAvailabilityAndReturnPrometheusMetrics() {
  try {
    const topNAvailabilityData = await fetchTopNAvailability();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const prometheusMetrics = `
# HELP site24x7_top_n_availability Top N Availability
# TYPE site24x7_top_n_availability gauge
${topNAvailabilityData.data.report.map((report) => (
  `site24x7_top_n_availability{monitor_id="${report.monitor_id}", monitor_name="${report.monitor_name}"} ${sanitizeMetricValue(report.availability)}`
)).join('\n')}
`;

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing Top N Availability data and returning Prometheus metrics: ${error.message}`);
  }
}

async function processTopNServerAndReturnPrometheusMetrics() {
  try {
    const topNServerData = await fetchTopNServer();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const prometheusMetrics = `
# HELP site24x7_top_n_server_diskusedpercent Disk used percent for top N servers
# TYPE site24x7_top_n_server_diskusedpercent gauge
${topNServerData.data.report.map((report) => (
  `site24x7_top_n_server_diskusedpercent{monitor_id="${report.monitor_id}", monitor_name="${report.monitor_name}", monitor_min="${report.diskusedpercent.min}", monitor_max="${report.diskusedpercent.max}"} ${sanitizeMetricValue(report.diskusedpercent.average)}`
)).join('\n')}

# HELP site24x7_top_n_server_memusedpercent Memory used percent for top N servers
# TYPE site24x7_top_n_server_memusedpercent gauge
${topNServerData.data.report.map((report) => (
  `site24x7_top_n_server_memusedpercent{monitor_id="${report.monitor_id}", monitor_name="${report.monitor_name}", monitor_min="${report.memusedpercent.min}", monitor_max="${report.memusedpercent.max}"} ${sanitizeMetricValue(report.memusedpercent.average)}`
)).join('\n')}

# HELP site24x7_top_n_server_cpuusedpercent CPU used percent for top N servers
# TYPE site24x7_top_n_server_cpuusedpercent gauge
${topNServerData.data.report.map((report) => (
  `site24x7_top_n_server_cpuusedpercent{monitor_id="${report.monitor_id}", monitor_name="${report.monitor_name}", monitor_min="${report.cpuusedpercent.min}", monitor_max="${report.cpuusedpercent.max}"} ${sanitizeMetricValue(report.cpuusedpercent.average)}`
)).join('\n')}
`;

    return prometheusMetrics.trim();
  } catch (error) {
    throw new Error(`Error processing Top N Server data and returning Prometheus metrics: ${error.message}`);
  }
}


module.exports = {
  processSite24x7DataAndReturnPrometheusMetrics,
  processGlobalMonitorStatusAndReturnPrometheusMetrics,
  processSummaryReportAndReturnPrometheusMetrics,
  processCurrentStatusAndReturnPrometheusMetrics,
  processNewCurrentStatusAndReturnPrometheusMetrics,
  processTrendReportAndReturnPrometheusMetrics,
  processTopNAvailabilityAndReturnPrometheusMetrics,
  processTopNServerAndReturnPrometheusMetrics
};