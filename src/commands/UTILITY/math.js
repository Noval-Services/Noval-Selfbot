module.exports = {
    name: 'math',
    description: 'Evaluate a math expression. Usage: math <expression>',
    category: 'UTILITY',
    hidden: false,
    async execute(client, message, args) {
        if (!message?.channel || message.author.id !== client.user.id) return;
        if (!args.length) {
            return message.channel.send('❌ Usage: math <expression>');
        }
        const expr = args.join(' ');
        try {
            // Chỉ cho phép các ký tự toán học cơ bản để tránh nguy hiểm
            if (!/^[\d\s+\-*/().%^]+$/.test(expr)) {
                return message.channel.send('❌ Invalid characters in expression!');
            }
            // eslint-disable-next-line no-eval
            const result = eval(expr);
            await message.channel.send([
                '```ini',
                `[🧮 Math Result]`,
                `Expression = ${expr}`,
                `Result    = ${result}`,
                '```'
            ].join('\n'));
        } catch (error) {
            await message.channel.send('❌ Failed to evaluate expression.');
        }
    },
};
