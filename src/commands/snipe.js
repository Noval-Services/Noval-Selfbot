// commands/snipe.js

// --- Snipe cache event setup (safe to call multiple times) ---
function setupSnipeCache(client) {
    if (!client.snipesCache) client.snipesCache = {};
    if (client._snipeEventSetup) return; // Prevent duplicate listeners
    client._snipeEventSetup = true;

    client.on('messageDelete', (message) => {
        if (!message.channel || !message.channel.id) return;
        const snipeData = {
            content: message.content || '',
            author: message.author ? message.author.tag : 'Unknown',
            authorId: message.author ? message.author.id : 'N/A',
            timestamp: Date.now(),
            channelName: message.channel.name || null,
            guildName: message.guild ? message.guild.name : null,
            attachments: message.attachments ? Array.from(message.attachments.values()).map(a => ({ url: a.url })) : [],
            embeds: message.embeds ? message.embeds.map(e => ({ title: e.title, description: e.description })) : []
        };
        if (!client.snipesCache[message.channel.id]) client.snipesCache[message.channel.id] = [];
        client.snipesCache[message.channel.id].unshift(snipeData);
        if (client.snipesCache[message.channel.id].length > 5) client.snipesCache[message.channel.id].length = 5;
    });
}

module.exports = {
    name: 'snipe',
    description: 'Shows the most recently deleted message in the channel (from cache).',
    category: 'UTILITY',
    hidden: false,
    aliases: ['s'],
    cooldown: 3,

    async execute(client, message, args) {
        // --- Ensure snipe cache event is set up ---
        setupSnipeCache(client);

        // --- Permission Check ---
        if (message.author.id !== client.user.id) return;

        try {
            // --- Access Snipe Cache ---
            if (!client.snipesCache) {
                console.error("[Snipe Command Error] client.snipesCache is undefined. Check index.js 'ready' event.");
                return message.reply({
                    content: "❌ **Error:** Snipe cache is not initialized.",
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            }

            let snipesArr = client.snipesCache[message.channel.id];
            if (!snipesArr) {
                return message.reply({
                    content: "❓ No recently deleted messages found in cache for this channel.",
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            }
            if (!Array.isArray(snipesArr)) snipesArr = [snipesArr];

            // Parse which snipe to show (default: 1st)
            let index = 0;
            if (args[0] && !isNaN(args[0])) {
                index = Math.max(0, Math.min(snipesArr.length - 1, parseInt(args[0], 10) - 1));
            }
            const sniped = snipesArr[index];
            if (!sniped || (!sniped.content && (!sniped.attachments || sniped.attachments.length === 0) && (!sniped.embeds || sniped.embeds.length === 0))) {
                return message.reply({
                    content: "❓ No valid deleted message found at that index.",
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            }

            // --- Extract data ---
            const {
                content = '',
                author = 'Unknown',
                authorId = 'N/A',
                timestamp,
                channelName,
                guildName,
                attachments = [],
                embeds = [],
                authorAvatar
            } = sniped;

            // --- Format timestamp ---
            let timestampSeconds = timestamp ? Math.floor(timestamp / 1000) : null;
            let relativeTimestamp = timestampSeconds ? `<t:${timestampSeconds}:R>` : 'Unknown';
            let fullTimestamp = timestampSeconds ? `<t:${timestampSeconds}:F>` : 'Unknown';

            // --- Format attachments ---
            let attachmentText = '';
            if (attachments && attachments.length > 0) {
                attachmentText = attachments.map((a, i) =>
                    `🔗 [Attachment ${i + 1}](${a.url || a})`
                ).join('\n');
            }

            // --- Format embeds (basic info) ---
            let embedText = '';
            if (embeds && embeds.length > 0) {
                embedText = embeds.map((e, i) =>
                    `🖼️ Embed ${i + 1}: ${e.title || e.description || '[No preview]'}`
                ).join('\n');
            }

            // --- Author avatar (if available) ---
            let avatarUrl = authorAvatar || (sniped.authorAvatarURL || null);
            let avatarLine = avatarUrl ? `![avatar](${avatarUrl})` : '';

            // --- Compose output (limit content length) ---
            let contentPreview = content ? (content.length > 1500 ? content.slice(0, 1500) + '... [truncated]' : content) : '[No text content]';

            let outputContent = `
\`\`\`fix
🕵️ Snipe #${index + 1} / ${snipesArr.length} in #${channelName || message.channel.name || 'Unknown'}
\`\`\`
\`\`\`ini
[ Guild    ] ${guildName || (message.guild ? message.guild.name : 'Direct Message')}
[ Channel  ] #${channelName || message.channel.name || 'Unknown Channel'}
[ Author   ] ${author} (${authorId})
[ Deleted  ] ${fullTimestamp} (${relativeTimestamp})
\`\`\`
${avatarLine}
\`\`\`diff
- Content:
${contentPreview}
\`\`\`
${attachmentText ? `📎 **Attachments:**\n${attachmentText}` : ''}
${embedText ? `🖼️ **Embeds:**\n${embedText}` : ''}
            `.trim();

            await message.reply({
                content: outputContent,
                allowedMentions: { repliedUser: false }
            }).catch(async err => {
                console.error("Failed to reply with snipe message:", err);
                await message.channel.send({
                    content: outputContent,
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            });

        } catch (error) {
            console.error('Error occurred during the snipe command execution:', error);
            try {
                await message.reply({
                    content: `❌ An unexpected error occurred: ${error.message}`,
                    allowedMentions: { repliedUser: false }
                }).catch(() => {});
            } catch { /* Ignore fallback error */ }
        }
    },
};
