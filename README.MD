# TripBot 🤖 <br>*(TripSit-Discord-Bot)*

## Table of contents 
+ [About](#about)
+ [How to use](#invite)
+ [Contribute](#contribute)
+ [Authors](#contributors)

## About
TripBot is multi-platform open-source bot that is a major part of the **[TripSit](https://tripsit.me)** project. 
It is primarily a discord bot, but has been built modularly to allow for easy expansion to other platforms such as IRC, Matrix, and Telegram. 
This bot's code is open source in the interest of helping people learn code, and to encourage people to contribute to the project.

The goals with this bot are:
1) Provide for the needs of TripSit's community such as drug information, harm reduction, and community support.
2) Spread access to TripSit's Harm Reduction information by encouraging other Discord guilds to use our bot.
3) Get traffic back to our discord, ultimately to gather more information that can be spread further and help more people!

## Invite
+ We run an instance of the bot that you can add to your guild following [this link](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands)

## Development

Want to help out?

Contributing to TripBot is super appreciated, and it's easy to get involved: [Join our Discord guild](https://discord.gg/tripsit) and check out the Development sections to get started.

### Features
Fully Typescript
Postgres Relational Database
Prisma ORM and Client
Discord.js
Jest Testing
SonarQube Code Quality
Docker Containerized
ESlint Linting
Nodemon Hot Reloading
TSC Auto Building
Drone Continuous Integration

### How to build

**Requirements**
1) Docker. You can get it [here](https://www.docker.com/products/docker-desktop).
2) A discord bot application. You can get one [here](https://discord.com/developers/applications).


**Optional**
1) VSCode. You can get it [here](https://code.visualstudio.com/).
2) ESLint extension for VSCode. You can get it [here](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).
3) Invite the discord bot to the tripsit dev guild. Ask Moonbear for an invite link. The bot will not work properly without doing this.

**Setup the bot**

Clone the repository

``` git clone https://github.com/TripSit/TripBot.git```

Copy env.example to .env and fill in these fields. You only /need/ the discord stuff like the token and client ID

Install the dependencies locally so that VSCode can use them for linting and intellisense.

```npm install```

**Start the bot** 

This will start up the tripbot_database, build the bot, and run the bot in a container.
The database container just basically sits there being a stable database, you don't need to check it's logs or anything.

```npm run tripbot:start```

You will likely want to immediately check the logs of the container to make sure it started up correctly.

**View logs**

```npm run tripbot:logs```

This will show you the logs of tripbot from inside the container.

**Deploy commands**

This command will happen automatically when you build the TripBot container and tells discord what commands are available.

```npm run tripbot:deployCommands```

**If you create a new command, or modify the options in an existing command, you'll need to deploy commands again.**

**Develop**

The container will watch the /src folder for changes and rebuild the bot when you save a file.

**Lint**

It's /highly/ recommended to use the eslint extension, and allow vscode the auto-fix your linting errors.
Jest tests are a WIP.

```npm run tripbot:lint```

**Test**

Jest tests are a WIP and while appreciated it's not required to add tests to your code

```npm run tripbot:test```

### Folder Structure ##
```
src/         : This is where all the code lives
src/api      : External API endpoints, see "API" below
src/api/v1   : Legacy json endpoint
src/api/v2   : New prisma postgres endpoint
src/discord  : Discord specific code, see "How commands work" below
src/docker   : Dockerfiles for the various containers
src/global   : Global functions that are used by multiple commands. See "How commands work" below
src/irc      : IRC specific code, see "How commands work" below.
src/jest     : Jest testing code.
src/matrix   : Matrix specific code, see "How commands work" below.
src/pgadmin4 : PGAdmin4 webserver, used in database development, see "Database Development" below.
src/postgres : Postgres startup script, used in database development, see "Database Development" below.
src/prisma   : Prisma database code, see "Database Development" below.
src/telegram : Telegram specific code, see "How commands work" below.
```

### How Commands Work
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

#### Troubleshooting Command Issues ####
**Moderation Tools**:

To use moderation commands in your TripBot instance, you must have the Moderator role on the development server. 

If you need this role, please ask Moonbear.

**AI Features**:

To use AI features in your TripBot instance, you need to do a few things. 

First, you will need the Developer role on the development server. 

Once again, if you need this role, please ask Moonbear.

Second, you must set the OpenAI key/org and the Gemini key in the .env file. If you're using ChatGPT, you will still need the Gemini key set, but it can be a placeholder, e.g "abc". Since the ChatGPT API isn't free, you will need either a ChatGPT Pro subscription or ChatGPT credits to use their API.

Lastly, you'll need to go into a channel and use /ai setup. This is what the Developer role is needed for.

Go into a channel, preferably #bot-spam, and after using /ai setup, accept the ToS in the help tab. Then, add a persona in the persona tab and proceed to the setup tab to finish your setup and select a channel.

That's it. You're done! Your TripBot instance should be able to be pinged for an AI response now.

### Database Development ###

TripBot's database runs on Postgres, which is a relational database, not a JSON file.

When TripBot starts, it will automatically create the tripbot_database container and run the migrations.

This gives you a copy of the production table schema on your local machine.

To make changes to the database, you need to use the Prisma ORM and make changes to the schema.prisma file.

Run the ```db:migrateDev``` to create new migration files based on the changes you made to the schema.prisma file.

When these migration files are pushed to production, the database will be updated automatically.

Prisma documentation is excellent, check out guides like: https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production


#### Troubleshooting Initial Database Setup Issues ####

If you run into errors about missing tables/columns, you may need to open Dockerfile.tripbot and uncomment "# RUN npx prisma migrate deploy".

If you then encounter an error about not being able to connect to the tripbot_database, try navigating to Containers > tripbot-tripbot in Docker Desktop, then select exec, and enter the above Prisma migration command there.

If you don't use Docker Desktop, then open terminal or Powershell and enter ```docker exec -it tripbot/bin/sh``` to interact with bash and run the above Prisma migration command.

After that, if it works, restart the bot. If this doesn't work, then please contact Moonbear for assistance.

To persist these changes so that you don't have to do it upon every restart, open docker-compose.yml and uncomment these two lines:

    volumes:
      - ${DOCKERDIR}/appdata/database/data:/var/lib/postgresql/data

Restart the bot and you should be good to go.

#### Postgres ###

```npm run postgres```

We use postgres for our database.

This is just a simple container that basically sits there being a stable database.

By itself, it does nothing, you need another utility, like Prisma, to interact with it.

#### PG Admin ###

```npm run pgadmin```

This is a webserver that allows you to view the database.

It's not necessary, but it's nice to have.

You can access it via http://localhost:80 (maybe idk)

#### API ###

```npm run api```

This is a simple API that allows you to interact with the database.

V1 : legacy tripbot APi that interacts with static .json files

V2 : the new prisma api that interacts with postgres for the appeal system
