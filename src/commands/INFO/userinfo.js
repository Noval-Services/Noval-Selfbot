// commands/userinfo.js (Enhanced TEXT-BASED OUTPUT - Corrected Permissions Import)

const Discord = require('discord.js-selfbot-v13'); // Require the main library object
const { PermissionsBitField } = Discord; // Try accessing PermissionsBitField from the main object

// Helper for formatting user flags
const UserFlags = {
    DISCORD_EMPLOYEE: 'Discord Employee 👨‍💼',
    PARTNERED_SERVER_OWNER: 'Partnered Server Owner <:discordpartner:1234567890>', // Replace emoji ID
    HYPESQUAD_EVENTS: 'HypeSquad Events Coordinator 🎉',
    BUG_HUNTER_LEVEL_1: 'Bug Hunter Level 1 🐛',
    HOUSE_BRAVERY: 'HypeSquad Bravery ❤️',
    HOUSE_BRILLIANCE: 'HypeSquad Brilliance 💡',
    HOUSE_BALANCE: 'HypeSquad Balance <:discordbalance:1234567890>', // Replace emoji ID
    EARLY_SUPPORTER: 'Early Supporter <:earlysupporter:1234567890>', // Replace emoji ID
    TEAM_USER: 'Team User',
    BUG_HUNTER_LEVEL_2: 'Bug Hunter Level 2 🦋',
    VERIFIED_BOT: 'Verified Bot ☑️',
    EARLY_VERIFIED_BOT_DEVELOPER: 'Early Verified Bot Developer <:verifieddev:1234567890>', // Replace emoji ID
    DISCORD_CERTIFIED_MODERATOR: 'Certified Moderator <:discordmod:1234567890>', // Replace emoji ID
    BOT_HTTP_INTERACTIONS: 'Bot uses Interactions',
    ACTIVE_DEVELOPER: 'Active Developer <:activedeveloper:1234567890>', // Replace emoji ID
    // Add any newer flags by their string key if needed
};

// Helper function to ensure non-empty strings
function ensureNonEmpty(str, placeholder = '-') {
    return (str && String(str).trim() !== '') ? String(str) : placeholder;
}

