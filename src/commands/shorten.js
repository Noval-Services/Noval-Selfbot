const axios = require('axios');

module.exports = {
    name: 'shorten',
    description: 'Shorten a URL using TinyURL. Usage: shorten <url>',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        if (!args[0] || !/^https?:\/\//.test(args[0])) {
            return message.channel.send([
                '```diff',
                '- Usage: shorten <url>',
                '- Example: shorten https://example.com',
                '```'
            ].join('\n'));
        }
        try {
            const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(args[0])}`);
            await message.channel.send([
                '```ini',
                '[🔗 Shortened URL]',
                `Original = ${args[0]}`,
                `TinyURL  = ${res.data}`,
                '```'
            ].join('\n'));
        } catch (error) {
            await message.channel.send([
                '```diff',
                '- ❌ Failed to shorten URL.',
                `- ${error.message || 'Unknown error'}`,
                '```'
            ].join('\n'));
        }
    },
};
