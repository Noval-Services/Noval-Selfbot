require('dotenv').config();
const fs = require('fs');
const path = require('path');

function setEnv(key, value) {
  const envPath = path.resolve(process.cwd(), '.env');
  let env = '';
  try {
    env = fs.readFileSync(envPath, 'utf8');
  } catch {}
  const line = `${key}=${value}`;
  env = env.replace(new RegExp(`^${key}=.*$`, 'm'), '').trim();
  fs.writeFileSync(envPath, (env ? env + '\n' : '') + line);
}

module.exports = {
  name: 'prefix',
  description: 'Change the bot command prefix.',
  category: 'ONLY',
  usage: 'prefix <newPrefix>',
  hidden: false,
  async execute(client, message, args) {
    if (message.author.id !== client.user.id) return;
    const newPrefix = args[0];
    if (!newPrefix || newPrefix.length > 5) {
      return message.channel.send(
        '```md\n❌ Error\n════════════════════\nPlease provide a valid prefix (max 5 characters).\nUsage: prefix <newPrefix>\n```'
      );
    }
    try {
      setEnv('PREFIX', newPrefix);
      await message.channel.send(
        `\`\`\`md
✅ Prefix Changed
════════════════════
New prefix is now: "${newPrefix}"
(Please restart the bot to apply the new prefix.)
\`\`\``
      );
    } catch {
      await message.channel.send(
        '```md\n❌ Error\n════════════════════\nFailed to update prefix.\n```'
      );
    }
  },
};
