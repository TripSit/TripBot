# TripBot First Run
Congrats on making it this far!

You have just a little more setup to complete:

0) Wait for setup in the terminal to finish. You'll know it's done when you see the "Welcome to codespace!" message.
1) Open NPM Scripts via the hamburger dots in the top left
2) Run the cs-deploy script, this registers the bot commands with your bot application
2.1) If you get an error about missing token or something, make sure you update your github codespace secrts to match the .env.example file
2.2) At least your discord client ID and token, everything else is optional.
2.3) If you're not going to use TripSit's dev guild, then change the guild ID.
3) Run the cs-start script, this compiles the bot into the /build folder and runs it via nodemon.
4) That's it! Start developing and have fun. The changes you make to the SRC folder will be reflected in the container.

# Development Notes
## General
* Work in /src, don't modify /build
* Nodemon will restart every time you save a file
* If you create or update a command, make sure to run the deploy script again

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
