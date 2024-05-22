const { fetchDataFromSite24x7 } = require('../services/metricsService');

async function processSite24x7DataAndReturnPrometheusMetrics() {
  try {
    // Panggil fungsi untuk mengambil data dari API Site24x7
    const site24x7Data = await fetchDataFromSite24x7();

    // Helper function to validate and return a proper metric value
    const sanitizeMetricValue = (value) => {
      const parsedValue = parseFloat(value);
      return isNaN(parsedValue) ? '0.0' : parsedValue.toString();
    };

    // Logic untuk memproses data yang diterima dari API Site24x7, salah satunya yaitu ekstraksi nilai-nilai metrik yang relevan dari respons data
    // dan memformatnya sesuai dengan format eksposisi Prometheus yang diharapkan
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

    // Disini akan mengembalikan metrik Prometheus yang telah diproses
    return prometheusMetrics.trim(); // Using trim() to remove leading and trailing whitespace
  } catch (error) {
    console.error('Error processing Site24x7 data and returning Prometheus metrics:', error);
    throw error;
  }
}

module.exports = {
  processSite24x7DataAndReturnPrometheusMetrics
};



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