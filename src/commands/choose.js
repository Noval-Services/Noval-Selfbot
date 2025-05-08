module.exports = {
    name: 'choose',
    description: 'Randomly choose one option. Usage: choose <option1> | <option2> | ...',
    category: 'FUN',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        const joined = args.join(' ');
        const options = joined.split('|').map(s => s.trim()).filter(Boolean);
        if (options.length < 2) {
            return message.channel.send('❌ Usage: choose <option1> | <option2> | ...');
        }
        const pick = options[Math.floor(Math.random() * options.length)];
        await message.channel.send([
            '```md',
            `Options: ${options.join(', ')}`,
            `Chosen: **${pick}**`,
            '```'
        ].join('\n'));
    },
};
