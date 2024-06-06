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
  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
)).join('')}

# HELP site24x7_server_mem_used_percent Memory Used Percentage
# TYPE site24x7_server_mem_used_percent gauge
${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
)).join('')}

# HELP site24x7_server_cpu_used_percent CPU Used Percentage
# TYPE site24x7_server_cpu_used_percent gauge
${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
)).join('')}
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
  `site24x7_monitor_status{monitor_id="${monitor.monitor_id}", monitor_name="${monitor.monitor_name}", customer_name="${monitor.customer_name}"} ${sanitizeMetricValue(monitor.status)}\n`
)).join('')}
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

    const prometheusMetrics = `
# HELP site24x7_current_status Current Status of Monitors
# TYPE site24x7_current_status gauge
${currentStatusData.data.monitor_groups.map((group) => (
  group.monitors?.map((monitor) => (
    `site24x7_current_status{monitor_id="${monitor.monitor_id}", monitor_name="${monitor.name}", group_name="${group.group_name}", status="${monitor.status}", last_polled_time="${monitor.last_polled_time}", device_info="${monitor.device_info}", type="${monitor.type}", category="${monitor.category}"} ${sanitizeMetricValue(monitor.attribute_value)}\n`
  )).join('')
)).join('')}
`;

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






// const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport, fetchCurrentStatusData } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     const site24x7Data = await fetchDataFromSite24x7();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
//   try {
//     const monitorStatusData = await fetchGlobalMonitorStatus();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_monitor_status Monitor Status
// # TYPE site24x7_monitor_status gauge
// ${monitorStatusData.data.map((monitor) => (
//  `site24x7_monitor_status{monitor_id="${monitor.monitor_id}", monitor_name="${monitor.monitor_name}", customer_name="${monitor.customer_name}"} ${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Global Monitor Status data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processSummaryReportAndReturnPrometheusMetrics() {
//   try {
//     const summaryData = await fetchSummaryReport();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const summaryDetails = summaryData.data.summary_details;
//     const performanceDetails = summaryData.data.performance_details;

//     let prometheusMetrics = `
// # HELP site24x7_summary_availability_percentage Availability Percentage
// # TYPE site24x7_summary_availability_percentage gauge
// site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryDetails.availability_percentage)}

// # HELP site24x7_summary_downtime_percentage Downtime Percentage
// # TYPE site24x7_summary_downtime_percentage gauge
// site24x7_summary_downtime_percentage ${sanitizeMetricValue(summaryDetails.downtime_percentage)}

// # HELP site24x7_summary_maintenance_percentage Maintenance Percentage
// # TYPE site24x7_summary_maintenance_percentage gauge
// site24x7_summary_maintenance_percentage ${sanitizeMetricValue(summaryDetails.maintenance_percentage)}

// # HELP site24x7_summary_alarm_count Alarm Count
// # TYPE site24x7_summary_alarm_count gauge
// site24x7_summary_alarm_count ${sanitizeMetricValue(summaryDetails.alarm_count)}

// # HELP site24x7_summary_down_count Down Count
// # TYPE site24x7_summary_down_count gauge
// site24x7_summary_down_count ${sanitizeMetricValue(summaryDetails.down_count)}
// `;

//     const metricGroups = {};

//     for (const [monitorType, monitorData] of Object.entries(performanceDetails)) {
//       monitorData.name.forEach((monitorName, index) => {
//         const attributes = monitorData.attribute_data[index]['0'];
//         for (const [attribute, value] of Object.entries(attributes)) {
//           const metricName = `site24x7_${monitorType.toLowerCase()}_${attribute.toLowerCase()}`;
//           const metricHelp = `${attribute.replace(/_/g, ' ')}`;

//           if (!metricGroups[metricName]) {
//             metricGroups[metricName] = {
//               help: metricHelp,
//               type: 'gauge',
//               values: []
//             };
//           }

//           metricGroups[metricName].values.push({
//             monitor: monitorName,
//             value: sanitizeMetricValue(value)
//           });
//         }
//       });
//     }

