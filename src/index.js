const Discord  = require("discord.js");
const Config   = require(__dirname + "/../config.json");
const Commands = require(__dirname + "/commands.js");
const winston  = require("winston");

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '../bot.log' })
  ],
  format: winston.format.printf(log => `[${log.level.toUpperCase()}] - ${log.message}`)
});

const client = new Discord.Client();
const ESC = "\033[";

/*
 * --------------------
 * Start Main Code Here
 * --------------------
*/

client.on('debug', m => logger.log('debug', m));
client.on('warn', m => logger.log('warn', m));
client.on('error', m => logger.log('error', m));

client.on("ready", () => {
  logger.log('info', `Bot started in ${client.guilds.cache.size} servers.`);
  client.user.setActivity(`Watching ${client.users.cache.size} users...`);
});

client.on("guildCreate", guild => {
  logger.log('info', `Joined server "${guild.name}"`);
  client.user.setActivity(`Watching ${client.users.cache.size} users...`);
});

client.on("guildDelete", guild => {
  logger.log('info', `Left server "${guild.name}"`);
  client.user.setActivity(`Watching ${client.users.cache.size} users...`);
});


client.on("message", async message => {
  if (message.author.bot) return;
  if (!message.content.startsWith(Config.prefix)) return;

  const args = message.content.slice(Config.prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch (command) {
    case "help" || "?":
      Commands.help.run(args, message);
      break;
    case "commands":
      Commands.commands.run(message);
      break;
    case "search":
      Commands.search.run(message, logger);
      break;
    default:

  }
});

client.login(Config.bot_token);
