const fs = require('fs');
const path = require('path');

const THEMES = {
    DEFAULT: {
        title: ':📋Nova Commands List',
        divider: '---------------------------------------------------------',
        prefix: '  ',
        commandArrow: '    ↳ ',
        color: 'yaml',
        categoryEmojis: {
            AI: '🧠',
            FUN: '🎉',
            General: '🌐',
            INFO: 'ℹ️',
            UTILITY: '🛠️'
        }
    }
};

const ORDERED_CATEGORIES = [
    'AI',       // Page 1
    'FUN',      // Page 2
    'General',  // Page 3
    'INFO',     // Page 4
    'UTILITY'   // Page 5
];
const COMMANDS_PER_PAGE = 10;
const TOTAL_CATEGORY_PAGES = ORDERED_CATEGORIES.length;

module.exports = {
    name: 'help',
    description: 'Displays up to 10 commands for a category page or details for a specific command.',
    async execute(client, message, args) {
        if (!message?.channel) return;

        const prefix = process.env.PREFIX || '>';
        const theme = THEMES.DEFAULT;

        try {
            const allCommandsRaw = Array.from(client.commands.values())
                .filter(cmd => cmd.name && cmd.name !== 'help' && !cmd.hidden)
                .map(cmd => ({
                    name: cmd.name,
                    description: cmd.description || 'No description available',
                    category: cmd.category || 'General',
                    usage: cmd.usage || null,
                    aliases: cmd.aliases || []
                }));

            let targetCategoryName = ORDERED_CATEGORIES[0]; // Default to first category
            let pageNumberForDisplay = 1; // Default page number
            let displayMode = 'PAGED_CATEGORY'; // Default display mode

            if (args.length > 0) {
                const firstArg = args[0].toLowerCase();
                const potentialPageNum = parseInt(firstArg);

                console.log(`[HELP DEBUG] Input Arg: "${firstArg}", Parsed Page Number: ${potentialPageNum}`);

                if (!isNaN(potentialPageNum)) { // Argument is a number
                    console.log(`[HELP DEBUG] Argument interpreted as a number.`);
                    if (potentialPageNum >= 1 && potentialPageNum <= TOTAL_CATEGORY_PAGES) {
                        console.log(`[HELP DEBUG] Valid page number detected: ${potentialPageNum}. Target category: ${ORDERED_CATEGORIES[potentialPageNum - 1]}`);
                        targetCategoryName = ORDERED_CATEGORIES[potentialPageNum - 1];
                        pageNumberForDisplay = potentialPageNum;
                        displayMode = 'PAGED_CATEGORY';
                    } else {
                        console.log(`[HELP DEBUG] Page number ${potentialPageNum} is out of range (1-${TOTAL_CATEGORY_PAGES}).`);
                        await message.channel.send(`❌ Page \`${potentialPageNum}\` is out of range (1-${TOTAL_CATEGORY_PAGES}). Showing **${ORDERED_CATEGORIES[0]}** (Page 1).`);
                        displayMode = 'PAGED_CATEGORY';
                    }
                } else { // Argument is not a number, check for command
                    console.log(`[HELP DEBUG] Argument "${firstArg}" is not a number. Checking if it's a command.`);
                    const cmd = client.commands.get(firstArg) || client.commands.find(c => c.aliases && c.aliases.includes(firstArg));
                    if (cmd && !cmd.hidden) {
                        console.log(`[HELP DEBUG] Found command: ${cmd.name}. Displaying details.`);
                        displayMode = 'SPECIFIC_COMMAND';
                        const timestamp = new Date().toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                        });
                        let details = [
                            '```' + theme.color,
                            theme.title,
                            theme.divider,
                            `Command: ${prefix}${cmd.name}`,
                            `${theme.commandArrow}${cmd.description || 'No description available'}`,
                            cmd.aliases && cmd.aliases.length ? `Aliases: ${cmd.aliases.join(', ')}` : '',
                            `Category: ${cmd.category || 'General'} ${theme.categoryEmojis[cmd.category || 'General']}`,
                            `Usage: ${prefix}${cmd.name}${cmd.usage ? ` ${cmd.usage}` : ''}`,
                            theme.divider,
                            `Requested by: ${message.author.tag}`,
                            `Generated: ${timestamp}`,
                            '```'
                        ].filter(Boolean).join('\n');
                        await message.channel.send(details);
                        return;
                    } else {
                        console.log(`[HELP DEBUG] Argument "${firstArg}" is not a command. Showing default page.`);
                        await message.channel.send(`❌ Command or page \`${firstArg}\` not found. Showing **${ORDERED_CATEGORIES[0]}** (Page 1).`);
                        displayMode = 'PAGED_CATEGORY';
                    }
                }
            } else {
                console.log(`[HELP DEBUG] No arguments provided. Showing default page (Page 1: ${ORDERED_CATEGORIES[0]}).`);
            }

            if (displayMode === 'PAGED_CATEGORY') {
                console.log(`[HELP DEBUG] Displaying category: "${targetCategoryName}", Page: ${pageNumberForDisplay}`);

                const commandsForCategory = allCommandsRaw
                    .filter(cmd => (cmd.category || 'General').toLowerCase() === targetCategoryName.toLowerCase())
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .slice(0, COMMANDS_PER_PAGE); // Limit to 10 commands

                if (commandsForCategory.length === 0) {
                    console.log(`[HELP DEBUG] No commands found for category "${targetCategoryName}".`);
                    await message.channel.send(`No commands found for **${targetCategoryName}** (Page ${pageNumberForDisplay}).`);
                    return;
                }
                console.log(`[HELP DEBUG] Found ${commandsForCategory.length} commands for category "${targetCategoryName}".`);

                const timestamp = new Date().toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: 'numeric',
                    hour12: true
                });

                const helpLines = [
                    '```' + theme.color,
                    theme.title,
                    theme.divider,
                    `Prefix: ${prefix}`,
                    '',
                    `${theme.categoryEmojis[targetCategoryName]} ${targetCategoryName} Commands (Page ${pageNumberForDisplay}/${TOTAL_CATEGORY_PAGES}):`,
                    ''
                ];

                commandsForCategory.forEach(cmd => {
                    helpLines.push(
                        `${theme.prefix}${prefix}${cmd.name}`,
                        `${theme.commandArrow}${cmd.description}`
                    );
                });

                helpLines.push(
                    theme.divider,
                    `Requested by: ${message.author.tag}`,
                    `Generated: ${timestamp}`,
                    '```',
                    `💡 Use \`${prefix}help <command>\` for command details.`,
                    `💡 Use \`${prefix}help <1-${TOTAL_CATEGORY_PAGES}>\` to view other categories.`
                );

                await message.channel.send(helpLines.join('\n'));
            }

        } catch (error) {
            console.error('Error in help command:', error);
            const timestamp = new Date().toLocaleString('en-US', {
                hour: 'numeric',
                minute: 'numeric',
                hour12: true
            });
            const errorMessage = [
                '```diff',
                theme.title,
                theme.divider,
                '- ⚠️ Error: Failed to Generate Help Menu ⚠️',
                `+ Details: ${error.message}`,
                theme.divider,
                `Requested by: ${message.author.tag}`,
                `Generated: ${timestamp}`,
                '```'
            ].join('\n');
            try {
                await message.channel.send(errorMessage);
            } catch (sendError) {
                console.error('Error sending help command error message:', sendError);
            }
        }
    },
};