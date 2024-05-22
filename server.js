const express = require('express');
const { processSite24x7DataAndReturnPrometheusMetrics } = require('./src/controllers/metricsController');
const { authenticate } = require('./src/services/tokenManager');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let cachedMetrics = null;
let lastFetchTime = 0;

// Autentikasi saat starting server
authenticate()
  .then(() => {
    // Setelah autentikasi berhasil, server dijalankan
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);

      // setInterval berfungsi untuk menjadwalkan pengambilan data setiap jam
      setInterval(async () => {
        try {
          cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
          lastFetchTime = Date.now();
          console.log('Data has been fetched from Site24x7:', new Date());
        } catch (error) {
          console.error('Error processing and returning Prometheus metrics:', error);
        }
      }, 3600000); // Interval setiap satu jam (dalam milidetik)
    });
  })
  .catch(error => {
    console.error('Failed to authenticate:', error);
  });

// Menentukan rute khusus untuk menggunakan metricsController
app.get('/metrics', async (req, res) => {
  try {
    // Periksa apakah data sudah di-cache
    if (cachedMetrics && (Date.now() - lastFetchTime < 3600000)) {
      // Jika cache masih valid, kirimkan data dari cache
      res.set('Content-Type', 'text/plain');
      res.send(cachedMetrics);
    } else {
      // Jika cache tidak ada atau sudah kedaluwarsa, ambil data baru
      cachedMetrics = await processSite24x7DataAndReturnPrometheusMetrics();
      lastFetchTime = Date.now();
      res.set('Content-Type', 'text/plain');
      res.send(cachedMetrics);
    }
  } catch (error) {
    console.error('Error processing and returning Prometheus metrics:', error);
    res.status(500).send('Internal server error');
  }
});

// Basic Route (root)
app.get('/', (req, res) => {
  res.send('Server is running on http://localhost:3001');
});

module.exports = app;



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