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
Discord.js 14.8
Jest testing support
Sonarqube scanning
Dockerized

## 🎈 How to use 
+ We run an instance of the bot that you can add to your guild following [this link](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands)

+ If you want to host your own instance of the bot, your best bet is to use the tripsit-dev repo to setup everything you need. You may be able to run this bot stand-alone, but it's not recommended nor supported.

0: **Setup postgres**
1) Install postgres
2) Create a database called tripsit
3) Create a user called tripsit_api with password P@ssw0rd
- If you don't use these credentials, change the env.config file

1: **Setup the bot**

Clone the repository

``` git clone https://github.com/tripsit-tripit-dicord-bot```

Copy env.example to .env and fill in these fields. You only /need/ the discord stuff

2: **Run in dev mode** 

```npm run dev```

This starts the bot in development mode
- This runs nodemon, which will update on every change
If you need to update the container, use

```npm run docker-rebuild```

This *should* work, but your best bet is to run the /tripsit-dev code space that will set you up with everything, including a TripSit Postgres Database.

## Contribute

If you want to contribute to TripBot, that's super cool and highly appreciated.<br>To get in touch, it's currently the easiest way to [Join our Discord guild](https://discord.gg/tripsit). 

### Useful information for developers: 
- The defaults in env.config for postgres are ```tripsit``` for the database name and user ```tripsit_api``` with password ```P@ssw0rd```. 
- To get started, just clone the repo, copy the .env.example to .env and fill in what you'll need.<br>For the (discord-)bot to start you only /need/ the discord stuff. 
- Use ```npm run dev``` to let the linter make your messy code a bit more readable (💗) and run the thing in *nodemon* which will restart the app for you on every change (to a file tracked by nodemon) 
- If you need to update the container, use<br>
```npm run docker-rebuild```
## ⌨️ Authors 
- Moonbear
- foggy
- Hipperoni 
- AJAr