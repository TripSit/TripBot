const PREFIX = require('path').parse(__filename).name;
const logger = require('../utils/logger.js');
const template = require('../utils/embed_template');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const guild_id = process.env.guildId;
const ts_flame_url = process.env.ts_flame_url;
const welcome_channel_id = process.env.channel_welcome;
const channel_start_id = process.env.channel_start;
const channel_botspam_id = process.env.channel_botspam;

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // console.log('guildMemberAdd');
        // console.log(member);
        if (member.guild.id === guild_id) {
            logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

            // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
            /* Start *INVITE* code */
            // To compare, we need to load the current invite list.
            const newInvites = await member.guild.invites.fetch();
            // const mappedArray = newInvites.map((invite) => [invite.code, invite.uses]);
            // const newInvitesString = newInvites.map((value, key) => `${key} => ${value}`);
            // logger.debug(`[${PREFIX}] newInvites: ${newInvitesString}`);
            // This is the *existing* invites for the guild.
            const oldInvites = client.invites.get(member.guild.id);
            // const oldInvitesString = oldInvites.map((value, key) => `${key} => ${value}`);
            // logger.debug(`[${PREFIX}] oldInvites: ${oldInvitesString}`);
            // Look through the invites, find the one for which the uses went up.
            const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
            // logger.debug(`[${PREFIX}] invite: ${invite}`);
            // This is just to simplify the message being sent below (inviter doesn't have a tag property)
            let footer_text = '';
            if (invite) {
                if (invite.inviter) {
                    const inviter = await client.users.fetch(invite.inviter.id);
                    if (inviter) {
                        footer_text = `Joined via the link in ${invite.channel.name} (${invite.code}-${invite.uses}).`;
                    }
                }
            }

            const diff = Math.abs(Date.now() - member.user.createdAt);
            const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
            const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
            const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            // logger.debug(`[${PREFIX}] diff: ${diff}`);
            // logger.debug(`[${PREFIX}] years: ${years}`);
            // logger.debug(`[${PREFIX}] months: ${months}`);
            // logger.debug(`[${PREFIX}] weeks: ${weeks}`);
            // logger.debug(`[${PREFIX}] days: ${days}`);
            // logger.debug(`[${PREFIX}] hours: ${hours}`);
            // logger.debug(`[${PREFIX}] minutes: ${minutes}`);
            // logger.debug(`[${PREFIX}] seconds: ${seconds}`);
            let color_value = 'RED';
            if (years > 0) {color_value = 'WHITE';}
            else if (years == 0 && months > 0) {color_value = 'PURPLE';}
            else if (months == 0 && weeks > 0) {color_value = 'BLUE';}
            else if (weeks == 0 && days > 0) {color_value = 'GREEN';}
            else if (days == 0 && hours > 0) {color_value = 'YELLOW';}
            else if (hours == 0 && minutes > 0) {color_value = 'ORANGE';}
            else if (minutes == 0 && seconds > 0) {color_value = 'RED';}
            logger.debug(`[${PREFIX}] color_value: ${color_value}`);
            // const random_topic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
            const welcome_channel = member.client.channels.cache.get(welcome_channel_id);
            const channel_start = member.client.channels.cache.get(channel_start_id);
            const channel_botspam = member.client.channels.cache.get(channel_botspam_id);
            logger.debug(`[${PREFIX}] channel_botspam: ${channel_botspam}`);
            const embed = template.embed_template()
                .setColor(color_value)
                .setDescription(`Welcome to the TripSit Network ${member}!\n\n We're a positive-enforced, harm-reduction space.\n\nTry checking out ${channel_start} to set your interests and color!\n\nPlease use ${channel_botspam} to access the bot's commands!\n\nStay safe!\n\n`);
            if (footer_text != '') {
                embed.setFooter({ text: footer_text, iconURL: ts_flame_url });
            }
            welcome_channel.send({ embeds: [embed] });
        }
    },
};