module.exports = {
    name: 'userinfo',
    description: 'Displays detailed information about you or a specified user as text.',
    aliases: ['ui', 'whois', 'user'],
    category: 'INFO', // For categorization in help command

    async execute(client, message, args) {
        const log = client.log || console.log; // Use logger attached in index.js or fallback

        // Simple text-based error reply function
        const sendErrorReply = async (errorText) => {
            try { await message.reply({ content: `❌ ${errorText}`, allowedMentions: { repliedUser: false } }); }
            catch (replyErr) { log(`[UserInfo] Failed to send error reply: ${replyErr.message}`, "WARN"); }
        };

        try {
            // --- Determine Target User ---
            let targetUser;
            if (args.length > 0) {
                const mention = message.mentions.users.first(); const userIdMatch = args[0].match(/^(\d{17,19})$/);
                if (mention) { targetUser = mention; }
                else if (userIdMatch) { const userId = userIdMatch[1]; targetUser = await client.users.fetch(userId).catch(() => null); if (!targetUser) { await sendErrorReply(`User ID \`${userId}\` not found.`); return; } }
                else { await sendErrorReply(`Invalid user format. Use @mention or User ID.`); return; }
            } else { targetUser = message.author; }
            if (!targetUser) { await sendErrorReply('Failed to identify target user.'); return; }

            // --- Force fetch for latest data ---
            let fetchedTargetUser = null;
            try { fetchedTargetUser = await targetUser.fetch(true); if (!fetchedTargetUser) { fetchedTargetUser = targetUser; } }
            catch (fetchErr) { log(`[UserInfo] Force-fetch failed. Falling back. Err: ${fetchErr.message}`, "WARN"); fetchedTargetUser = targetUser; }
            if (!fetchedTargetUser) { await sendErrorReply('Failed to retrieve user data object.'); return; }

            // --- Fetch Member Object (if in a guild) ---
            let targetMember = null;
            if (message.guild) { targetMember = await message.guild.members.fetch(fetchedTargetUser.id).catch(() => null); }

            // --- Build Text Output ---
            log(`[UserInfo] Building text output for ${fetchedTargetUser.tag}`, 'INFO');
            let outputLines = [];
            outputLines.push(`**User Information for ${fetchedTargetUser.tag}**`);
            outputLines.push(`━━━━━━━━━━━━━━━━━━━━━━`);
            outputLines.push(`**ID:** \`${fetchedTargetUser.id}\``);
            outputLines.push(`**Tag:** \`${fetchedTargetUser.tag}\``);
            outputLines.push(`**Avatar:** ${fetchedTargetUser.displayAvatarURL({ dynamic: true, size: 1024 })}`);
            outputLines.push(`**Account Created:** <t:${Math.floor(fetchedTargetUser.createdTimestamp / 1000)}:F> (<t:${Math.floor(fetchedTargetUser.createdTimestamp / 1000)}:R>)`);
            outputLines.push(`**Bot Account:** ${fetchedTargetUser.bot ? 'Yes' : 'No'}`);

            if (fetchedTargetUser.accentColor) {
                outputLines.push(`**Accent Color:** \`#${fetchedTargetUser.accentColor.toString(16).padStart(6, '0')}\``);
            }
             if (fetchedTargetUser.banner) {
                 outputLines.push(`**Profile Banner:** Yes (Suggests Nitro) - ${fetchedTargetUser.bannerURL({ dynamic: true, size: 1024 })}`);
             } else {
                 outputLines.push(`**Profile Banner:** No`);
             }

            const flags = fetchedTargetUser.flags?.toArray() || [];
            if (flags.length > 0) {
                const flagDescriptions = flags.map(flag => UserFlags[flag] || flag).join(', ');
                outputLines.push(`**Flags:** ${flagDescriptions}`);
            } else {
                 outputLines.push(`**Flags:** None`);
            }


            // Server Specific Info
            if (message.guild) {
                 outputLines.push(`\n**Server Info (${message.guild.name})**`);
                 outputLines.push(`──────────────────────`);
                 if (targetMember) {
                     outputLines.push(`**Joined Server:** <t:${Math.floor(targetMember.joinedTimestamp / 1000)}:F> (<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>)`);
                     if (targetMember.nickname && targetMember.nickname !== fetchedTargetUser.username) {
                         outputLines.push(`**Nickname:** ${targetMember.nickname}`);
                     }

                      if (targetMember.premiumSinceTimestamp) {
                          outputLines.push(`**Boosting Since:** <t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:F> (<t:${Math.floor(targetMember.premiumSinceTimestamp / 1000)}:R>)`);
                      } else {
                          outputLines.push(`**Boosting Server:** No`);
                      }

                     // --- Administrator Status --- Using Corrected Permissions Check ---
                     let isAdmin = false; // Default to false
                     if (PermissionsBitField && PermissionsBitField.Flags) { // Check if Flags exists
                         isAdmin = targetMember.permissions?.has(PermissionsBitField.Flags.ADMINISTRATOR) || false;
                     } else {
                         // Fallback to string check if PermissionsBitField or Flags is missing
                         log("[UserInfo] Warning: PermissionsBitField.Flags not found, using string 'ADMINISTRATOR'.", "WARN");
                         isAdmin = targetMember.permissions?.has('ADMINISTRATOR') || false;
                     }
                     outputLines.push(`**Administrator:** ${isAdmin ? 'Yes' : 'No'}`);
                     // --- End Administrator Status ---

                     const isPending = targetMember.pending || false;
                     outputLines.push(`**Pending Member:** ${isPending ? 'Yes' : 'No'}`);


                     const highestRole = targetMember.roles?.highest;
                     outputLines.push(`**Highest Role:** ${highestRole ? highestRole.toString() : 'None'}`);

                     const roles = targetMember.roles?.cache
                         ?.filter(role => role.id !== message.guild.id)
                         ?.sort((a, b) => b.position - a.position)
                         ?.map(role => role.name) || [];

                     let roleString = roles.length > 0 ? roles.join(', ') : 'None';
                     if (roleString.length > 1500) { roleString = roleString.substring(0, 1500) + '...'; }
                     outputLines.push(`**Roles (${roles.length}):** ${roleString}`);

                 } else {
                      outputLines.push(`*User not currently in this server.*`);
                 }
            } else {
                 outputLines.push(`\n*(Command used in DMs, no server-specific info)*`);
            }

            const replyText = outputLines.join('\n');

             if (replyText.length >= 2000) {
                await sendErrorReply('Generated user info is too long to display.');
                return;
             }

            // --- Send Plain Text Reply ---
            await message.reply({
                content: replyText,
                allowedMentions: { parse: [] } // Disable all pings
            });

            // --- Delete original command ---
            try { await message.delete(); }
            catch (deleteError) { log(`[UserInfo] Could not delete original command: ${deleteError.message}`, 'WARN'); }

        } catch (error) {
            log(`[UserInfo] !! UNCAUGHT ERROR in execute block: ${error.message}`, "ERROR");
            console.error('[UserInfo] Full error stack trace:', error);
            // Check if error is the specific permissions one, otherwise generic message
            if (error instanceof TypeError && error.message.includes("reading 'Flags'")) {
                 await sendErrorReply(`Permission checking failed. Library structure might be unexpected.`);
            } else {
                 await sendErrorReply(`An error occurred: ${error.message.substring(0, 200)}`);
            }
        }
    },
};