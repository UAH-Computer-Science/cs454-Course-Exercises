const http = require('http');
const os = require('os');
const net = require('net');

const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || 'compose-api';
const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = Number(process.env.REDIS_PORT || 6379);
let localCount = 0;

function redisCommand(command) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: redisHost, port: redisPort });
    let data = '';

    socket.setTimeout(1500);
    socket.on('connect', () => socket.write(command));
    socket.on('data', chunk => { data += chunk.toString(); });
    socket.on('end', () => resolve(data.trim()));
    socket.on('timeout', () => socket.destroy(new Error('Redis timeout')));
    socket.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  localCount += 1;
  let redisCount = null;
  let redisError = null;

  try {
    const response = await redisCommand('*2\r\n$4\r\nINCR\r\n$8\r\nrequests\r\n');
    const match = response.match(/^:(\d+)/);
    redisCount = match ? Number(match[1]) : response;
  } catch (error) {
    redisError = error.message;
  }

  const body = {
    service: serviceName,
    hostname: os.hostname(),
    pid: process.pid,
    localCount,
    redisCount,
    redisHost,
    redisError,
    path: req.url,
    timestamp: new Date().toISOString()
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body, null, 2));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} listening on port ${port}`);
});
