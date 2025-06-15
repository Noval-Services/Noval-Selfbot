module.exports = {
  name: 'killbot',
  description: 'Stop the bot process.',
  category: 'ONLY',
  usage: 'killbot',
  hidden: false,
  async execute(client, message, args) {
    if (message.author.id !== client.user.id) return;
    await message.channel.send('```md\n⛔ Bot is shutting down...\n```');
    process.exit(0);
  },
};
