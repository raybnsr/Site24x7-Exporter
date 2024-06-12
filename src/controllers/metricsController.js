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

    const summaryDetails = summaryData.data.summary_details;
    const performanceDetails = summaryData.data.performance_details;

    let prometheusMetrics = `
# HELP site24x7_summary_availability_percentage Availability Percentage
# TYPE site24x7_summary_availability_percentage gauge
site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryDetails.availability_percentage)}

# HELP site24x7_summary_downtime_duration_total Downtime Duration Total
# TYPE site24x7_summary_downtime_duration_total gauge
site24x7_summary_downtime_duration_total ${sanitizeMetricValue(summaryDetails.down_duration)}

# HELP site24x7_summary_downtime_count_total Downtime Count Total
# TYPE site24x7_summary_downtime_count_total gauge
site24x7_summary_downtime_count_total ${sanitizeMetricValue(summaryDetails.down_count)}
`;

    prometheusMetrics += `
# HELP site24x7_summary_performance_response_time_average Performance Response Time Average
# TYPE site24x7_summary_performance_response_time_average gauge
site24x7_summary_performance_response_time_average ${sanitizeMetricValue(performanceDetails.avg_response_time)}

# HELP site24x7_summary_performance_response_time_maximum Performance Response Time Maximum
# TYPE site24x7_summary_performance_response_time_maximum gauge
site24x7_summary_performance_response_time_maximum ${sanitizeMetricValue(performanceDetails.max_response_time)}

# HELP site24x7_summary_performance_response_time_minimum Performance Response Time Minimum
# TYPE site24x7_summary_performance_response_time_minimum gauge
site24x7_summary_performance_response_time_minimum ${sanitizeMetricValue(performanceDetails.min_response_time)}
`;

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
# HELP site24x7_current_status Monitor Current Status
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
    throw new Error(`Error processing current status data and returning Prometheus metrics: ${error.message}`);
  }
}


module.exports = {
  processSite24x7DataAndReturnPrometheusMetrics,
  processGlobalMonitorStatusAndReturnPrometheusMetrics,
  processSummaryReportAndReturnPrometheusMetrics,
  processCurrentStatusAndReturnPrometheusMetrics
};
