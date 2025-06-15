const moment = require('moment');

module.exports = {
    name: 'userinfo',
    description: 'Display information about a user.',
    category: 'INFO',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;

        let user = message.author;
        if (args[0]) {
            const mention = message.mentions.users.first();
            const byId = client.users.cache.get(args[0].replace(/[<@!>&]/g, ''));
            const byTag = client.users.cache.find(u => u.tag.toLowerCase() === args[0].toLowerCase());
            user = mention || byId || byTag || user;
        }
        if (!user) {
            return message.reply('❌ User not found! Please provide a valid mention, ID, or tag.').catch(() => {});
        }

        const createdAt = moment(user.createdAt).format('YYYY-MM-DD HH:mm:ss');
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 4096 });

        await message.channel.send({
            content: [
                '```fix',
                `User Info for ${user.tag}`,
                '```',
                `**ID:** ${user.id}`,
                `**Username:** ${user.username}`,
                `**Discriminator:** #${user.discriminator}`,
                `**Created At:** ${createdAt}`,
                `**Bot:** ${user.bot ? 'Yes' : 'No'}`,
                `**Avatar:** [Click Here](${avatarUrl})`
            ].join('\n')
        }).catch(() => {});
    },
};
