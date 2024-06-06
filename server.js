const express = require('express');
const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics, processSummaryReportAndReturnPrometheusMetrics, processCurrentStatusAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

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

let tokenExpirationTime = 0;

async function ensureTokenIsValid() {
  const currentTime = Date.now();
  if (currentTime >= tokenExpirationTime) {
    try {
      await authenticate();
      tokenExpirationTime = currentTime + 3600000;
      console.log('Token has been refreshed:', new Date().toISOString());
      const currentToken = getAccessToken();
      console.log('Active token:', currentToken);
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    }
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  setInterval(async () => {
    try {
      await ensureTokenIsValid();

      cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
      lastFetchTime = Date.now();
      console.log('Data has been fetched from Site24x7:', new Date().toISOString());

      cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
      lastFetchTimeMonitorStatus = Date.now();
      console.log('Monitor status data has been fetched from Site24x7:', new Date().toISOString());

      cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
      lastFetchTimeSummaryReport = Date.now();
      console.log('Summary report data has been fetched from Site24x7:', new Date().toISOString());

      cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
      lastFetchTimeCurrentStatus = Date.now();
      console.log('Current status data has been fetched from Site24x7:', new Date().toISOString());
    } catch (error) {
      console.error('Error processing and returning Prometheus metrics:', error);
    }
  }, 3600000);
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




// const express = require('express');
// const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
// const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics, processSummaryReportAndReturnPrometheusMetrics, processCurrentStatusAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// let cachedMonitorStatusMetrics = null;
// let lastFetchTimeMonitorStatus = 0;

// let cachedSummaryReportMetrics = null;
// let lastFetchTimeSummaryReport = 0;

// let cachedCurrentStatusMetrics = null;
// let lastFetchTimeCurrentStatus = 0;

// let tokenExpirationTime = 0;

// async function ensureTokenIsValid() {
//   const currentTime = Date.now();
//   if (currentTime >= tokenExpirationTime) {
//     try {
//       await authenticate();
//       tokenExpirationTime = currentTime + 3600000;
//       console.log('Token has been refreshed:', new Date());
//     } catch (error) {
//       console.error('Failed to refresh token:', error);
//       throw error;
//     }
//   }
// }

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);

//   setInterval(async () => {
//     try {
//       await ensureTokenIsValid();

//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = Date.now();
//       console.log('Data has been fetched from Site24x7:', new Date());

//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = Date.now();
//       console.log('Monitor status data has been fetched from Site24x7:', new Date());

//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = Date.now();
//       console.log('Summary report data has been fetched from Site24x7:', new Date());

//       cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
//       lastFetchTimeCurrentStatus = Date.now();
//       console.log('Current status data has been fetched from Site24x7:', new Date());
//     } catch (error) {
//       console.error('Error processing and returning Prometheus metrics:', error);
//     }
//   }, 3600000);
// });

// app.get('/metrics', async (req, res) => {
//   try {
//     const currentTime = Date.now();

//     await ensureTokenIsValid();

//     if (!cachedMetrics || currentTime - lastFetchTime > 3600000) {
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = currentTime;
//     }

//     if (!cachedMonitorStatusMetrics || currentTime - lastFetchTimeMonitorStatus > 3600000) {
//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = currentTime;
//     }

//     if (!cachedSummaryReportMetrics || currentTime - lastFetchTimeSummaryReport > 3600000) {
//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = currentTime;
//     }

//     if (!cachedCurrentStatusMetrics || currentTime - lastFetchTimeCurrentStatus > 3600000) {
//       cachedCurrentStatusMetrics = await processCurrentStatusAndReturnPrometheusMetrics();
//       lastFetchTimeCurrentStatus = currentTime;
//     }

//     const allMetrics = `
// ${cachedMetrics}

// ${cachedMonitorStatusMetrics}

// ${cachedSummaryReportMetrics}

// ${cachedCurrentStatusMetrics}
// `.trim();

//     res.set('Content-Type', 'text/plain');
//     res.send(allMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// module.exports = app;




// const express = require('express');
// const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
// const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics, processSummaryReportAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// let cachedMonitorStatusMetrics = null;  
// let lastFetchTimeMonitorStatus = 0;

// let cachedSummaryReportMetrics = null;
// let lastFetchTimeSummaryReport = 0;

// let tokenExpirationTime = 0;

// // Fungsi untuk memperbarui token jika sudah kedaluwarsa atau mendekati kedaluwarsa
// async function ensureTokenIsValid() {
//   const currentTime = Date.now();
//   if (currentTime >= tokenExpirationTime) {
//     try {
//       await authenticate();
//       tokenExpirationTime = currentTime + 3600000; // Setel waktu kedaluwarsa token satu jam ke depan
//       console.log('Token has been refreshed:', new Date());
//     } catch (error) {
//       console.error('Failed to refresh token:', error);
//       throw error;
//     }
//   }
// }

// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);

//   setInterval(async () => {
//     try {
//       await ensureTokenIsValid();

//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = Date.now();
//       console.log('Data has been fetched from Site24x7:', new Date());

//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = Date.now();
//       console.log('Monitor status data has been fetched from Site24x7:', new Date());

//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = Date.now();
//       console.log('Summary report data has been fetched from Site24x7:', new Date());
//     } catch (error) {
//       console.error('Error processing and returning Prometheus metrics:', error);
//     }
//   }, 3600000); // Interval setiap satu jam (dalam milidetik)
// });

// app.get('/metrics', async (req, res) => {
//   try {
//     const currentTime = Date.now();

//     await ensureTokenIsValid();

//     if (!cachedMetrics || currentTime - lastFetchTime > 3600000) {
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = currentTime;
//     }

//     if (!cachedMonitorStatusMetrics || currentTime - lastFetchTimeMonitorStatus > 3600000) {
//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = currentTime;
//     }

//     if (!cachedSummaryReportMetrics || currentTime - lastFetchTimeSummaryReport > 3600000) {
//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = currentTime;
//     }

//     const allMetrics = `
// ${cachedMetrics}

// ${cachedMonitorStatusMetrics}

// ${cachedSummaryReportMetrics}
// `.trim();

//     res.set('Content-Type', 'text/plain');
//     res.send(allMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// module.exports = app;




// const express = require('express');
// const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
// const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics, processSummaryReportAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// let cachedMonitorStatusMetrics = null;
// let lastFetchTimeMonitorStatus = 0;

// let cachedSummaryReportMetrics = null;
// let lastFetchTimeSummaryReport = 0;

// authenticate()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);

//       setInterval(async () => {
//         try {
//           cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//           lastFetchTime = Date.now();
//           console.log('Data has been fetched from Site24x7:', new Date());

//           cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//           lastFetchTimeMonitorStatus = Date.now();
//           console.log('Monitor status data has been fetched from Site24x7:', new Date());

//           cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//           lastFetchTimeSummaryReport = Date.now();
//           console.log('Summary report data has been fetched from Site24x7:', new Date());
//         } catch (error) {
//           console.error('Error processing and returning Prometheus metrics:', error);
//         }
//       }, 3600000); // Interval setiap satu jam (dalam milidetik)
//     });
//   })
//   .catch(error => {
//     console.error('Failed to authenticate:', error);
//   });

// app.get('/metrics', async (req, res) => {
//   try {
//     const currentTime = Date.now();

//     if (!cachedMetrics || currentTime - lastFetchTime > 3600000) {
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = currentTime;
//     }

//     if (!cachedMonitorStatusMetrics || currentTime - lastFetchTimeMonitorStatus > 3600000) {
//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = currentTime;
//     }

//     if (!cachedSummaryReportMetrics || currentTime - lastFetchTimeSummaryReport > 3600000) {
//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = currentTime;
//     }

//     const allMetrics = `
// ${cachedMetrics}

// ${cachedMonitorStatusMetrics}

// ${cachedSummaryReportMetrics}
// `.trim();

//     res.set('Content-Type', 'text/plain');
//     res.send(allMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// module.exports = app;





// const express = require('express');
// const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
// const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics, processSummaryReportAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// let cachedMonitorStatusMetrics = null;
// let lastFetchTimeMonitorStatus = 0;

// let cachedSummaryReportMetrics = null;
// let lastFetchTimeSummaryReport = 0;

// authenticate()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);

//       setInterval(async () => {
//         try {
//           cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//           lastFetchTime = Date.now();
//           console.log('Data has been fetched from Site24x7:', new Date());

//           cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//           lastFetchTimeMonitorStatus = Date.now();
//           console.log('Monitor status data has been fetched from Site24x7:', new Date());

//           cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//           lastFetchTimeSummaryReport = Date.now();
//           console.log('Summary report data has been fetched from Site24x7:', new Date());
//         } catch (error) {
//           console.error('Error processing and returning Prometheus metrics:', error);
//         }
//       }, 3600000); // Interval setiap satu jam (dalam milidetik)
//     });
//   })
//   .catch(error => {
//     console.error('Failed to authenticate:', error);
//   });

// app.get('/metrics', async (req, res) => {
//   try {
//     const currentTime = Date.now();

//     if (!cachedMetrics || currentTime - lastFetchTime > 3600000) {
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = currentTime;
//     }

//     if (!cachedMonitorStatusMetrics || currentTime - lastFetchTimeMonitorStatus > 3600000) {
//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = currentTime;
//     }

//     if (!cachedSummaryReportMetrics || currentTime - lastFetchTimeSummaryReport > 3600000) {
//       cachedSummaryReportMetrics = await processSummaryReportAndReturnPrometheusMetrics();
//       lastFetchTimeSummaryReport = currentTime;
//     }

//     const allMetrics = `
// ${cachedMetrics}
// ${cachedMonitorStatusMetrics}
// ${cachedSummaryReportMetrics}
// `.trim();

//     res.set('Content-Type', 'text/plain');
//     res.send(allMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// // Endpoint baru untuk mendapatkan access token
// app.get('/token', (req, res) => {
//   try {
//     const accessToken = getAccessToken();
//     res.json({ accessToken });
//   } catch (error) {
//     console.error('Failed to get access token:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// module.exports = app;




// const express = require('express');
// const { authenticate, getAccessToken } = require('./src/services/tokenManager'); 
// const { processSite24x7DataAndReturnPrometheusMetrics, processGlobalMonitorStatusAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// let cachedMonitorStatusMetrics = null;
// let lastFetchTimeMonitorStatus = 0;

// authenticate()
//   .then(() => {
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);

