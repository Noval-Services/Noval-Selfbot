// src/utils/FormatUtil.js
const DateTimeUtil = {
  getCurrentTimestamp() {
    return new Date().toISOString().replace('T', ' ').replace(/\..*$/, '');
  }
};


class FormatUtil {
  static box(title, content, type = 'info') {
    const colors = {
      success: '[2;32m', // Green
      error: '[2;31m',   // Red
      info: '[2;36m',    // Cyan
      warning: '[2;33m'  // Yellow
    };
    const color = colors[type] || colors.info;
    const border = '═'.repeat(50);
    const timestamp = DateTimeUtil.getCurrentTimestamp();
    return `\u0060\u0060\u0060ansi\n${color}${border}\n${title}\n${border}\n${content}\n${border}\n[Time: ${timestamp}]\n\u0060\u0060\u0060`;
  }
  static error(message, details = '') {
    return this.box('[ Error ]', `${message}${details ? `\n\nDetails: ${details}` : ''}`, 'error');
  }
  static success(message) {
    return this.box('[ Success ]', message, 'success');
  }
  static info(message) {
    return this.box('[ Info ]', message, 'info');
  }
  static warning(message) {
    return this.box('[ Warning ]', message, 'warning');
  }
  // New: Markdown and Table formatting helpers
  static mdSection(title, content) {
    return `\u0060\u0060\u0060md\n# ${title}\n${content}\n\u0060\u0060\u0060`;
  }
  static table(headers, rows) {
    const head = '| ' + headers.join(' | ') + ' |';
    const sep = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const body = rows.map(r => '| ' + r.join(' | ') + ' |').join('\n');
    return `${head}\n${sep}\n${body}`;
  }
}

module.exports = FormatUtil;
