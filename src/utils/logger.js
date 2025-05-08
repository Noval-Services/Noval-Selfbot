// src/utils/logger.js
const levels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};
let currentLevel = levels.INFO;

function setLevel(level) {
  if (typeof level === 'string') level = levels[level.toUpperCase()] ?? levels.INFO;
  currentLevel = level;
}

function formatMessage(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] ${level}: ${message}${metaString}`;
}

function error(message, meta = {}) {
  if (currentLevel >= levels.ERROR) {
    console.error(formatMessage('ERROR', message, meta));
  }
}
function warn(message, meta = {}) {
  if (currentLevel >= levels.WARN) {
    console.warn(formatMessage('WARN', message, meta));
  }
}
function info(message, meta = {}) {
  if (currentLevel >= levels.INFO) {
    console.info(formatMessage('INFO', message, meta));
  }
}
function debug(message, meta = {}) {
  if (currentLevel >= levels.DEBUG) {
    console.debug(formatMessage('DEBUG', message, meta));
  }
}

// New: log to file (append)
const fs = require('fs');
const path = require('path');
function logToFile(level, message, meta = {}) {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);
  const logFile = path.join(logDir, `${level.toLowerCase()}.log`);
  const line = formatMessage(level, message, meta) + '\n';
  fs.appendFileSync(logFile, line);
}

// New: Decorator for async command/event/handler error logging
function withErrorLogging(fn, context = 'Unknown') {
  return async function(...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      error && error.stack && error.stack.split('\n').forEach(l => debug(l));
      error && error.message && error(error.message, { context });
      logToFile('ERROR', error.message, { context });
      throw error;
    }
  };
}

// New: Simple performance timer
function perfTimer(label = 'Timer') {
  const start = Date.now();
  return () => `${label}: ${Date.now() - start}ms`;
}

module.exports = { levels, setLevel, error, warn, info, debug, logToFile, withErrorLogging, perfTimer };
