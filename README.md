TripBot is an over-complicated bot that aims to be a awesome resource for your guild =D

The code is open source in the interest of helping people!

The goals with this bot are:
1) Provide for the needs of TripSit's community and make it an awesome place to be!
2) Spread access to TripSit's information by allowing greater access to our wiki on discord.
3) Get traffic back to our discord, ultimately to gather more information that can be spread further and help more people!
4) Allow other guilds to host their own "tripsit" service?
5) Allow the bot to be a "remote tripsit" service??

## Features
Full Typescript support
Firebase realtime database support

## Installation
1) Clone the repo
2) Run `npm install`
3) Create a file called `.env` in the root directory
4) Use env.config to create your .env file. You only /need/ the discord stuff

## Usage
1) Run `npm run dev` to start the bot in development mode

## Contributing
1) Fork it!
2) Create your feature branch: `git checkout -b my-new-feature`
2a) Make sure you 'npm run dev' before you commit to lint and increment version number
3) Commit your changes: `git commit -am 'Add some feature'`
4) Push to the branch: `git push origin my-new-feature`
5) Submit a pull request :D 

## Get in touch 
Feel free to join our discord guild under https://discord.gg/tripsit 

## Postgres stuff
Okay so moonbear is using this section to take notes on how to use postgres, cuz i have litle clue what im doing

### Setup desktop programs
1) Install/run pgAdmin4
2) Create a database called tripsit
3) Create a user called tripsit with password TripSitLol123\
- If you don't use these credentials, change the env.config file

Remember that postgres is a database that runs as a webserver, so you can access it from anywhere. You can also access it from the command line, but I'm not sure how to do that yet.

### Setup project
1) Install the project (npm install)
- There is a database file called global/utils/database.ts that is used for all connections to the database
2) Run the postgres-test file to make sure everything is working! (npm run postgres-test)

## Postgres notes

-- Commands finished:
birthday
dramacounter
idose
timezone
experience

-- Commands in progress:
karma
h2flow
chitragupta
sparklePoints

profile

leaderboard
modmail
timers
remindme

tripsitme
guildCreate
guildMemberAdd
guildMemberRemove
guildMemberUpdate
handleReactionRoles
