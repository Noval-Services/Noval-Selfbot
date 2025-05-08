module.exports = {
    name: 'search',
    description: 'Search anything on Google.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        try {
            if (!args.length) {
                return message.channel.send(
                  '```md\n❌ Error\n════════════════════\nPlease provide a search query!\nExample: ' + (process.env.PREFIX || 'i?') + 'search discord bot\n```'
                ).catch(() => {});
            }
            // Add YouTube search shortcut
            if (args[0].toLowerCase() === "youtube" && args.length > 1) {
                const ytQuery = encodeURIComponent(args.slice(1).join(' '));
                const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;
                await new Promise(resolve => setTimeout(resolve, 100));
                return message.channel.send(
                  '```md\n▶️ YouTube Search\n════════════════════\n**Query**: ' + args.slice(1).join(' ') + '\n**Link**: ' + ytUrl + '\n```'
                ).catch(() => {});
            }
            // Default: Google search
            const query = args.join(' ');
            const encodedQuery = encodeURIComponent(query);
            const url = `https://www.google.com/search?q=${encodedQuery}`;
            await new Promise(resolve => setTimeout(resolve, 100));
            await message.channel.send(
              '```md\n🔎 Google Search\n════════════════════\n**Query**: ' + query + '\n**Link**: ' + url + '\n```'
            ).catch(() => {});
        } catch (error) {
            const FormatUtil = require('../utils/FormatUtil');
            console.error('Error in search command:', error);
            await message.channel.send(
              FormatUtil.error('Failed to execute search.', error.message)
            ).catch(() => {});
        }
    },
};