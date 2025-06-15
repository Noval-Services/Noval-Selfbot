const fs = require('fs').promises;
const path = require('path');
const { WebhookClient, EmbedBuilder } = require('discord.js');

// Store the bot's startup timestamp
const startupTimestamp = Date.now();

const WEBHOOK_URL = 'https://discord.com/api/webhook/1370403747871719505/B6ghI_j43FG47hDt7MlOQ39u1JeiRADzz0-GUJw261otSYTZ3RBQpYktUZa1utgRsqIu';
const CONFIG_FILE = path.join(__dirname, '..', 'data', 'tracking.json');

async function loadConfig() {
    try {
        const data = await fs.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data).targetServerId || null;
    } catch (error) {
        return null; // File doesn't exist or is invalid
    }
}

module.exports = {
    name: 'messageDelete',
    async execute(client, message) {
        if (!message.guild || !message.content || message.author?.bot) return;

        const targetServerId = await loadConfig();
        if (!targetServerId || message.guild.id !== targetServerId) return;

        // Only track messages sent after the bot started
        if (message.createdTimestamp < startupTimestamp) {
            console.log(`[ServerTracking] Ignored deleted message from ${message.author.tag} in ${message.guild.name}#${message.channel.name} (Message sent before bot startup)`);
            return;
        }

        try {
            const webhookClient = new WebhookClient({ url: WEBHOOK_URL });

            const embed = new EmbedBuilder()
                .setTitle('🗑️ Message Delete')
                .setColor('#FF5555')
                .addFields(
                    { name: 'Server', value: `${message.guild.name} (${message.guild.id})`, inline: true },
                    { name: 'Message', value: message.content.length > 1000 ? `${message.content.substring(0, 1000)}...` : message.content || 'No text content' },
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Time', value: new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) }
                )
                .setTimestamp();

            if (message.attachments.size > 0) {
                const attachmentUrls = message.attachments.map(attachment => attachment.url).join('\n');
                embed.addFields({ name: 'Attachments', value: attachmentUrls || 'None' });
            }

            await webhookClient.send({ embeds: [embed] });
            console.log(`[ServerTracking] Logged deleted message from ${message.author.tag} in ${message.guild.name}#${message.channel.name}`);
        } catch (error) {
            console.error('[ServerTracking] Error sending webhook:', error);
        }
    }
};