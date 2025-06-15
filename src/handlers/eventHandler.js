const fs = require('fs');
const path = require('path');

module.exports = (client) => {
    const eventsPath = path.join(__dirname, '../events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

    console.log(`\nLoaded events:`);
    for (const file of eventFiles) {
        const event = require(`${eventsPath}/${file}`);
        const eventName = event.name || file.split('.')[0]; 

        if (typeof event.execute !== 'function') {
            console.log(`[WARNING] Event file ${file} does not have a valid 'execute' method. Skipping...`);
            continue;
        }

        try {
            client.on(eventName, (...args) => event.execute(client, ...args));
            console.log(`- ${eventName}`);
        } catch (error) {
            console.error(`[ERROR] Failed to load event ${eventName}:`, error);
        }
    }
};