# Deploy to Heroku
## Get Setup
## Create a new Discord app and bot
First of you have to create a new discord application for your bot [here](https://discord.com/developers/applications).<br>
Once you've named application go to the Bot tab and click `Add Bot`.
## Get a Ticketmaster API key
Register a Ticketmaster developer account [here](https://developer-acct.ticketmaster.com/user/register).<br>
Once you have verified you email and set your password, click on your profile in the top right corner and then on `My Apps`.
You should find an app called something like `<username>-app` click on it and you should find your API key/Consumer key.
## Configuration
Now you should clone the repository:<br>
```
$ git clone https://github.com/ajekt/ticketmaster-discord-bot.git
```
And inside the `example_config.json` file copy the discord bot token into the `bot_token` field and your Ticketmaster API key into the api_key field.<br>
Then rename the file to `config.json` and remove it from `.gitignore` along with `bot.log`.
## Heroku
Assuming you already have a Heroku account and the Heroku CLI installed, run:
```
$ git add .
$ git commit -m "Initial commit"

$ heroku create
$ git push heroku master
```
Then log into the Heroku dashboard and open your app. Go to the `Resources` tab, disable web and enable service.<br>
Finally type:
```
$ heroku restart
```
And the bot should be running.
