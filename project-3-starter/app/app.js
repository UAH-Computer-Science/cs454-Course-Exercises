const http = require('http');
const os = require('os');
const net = require('net');

const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || 'compose-api';
const redisHost = process.env.REDIS_HOST || 'redis';
const redisPort = Number(process.env.REDIS_PORT || 6379);
let localCount = 0;

// Minimal Redis client, hand-rolled so this image needs no npm dependencies.
// Redis accepts plain-text "inline commands", so this sends exactly what you
// would type into redis-cli. Real applications use a client library instead
// (see the redis package on npm) -- the point of this exercise is service
// discovery and lifecycle, not the Redis wire protocol.
function redisCommand(command) {
  return new Promise((resolve, reject) => {
    console.log("Connecting to " + redisHost + ":" + redisPort);
    const socket = net.createConnection({ host: redisHost, port: redisPort });
    let data = '';

    socket.setTimeout(1500);
    socket.on('connect', () => socket.write(command + '\r\n'));
    socket.on('data', chunk => {
      data += chunk.toString();
      // Redis keeps the connection open for more commands, so there is no
      // 'end' event to wait for. One command means one reply line: as soon as
      // we see its CRLF terminator we have the whole answer and can hang up.
      if (data.includes('\r\n')) {
        socket.end();
        resolve(data.trim());
      }
    });
    socket.on('timeout', () => socket.destroy(new Error('Redis timeout')));
    socket.on('error', reject);
  });
}

// INCR returns a RESP integer, e.g. ":5". Decoding that is this layer's job,
// not the request handler's -- callers just get a number back.
async function redisIncr(key) {
  const reply = await redisCommand(`INCR ${key}`);
  const match = reply.match(/^:(\d+)/);
  if (!match) {
    throw new Error(`Unexpected Redis reply: ${reply}`);
  }
  return Number(match[1]);
}

const server = http.createServer(async (req, res) => {
  localCount += 1;
  let redisCount = null;
  let redisError = null;

  try {
    redisCount = await redisIncr('requests');
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
