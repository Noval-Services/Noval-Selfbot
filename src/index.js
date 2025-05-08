require('dotenv').config();
const { Client, Collection } = require('discord.js-selfbot-v13');
const fs = require('fs');
const path = require('path');

const logger = require('./utils/logger');
const client = new Client();

client.commands = new Collection();

const handlersPath = path.join(__dirname, 'handlers');
['commandHandler', 'eventHandler'].forEach(handler => {
  require(`${handlersPath}/${handler}`)(client);
});


logger.info('Starting selfbot...');
client.login(process.env.TOKEN).then(() => {
  logger.info('Selfbot logged in successfully!');
  logger.logToFile('INFO', 'Selfbot started');
}).catch(err => {
  logger.error('Login failed', { error: err.message });
  logger.logToFile('ERROR', 'Login failed', { error: err.message });
  process.exit(1);
});

