// src/commands/uptime.js
const FormatUtil = require('../utils/FormatUtil');

function formatUptime(ms) {
  const sec = Math.floor(ms / 1000) % 60;
  const min = Math.floor(ms / 1000 / 60) % 60;
  const hr = Math.floor(ms / 1000 / 60 / 60) % 24;
  const day = Math.floor(ms / 1000 / 60 / 60 / 24);
  return `${day}d ${hr}h ${min}m ${sec}s`;
}

module.exports = {
  name: 'uptime',
  description: 'Xem thời gian bot đã hoạt động.',
  category: 'INFO',
  hidden: false,
  async execute(client, message, args) {
    if (!message?.channel || message.author.id !== client.user.id) return;
    const uptime = Date.now() - (client.startTimestamp || process.uptime() * 1000);
    await message.channel.send(FormatUtil.info(`⏱️ Uptime: ${formatUptime(uptime)}`));
  }
};
