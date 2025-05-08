const FormatUtil = require('../utils/FormatUtil');
const logger = require('../utils/logger');

module.exports = {
  name: 'util',
  description: 'Hiển thị các tiện ích hữu ích cho dev và user.',
  category: 'UTILITY',
  hidden: false,
  async execute(client, message, args) {
    if (!message?.channel || message.author.id !== client.user.id) return;
    const sub = (args[0] || '').toLowerCase();
    if (sub === 'logtest') {
      logger.info('Test log from util command', { user: message.author.tag });
      logger.logToFile('INFO', 'Test log to file from util command', { user: message.author.tag });
      return message.channel.send(FormatUtil.success('Đã ghi log test ra console và file!'));
    }
    if (sub === 'table') {
      const headers = ['STT', 'Tên', 'Giá trị'];
      const rows = [
        ['1', 'Ping', 'pong'],
        ['2', 'Time', new Date().toLocaleTimeString()],
        ['3', 'User', message.author.tag]
      ];
      return message.channel.send(FormatUtil.mdSection('Bảng mẫu', FormatUtil.table(headers, rows)));
    }
    if (sub === 'timer') {
      const timer = logger.perfTimer('TestTimer');
      await new Promise(r => setTimeout(r, 200));
      return message.channel.send(FormatUtil.success(timer()));
    }
    if (sub === 'error') {
      try {
        throw new Error('Demo error for logger!');
      } catch (err) {
        logger.error('Demo error triggered', { user: message.author.tag });
        logger.logToFile('ERROR', err.message, { user: message.author.tag });
        return message.channel.send(FormatUtil.error('Đã ghi lỗi demo vào log!'));
      }
    }
    // Default: show help
    return message.channel.send(FormatUtil.info('Các subcommand: logtest, table, timer, error'));
  }
};