//     for (const [metricName, metricData] of Object.entries(metricGroups)) {
//       prometheusMetrics += `
// # HELP ${metricName} ${metricData.help}
// # TYPE ${metricName} ${metricData.type}
// ${metricData.values.map(entry => `${metricName}{monitor="${entry.monitor}"} ${entry.value}`).join('\n')}
// `;
//     }

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing summary report and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processCurrentStatusAndReturnPrometheusMetrics() {
//   try {
//     const currentStatusData = await fetchCurrentStatusData();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_current_status Current Status of Monitors
// # TYPE site24x7_current_status gauge
// ${currentStatusData.data.monitor_groups.map((group) => (
//   group.monitors?.map((monitor) => ( 
//     `site24x7_current_status{monitor_id="${monitor.monitor_id}", monitor_name="${monitor.name}", group_name="${group.group_name}", status="${monitor.status}", last_polled_time="${monitor.last_polled_time}", device_info="${monitor.device_info}", type="${monitor.type}", category="${monitor.category}"} ${sanitizeMetricValue(monitor.attribute_value)}\n`
//   )).join('')
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Current Status data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics,
//   processGlobalMonitorStatusAndReturnPrometheusMetrics,
//   processSummaryReportAndReturnPrometheusMetrics,
//   processCurrentStatusAndReturnPrometheusMetrics
// };





// const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     const site24x7Data = await fetchDataFromSite24x7();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
//   try {
//     const globalMonitorData = await fetchGlobalMonitorStatus();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_global_monitor_status Monitor Status
// # TYPE site24x7_global_monitor_status gauge
// ${globalMonitorData.data.map((monitor) => (
//   `site24x7_global_monitor_status{monitor="${monitor.monitor_name}", customer="${monitor.customer_name}", type="${monitor.monitor_type}"} ${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing global monitor status and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processSummaryReportAndReturnPrometheusMetrics() {
//   try {
//     const summaryData = await fetchSummaryReport();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const summaryDetails = summaryData.data.summary_details;
//     const performanceDetails = summaryData.data.performance_details;

//     let prometheusMetrics = `
// # HELP site24x7_summary_availability_percentage Availability Percentage
// # TYPE site24x7_summary_availability_percentage gauge
// site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryDetails.availability_percentage)}

// # HELP site24x7_summary_downtime_percentage Downtime Percentage
// # TYPE site24x7_summary_downtime_percentage gauge
// site24x7_summary_downtime_percentage ${sanitizeMetricValue(summaryDetails.downtime_percentage)}

// # HELP site24x7_summary_maintenance_percentage Maintenance Percentage
// # TYPE site24x7_summary_maintenance_percentage gauge
// site24x7_summary_maintenance_percentage ${sanitizeMetricValue(summaryDetails.maintenance_percentage)}

// # HELP site24x7_summary_alarm_count Alarm Count
// # TYPE site24x7_summary_alarm_count gauge
// site24x7_summary_alarm_count ${sanitizeMetricValue(summaryDetails.alarm_count)}

// # HELP site24x7_summary_down_count Down Count
// # TYPE site24x7_summary_down_count gauge
// site24x7_summary_down_count ${sanitizeMetricValue(summaryDetails.down_count)}
// `;

//     for (const [monitorType, monitorData] of Object.entries(performanceDetails)) {
//       monitorData.name.forEach((monitorName, index) => {
//         const attributes = monitorData.attribute_data[index]['0'];
//         for (const [attribute, value] of Object.entries(attributes)) {
//           const metricName = `site24x7_${monitorType.toLowerCase()}_${attribute.toLowerCase()}`;
//           prometheusMetrics += `
// # HELP ${metricName} ${attribute.replace(/_/g, ' ')}
// # TYPE ${metricName} gauge
// ${metricName}{monitor="${monitorName}"} ${sanitizeMetricValue(value)}
// `;
//         }
//       });
//     }

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing summary report and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics,
//   processGlobalMonitorStatusAndReturnPrometheusMetrics,
//   processSummaryReportAndReturnPrometheusMetrics
// };




// const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     const site24x7Data = await fetchDataFromSite24x7();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
//   try {
//     const globalMonitorData = await fetchGlobalMonitorStatus();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_global_monitor_status Monitor Status
// # TYPE site24x7_global_monitor_status gauge
// ${globalMonitorData.data.map((monitor) => (
//   `site24x7_global_monitor_status{customer="${monitor.customer_name}", status="${monitor.status_name}, monitor="${monitor.monitor_name}", type="${monitor.monitor_type}"}${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing global monitor status and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processSummaryReportAndReturnPrometheusMetrics() {
//   try {
//     const SummaryDetailsData = await fetchSummaryReport();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_summary_availability_percentage Summary Details
// # TYPE site24x7_summary_availability_percentage gauge
// ${SummaryDetailsData.data.map((monitor) => (
//   `site24x7_summary_details{availability_duration="${monitor.availability_duration}", downtime_duration="${monitor.downtime_duration}", type="${monitor.monitor_type}, status="${monitor.status_name}"}${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing summary report and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics,
//   processGlobalMonitorStatusAndReturnPrometheusMetrics,
//   processSummaryReportAndReturnPrometheusMetrics
// };






// const { fetchDataFromSite24x7, fetchGlobalMonitorStatus, fetchSummaryReport } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     const site24x7Data = await fetchDataFromSite24x7();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//   `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
//   try {
//     const globalMonitorData = await fetchGlobalMonitorStatus();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_global_monitor_status Monitor Status
// # TYPE site24x7_global_monitor_status gauge
// ${globalMonitorData.data.map((monitor) => (
//   `site24x7_global_monitor_status{customer="${monitor.costumer_name}", monitor="${monitor.monitor_name}", type="${monitor.monitor_type}"}, status="${monitor.status_name}", last_polled="${monitor.last_polled_time}" ${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing global monitor status and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processSummaryReportAndReturnPrometheusMetrics() {
//   try {
//     const summaryData = await fetchSummaryReport();

//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     const prometheusMetrics = `
// # HELP site24x7_summary_availability_percentage Availability Percentage
// # TYPE site24x7_summary_availability_percentage gauge
// site24x7_summary_availability_percentage ${sanitizeMetricValue(summaryData.data.summary_details.availability_percentage)}

// # HELP site24x7_summary_downtime_percentage Downtime Percentage
// # TYPE site24x7_summary_downtime_percentage gauge
// site24x7_summary_downtime_percentage ${sanitizeMetricValue(summaryData.data.summary_details.downtime_percentage)}

// # HELP site24x7_summary_maintenance_percentage Maintenance Percentage
// # TYPE site24x7_summary_maintenance_percentage gauge
// site24x7_summary_maintenance_percentage ${sanitizeMetricValue(summaryData.data.summary_details.maintenance_percentage)}

// # HELP site24x7_summary_alarm_count Alarm Count
// # TYPE site24x7_summary_alarm_count gauge
// site24x7_summary_alarm_count ${sanitizeMetricValue(summaryData.data.summary_details.alarm_count)}

// # HELP site24x7_summary_down_count Down Count
// # TYPE site24x7_summary_down_count gauge
// site24x7_summary_down_count ${sanitizeMetricValue(summaryData.data.summary_details.down_count)}
// `;

//     return prometheusMetrics.trim();
//   } catch (error) {
//     console.error('Error processing summary report and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics,
//   processGlobalMonitorStatusAndReturnPrometheusMetrics,
//   processSummaryReportAndReturnPrometheusMetrics
// };




// const { fetchDataFromSite24x7, fetchGlobalMonitorStatus } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const site24x7Data = await fetchDataFromSite24x7();

//     // Helper function to validate and return a proper metric value
//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan
//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics.join('').trim(); // Using trim() to remove leading and trailing whitespace
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// async function processGlobalMonitorStatusAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const globalMonitorData = await fetchGlobalMonitorStatus();

//     // Helper function to validate and return a proper metric value
//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan
//     const prometheusMetrics = `
// # HELP site24x7_global_monitor_status Monitor Status
// # TYPE site24x7_global_monitor_status gauge
// ${globalMonitorData.data.map((monitor) => (
//   `site24x7_global_monitor_status{customer="${monitor.customer_name}", monitor="${monitor.monitor_name}", type="${monitor.monitor_type}"}, status="${monitor.status_name}", last_polled="${monitor.last_polled_time}" ${sanitizeMetricValue(monitor.status)}\n`
// )).join('')}
// `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics.trim(); // Using trim() to remove leading and trailing whitespace
//   } catch (error) {
//     console.error('Error processing global monitor status and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics,
//   processGlobalMonitorStatusAndReturnPrometheusMetrics
// };





// const { fetchDataFromSite24x7 } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const site24x7Data = await fetchDataFromSite24x7();

//     // Helper function to validate and return a proper metric value
//     const sanitizeMetricValue = (value) => {
//       const parsedValue = parseFloat(value);
//       return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
//     };

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan
//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT)}\n`
// )).join('')}
      
// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${sanitizeMetricValue(site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT)}\n`
// )).join('')}
// `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics.trim(); // Using trim() to remove leading and trailing whitespace
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics
// };



// const { fetchDataFromSite24x7 } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const site24x7Data = await fetchDataFromSite24x7();

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan

//     // Misalnya, Anda dapat menggunakan package 'prom-client' untuk membuat objek metrik Prometheus:
//     const prometheusMetrics = `
// # HELP site24x7_server_disk_used_percent Disk Used Percentage
// # TYPE site24x7_server_disk_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_disk_used_percent{server="${serverName}", instance="localhost:3001"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT || '0.0'}\n`
// )).join('')}

// # HELP site24x7_server_mem_used_percent Memory Used Percentage
// # TYPE site24x7_server_mem_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_mem_used_percent{server="${serverName}", instance="localhost:3001"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT || '0.0'}\n`
// )).join('')}

// # HELP site24x7_server_cpu_used_percent CPU Used Percentage
// # TYPE site24x7_server_cpu_used_percent gauge
// ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//  `site24x7_server_cpu_used_percent{server="${serverName}", instance="localhost:3001"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT || '0.0'}\n`
// )).join('')}
// `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics; // Coba pake method trim() untuk menghapus string kosong pada awal/akhir baris
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics
// };




// const { fetchDataFromSite24x7 } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const site24x7Data = await fetchDataFromSite24x7();

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan

//     // Misalnya, Anda dapat menggunakan package 'prom-client' untuk membuat objek metrik Prometheus:
//     const prometheusMetrics = `
//       # HELP site24x7_server_disk_used_percent Disk Used Percentage
//       # TYPE site24x7_server_disk_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_disk_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT}\n`
//       )).join('')}
      
//       # HELP site24x7_server_mem_used_percent Memory Used Percentage
//       # TYPE site24x7_server_mem_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_mem_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT}\n`
//       )).join('')}
      
//       # HELP site24x7_server_cpu_used_percent CPU Used Percentage
//       # TYPE site24x7_server_cpu_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_cpu_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT}\n`
//       )).join('')}
//     `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics;
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics
// };




// const { fetchDataFromSite24x7 } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//     try {
//         const site24x7Data = await fetchDataFromSite24x7();

//         const prometheusMetrics = `
//             # HELP site24x7_server_disk_used_percent Disk Used Percentage
//             # TYPE site24x7_server_disk_used_percent gauge
//             ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//                 `site24x7_server_disk_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT}\n`
//             )).join('')}
            
//             # HELP site24x7_server_mem_used_percent Memory Used Percentage
//             # TYPE site24x7_server_mem_used_percent gauge
//             ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//                 `site24x7_server_mem_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT}\n`
//             )).join('')}
            
//             # HELP site24x7_server_cpu_used_percent CPU Used Percentage
//             # TYPE site24x7_server_cpu_used_percent gauge
//             ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//                 `site24x7_server_cpu_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT}\n`
//             )).join('')}
//         `;

//         return prometheusMetrics;
//     } catch (error) {
//         console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//         throw error;
//     }
// }

// module.exports = {
//     processSite24x7DataAndReturnPrometheusMetrics
// };


// const { fetchDataFromSite24x7 } = require('../services/metricsService');

// async function processSite24x7DataAndReturnPrometheusMetrics() {
//   try {
//     // Panggil fungsi untuk mengambil data dari API Site24x7
//     const site24x7Data = await fetchDataFromSite24x7();

//     // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
//     // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan

//     // Misalnya, Anda dapat menggunakan package 'prom-client' untuk membuat objek metrik Prometheus:
//     const prometheusMetrics = `
//       # HELP site24x7_server_disk_used_percent Disk Used Percentage
//       # TYPE site24x7_server_disk_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_disk_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].DISKUSEDPERCENT}\n`
//       )).join('')}
      
//       # HELP site24x7_server_mem_used_percent Memory Used Percentage
//       # TYPE site24x7_server_mem_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_mem_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].MEMUSEDPERCENT}\n`
//       )).join('')}
      
//       # HELP site24x7_server_cpu_used_percent CPU Used Percentage
//       # TYPE site24x7_server_cpu_used_percent gauge
//       ${site24x7Data.data.group_data.SERVER.name.map((serverName, index) => (
//         `site24x7_server_cpu_used_percent{server="${serverName}"} ${site24x7Data.data.group_data.SERVER.attribute_data[index]['0'].CPUUSEDPERCENT}\n`
//       )).join('')}
//     `;

//     // Disini akan mengembalikan metrik Prometheus yang telah diproses
//     return prometheusMetrics;
//   } catch (error) {
//     console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
//     throw error;
//   }
// }

// module.exports = {
//   processSite24x7DataAndReturnPrometheusMetrics
// };