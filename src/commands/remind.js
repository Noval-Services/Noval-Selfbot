// src/commands/remind.js
const FormatUtil = require('../utils/FormatUtil');

module.exports = {
  name: 'remind',
  description: 'Đặt nhắc nhở cá nhân (reminder) sau X phút/giây.',
  category: 'UTILITY',
  hidden: false,
  usage: 'remind <số> <s|m|h> <nội dung>',
  async execute(client, message, args) {
    if (!message?.channel || message.author.id !== client.user.id) return;
    if (args.length < 3) {
      return message.channel.send(FormatUtil.warning('Cú pháp: remind <số> <s|m|h> <nội dung>')).catch(() => {});
    }
    const num = parseInt(args[0]);
    const unit = args[1].toLowerCase();
    const content = args.slice(2).join(' ');
    if (isNaN(num) || !['s','m','h'].includes(unit)) {
      return message.channel.send(FormatUtil.error('Sai định dạng thời gian!')).catch(() => {});
    }
    let ms = num * 1000;
    if (unit === 'm') ms *= 60;
    if (unit === 'h') ms *= 60 * 60;
    await message.channel.send(FormatUtil.success(`⏰ Đã đặt nhắc nhở sau ${num}${unit}: ${content}`));
    setTimeout(() => {
      message.channel.send(FormatUtil.info(`🔔 Nhắc nhở: ${content}`)).catch(() => {});
    }, ms);
  }
};
