const PREFIX = require('path').parse(__filename).name;

module.exports = {
    name: 'messageReactionRemove',
    execute(reaction, user, logger, client) {
        logger.debug(`[${PREFIX}] Reaction removed`);
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            logger.debug(`[${PREFIX}] Reaction is partial`);
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            reaction.fetch()
                .then(() => {
                    logger.debug(`[${PREFIX}] reaction2: ${JSON.stringify(reaction, null, 4)}`);
                    const reaction_author = reaction.message.author;
                    const reaction_emoji = reaction.emoji;
                    console.log(`${user.username} took ${reaction_emoji.name} to ${reaction_author.username} in ${reaction.message.guild}!`);
                    const command = client.commands.get('chitragupta');
                    command.execute('chitragupta', logger, user, -1, reaction_emoji.toString(), reaction_author);
                    return;
                })
                .catch((err) => {
                    // Do something with the Error object, for example, console.error(err);
                    logger.error(`[${PREFIX} ${err}]
                    reaction3: ${JSON.stringify(reaction, null, 4)}`);
                });
        }
        else {
            // Now the message has been cached and is fully available
            const reaction_author = reaction.message.author;
            const reaction_remoji = reaction.emoji;
            console.log(`${user.username} took ${reaction_remoji.name} from ${reaction_author.username} in ${reaction.message.guild}!`);
            const command = client.commands.get('chitragupta');
            command.execute('chitragupta', logger, user, -1, reaction_remoji.toString(), reaction_author);
        }
    },
};