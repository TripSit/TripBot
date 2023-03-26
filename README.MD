# TripBot 🤖 <br>*(TripSit-Discord-Bot)*

## Table of contents 
+ [About](#about)
+ [How to use](#how-to-use)
+ [Contribute](#contribute)
+ [Authors](#contributors)


## 🧐 About
TripBot is an over-complicated (**multi-platform**(!)) bot that is a minor part of our project **[TripSit](https://tripsit.me)** providing open discussion of and education about safer use and harm reduction techniques, If you want, you can [read more](https://tripsit.me/about/) about our mission. 

However, this bot's code is open source in the interest of helping people. We use it a lot, there's active development happening, 
and you can use it on your guild too. 
## 🎈 How to use 

+ We run an instance of the bot that you can add to your guild following [this link](https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=18432&scope=bot%20applications.commands)

+ If you want to host your own instance of the bot, you can use *Docker* to run it.

1: **Clone the repository**

``` 
git clone https://github.com/tripsit-tripit-dicord-bot
```
2: **Run with docker compose** 
```
doccker compose up -d
````

## Contribute

If you want to contribute to TripBot, that's super cool and highly appreciated.<br>To get in touch, it's currently the easiest way to [Join our Disscord guild](https://discord.gg/tripsit). 

### Useful information for developers: 
- The defaults in env.config for postgres are ```tripsit``` for the database name and user ```tripsit_api``` with password ```P@ssw0rd```. 
- To get started, jusst clone the repo, copy the .env.example to .env and fill in what you'll need.<br>For the (discord-)bot to start you only /need/ the discord stuff. 
- Use ```npm run dev``` to let the linter make your messy code a bit more readable (💗) and run the thing in *nodemon* which will restart the app for you on every change (to a file tracked by nodemon) 
- If you need to update the container, use<br>
```npm run docker-rebuild```
## ⌨️ Authors 
- Moonbear
- foggy
- Hipperoni 
- AJAr