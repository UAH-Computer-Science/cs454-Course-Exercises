const http = require('http');
const os = require('os');

const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || 'cs454-demo';
const message = process.env.MESSAGE || 'Hello from CS454';
let requestCount = 0;

const server = http.createServer((req, res) => {
  requestCount += 1;

  const body = {
    service: serviceName,
    message,
    hostname: os.hostname(),
    pid: process.pid,
    platform: process.platform,
    node: process.version,
    requestCount,
    path: req.url,
    timestamp: new Date().toISOString()
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} listening on port ${port}`);
});
