const axios = require('axios');
const CONFIG = {
  PREFIX: process.env.PREFIX || 'i?',
};

const formatOutput = (data, client, message) => `
\`\`\`md
🖨️ Server Cloner
════════════════════
Requested by: ${message.author?.username || 'Unknown User'}

📡 Cloning Status
════════════════════
Source Guild: ${data.guild_s}
Target Guild: ${data.guild}
Status: ${data.status}
Message: ${data.message}

🤖 Bot Details
════════════════════
Powered by: ${client.user.username}
Timestamp: ${new Date().toLocaleString()}
\`\`\`
`;

module.exports = {
  name: 'cloner',
  description: 'Clones a Discord server.',
  category: 'UTILITY',
  hidden: false,
  async execute(client, message, args) {
    if (message.author.id !== client.user.id) return;

    try {
      const [guild_s, guild] = args;
      if (!guild_s || !guild) {
        return await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Usage: ${CONFIG.PREFIX}cloner <source_guild_id> <target_guild_id>
\`\`\`
        `).catch(() => {});
      }
      if (!/^\d+$/.test(guild_s) || !/^\d+$/.test(guild)) {
        return await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Guild IDs must be numeric.
\`\`\`
        `).catch(() => {});
      }

      const sentMessage = await message.channel.send('🖨️ Cloning server...');

      const response = await axios.post('http://cloner.theatlantis.asia/clone', {
        token: process.env.TOKEN,
        guild_s,
        guild,
        clone_emojis: true,
      });

      const data = {
        guild_s,
        guild,
        status: response.data.status || 'Unknown',
        message: response.data.message || 'No message provided',
      };

      // Send result
      await sentMessage.edit(formatOutput(data, client, message)).catch(() => {});
    } catch (error) {
      console.error('Error in cloner command:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to clone server. Please try again later.';
      await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
${errorMessage}
\`\`\`
      `).catch(() => {});
    }
  },
};