//       setInterval(async () => {
//         try {
//           cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//           lastFetchTime = Date.now();
//           console.log('Data has been fetched from Site24x7:', new Date());

//           cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//           lastFetchTimeMonitorStatus = Date.now();
//           console.log('Monitor status data has been fetched from Site24x7:', new Date());
//         } catch (error) {
//           console.error('Error processing and returning Prometheus metrics:', error);
//         }
//       }, 3600000); // Interval setiap satu jam (dalam milidetik)
//     });
//   })
//   .catch(error => {
//     console.error('Failed to authenticate:', error);
//   });

// app.get('/metrics', async (req, res) => {
//   try {
//     let prometheusMetrics = [];

//     if (cachedMetrics && (Date.now() - lastFetchTime < 3600000)) {
//       prometheusMetrics.push(cachedMetrics);
//     } else {
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = Date.now();
//       prometheusMetrics.push(cachedMetrics);
//     }

//     if (cachedMonitorStatusMetrics && (Date.now() - lastFetchTimeMonitorStatus < 3600000)) {
//       prometheusMetrics.push(cachedMonitorStatusMetrics);
//     } else {
//       cachedMonitorStatusMetrics = await processGlobalMonitorStatusAndReturnPrometheusMetrics();
//       lastFetchTimeMonitorStatus = Date.now();
//       prometheusMetrics.push(cachedMonitorStatusMetrics);
//     }

