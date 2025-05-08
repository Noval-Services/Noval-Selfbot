module.exports = (client) => {
  client.isOwner = (message) => {
    return message.author.id === process.env.OWNER_ID;
  };
};