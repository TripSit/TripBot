# TripBot First Run
Congrats on making it this far!

You have just a little more setup to complete:

0) Wait for setup in the terminal to finish. You'll know it's done when you see the "Welcome to codespace!" message.
1) The bot starts automatically once the container is up (via the `postStartCommand` in `devcontainer.json`), compiling
   with `tsc-watch` and running in a `tmux` session. Open NPM Scripts via the hamburger dots in the top left and run
   `tripbot:logs` to attach to it and see the output.
1.1) If you see errors about a missing token or similar, update your GitHub Codespace secrets to match `.env.example`.
1.2) At minimum you need your Discord client ID and token; everything else is optional.
1.3) If you're not going to use TripSit's dev guild, change the guild ID.
2) Run the `tripbot:deployCommands` script to register the bot's slash commands with your bot application. You'll need
   to re-run this any time you add a command or change an existing command's options.
3) That's it! Start developing and have fun. The changes you make to the `src` folder will be reflected in the
   container and trigger an automatic rebuild/restart.
