module.exports = {
    name: 'search',
    description: 'Search anything on Google.',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        try {
            if (!args.length) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please provide a search query!
Example: ${process.env.PREFIX || 'i?'}search discord bot
\`\`\`
                `).catch(() => {});
            }
            // Add YouTube search shortcut
            if (args[0].toLowerCase() === "youtube" && args.length > 1) {
                const ytQuery = encodeURIComponent(args.slice(1).join(' '));
                const ytUrl = `https://www.youtube.com/results?search_query=${ytQuery}`;
                await new Promise(resolve => setTimeout(resolve, 100));
                return message.channel.send(`
\`\`\`md
▶️ YouTube Search
════════════════════
**Query**: ${args.slice(1).join(' ')}
**Link**: ${ytUrl}
\`\`\`
                `).catch(() => {});
            }
            const query = args.join(' ');
            const encodedQuery = encodeURIComponent(query);
            const url = `https://www.google.com/search?q=${encodedQuery}`;
            await new Promise(resolve => setTimeout(resolve, 100));
            await message.channel.send(`
\`\`\`md
🔎 Google Search
════════════════════
**Query**: ${query}
**Link**: ${url}
\`\`\`
            `).catch(() => {});
        } catch (error) {
            console.error('Error in search command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to execute search. Please try again later.
Reason: ${error.message}
\`\`\`
            `).catch(() => {});
        }
    },
};