const Discord = require('discord.js-selfbot-v13');
const { EmbedBuilder } = Discord;
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const CONFIG = require('../../../lib/rpc/constants');

/**
 * Utility Classes
 */
class DateTimeUtil {
    static getCurrentTimestamp() {
        return new Date().toISOString()
            .replace('T', ' ')
            .replace(/\.\d+Z$/, '');
    }

    static formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    static parseTime(timeStr) {
        if (timeStr.toLowerCase() === 'now') return Date.now();
        
        const match = timeStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
        if (!match) return null;
        
        const [, hours, minutes, seconds] = match.map(Number);
        if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
            return Date.now() - (hours * 3600 + minutes * 60 + seconds) * 1000;
        }
        return null;
    }
}

class FormatUtil {
    static box(title, content, type = 'info') {
        const colors = {
            success: '[2;32m', // Green
            error: '[2;31m',   // Red
            info: '[2;36m',    // Cyan
            warning: '[2;33m'  // Yellow
        };
        
        const color = colors[type] || colors.info;
        const border = '═'.repeat(50);
        const timestamp = DateTimeUtil.getCurrentTimestamp();
        
        return `\`\`\`ansi
${color}${border}
${title}
${border}
${content}
${border}
[Time: ${timestamp}]
\`\`\``;
    }

    static error(message, details = '') {
        return this.box(
            '[ Error ]',
            `${message}${details ? `\n\nDetails: ${details}` : ''}`,
            'error'
        );
    }

    static success(message) {
        return this.box('[ Success ]', message, 'success');
    }

    static info(message) {
        return this.box('[ Info ]', message, 'info');
    }

    static warning(message) {
        return this.box('[ Warning ]', message, 'warning');
    }
}

/**
 * Storage System
 */
class StorageManager {
    static async ensureDirectories() {
        for (const dir of Object.values(CONFIG.STORAGE)) {
            if (typeof dir === 'string' && dir.endsWith('.json')) {
                await fs.mkdir(path.dirname(dir), { recursive: true });
            }
        }
    }

    static async readJson(filePath, defaultValue = null) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') return defaultValue;
            throw error;
        }
    }

    static async writeJson(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
}

/**
 * Image Management System
 */
class ImageManager {
    constructor() {
        this.cache = new Map();
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        await StorageManager.ensureDirectories();
        const data = await StorageManager.readJson(CONFIG.STORAGE.IMAGES_FILE, {});
        this.cache = new Map(Object.entries(data));
        this.initialized = true;
    }

    async save() {
        await StorageManager.writeJson(
            CONFIG.STORAGE.IMAGES_FILE,
            Object.fromEntries(this.cache)
        );
    }

    generateHash(url) {
        return crypto.createHash('md5').update(url).digest('hex').substring(0, 8);
    }

    processDiscordCDN(url) {
        const urlObj = new URL(url);
        const baseUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        
        if (CONFIG.IMAGE_PATTERNS.DISCORD_CDN.ATTACHMENT.test(url)) {
            const params = new URLSearchParams(urlObj.search);
            const essentialParams = ['ex', 'is', 'hm'].filter(p => params.has(p));
            if (essentialParams.length > 0) {
                const filteredParams = new URLSearchParams();
                essentialParams.forEach(p => filteredParams.append(p, params.get(p)));
                return `${baseUrl}?${filteredParams.toString()}`;
            }
        }
        
        return baseUrl;
    }

    validateImageSource(source) {
        if (!source) return { valid: false, reason: 'Empty source' };

        // Handle Discord emoji format
        const emojiMatch = source.match(CONFIG.IMAGE_PATTERNS.EMOJI_FORMAT);
        if (emojiMatch) {
            const [, animated, name, id] = emojiMatch;
            return {
                valid: true,
                type: 'emoji',
                url: `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`,
                metadata: { name, id, animated: !!animated }
            };
        }

        try {
            const url = new URL(source);
            
            if (url.hostname.includes('discord')) {
                const processedUrl = this.processDiscordCDN(source);
                return {
                    valid: true,
                    type: 'discord_cdn',
                    url: processedUrl,
                    metadata: { original: source }
                };
            }

            if (CONFIG.IMAGE_PATTERNS.BASIC_URL.test(source)) {
                return {
                    valid: true,
                    type: 'url',
                    url: source,
                    metadata: { format: source.split('.').pop().toLowerCase() }
                };
            }
        } catch (error) {
            return { valid: false, reason: 'Invalid URL format' };
        }

        return { valid: false, reason: 'Unsupported image format' };
    }

