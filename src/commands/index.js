const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const FormatUtil = require('../utils/FormatUtil');

const commands = new Map();

const commandFiles = fs.readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js');

for (const file of commandFiles) {
  const commandPath = path.join(__dirname, file);
  let command = require(commandPath);

  // Wrap command.execute with logging and error handling
  if (typeof command === 'object' && typeof command.execute === 'function') {
    const originalExecute = command.execute;
    command.execute = async (...args) => {
      const message = args[0];
      logger.info(`[Command] ${command.name || file} invoked by ${message.author?.tag || 'unknown'}`);
      try {
        const result = await originalExecute.apply(command, args);
        logger.info(`[Command] ${command.name || file} executed successfully`);
        return result;
      } catch (err) {
        logger.error(`[Command Error] ${command.name || file}: ${err.message}`);
        logger.logToFile('ERROR', `[Command Error] ${command.name || file}`, { error: err.stack });
        if (message && message.channel) {
          message.channel.send(FormatUtil.error(`Đã xảy ra lỗi khi thực thi lệnh: \`${command.name || file}\``));
        }
      }
    };
  }

  // Add to commands map
  commands.set(command.name || file.replace('.js', ''), command);
}

module.exports = commands;