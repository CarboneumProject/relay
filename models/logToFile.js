const logToFile = {};
const path = require('path');
const fs = require('fs');
const { transports, createLogger, format } = require('winston');

if (!fs.existsSync(path.join(__dirname, '../logs/'))) {
  // Create the directory if it does not exist
  fs.mkdirSync(path.join(__dirname, '../logs/'));
}

logToFile.writeLog = function writeLog (filename, data) {
  const logger = createLogger({
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    transports: [
      new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
      new transports.File({ filename: path.join(__dirname, '../logs/activity.log'), level: 'info' }),
    ],
  });
  logger.info('[' + filename + '] ' + data);
};

module.exports = logToFile;
