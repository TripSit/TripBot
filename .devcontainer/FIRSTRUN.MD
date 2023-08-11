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
