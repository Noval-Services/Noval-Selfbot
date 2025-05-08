const axios = require('axios');

module.exports = {
    name: 'define',
    description: 'Get the English definition of a word. Usage: define <word>',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        if (!args.length) {
            return message.channel.send('❌ Usage: define <word>');
        }
        const word = args[0];
        try {
            const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            const data = res.data[0];
            const phonetic = data.phonetic ? `/${data.phonetic}/` : '';
            let output = [
                '```md',
                `# ${data.word} ${phonetic}`,
                ''
            ];
            data.meanings.forEach(m => {
                output.push(`*${m.partOfSpeech}*`);
                m.definitions.slice(0, 2).forEach((def, i) => {
                    output.push(`  ${i + 1}. ${def.definition}`);
                    if (def.example) output.push(`     _e.g._ ${def.example}`);
                });
                output.push('');
            });
            output.push('```');
            await message.channel.send(output.join('\n'));
        } catch (error) {
            await message.channel.send('❌ No definition found.');
        }
    },
};
