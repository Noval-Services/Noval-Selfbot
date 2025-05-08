module.exports = {
    name: 'clear',
    description: 'Clears a specified number of your messages in the channel.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message.channel || !['GUILD_TEXT', 'DM'].includes(message.channel.type) || message.author.id !== client.user.id) {
            return message.reply('⛔ This command can only be used in text channels or DMs.').catch(() => {});
        }
        try {
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please provide a number between 1 and 100!
Example: ${process.env.PREFIX || 'i?'}clear 50
\`\`\`
                `).then(m => setTimeout(() => m.deletable && m.delete().catch(() => {}), 3000));
            }
            const progressMsg = await message.channel.send(`
\`\`\`md
🧹 Clearing Messages
════════════════════
Please wait while up to ${amount} of your messages are being deleted...
\`\`\`
            `);
            const messages = await message.channel.messages.fetch({ limit: 100 });
            const userMessages = messages
                .filter(m => m.author.id === client.user.id && m.id !== progressMsg.id)
                .first(Math.min(amount, messages.size));
            if (!userMessages.length) {
                await progressMsg.edit(`
\`\`\`md
❌ No Messages Found
════════════════════
No messages from you were found in the last 100 messages!
\`\`\`
                `).catch(() => {});
                setTimeout(() => progressMsg.deletable && progressMsg.delete().catch(() => {}), 3000);
                return;
            }
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const deletableMessages = userMessages.filter(m => m.createdTimestamp > twoWeeksAgo);
            let deletedCount = 0;
            for (const msg of deletableMessages) {
                try {
                    await msg.delete();
                    deletedCount++;
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (deleteError) {
                    console.error(`Failed to delete message ${msg.id}:`, deleteError.message);
                }
            }
            await progressMsg.edit(`
\`\`\`md
✅ Cleared Messages
════════════════════
Successfully deleted ${deletedCount}/${userMessages.length} of your messages!
\`\`\`
            `).catch(() => {});
        } catch (error) {
            console.error('Error in clear command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to clear messages. Please try again later.
Reason: ${error.message}
\`\`\`
            `).catch(() => {});
        }
    },
};