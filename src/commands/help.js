const fs = require('fs');
const path = require('path');

const THEMES = {
    DEFAULT: {
        title: '🌟 Nova Commands 🌟',
        border: '•―――――――――――――――――――――――――――•',
        prefix: '│',
        suffix: '│',
        categoryPrefix: '┌',
        categorySuffix: '┐',
        commandPrefix: '├',
        commandSuffix: '┤',
        footer: '•―――――――――――――――――――――――――――•',
        color: 'yaml'
    }
};

const formatCommand = (prefix, cmd, maxNameLength, theme) => {
    const paddedName = cmd.name.padEnd(maxNameLength);
    return `${theme.commandPrefix} ${prefix}${paddedName} │ ${cmd.description} ${theme.commandSuffix}`;
};

const ORDERED_CATEGORIES = [
    'AI',       // Page 1
    'FUN',      // Page 2
    'General',  // Page 3
    'INFO',     // Page 4
    'UTILITY'   // Page 5
];
const TOTAL_CATEGORY_PAGES = ORDERED_CATEGORIES.length;

module.exports = {
    name: 'help',
    description: 'Shows commands for a specific category page.',
    async execute(client, message, args) {
        if (!message?.channel) return;

        const prefix = process.env.PREFIX || 'i?';
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

            let targetCategoryName = ORDERED_CATEGORIES[0]; // Default to the first category
            let pageNumberForDisplay = 1; // Default page number
            let displayMode = 'PAGED_CATEGORY'; // Default display mode

            if (args.length > 0) {
                const firstArg = args[0].toLowerCase();
                const potentialPageNum = parseInt(firstArg);

                console.log(`[HELP DEBUG] Input Arg: "${firstArg}", Parsed Page Number: ${potentialPageNum}`);

                if (!isNaN(potentialPageNum)) { // Argument is a number
                    console.log(`[HELP DEBUG] Argument interpreted as a number.`);
                    if (potentialPageNum >= 1 && potentialPageNum <= TOTAL_CATEGORY_PAGES) {
                        console.log(`[HELP DEBUG] Valid page number detected: ${potentialPageNum}. Target categories: ${ORDERED_CATEGORIES[potentialPageNum - 1]}`);
                        targetCategoryName = ORDERED_CATEGORIES[potentialPageNum - 1];
                        pageNumberForDisplay = potentialPageNum;
                        displayMode = 'PAGED_CATEGORY';
                    } else {
                        console.log(`[HELP DEBUG] Page number ${potentialPageNum} is out of range (1-${TOTAL_CATEGORY_PAGES}).`);
                        await message.channel.send(`❌ Page number \`${potentialPageNum}\` is out of range (1-${TOTAL_CATEGORY_PAGES}). Showing default page (Page 1: ${ORDERED_CATEGORIES[0]}).`);
                        // Keep default targetCategoryName (ORDERED_CATEGORIES[0]) and pageNumberForDisplay (1)
                        displayMode = 'PAGED_CATEGORY'; // Still show default page
                    }
                } else { // Argument is NOT a number, treat as a potential command name
                    console.log(`[HELP DEBUG] Argument "${firstArg}" is NOT a number. Checking if it's a command.`);
                    const cmd = client.commands.get(firstArg) || client.commands.find(c => c.aliases && c.aliases.includes(firstArg));
                    if (cmd && !cmd.hidden) {
                        console.log(`[HELP DEBUG] Found specific command: ${cmd.name}. Displaying its details.`);
                        displayMode = 'SPECIFIC_COMMAND';
                        let details = [
                            '```' + theme.color,
                            `Command: ${prefix}${cmd.name}`,
                            cmd.aliases && cmd.aliases.length ? `Aliases: ${cmd.aliases.join(', ')}` : '',
                            `Description: ${cmd.description || 'No description available'}`,
                            `Category: ${cmd.category || 'General'}`,
                            cmd.usage ? `Usage: ${prefix}${cmd.name} ${cmd.usage}` : `Usage: ${prefix}${cmd.name}`,
                            '```'
                        ].filter(Boolean).join('\n');
                        await message.channel.send(details);
                        return; // Exit after showing specific command help
                    } else {
                        console.log(`[HELP DEBUG] Argument "${firstArg}" is not a recognized command. Showing default page.`);
                        await message.channel.send(`❌ Command or Category Page \`${firstArg}\` not found. Showing default help page (Page 1: ${ORDERED_CATEGORIES[0]}).`);
                        // Keep default targetCategoryName (ORDERED_CATEGORIES[0]) and pageNumberForDisplay (1)
                        displayMode = 'PAGED_CATEGORY'; // Still show default page
                    }
                }
            } else { // No arguments provided
                console.log(`[HELP DEBUG] No arguments provided. Showing default page (Page 1: ${ORDERED_CATEGORIES[0]}).`);
                // Defaults for targetCategoryName, pageNumberForDisplay, and displayMode are already set for this case
            }


            if (displayMode === 'PAGED_CATEGORY') {
                console.log(`[HELP DEBUG] Proceeding to display paged category. Target: "${targetCategoryName}", Page: ${pageNumberForDisplay}`);

                const commandsForCategory = allCommandsRaw
                    .filter(cmd => (cmd.category || 'General').toLowerCase() === targetCategoryName.toLowerCase())
                    .sort((a, b) => a.name.localeCompare(b.name));

                if (commandsForCategory.length === 0) {
                    console.log(`[HELP DEBUG] No commands found for category "${targetCategoryName}".`);
                    await message.channel.send(`No commands found for category: **${targetCategoryName}** (Page ${pageNumberForDisplay}).`);
                    return;
                }
                console.log(`[HELP DEBUG] Found ${commandsForCategory.length} commands for category "${targetCategoryName}".`);

                const maxNameLength = Math.max(...commandsForCategory.map(cmd => cmd.name.length), 0) + 2;

                const helpLines = [
                    '```' + theme.color,
                    theme.border,
                    `${theme.prefix} ${theme.title} (Page ${pageNumberForDisplay}/${TOTAL_CATEGORY_PAGES}) ${theme.suffix}`,
                    theme.border,
                ];

                const categoryTitle = `${theme.categoryPrefix}── ${targetCategoryName} `;
                const lineLength = Math.max(0, (maxNameLength + 20 + theme.prefix.length + theme.suffix.length + 4) - categoryTitle.length - theme.categorySuffix.length);
                helpLines.push(
                    `${categoryTitle}${'─'.repeat(lineLength)}${theme.categorySuffix}`
                );

                commandsForCategory.forEach(cmd => {
                    helpLines.push(formatCommand(prefix, cmd, maxNameLength, theme));
                });

                helpLines.push(theme.border);

                // const timestamp = new Date().toLocaleString(); // Optional
                helpLines.push(
                    theme.footer,
                    '```',
                    `💡 Type \`${prefix}help <command>\` for specific command info.`,
                    `💡 Type \`${prefix}help <1-${TOTAL_CATEGORY_PAGES}>\` to view a category page.`
                );

                await message.channel.send(helpLines.join('\n'));
            }

        } catch (error)
        {
            console.error('Error in help command:', error);
            const errorMessage = [
                '```diff',
                '- ⚠️ Error: Failed to Generate Help Menu ⚠️ -',
                `+ Details: ${error.message}`,
                '+ Please check the console for more information. +',
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