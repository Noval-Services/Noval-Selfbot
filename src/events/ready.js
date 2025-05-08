module.exports = async (client) => {
  // --- Startup timestamp for uptime tracking ---
  client.startTimestamp = Date.now();

  // --- Initialize snipes cache for snipe command ---
  if (!client.snipesCache) client.snipesCache = {};

  // --- Store original DM channels for easy access ---
  client.importantDMs = {};


  // --- Log startup information (discreet for selfbots) ---
  const logger = require('../utils/logger');
  logger.info('----------------------------------------------');
  logger.info(`Selfbot initialized as ${client.user.tag}`);
  logger.info(`Loaded ${client.commands.size} commands`);
  logger.info(`Active in ${client.guilds.cache.size} servers`);
  logger.info('----------------------------------------------');

  // --- Self-monitoring routine ---
  setInterval(() => {
    try {
      // Check RAM usage
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      if (memoryUsageMB > 200) {
        logger.warn(`High memory usage: ${memoryUsageMB}MB`);
        logger.logToFile('WARN', `High memory usage: ${memoryUsageMB}MB`);
      }

      // Calculate uptime
      const uptime = Math.floor((Date.now() - client.startTimestamp) / 1000 / 60);
      if (uptime > 0 && uptime % 60 === 0) {
        logger.info(`Selfbot running for ${uptime} minutes`);
      }
    } catch (err) {
      logger.error('[Monitor Error]', { error: err.message });
      logger.logToFile('ERROR', '[Monitor Error]', { error: err.message });
    }
  }, 60000);

  // --- Cache important DM channels if configured ---
  if (process.env.IMPORTANT_USER_IDS) {
    const importantUserIds = process.env.IMPORTANT_USER_IDS.split(',').map(id => id.trim()).filter(Boolean);
    for (const userId of importantUserIds) {
      try {
        const user = await client.users.fetch(userId);
        if (user) {
          const dmChannel = await user.createDM();
          client.importantDMs[userId] = dmChannel;
        }
      } catch (error) {
        console.error(`[DM Cache Error] User ${userId}:`, error);
      }
    }
  }
};
module.exports.name = 'ready';
module.exports.once = true;