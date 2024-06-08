const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport, fetchCurrentStatusData } = require('../services/metricsService');

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
    console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
    throw error;
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
    console.error('Error processing Global Monitor Status data and returning Prometheus metrics:', error);
    throw error;
  }
}

async function processSummaryReportAndReturnPrometheusMetrics() {
  try {
    const summaryData = await fetchSummaryReport();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    const summaryDetails = summaryData.data.summary_details;
    const performanceDetails = summaryData.data.performance_details;

    let prometheusMetrics = `
# HELP site24x7_summary_availability_percentage Availability Percentage
# TYPE site24x7_summary_availability_percentage gauge
site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryDetails.availability_percentage)}

# HELP site24x7_summary_downtime_percentage Downtime Percentage
# TYPE site24x7_summary_downtime_percentage gauge
site24x7_summary_downtime_percentage ${sanitizeMetricValue(summaryDetails.downtime_percentage)}

# HELP site24x7_summary_maintenance_percentage Maintenance Percentage
# TYPE site24x7_summary_maintenance_percentage gauge
site24x7_summary_maintenance_percentage ${sanitizeMetricValue(summaryDetails.maintenance_percentage)}

# HELP site24x7_summary_alarm_count Alarm Count
# TYPE site24x7_summary_alarm_count gauge
site24x7_summary_alarm_count ${sanitizeMetricValue(summaryDetails.alarm_count)}

# HELP site24x7_summary_down_count Down Count
# TYPE site24x7_summary_down_count gauge
site24x7_summary_down_count ${sanitizeMetricValue(summaryDetails.down_count)}
`;

    const metricGroups = {};

    for (const [monitorType, monitorData] of Object.entries(performanceDetails)) {
      monitorData.name.forEach((monitorName, index) => {
        const attributes = monitorData.attribute_data[index]['0'];
        for (const [attribute, value] of Object.entries(attributes)) {
          const metricName = `site24x7_${monitorType.toLowerCase()}_${attribute.toLowerCase()}`;
          const metricHelp = `${attribute.replace(/_/g, ' ')}`;

          if (!metricGroups[metricName]) {
            metricGroups[metricName] = {
              help: metricHelp,
              type: 'gauge',
              values: []
            };
          }

          metricGroups[metricName].values.push({
            monitor: monitorName,
            value: sanitizeMetricValue(value)
          });
        }
      });
    }

    for (const [metricName, metricData] of Object.entries(metricGroups)) {
      prometheusMetrics += `
# HELP ${metricName} ${metricData.help}
# TYPE ${metricName} ${metricData.type}
${metricData.values.map(entry => `${metricName}{monitor="${entry.monitor}"} ${entry.value}`).join('\n')}
`;
    }

    return prometheusMetrics.trim();
  } catch (error) {
    console.error('Error processing summary report and returning Prometheus metrics:', error);
    throw error;
  }
}

async function processCurrentStatusAndReturnPrometheusMetrics() {
  try {
    const currentStatusData = await fetchCurrentStatusData();

    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    let prometheusMetrics = `
# HELP site24x7_current_status Current Status of Monitors
# TYPE site24x7_current_status gauge
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
            device_info: monitor.device_info,
            server_info: monitor.serverinfo,
            server_version: monitor.server_version,
            server_category: monitor.server_category,
            attribute_key: monitor.attribute_key,
            attribute_label: monitor.attribute_label,
            monitor_type: monitor.monitor_type,
            server_type: monitor.server_type
          };

          const labelString = Object.entries(labels)
            .map(([key, value]) => `${key}="${value}"`)
            .join(', ');

          prometheusMetrics += `
site24x7_current_status{${labelString}} ${sanitizeMetricValue(monitor.attribute_value)}
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
site24x7_current_status{${labelString}} ${sanitizeMetricValue(monitor.attribute_value)}
`;
        });
      }
    });

    return prometheusMetrics.trim();
  } catch (error) {
    console.error('Error processing Current Status data and returning Prometheus metrics:', error);
    throw error;
  }
}

module.exports = {
  processSite24x7DataAndReturnPrometheusMetrics,
  processGlobalMonitorStatusAndReturnPrometheusMetrics,
  processSummaryReportAndReturnPrometheusMetrics,
  processCurrentStatusAndReturnPrometheusMetrics
};