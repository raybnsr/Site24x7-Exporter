# Site24x7 Exporter for Prometheus

This project provides a Site24x7 exporter for Prometheus, enabling you to monitor Site24x7 metrics in your Prometheus and Grafana setup. The exporter fetches various metrics from Site24x7, processes them, and exposes them in a Prometheus-compatible format.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Endpoints](#endpoints)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

This project is designed to integrate Site24x7 monitoring data with Prometheus. It fetches performance data, global monitor status, summary reports, and current status from Site24x7 and converts these into Prometheus metrics.

## Features

- **Fetch Site24x7 Data:** Retrieves performance data, global monitor status, summary reports, and current status from Site24x7.
- **Prometheus Metrics:** Converts Site24x7 data into Prometheus-compatible metrics.
- **Token Management:** Manages access tokens for authenticating with the Site24x7 API.
- **Caching:** Implements caching to minimize the load on the Site24x7 API.

## Architecture

The application consists of the following components:

- **server.js:** Main entry point of the application. Sets up the Express server and schedules periodic data fetching from Site24x7.
- **metricsService.js:** Contains functions to fetch data from Site24x7 APIs.
- **metricsController.js:** Contains functions to process fetched data and convert them into Prometheus metrics.
- **tokenManager.js:** Manages the OAuth tokens required for authenticating with the Site24x7 API.

## Installation

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/site24x7-exporter.git
   cd site24x7-exporter
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a '.env' file:**
   ```bash
   touch .env
   ```

#### Add the following environment variables to the .env file:
```bash
CLIENT_ID=your_site24x7_client_id
CLIENT_SECRET=your_site24x7_client_secret
REFRESH_TOKEN=your_site24x7_refresh_token
ZAAID=your_site24x7_zaaid
```

## Configuration

The application requires the following environment variables to be set:

- **CLIENT_ID:** Your Site24x7 client ID.
- **CLIENT_SECRET:** Your Site24x7 client secret.
- **REFRESH_TOKEN:** Your Site24x7 refresh token.
- **ZAAID:** Your Site24x7 zaaid.

These can be set in the .env file at the root of the project.


## Usage
### Running the Application
To start the application, run:
```bash
npm run start
```
This will start the server on the port specified in the environment variables (default: 3001).


### Accessing Metrics
The Prometheus metrics can be accessed at:
```bash
http://localhost:3001/metrics
```

## Endpoints
- /metrics: Exposes the Prometheus metrics.

### Example Metrics
Here are some examples of the metrics exposed by this exporter:
```bash
# HELP site24x7_server_disk_used_percent Disk Used Percentage
# TYPE site24x7_server_disk_used_percent gauge
site24x7_server_disk_used_percent{server="server1", instance="localhost:3001"} 55.4

# HELP site24x7_server_mem_used_percent Memory Used Percentage
# TYPE site24x7_server_mem_used_percent gauge
site24x7_server_mem_used_percent{server="server1", instance="localhost:3001"} 67.2

# HELP site24x7_server_cpu_used_percent CPU Used Percentage
# TYPE site24x7_server_cpu_used_percent gauge
site24x7_server_cpu_used_percent{server="server1", instance="localhost:3001"} 24.6
```

## Contributing
We welcome contributions to this project. To contribute, please follow these steps:

- Fork the repository on GitHub.
- Clone your fork to your local machine
```bash
git clone https://github.com/yourusername/site24x7-exporter.git
```
- Create a new branch for your feature or bugfix:
```bash
git checkout -b feature-or-bugfix-name
```
- Make your changes and commit them to your branch.
- Push your changes to your fork on GitHub:
```bash
git push origin feature-or-bugfix-name
```
- Create a pull request to the main repository.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
