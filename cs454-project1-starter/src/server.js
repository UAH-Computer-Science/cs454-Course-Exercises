const express = require('express');

const app = express();

// Runtime configuration comes from the environment, never from hard-coded values.
// Keep it that way as you add Redis: the image you build must be usable without
// rebuilding it for a different host, port, or backing service.
const port = Number(process.env.PORT || 3000);
const serviceName = process.env.SERVICE_NAME || 'cs454-project1';

// TODO (Project 1): read your Redis connection settings from the environment too.
// The Compose service name is the hostname -- do not hard-code a container IP.
//   const redisHost = process.env.REDIS_HOST || 'localhost';
//   const redisPort = Number(process.env.REDIS_PORT || 6379);

// Basic request logging. Container logs are your primary debugging tool for this
// project, so keep writing to stdout/stderr rather than to a file inside the image.
app.use((req, res, next) => {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs.toFixed(1)}ms`
    );
  });

  next();
});

app.get('/', (req, res) => {
  res.json({
    service: serviceName,
    message: 'CS 454/554 Project 1 starter is running.'
  });
});

// TODO (Project 1): implement GET /convert?lbs=<number>
//   200 -> { lbs, kg, formula: 'kg = lbs * 0.45359237' }, kg rounded to 3 decimals
//   400 -> lbs missing or not a number
//   422 -> lbs negative or non-finite
//   Every successful conversion increments the Redis key `conversions` by one.
//   Invalid requests must NOT increment it.

// TODO (Project 1): implement GET /stats
//   200 -> { conversions: <count read from Redis> }
//   503 -> optional, when the Redis-backed state cannot be read

// TODO (Project 1): implement GET /health
//   200 -> { status: 'ok' }
//   This is what your container health check will call. Per the API contract it
//   is an application-local liveness check: it should NOT fail just because
//   Redis is unreachable -- that failure surfaces on /stats instead. Explain the
//   distinction in your README.

// Error bodies match the ErrorResponse schema in convert-api.openapi.yaml:
// a single `error` string and nothing else. The requested path is already in
// the log line above, so it does not need to go in the response.
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(port, '0.0.0.0', () => {
  console.log(`${serviceName} listening on port ${port}`);
});

// Containers are stopped by signal, not by Ctrl-C. Handling SIGTERM lets the
// runtime shut the process down cleanly instead of killing it after a timeout.
const shutdown = (signal) => {
  console.log(`Received ${signal}, shutting down...`);

  server.close(() => {
    console.log('Server closed.');
    // TODO (Project 1): close your Redis client here before exiting.
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
