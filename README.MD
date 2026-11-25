# TripBot 🤖 <br>*(TripSit-Discord-Bot)*

## Table of contents
+ [About](#about)
+ [How to use](#invite)
+ [Contribute](#contribute)
+ [Authors](#contributors)
+ [License](#license)

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch/PR conventions and how to run checks before opening a pull request.

Follow the [PR to production walkthrough](docs/pr-to-production.md) for automatic UAT queueing,
deployment verification, UAT testing, and production sign-off.

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
Vitest Testing
SonarQube Code Quality
Docker Containerized
ESlint Linting
tsc-watch Hot Reloading
TSC Auto Building
Drone Continuous Integration

### How to build

**Requirements**
1) Docker. You can get it [here](https://www.docker.com/products/docker-desktop).
2) VSCode with the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers), or [GitHub Codespaces](https://github.com/features/codespaces). Development happens inside the devcontainer defined in `.devcontainer/`.
3) A discord bot application. You can get one [here](https://discord.com/developers/applications).

**Optional**
1) ESLint extension for VSCode. You can get it [here](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint). It's already included in the devcontainer's recommended extensions.
2) Invite the discord bot to the tripsit dev guild. Ask Moonbear for an invite link. The bot will not work properly without doing this.

**Setup the bot**

Clone the repository

``` git clone https://github.com/TripSit/TripBot.git```

Copy `.env.example` to `.env` and fill in these fields. You only /need/ the discord stuff like the token and client ID.

Open the folder in VSCode and choose **Reopen in Container** (or open it as a GitHub Codespace). This builds the dev
image, starts the database, and mounts the whole repo into the container so edits and commits made either on your
host machine or inside the container show up in both places.

**Start the bot**

Nothing to do here — the devcontainer's `postStartCommand` runs `npm run tripbot:start` automatically once the
container is up, compiling with `tsc-watch` and running the bot in a detached `tmux` session. (`npm run tripbot:dev`
does the same and then attaches to the logs; `npm run tripbot:restart` stops, starts and attaches.)

**View logs**

```npm run tripbot:logs```

This attaches to the `tmux` session and shows you the bot's live output. Detach without stopping it with `Ctrl+B` then `D`.

**Deploy commands**

The bot registers its slash commands with Discord automatically every time it starts, and skips the Discord call when
the definitions have not changed since the last deploy, so restarting the bot after you add a command or change its
options is enough. To deploy them manually (for example from outside the container), run:

```npm run tripbot:deployCommands```

**Develop**

The devcontainer watches the whole repo for changes (via polling, since native file-change events don't reliably
cross the Windows/Mac-to-Linux bind mount) and rebuilds/restarts the bot when you save a file under `src/`.

**Lint**

It's /highly/ recommended to use the eslint extension, and allow vscode the auto-fix your linting errors.

```npm run tripbot:lint```

**Test**

Tests run with [Vitest](https://vitest.dev). Behavior you add or change needs tests, and CI enforces a coverage
threshold (see `vitest.config.mts`), so new code paths should be covered.

```npm run tripbot:test```

Run one file with `npx vitest run path/to/file.test.ts` and coverage with `npx vitest run --coverage`. Tests live next
to the layer they cover:

```
src/vitest/              : Shared test infrastructure (the Discord.js mock and a mocked Prisma client)
src/discord/tests/       : Discord command, event and util tests (global/ and guild/ mirror src/discord/commands)
src/global/tests/        : Business-logic (g.*) and util tests
src/irc/tests/           : IRC connection and bridge tests
src/api/*.test.ts        : API route tests
```

Add a `tsconfig.json` that extends `tsconfig.vitest.json` to any new test folder, and check test code with
`npx tsc --noEmit --project tsconfig.vitest.json`.

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
src/vitest   : Shared Vitest test infrastructure (tests themselves live in each layer's tests/ folder).
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

All AI features have been removed: AI chat, the Translate message command and AI flair review. RPG flair is reviewed locally with the keyword filter, and no message content is sent to an AI provider. The /ai command remains only so users can read and revoke earlier consent. Historical Discord chat audit posts and bot replies require separate cleanup.

### Database Development ###

TripBot's database runs on Postgres, which is a relational database, not a JSON file.

When TripBot starts, it will automatically create the tripbot_database container and run the migrations.

This gives you a copy of the production table schema on your local machine.

To make changes to the database, you need to use the Prisma ORM and make changes to the schema.prisma file.

Run the ```db:migrateDev``` to create new migration files based on the changes you made to the schema.prisma file.

When these migration files are pushed to production, the database is updated automatically: the
production branch of `src/docker/entrypoint.sh` runs `prisma migrate deploy` before starting the bot,
and refuses to start if the migrations fail. Note that CI (`PushToMain.yml`) does not apply
migrations - they are applied by the container on startup, so a migration only reaches production
when the image is rebuilt and the container is recreated.

Prisma documentation is excellent, check out guides like: https://www.prisma.io/docs/concepts/components/prisma-migrate/migrate-development-production

---
#### Handling unexpected migration issues ####
If your database changes aren't reflecting locally after editing the Prisma schema:

Generate and apply migrations:
  ```npx prisma migrate dev --name your_migration_name```
  ```npx prisma generate```
  ```npx prisma migrate deploy```

If VSCode isn't recognizing the new tables when writing code for them, press ```Ctrl/CMD Shift P: Restart TypeScript Server```.

if you are on Windows, you may need to run the above commands within the docker containers command execution context, after which you may need to run ```npx prisma generate``` within your VSCode IDE or otherwise

---

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

```npm run db:start```

We use postgres for our database.

This is just a simple container that basically sits there being a stable database.

By itself, it does nothing, you need another utility, like Prisma, to interact with it.

#### PG Admin ###

NOTE: You will need to uncomment the port from the docker-compose file. More details there.

```npm run pgadmin```

This is a webserver that allows you to view the database.

It's not necessary, but it's nice to have.

You can access it via http://localhost:5050 (maybe idk)

---

#### API ###

The API runs as part of the same bot process (see `src/api/app.ts`) — there's no separate script to start it.

V1 : legacy tripbot APi that interacts with static .json files.

## License

TripBot is source-available under the [PolyForm Noncommercial License 1.0.0](LICENSE). You're free to use, copy,
modify, and distribute the code (including forks) for any noncommercial purpose. Selling the software, or using it
to provide a commercial product or service, is not permitted.

V2 : the new prisma api that interacts with postgres for the appeal system.
