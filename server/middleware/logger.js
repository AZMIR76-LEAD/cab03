// FG DRIVO Professional HTTP Request & Response Telemetry Logger

export function requestLogger(req, res, next) {
  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  // Intercept response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });

    // ANSI color codes for terminal logging
    let statusColor = '\x1b[32m'; // Green (2xx)
    if (statusCode >= 300 && statusCode < 400) statusColor = '\x1b[36m'; // Cyan (3xx)
    if (statusCode >= 400 && statusCode < 500) statusColor = '\x1b[33m'; // Yellow (4xx)
    if (statusCode >= 500) statusColor = '\x1b[31m'; // Red (5xx)

    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    const bold = '\x1b[1m';

    console.log(
      `${dim}[${timestamp}]${reset} ${bold}${method.padEnd(6)}${reset} ${originalUrl.padEnd(35)} ${statusColor}${statusCode}${reset} ${dim}${duration}ms${reset}`
    );
  });

  next();
}
