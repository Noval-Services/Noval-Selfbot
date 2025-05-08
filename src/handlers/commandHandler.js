const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));


  const logger = require('../utils/logger');
  logger.info('Loaded commands:');
  for (const file of commandFiles) {
    const command = require(`${commandsPath}/${file}`);
    client.commands.set(command.name, command);
    logger.info(`- ${command.name}`);
  }

  client.on('messageCreate', async message => {
    if (message.author.id !== client.user.id) return;

    const prefix = process.env.PREFIX || "!";
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    if (typeof client.isOwner === 'function' && !client.isOwner(message)) {
      return message.channel.send('');
    }

    const FormatUtil = require('../utils/FormatUtil');
    const logger = require('../utils/logger');
    try {
      await command.execute(client, message, args);
    } catch (error) {
      logger.error('Command execution error', { command: commandName, error: error.message });
      logger.logToFile('ERROR', error.message, { command: commandName });
      try {
        await message.channel.send(FormatUtil.error('Command Error', error.message));
      } catch {
        await message.channel.send(`❌ Error: ${error.message}`);
      }
    }
  });
};
