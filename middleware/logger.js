// logger.js
const { createLogger, format, transports } = require('winston');

// Create a Winston logger instance
const logger = createLogger({
  level: 'info', // You can change this to 'debug' for more verbose logging
  format: format.combine(
    format.timestamp(), // Adds timestamps to logs
    format.json() // Logs will be in JSON format
  ),
  transports: [
    new transports.Console(), // Log to console
    new transports.File({ filename: 'error.log', level: 'error' }), // Log errors to a file
    new transports.File({ filename: 'combined.log' }) // Log all activity to a file
  ],
});

module.exports = logger;
