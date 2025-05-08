const FormatUtil = require('../utils/FormatUtil');

module.exports = {
  name: 'time',
  description: 'Xem giờ hệ thống và múi giờ phổ biến.',
  category: 'UTILITY',
  hidden: false,
  async execute(client, message, args) {
    if (!message?.channel || message.author.id !== client.user.id) return;
    const now = new Date();
    const utc = now.toISOString().replace('T', ' ').replace(/\..*$/, '') + ' UTC';
    const vn = new Date(now.getTime() + 7 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace(/\..*$/, '') + ' GMT+7';
    const us = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString().replace('T', ' ').replace(/\..*$/, '') + ' GMT-4';
    const content = [
      `**UTC:** ${utc}`,
      `**Việt Nam:** ${vn}`,
      `**US (EDT):** ${us}`
    ].join('\n');
    return message.channel.send(FormatUtil.mdSection('Thời gian hệ thống', content));
  }
};
