const fs = require('fs');
const path = require('path');

module.exports = (client) => {
  const commandsPath = path.join(__dirname, '../commands');
  
  // Recursive function to read all .js files in directory and subdirectories
  const loadCommands = (dir) => {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        // If it's a directory, recurse into it
        loadCommands(filePath);
      } else if (file.isFile() && file.name.endsWith('.js')) {
        // If it's a .js file, load the command
        const command = require(filePath);
        if (command.name) {
          client.commands.set(command.name, command);
          console.log(`- ${command.name} (from ${path.relative(commandsPath, filePath)})`);
        }
      }
    }
  };

  console.log(`\nLoaded commands:`);
  
  // Initialize commands collection if not already present
  if (!client.commands) client.commands = new Map();
  
  // Start loading commands
  loadCommands(commandsPath);

  client.on('messageCreate', async message => {
    // Ignore messages not from the bot itself
    if (message.author.id !== client.user.id) return;

    const prefix = process.env.PREFIX || "!";
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) return;

    // Check if user is owner if isOwner function exists
    if (typeof client.isOwner === 'function' && !client.isOwner(message)) {
      return message.channel.send('You are not authorized to use this command.');
    }

    try {
      await command.execute(client, message, args);
    } catch (error) {
      console.error(error);
      message.channel.send('There was an error executing that command.');
    }
  });
};