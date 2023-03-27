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
Postgres database support

## Installation

Use the tripsit-dev repo to do all this automatically!

### Setup postgres
1) Install postgres
2) Create a database called tripsit
3) Create a user called tripsit_api with password P@ssw0rd
- If you don't use these credentials, change the env.config file

### Setup Tripbot
1) Clone TripBot
2) Copy env.example to .env and fill in these fields. You only /need/ the discord stuff

### Run production
1) Run `docker compose up -d`

## Run Development
1) Run `npm run dev` to start the bot in development mode
- This runs nodemod, which will update on every change
2) If you need to update the container, use `npm run docker-rebuild`

## Get in touch 
Feel free to join our discord guild under https://discord.gg/tripsit 
