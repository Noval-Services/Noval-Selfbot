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

  // New: Format duration (seconds) to human readable string
  static formatDuration(seconds) {
    const d = Math.floor(seconds / (60 * 60 * 24));
    const h = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    const m = Math.floor((seconds % (60 * 60)) / 60);
    const s = Math.floor(seconds % 60);
    return [
      d ? `${d}d` : null,
      h ? `${h}h` : null,
      m ? `${m}m` : null,
      s ? `${s}s` : null
    ].filter(Boolean).join(' ');
  }

  // New: Truncate long strings with ellipsis
  static truncate(str, max = 32) {
    if (typeof str !== 'string') return '';
    return str.length > max ? str.slice(0, max - 3) + '...' : str;
  }

  // New: Pad string left/right for table-like visuals
  static pad(str, len, dir = 'right') {
    str = String(str);
    if (dir === 'left') return str.padStart(len, ' ');
    return str.padEnd(len, ' ');
  }

  // New: Capitalize first letter
  static capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // New: Format bytes to human readable
  static formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // New: Format a date to "YYYY-MM-DD HH:mm:ss"
  static formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' +
      String(d.getMinutes()).padStart(2, '0') + ':' +
      String(d.getSeconds()).padStart(2, '0');
  }

  // New: Strip markdown from a string
  static stripMarkdown(str) {
    if (!str) return '';
    return str.replace(/[_*~`>]/g, '');
  }

  // New: Format a number with commas (e.g. 1,234,567)
  static numberWithCommas(x) {
    if (typeof x !== 'number' && typeof x !== 'string') return x;
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // New: Clamp a number between min and max
  static clamp(num, min, max) {
    return Math.min(Math.max(num, min), max);
  }

  // New: Random pick from array
  static pickRandom(arr) {
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
  }
}

module.exports = FormatUtil;
