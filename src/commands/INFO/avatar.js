const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'avatar',
    description: 'Send user avatar links.',
    category: 'INFO', // For categorization in help command
    hidden: false, // Allow hiding from help if needed
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;

        const prefix = process.env.PREFIX || 'i?';

        try {
            // Determine the target user
            let user = message.author; // Default to self
            if (args[0]) {
                // Check for mention, ID, or tag
                const mention = message.mentions.users.first();
                const byId = client.users.cache.get(args[0].replace(/[<@!>&]/g, ''));
                const byTag = client.users.cache.find(u => u.tag.toLowerCase() === args[0].toLowerCase());
                user = mention || byId || byTag || user;
            }

            // If user not found, send error message
            if (!user) {
                return message.reply('❌ User not found! Please provide a valid mention, ID, or tag.').catch(() => {});
            }

            // Get the avatar URL
            const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });

            // Send formatted avatar message
            await message.channel.send({
                content: [
                    '```css',
                    '╔══════ ✦ User Avatar ✦ ═══════╗',
                    `║    User: ${user.tag.padEnd(20)} ║`,
                    '║                               ║',
                    `╚════ Requested by ${message.author.username} ═══╝`,
                    '```',
                    `🔗 [Click Here](${avatarUrl}) to view the avatar!`,
                ].join('\n')
            }).catch(() => {});
        } catch (error) {
            console.error('Error in avatar command:', error);
            await message.channel.send('❌ Failed to fetch avatar. Please try again later.').catch(() => {});
        }
    },
};