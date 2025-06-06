module.exports = {
    name: 'kick',
    description: 'Kick a member from the server.',
    async execute(client, message, args) {
        if (!message.guild || message.author.id !== client.user.id) return;
        if (!message.member.permissions.has('KICK_MEMBERS')) {
            return message.reply('⛔ You do not have permission to kick members.').catch(() => {});
        }
        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!member) {
            return message.reply('❌ Please mention a member or provide their ID to kick.').catch(() => {});
        }
        if (!member.kickable) {
            return message.reply('❌ Cannot kick this member. They may have higher permissions or be the server owner.').catch(() => {});
        }
        try {
            await member.kick(args.slice(1).join(' ') || undefined);
            await message.react('✅').catch(() => {});
            await message.channel.send(`${member.user.tag} has been kicked.`).catch(() => {});
        } catch (error) {
            console.error(error);
            await message.channel.send('❌ There was an error kicking this member.').catch(() => {});
        }
    },
};
