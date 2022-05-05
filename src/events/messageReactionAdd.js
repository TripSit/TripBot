const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const guild_id = process.env.guildId;
const role_moderator_id = process.env.role_moderator;

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user, client) {
        // logger.debug(`[${PREFIX}] Reaction added`);
        // logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 2)}`);
        // logger.debug(`[${PREFIX}] User: ${JSON.stringify(user, null, 2)}`);
        // logger.debug(`[${PREFIX}] Client: ${JSON.stringify(client, null, 2)}`);

        // logger.debug(`[${PREFIX}] reaction1: ${JSON.stringify(reaction, null, 4)}`);
        // When a reaction is received, check if the structure is partial
        if (reaction.partial) {
            // If the message this reaction belongs to was removed, the fetching might result in an API error which should be handled
            try { await reaction.fetch(); }
            catch (err) { logger.error(`[${PREFIX}] reaction3: ${JSON.stringify(err, null, 4)}`); }
        }
        logger.debug(`[${PREFIX}] Reaction: ${JSON.stringify(reaction, null, 4)}`);
        const reaction_author = reaction.message.author;
        const reaction_emoji = reaction.emoji;
        const count = reaction.count;
        // logger.debug(`[${PREFIX}] guild_id: ${guild_id}`);
        // logger.debug(`[${PREFIX}] reaction.message.guild.id: ${reaction.message.guild.id}`);
        // If we're not in the TripSit guild, don't do this.
        if (reaction.message.guild.id !== guild_id) { return; }
        logger.debug(`[${PREFIX}] ${user.username} gave ${reaction_emoji.name} to ${reaction_author.username} in ${reaction.message.guild}!`);
        const command = client.commands.get('chitragupta');
        await command.execute('chitragupta', user, 1, reaction_emoji.toString(), reaction_author);
        if (count == 3 && reaction_emoji.name == 'ts_down') {
            if (reaction.message.member.isCommunicationDisabled()) { return; }
            logger.debug(`[${PREFIX}] ${user.username} has been downvoted three times, muting!`);
            // One week is the maximum time to mute
            const timeout_duration = 604800000;
            reaction.message.member.timeout(timeout_duration, `Was community quieted for saying "${reaction.message}"`);
            const moderator_role = reaction.message.guild.roles.cache.find(role => role.id === role_moderator_id);
            reaction.message.reply(`Hey ${moderator_role}s! ${reaction_author.username} was downvoted three times for this, please review!`);
        }
        // if (count == 3 && reaction_emoji.name == 'ts_up') {
        //     reaction.message.channel.send(`${reaction_author.username} has been upvoted three times, great work!`);
        // }
        return;
    },
};