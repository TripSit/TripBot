# TripBot 🤖 <br>*(TripSit-Discord-Bot)*

## Table of contents 
+ [About](#about)
+ [How to use](#how-to-use)
+ [Contribute](#contribute)
+ [Authors](#contributors)


## 🧐 About
TripBot is an over-complicated (**multi-platform**(!)) bot that is a major part of our project **[TripSit](https://tripsit.me)** providing open discussion of and education about safer use and harm reduction techniques, If you want, you can [read more](https://tripsit.me/about/) about our mission. 

This bot's code is open source in the interest of helping people. We use it a lot, there's active development happening, and you can use it on your guild too!

The goals with this bot are:
1) Provide for the needs of TripSit's community and make it an awesome place to be!
2) Spread access to TripSit's information by allowing greater access to our wiki on discord.
3) Get traffic back to our discord, ultimately to gather more information that can be spread further and help more people!
4) Allow other guilds to host their own "tripsit" service?
5) Allow the bot to be a "remote tripsit" service??

## Features
Full Typescript support
Postgres database support
Prisma integration support
Discord.js 14.8
Jest testing support
Sonar scanning
Dockerized

## 🎈 How to use 
+ We run an instance of the bot that you can add to your guild following [this link](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands)

## Contribute

If you want to contribute to TripBot, that's super cool and highly appreciated.<br>To get in touch, it's currently the easiest way to [Join our Discord guild](https://discord.gg/tripsit). 

## How to build
+ If you want to host your own instance of the bot, first talk to Moonbear to see if these instructions are valid. If they are, then you can follow these steps to get your own instance of the bot running.

0: **Requirements**
1) Docker. You can get it [here](https://www.docker.com/products/docker-desktop).
2) A discord bot application. You can get one [here](https://discord.com/developers/applications).
- Save your client ID and Token to the .env file (after you make it via copying env.example)
3) A discord guild to test the bot in. 
- It's preferred that you use the TripSit dev guild, but you can use your own if you want.
- If you use your own, you'll need to update the env.config file with your channel/roles IDs.
- Save your guild ID to the .env file
4) A discord bot application invite link. You can get this from your discord bot application.
- For basic functionality you dont need a ton of permissions
- Moonbear will give your bot permissions on the dev guild
- On you own private guild just give it admin permissions
- There are permission checks but they're a bit wonky.

1: **Setup the bot**

Clone the repository

``` git clone https://github.com/TripSit/TripBot.git```

Copy env.example to .env and fill in these fields. You only /need/ the discord stuff

2: **Start the tripbot container** 

```npm run tripbot```

This will start the container and build the bot. It will also run the bot in the container.
If you need to update the container (like if you update the .env), use this command again.
In general, if something isnt working right, rebuild the container.

2: **Deploy commands**

```npm run tripbot:deploy```

As part of the build process it will  to register the bot commands with discord.
If you modify or create a new commands you'll need to run this script again, or rebuild the container.

3: **View logs**

```npm run logs```

This will show you the logs of tripbot from inside the container.
When i develop i have this running in a separate terminal window so i can see the logs as i work.

4: **Develop!**

The container will watch the /src folder for changes and rebuild the bot when you save a file.
If you create or update a command, make sure to run the deploy script again

5: **Test/Lint**

It's /highly/ recommended to use the eslint extension, and allow vscode the auto-fix your linting errors.
Jest tests are a WIP.

## Folder Structure ##
src/         : This is where all the code lives
src/api      : External API endpoints, see "API" below
src/api/v1   : Legacy json endpoint
src/api/v2   : New prisma postgres endpoint
src/discord  : Discord specific code, see "How commands work" below
src/docker   : Dockerfiles for the various containers
src/global   : Global functions that are used by multiple commands. See "How commands work" below
src/irc      : IRC specific code, see "How commands work" below.
src/jest     : Jest testing code.
src/knex     : Knex migrations, used in database development, see "Database Development" below.
src/matrix   : Matrix specific code, see "How commands work" below.
src/pgadmin4 : PGAdmin4 webserver, used in database development, see "Database Development" below.
src/postgres : Postgres startup script, used in database development, see "Database Development" below.
src/prisma   : Prisma database code, see "Database Development" below.
src/telegram : Telegram specific code, see "How commands work" below.

## How Commands Work
Most commands are built with a global core function, and then have a UI function that interacts with that global function.
For example: We have the /birthday command on discord.
When someone runs the /birthday set command on discord, they enter their birth month and day.
When they hit enter, d.birthday gets the user's input values (month and day), and sends them to g.birthday
g.birthday talks to the database and sets the values, and tells d.birthday if it succeeded or not
d.birthday then responds to the user that they successfully set their birthday

This might seem complicated, but this allows us to re-use commands depending on the service that calls them.
All m.birthday needs to do is take input from the user however they can from the Matrix side, and send the same standard values to g.birthday.
If you wanted to do this in telegram, you would figure out how to take input values from users in telegram, and then send those to g.birthday.

+---------+       +------------+       +------------+       +-------------+       +---------+
| Discord |       |            |       |            |       |             |       | Matrix  |
|  User   | <---> | d.birthday | <---> | g.birthday | <---> |  m.birthday | <---> |  User   |
|         |       |            |       |            |       |             |       |         |
+---------+       +------------+       +------------+       +-------------+       +---------+

## Database Development ##

TripBot's database runs on Postgres, which is a relational database.

You make changes to the schema.prisma, and then run the ```npm run prisma:migrate``` to create the migration file

When this file is pushed to production, the database will be updated automatically.

One of the goals is to convert the knex queries in tripbot into Prisma Client queries.

### Postgres ###
```npm run postgres```
We use postgres for our database.
This is just a simple container that basically sits there being a stable database.
By itself, it does nothing, you need another utility, like Prisma, to interact with it.

### Prisma ###
```npm run prisma```
Prisma runs the necessary setup to fill in the database tables and columns.
You just need to run this container once and you can forget about it.
Previously we used Knex so you'll still see some knex code, but we're moving away from that.
There is a webserver (prisma studio) that starts as part of this container.
You can access it via http://localhost:5555
If you're worried about this, exit the prisma container after it finishes running.
It only needs to run once to setup the DB.

### PG Admin ###
```npm run pgadmin```
This is a webserver that allows you to view the database.
It's not necessary, but it's nice to have.
You can access it via http://localhost:80 (maybe idk)

### API ###
```npm run api```
This is a simple API that allows you to interact with the database.
There's a bit of neuance to the api:
V1 : legacy tripbot APi that interacts with static .json files
V2 : the new prisma api that interacts with postgres for the appeal system

There is also an api endpoint within tripbot that receives webhooks from the appeal system.