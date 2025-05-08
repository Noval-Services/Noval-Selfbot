// src/commands/whoami.js
const FormatUtil = require('../utils/FormatUtil');

module.exports = {
  name: 'whoami',
  description: 'Hiển thị thông tin tài khoản selfbot.',
  category: 'INFO',
  hidden: false,
  async execute(client, message, args) {
    if (!message?.channel || message.author.id !== client.user.id) return;
    const user = client.user;
    const info = [
      `**Username:** ${user.username}#${user.discriminator}`,
      `**ID:** ${user.id}`,
      `**Created:** <t:${Math.floor(user.createdTimestamp/1000)}:F>`,
      `**Avatar:** [Link](${user.displayAvatarURL()})`,
      `**Bot:** ${user.bot ? 'Yes' : 'No'}`
    ].join('\n');
    await message.channel.send(FormatUtil.mdSection('Thông tin Selfbot', info));
  }
};
