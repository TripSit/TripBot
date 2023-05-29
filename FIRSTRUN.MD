# TripBot First Run
Congrats on making it this far!

You have just a little more setup to complete:

0) Wait for setup in the terminal to finish. You'll know it's done when the .env file appears.
1) Modify this .env file with your discord client ID and token, everything else is optional.
1.5) If you're not going to use TripSit's dev guild, then change the guild ID.
2) In the top left of your window, in the file exporer, there are three dots: enable NPM Scripts
2.5) If you don't see this yet, be patient, wait for the codespace to load.
3) Run the 'deploy' script.
3.5) If this fails, run 'npx deploy' in the terminal.
4) Run the 'nodemon' script.
4.5) If this fails, run 'npx nodemon' in the terminal.
3) That's it! Start developing and have fun.

# Development Notes
## General
* Nodemon will restart every time you save a file
* If you create or update a command, make sure to run the deploy script again

## Commands
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
