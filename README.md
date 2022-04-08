The TripSit.Me bot is a relatively simple bot that provides access to the TripSit API.

The code is open source in the interest of helping people but **I would greatly prefer that you contribute to this project rather than forking it!**

The goals with this bot are:
1) Make TripSit discord a fun and safe place to be!
2) Spread access to TripSit's information by allowing greater access to our wiki on discord.
3) Get traffic back to our discord, ultimately to gather more information that can be spread further and help more people!

The methods in which we will do this:
1) Be useful enough that people want this bot on their servers
2) Be lightweight (not require a lot of permissions) enough to be invited to servers without people worrying about security. EG: I'm trying to stay away from needing the Messages intent.
4) By putting this bot on certain websites we will introduce ourselves to people who have not heard of us yet when they search for a "drug" "dose" bot
5) By having "TripSit.Me" in the name people will immediately know 1) our org name and 2) our website

Current features:
Admin stuff
* /about - Information about the bot
* /contact - How to contact tripsit

HR stuff:
* /info Substance  : Summary | Properties | Everything
* /combo DrugA DrugB (Now with autocomplete!)
* /idose - Remind yourself, in private, when you last dosed

Funzies:
* /breathe
* /hydrate
* /kipp
* /topic

Tripsit specific:
* /karma - Records the emojis you've given and received
* /tripsit USER ON/OFF - This command will give the NeedsHelp role and remove all other roles. It basically forces the user to look at #tripsit. This can only be done by Tripsitters+

Denied Features:
* Rainbow Role  - Changing the role color every few seconds: Discord would want to murder me for abusing the API.
* Karma++ - This would require the Messages privilege, and discord doesn't give out this permission lightly. Instead, the idea is to react with an emoji to show your support! We can try to use the :ts_up: as good karma and the :reddit_downvote:  as bad 
