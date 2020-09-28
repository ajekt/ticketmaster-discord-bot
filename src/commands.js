const Embed  = require("discord.js").MessageEmbed;
const moment = require('moment');
const fetch  = require('node-fetch');
const Config = require(__dirname + "/../config.json");

const API_ROOT = 'https://app.ticketmaster.com/discovery/v2/';

const Commands = {
  help: {
      name: "help",
      description: "Displays command information and syntax.\nUse `commands` to find a list of commands.",
      syntax: "<command>",
      run: (args, message) => {
        if (!Commands[args[0]]) {
          message.channel.send(showHelp(Commands.help));
          return;
        }
        message.channel.send(showHelp(Commands[args[0]]));
      }
  },
  commands: {
    name: "commands",
    description: "Shows a list of available commands.",
    run: (message) => {
      let cmdText = Object.keys(Commands).map(item => {
        return `+ ${item}`;
      });
      message.channel.send(new Embed()
        .setTitle("Commands")
        .setDescription(`List of all commands:\`\`\`diff\n${cmdText.join('\n')}\`\`\``)
      );
    }
  },
  search: {
    name: "search",
    description: "Search Ticketmaster for upcomming events.",
    run: async (message, logger) => {
      try {
        let propertyEmbed = await new Embed()
          .setTitle("Enter Search Properties")
          .setDescription("Enter properties to filter your search.\nFor a list of valid properties enter `properties`.\nUse `search` to perform the search or `cancel` to cancel the search.");
        message.channel.send(propertyEmbed);

    	  const filter = m => message.author.id === m.author.id;
        const collector = message.channel.createMessageCollector(filter, { time: 30000 });
        const propertyList = ["keyword", "postalCode", "city", "countryCode", "stateCode", "type", "date"];
        let propertyObject = {};

        collector.on('collect', async m => {
          if (m.content.includes("=")) {
            collector.resetTimer();
            let property = m.content.trim().replace(/[^\w\s^=^-]/gi, '').split("=");
            let value = property.pop();
            property = property.toString();

            if (!propertyList.includes(property)) {
              message.channel.send(`\:x: Invalid property \`${property}\`. Enter \`properties\` for a list of valid properties.`);
              return;
            }
            if (property == "date") {
              try {
                value = new Date(value).toISOString().split('.')[0]+"Z"; // remove milliseconds
              } catch(e) {
                if (e instanceof RangeError) {
                  message.channel.send("\:x: Invalid date string! Use format YYYY-MM-DD.");
                } else {
                  message.channel.send("\:x: An unexpected error occured.");
                }
                return;
              }
            }

            propertyObject[property] = value;
            message.channel.send(`\:white_check_mark: Property \`${property}\` has been set to \`${value}\`.`);
            return;
          }

          switch (m.content) {
            case "search":
              message.channel.send(await tkSearch(propertyObject, message, logger));
              collector.stop();
              break;

            case "cancel":
              message.channel.send("\:x: Search was cancelled");
              collector.stop();
              break;

            case "properties":
              collector.resetTimer();
              let propertyListText = propertyList.map(item => {
                return `+ ${item}`;
              });

              message.channel.send(new Embed()
                .setTitle("Properties")
                .setDescription(`List of all properties:\`\`\`diff\n${propertyListText.join('\n')}\`\`\`\nTo set a property use the following syntax:\n\`\`\`property=value\`\`\``)
              );
              break;

            default:
          }
        });

        collector.on('end', (collected, reason) => {
          if (reason == "time") {
            message.channel.send(`\:x: ${message.author} request has timed out.`);
          }
        });
      } catch(e) {
        logger.log('error', e);
        return "\:x: An unexpected error occurred.";
      }
    }
  }
}

module.exports = Commands;

function showHelp(command) {
  return new Embed()
  .addFields(
    { name: "Description", value: command.description },
    { name: "Syntax", value: `\`${command.name} ${command.syntax || ""}\``}
  );
}

async function tkSearch(propertyObject, message, logger) {
  try {
    // Rename some object keys to match the correct query params
    if (propertyObject['date']) {
        propertyObject['startDateTime'] = propertyObject['date'];
        delete propertyObject['date'];
    }
    if (propertyObject['type']) {
       propertyObject['segmentName'] = propertyObject['type'];
       delete propertyObject['type'];
    }

    const query = Object.keys(propertyObject)
      .map(key => `${key}=${propertyObject[key]}`)
      .join('&');

    let res = await fetch(`${API_ROOT}events.json?size=1&apikey=${Config.api_key}&${query}`);

    if (!res.ok) {
      return `\:x: Ticketmaster API returned: ${res.status} ${res.statusText}`;
    }

    let json = await res.json();
    if (json.page.totalElements == 0) {
      return "\:x: Could not find any events maching the parameters.";
    }

    let eventObject = json._embedded.events[0];
    let embed = {
      title:  eventObject.name,
      url: eventObject.url,
      fields: [
        {
          name: "Date",
          value: `${eventObject.dates.start.localDate}`,
          inline: true
        },
        {
          name: "Time",
          value: `${eventObject.dates.start.localTime}`,
          inline: true
        },
        {
          name: "Event Type",
          value: `${eventObject.classifications[0].segment.name} (${eventObject.classifications[0].genre.name})`
        },
        {
          name: "Venue Location",
          value: `${eventObject._embedded.venues[0].country.name}, ${eventObject._embedded.venues[0].state.name}, ${eventObject._embedded.venues[0].city.name}, ${eventObject._embedded.venues[0].name}`
        }
      ],
      image: {
        url: eventObject.images[0].url
      },
      timestamp: new Date(),
      footer: {
        text: `Requested by ${message.author.tag}`,
        icon_url: message.author.avatarURL()
      }
    };


    if (eventObject.priceRanges) {
      embed.fields.push({
        name: `Price Range (${eventObject.priceRanges[0].currency})`,
        value: `${eventObject.priceRanges[0].min} - ${eventObject.priceRanges[0].max}`
      });
    }
    return { embed: embed };
  } catch(e) {
    logger.log('error', e);
    return "\:x: An unexpected error occurred.";
  }
}