//     res.set('Content-Type', 'text/plain');
//     res.send(prometheusMetrics.join('\n'));
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// // Endpoint baru untuk mendapatkan access token
// app.get('/token', (req, res) => {
//   try {
//     const accessToken = getAccessToken();
//     res.json({ accessToken });
//   } catch (error) {
//     console.error('Failed to get access token:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// module.exports = app;





// const express = require('express');
// const { processSite24x7DataAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');
// const { authenticate } = require('./src/services/tokenManager');

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// let cachedMetrics = null;
// let lastFetchTime = 0;

// // Autentikasi saat starting server
// authenticate()
//   .then(() => {
//     // Setelah autentikasi berhasil, server dijalankan
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);

//       // setInterval berfungsi untuk menjadwalkan pengambilan data setiap jam
//       setInterval(async () => {
//         try {
//           cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//           lastFetchTime = Date.now();
//           console.log('Data has been fetched from Site24x7:', new Date());
//         } catch (error) {
//           console.error('Error processing and returning Prometheus metrics:', error);
//         }
//       }, 3600000); // Interval setiap satu jam (dalam milidetik)
//     });
//   })
//   .catch(error => {
//     console.error('Failed to authenticate:', error);
//   });

// // Menentukan rute khusus untuk menggunakan metricsController
// app.get('/metrics', async (req, res) => {
//   try {
//     // Periksa apakah data sudah di-cache
//     if (cachedMetrics && (Date.now() - lastFetchTime < 3600000)) {
//       // Jika cache masih valid, kirimkan data dari cache
//       res.set('Content-Type', 'text/plain');
//       res.send(cachedMetrics);
//     } else {
//       // Jika cache tidak ada atau sudah kedaluwarsa, ambil data baru
//       cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//       lastFetchTime = Date.now();
//       res.set('Content-Type', 'text/plain');
//       res.send(cachedMetrics);
//     }
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// // Basic Route (root)
// app.get('/', (req, res) => {
//   res.send('Server is running on http://localhost:3001');
// });