    async addImage(name, source, type = 'both') {
        await this.init();
        
        const validation = this.validateImageSource(source);
        if (!validation.valid) {
            throw new Error(`Invalid image source: ${validation.reason}`);
        }

        const imageData = {
            url: validation.url,
            type,
            source: validation.type,
            metadata: validation.metadata,
            hash: this.generateHash(validation.url),
            addedAt: DateTimeUtil.getCurrentTimestamp(),
            addedBy: CONFIG.USER.NAME
        };

        this.cache.set(name.toLowerCase(), imageData);
        await this.save();
        return imageData;
    }

    async getImage(name) {
        await this.init();
        return this.cache.get(name.toLowerCase());
    }

    async listImages() {
        await this.init();
        return Array.from(this.cache.entries()).map(([name, data]) => ({
            name,
            ...data
        }));
    }

    async removeImage(name) {
        await this.init();
        const deleted = this.cache.delete(name.toLowerCase());
        if (deleted) await this.save();
        return deleted;
    }
}

/**
 * RPC Management System
 */
class RPCManager {
    constructor() {
        this.history = [];
        this.maxHistory = 5;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        const data = await StorageManager.readJson(CONFIG.STORAGE.RPC_FILE, { history: [] });
        this.history = data.history || [];
        this.initialized = true;
    }

    async save() {
        await StorageManager.writeJson(CONFIG.STORAGE.RPC_FILE, {
            history: this.history,
            lastUpdated: DateTimeUtil.getCurrentTimestamp()
        });
    }

    async saveCurrentRPC(rpcData) {
        await this.init();
        
        const entry = {
            ...rpcData,
            savedAt: DateTimeUtil.getCurrentTimestamp(),
            savedBy: CONFIG.USER.NAME
        };

        this.history.unshift(entry);
        this.history = this.history.slice(0, this.maxHistory);
        await this.save();
        return entry;
    }

    async getLastRPC() {
        await this.init();
        return this.history[0] || null;
    }

    async getHistory() {
        await this.init();
        return this.history;
    }
}

// Create manager instances
const imageManager = new ImageManager();
const rpcManager = new RPCManager();

/**
 * Command Module
 */
