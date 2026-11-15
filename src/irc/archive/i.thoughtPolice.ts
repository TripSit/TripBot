import { Message } from "discord.js";

const F = f(__filename);

export default async function(message:Message) {
    log.debug(F, `started!`);
    log.debug(F, `message: ${JSON.stringify(message, null, 2)}`);
    // {
    //   "prefix": "Moonbear!~teknos@tripsit/founder/Teknos",
    //   "nick": "Moonbear",
    //   "user": "~teknos",
    //   "host": "tripsit/founder/Teknos",
    //   "command": "PRIVMSG",
    //   "rawCommand": "PRIVMSG",
    //   "commandType": "normal",
    //   "args": [
    //     "#sandbox-dev",
    //     "lkasjdl;kfj;alksdjfl;kajsl;dkfjal;ksdjfl;kajs;ldfjl;kj;lkj"
    //   ]
    // }
  }