// module.exports = app;



// const express = require('express');
// const { processSite24x7DataAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');
// const { authenticate } = require('./src/services/tokenManager'); 

// const app = express();
// const PORT = process.env.PORT || 3001;

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// // Autentikasi saat starting server
// authenticate()
//   .then(() => {
//     // Setelah autentikasi berhasil, server dijalankan
//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);

//       // setInterval berfungsi untuk menjadwalkan pengambilan data setiap jam
//       setInterval(async () => {
//         try {
//           const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//           console.log('Data has been fetched from Site24x7:', new Date());
//           // Nanti jika butuh logic lainnya untuk menyimpan atau mengirim metrik Prometheus, tambahkan aja disini
//         } catch (error) {
//           console.error('Error processing and returning Prometheus metrics:', error);
//         }
//       }, 3600000); // Interval setiap satu jam (dalam milidetik)
//     });
//   })
//   .catch(error => {
//     console.error('Failed to authenticate:', error);
//   });

// // Menentukan rute khusus untuk menggunakan metricsController
// app.get('/metrics', async (req, res) => {
//   try {
//     // Panggil fungsi untuk memproses data dari API Site24x7 dan mengembalikan metrik Prometheus
//     const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();

//     // Kirimkan metrik Prometheus sebagai respons
//     res.set('Content-Type', 'text/plain');
//     res.send(prometheusMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });

// module.exports = app;




// const express = require('express');
// const { processSite24x7DataAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');
// const { authenticate } = require('./src/services/tokenManager');

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Start server after successful authentication
// authenticate()
//     .then(() => {
//         // Server is started
//         app.listen(PORT, () => {
//             console.log(`Server is running on http://localhost:${PORT}`);

//             // Schedule data fetching every hour
//             setInterval(async () => {
//                 try {
//                     const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//                     console.log('Data has been fetched from Site24x7:', new Date());
//                     // Add any additional logic for saving or sending Prometheus metrics here
//                 } catch (error) {
//                     console.error('Error processing and returning Prometheus metrics:', error);
//                 }
//             }, 3600000); // 1 hour interval (in milliseconds)
//         });
//     })
//     .catch(error => {
//         console.error('Failed to authenticate:', error);
//         process.exit(1); // Exit process if authentication fails
//     });

// // Route to use metricsController
// app.get('/metrics', async (req, res) => {
//     try {
//         const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//         res.set('Content-Type', 'text/plain');
//         res.send(prometheusMetrics);
//     } catch (error) {
//         console.error('Error processing and returning Prometheus metrics:', error);
//         res.status(500).send('Internal server error');
//     }
// });


// const express = require('express');
// const { processSite24x7DataAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');
// const { authenticate } = require('./src/services/tokenManager'); 

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Autentikasi saat starting server
// authenticate().then(() => {
//   // Setelah autentikasi berhasil, server dijalankan
//   app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);

//     // setInterval berfungsi untuk menjadwalkan pengambilan data setiap jam
//     setInterval(async () => {
//       try {
//         const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
//         console.log('Data has been fetched from Site24x7:', new Date());
//         // Nanti jika butuh logic lainnya untuk menyimpan atau mengirim metrik Prometheus, tambahkan aja disini
//       } catch (error) {
//         console.error('Error processing and returning Prometheus metrics:', error);
//       }
//     }, 3600000); // Interval setiap satu jam (dalam milidetik)
//   });
// }).catch(error => {
//   console.error('Failed to authenticate:', error);
// });

// // Menentukan rute khusus untuk menggunakan metricsController
// app.get('/metrics', async (req, res) => {
//   try {
//     // Panggil fungsi untuk memproses data dari API Site24x7 dan mengembalikan metrik Prometheus
//     const prometheusMetrics = await processSite24x7DataAndReturnPrometheusMetrics();

//     // Kirimkan metrik Prometheus sebagai respons
//     res.set('Content-Type', 'text/plain');
//     res.send(prometheusMetrics);
//   } catch (error) {
//     console.error('Error processing and returning Prometheus metrics:', error);
//     res.status(500).send('Internal server error');
//   }
// });