module.exports = {
    name: 'rpc',
    aliases: [],
    description: `Advanced RPC Manager v${CONFIG.VERSION}`,
    category: 'UTILITY',
    usage: [
        'Changer  : rpc changer name=Game Name',
        'Full     : rpc changer name=Game; details=Text; state=Text; type=PLAYING',
        'Images   : rpc addimage large=url; small=url; name=imagename',
        'Use Image: rpc changer name=Game; image=imagename',
        'History  : rpc changer savecurrent, loadlast, history',
        'Images   : rpc listimages, removeimage <name>',
        'Stop     : rpc changer stop'
    ].join('\n'),

    async execute(client, message, args) {
        try {
            if (!args.length) {
                return message.channel.send(FormatUtil.warning(this.usage))
                    .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.HELP));
            }

            // Subcommand parsing
            const subcommand = args[0].toLowerCase();
            const subArgs = args.slice(1);
            let fullInput = subArgs.join(' ').trim();

            // Default to 'changer' if subcommand is not recognized
            const validSubcommands = ['changer', 'addimage', 'removeimage', 'listimages'];
            let actualSubcommand = subcommand;
            if (!validSubcommands.includes(subcommand)) {
                // Backward compatibility: treat as 'changer'
                actualSubcommand = 'changer';
                fullInput = args.join(' ').trim();
            }

            // Subcommand: addimage
            if (actualSubcommand === 'addimage') {
                const imageData = {};
                const fields = fullInput.split(';').map(f => f.trim());

                for (const field of fields) {
                    const [key, ...valueParts] = field.split('=');
                    const value = valueParts.join('=').trim();
                    if (key && value) {
                        imageData[key.trim().toLowerCase()] = value;
                    }
                }

                if (!imageData.name) {
                    throw new Error('Image name is required');
                }

                const result = await imageManager.addImage(
                    imageData.name,
                    imageData.url || imageData.large || imageData.small,
                    imageData.type || 'both'
                );

                return message.channel.send(FormatUtil.success(
                    `Added image "${imageData.name}" successfully\nType: ${result.type}\nSource: ${result.source}`
                )).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
            }

            // Subcommand: removeimage
            if (actualSubcommand === 'removeimage' && subArgs[0]) {
                const removed = await imageManager.removeImage(subArgs[0]);
                return message.channel.send(
                    removed ?
                    FormatUtil.success(`Removed image "${subArgs[0]}"`) :
                    FormatUtil.error(`Image "${subArgs[0]}" not found`)
                ).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
            }

            // Subcommand: listimages
            if (actualSubcommand === 'listimages') {
                const images = await imageManager.listImages();
                return message.channel.send(FormatUtil.info(
                    images.map(img =>
                        `${img.name}: ${img.type} (${img.source})`
                    ).join('\n') || 'No images stored'
                )).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.INFO));
            }

            // Subcommand: changer (default)
            if (actualSubcommand === 'changer') {
                // Command processing based on input
                if (fullInput.toLowerCase() === 'stop') {
                    await client.user.setPresence({ activities: [], status: 'online' });
                    return message.channel.send(FormatUtil.success('RPC has been stopped'))
                        .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
                }

                // Handle special commands
                switch (fullInput.toLowerCase()) {
                    case 'savecurrent':
                        const currentActivity = client.user.presence.activities[0];
                        if (!currentActivity) throw new Error('No active RPC to save');
                        await rpcManager.saveCurrentRPC(currentActivity);
                        return message.channel.send(FormatUtil.success(`Saved current RPC: ${currentActivity.name}`))
                            .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));

                    case 'loadlast':
                        const savedRPC = await rpcManager.getLastRPC();
                        if (!savedRPC) throw new Error('No saved RPC found');
                        await client.user.setActivity(savedRPC);
                        return message.channel.send(FormatUtil.success(`Loaded RPC: ${savedRPC.name}`))
                            .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));

                    case 'history':
                        const history = await rpcManager.getHistory();
                        return message.channel.send(FormatUtil.info(
                            history.map((rpc, i) =>
                                `${i + 1}. ${rpc.name} (${rpc.savedAt})`
                            ).join('\n') || 'No history available'
                        )).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.INFO));
                }

                // Handle image commands
                if (args[0]?.toLowerCase() === 'addimage') {
                    const imageData = {};
                    const fields = fullInput.substring(8).split(';').map(f => f.trim());
                    
                    for (const field of fields) {
                        const [key, ...valueParts] = field.split('=');
                        const value = valueParts.join('=').trim();
                        if (key && value) {
                            imageData[key.trim().toLowerCase()] = value;
                        }
                    }

                    if (!imageData.name) {
                        throw new Error('Image name is required');
                    }

                    const result = await imageManager.addImage(
                        imageData.name,
                        imageData.url || imageData.large || imageData.small,
                        imageData.type || 'both'
                    );

                    return message.channel.send(FormatUtil.success(
                        `Added image "${imageData.name}" successfully\nType: ${result.type}\nSource: ${result.source}`
                    )).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
                }

                if (args[0]?.toLowerCase() === 'removeimage' && args[1]) {
                    const removed = await imageManager.removeImage(args[1]);
                    return message.channel.send(
                        removed ? 
                        FormatUtil.success(`Removed image "${args[1]}"`) :
                        FormatUtil.error(`Image "${args[1]}" not found`)
                    ).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
                }

                // Handle RPC setting
                const rpcData = {};
                const fields = fullInput.split(';').map(f => f.trim());

                // Parse fields
                for (const field of fields) {
                    if (!field.includes('=')) {
                        if (fields.length === 1) {
                            rpcData.name = field;
                            continue;
                        }
                        throw new Error(`Invalid format: "${field}"`);
                    }

                    const [key, ...valueParts] = field.split('=');
                    const value = valueParts.join('=').trim();
                    if (!key || !value) {
                        throw new Error(`Empty ${!key ? 'key' : 'value'} in: "${field}"`);
                    }
                    rpcData[key.trim().toLowerCase()] = value;
                }

                // Create RPC
                const rpc = new Discord.RichPresence(client);
                
                // Set basic properties
                rpc.setName(rpcData.name || CONFIG.DEFAULT_NAME);
                if (rpcData.details) rpc.setDetails(rpcData.details);
                if (rpcData.state) rpc.setState(rpcData.state);

                // Handle activity type
                const activityType = rpcData.type?.toUpperCase() || CONFIG.DEFAULT_TYPE;
                if (CONFIG.ACTIVITY_TYPES[activityType]) {
                    rpc.setType(activityType);
                } else {
                    console.warn(`Invalid activity type: ${activityType}. Using ${CONFIG.DEFAULT_TYPE}`);
                    rpc.setType(CONFIG.DEFAULT_TYPE);
                }

                // Handle images
                if (rpcData.image) {
                    const imageData = await imageManager.getImage(rpcData.image);
                    if (imageData) {
                        if (imageData.type === 'large' || imageData.type === 'both') {
                            rpc.setAssetsLargeImage(imageData.url);
                        }
                        if (imageData.type === 'small' || imageData.type === 'both') {
                            rpc.setAssetsSmallImage(imageData.url);
                        }
                    }
                } else {
                    if (rpcData.largeimage) {
                        const largeImage = await imageManager.getImage(rpcData.largeimage);
                        rpc.setAssetsLargeImage(largeImage?.url || rpcData.largeimage);
                    }
                    if (rpcData.smallimage) {
                        const smallImage = await imageManager.getImage(rpcData.smallimage);
                        rpc.setAssetsSmallImage(smallImage?.url || rpcData.smallimage);
                    }
                }

                // Set image texts
                if (rpcData.largetext) rpc.setAssetsLargeText(rpcData.largetext);
                if (rpcData.smalltext) rpc.setAssetsSmallText(rpcData.smalltext);

                // Handle buttons
                const buttons = [];
                if (rpcData.buttontext && rpcData.buttonurl) {
                    if (validateUrl(rpcData.buttonurl)) {
                        buttons.push({
                            label: rpcData.buttontext.substring(0, CONFIG.BUTTONS.MAX_LENGTH),
                            url: rpcData.buttonurl
                        });
                    }
                }
                if (rpcData.button2text && rpcData.button2url) {
                    if (validateUrl(rpcData.button2url)) {
                        buttons.push({
                            label: rpcData.button2text.substring(0, CONFIG.BUTTONS.MAX_LENGTH),
                            url: rpcData.button2url
                        });
                    }
                }
                if (buttons.length > 0) {
                    rpc.setButtons(buttons);
                }

                // Handle time
                if (rpcData.time) {
                    const timestamp = DateTimeUtil.parseTime(rpcData.time);
                    if (timestamp) {
                        rpc.setStartTimestamp(timestamp);
                    } else {
                        console.warn(`Invalid time format: ${rpcData.time}. Using current time.`);
                        rpc.setStartTimestamp(Date.now());
                    }
                } else {
                    rpc.setStartTimestamp(Date.now());
                }

                // Set Activity
                await client.user.setActivity(rpc);

                // Success Message
                return message.channel.send(FormatUtil.success([
                    `Type    : ${CONFIG.ACTIVITY_TYPES[activityType]} ${activityType}`,
                    `Name    : ${rpcData.name || CONFIG.DEFAULT_NAME}`,
                    `Details : ${rpcData.details || 'None'}`,
                    `State   : ${rpcData.state || 'None'}`,
                    `Buttons : ${buttons.length} configured`,
                    `Images  : ${rpcData.image || (rpcData.largeimage ? 'Large ' : '')
                        + (rpcData.smallimage ? 'Small' : '') || 'None'}`
                ].join('\n')))
                .then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.SUCCESS));
            }

        } catch (error) {
            console.error('RPC Error:', error);
            return message.channel.send(FormatUtil.error(
                'RPC Error',
                error.message
            )).then(msg => setTimeout(() => msg.delete().catch(() => {}), CONFIG.AUTO_DELETE_DELAYS.ERROR));
        }
    }
};

// Helper function for URL validation
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}