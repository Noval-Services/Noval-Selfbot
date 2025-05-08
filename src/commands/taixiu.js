module.exports = {
    name: 'taixiu',
    description: 'Play a game of Tài Xỉu (Over/Under) with dice.',
    category: 'FUN',
    hidden: false,
    async execute(client, message, args) {
        // Restrict to token owner (self-bot user) and valid channel
        if (!message?.channel || message.author.id !== client.user.id) return;

        try {
            // Chuẩn hóa lựa chọn đầu vào
            const input = (args[0] || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const validChoices = { 'tai': 'tài', 'xiu': 'xỉu' };
            let choice = '';
            if (input === 'tai' || input === 'tai') choice = 'tài';
            else if (input === 'xiu' || input === 'xiu') choice = 'xỉu';

            if (!choice) {
                return message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Please choose **tài** or **xỉu**!
Example: ${process.env.PREFIX || 'i?'}taixiu tài
\`\`\`
                `).then(m => setTimeout(() => m.deletable && m.delete().catch(() => {}), 3000));
            }

            // Roll three dice
            const dice = Array.from({ length: 3 }, () => Math.floor(Math.random() * 6) + 1);
            const total = dice.reduce((a, b) => a + b, 0);
            const result = total >= 11 ? 'tài' : 'xỉu';
            const outcome = (choice === result) ? '✅ You won!' : '❌ You lost!';

            // Add slight delay to avoid rate limits
            await new Promise(r => setTimeout(r, 100));

            // Send formatted response
            await message.channel.send(`
\`\`\`md
🎲 Tài Xỉu Result
════════════════════
**Dice**: [ ${dice.join(' + ')} ] = ${total}
**Result**: ${result.toUpperCase()}
**Your Choice**: ${choice.toUpperCase()}
**Outcome**: ${outcome}
\`\`\`
            `)
        } catch (error) {
            console.error('Error in taixiu command:', error);
            await message.channel.send(`
\`\`\`md
❌ Error
════════════════════
Failed to execute Tài Xỉu. Please try again later.
Reason: ${error.message}
\`\`\`
            `)
        }
    },
};