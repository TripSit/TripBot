const PREFIX = require('path').parse(__filename).name;
// const { getFirestore } = require('firebase-admin/firestore');
const { MessageEmbed } = require('discord.js');
const logger = require('../utils/logger.js');
const fs = require('fs');
const raw_topics = fs.readFileSync('./src/assets/topics.json');
const topics = JSON.parse(raw_topics);
const guild_id = process.env.guildId;
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;
const welcome_channel_id = process.env.channel_welcome;

module.exports = {
    name: 'guildMemberAdd',
    async execute(member, client) {
        // console.log('guildMemberAdd');
        // console.log(member);
        if (member.guild.id === guild_id) {
            logger.info(`[${PREFIX}] ${member} joined guild: ${member.guild.name} (id: ${member.guild.id})`);

            const welcome_channel = member.client.channels.cache.get(welcome_channel_id);
            // (*INVITE*) https://github.com/AnIdiotsGuide/discordjs-bot-guide/blob/master/coding-guides/tracking-used-invites.md
            /* Start *INVITE* code */
            // To compare, we need to load the current invite list.
            const newInvites = await member.guild.invites.fetch();
            // const mappedArray = newInvites.map((invite) => [invite.code, invite.uses]);
            const newInvitesString = newInvites.map((value, key) => `${key} => ${value}`);
            logger.debug(`[${PREFIX}] newInvites: ${newInvitesString}`);
            // This is the *existing* invites for the guild.
            const oldInvites = client.invites.get(member.guild.id);
            const oldInvitesString = oldInvites.map((value, key) => `${key} => ${value}`);
            logger.debug(`[${PREFIX}] oldInvites: ${oldInvitesString}`);
            // Look through the invites, find the one for which the uses went up.
            const invite = newInvites.find(i => i.uses > oldInvites.get(i.code));
            logger.debug(`[${PREFIX}] invite: ${invite}`);
            // This is just to simplify the message being sent below (inviter doesn't have a tag property)
            let footer_text = 'I couldn\'t find through which invite.';
            if (invite) {
                if (invite.inviter) {
                    const inviter = await client.users.fetch(invite.inviter.id);
                    if (inviter) {
                        footer_text = `Joined via the link in ${invite.channel.name} (${invite.code}-${invite.uses}).`;
                    }
                }
            }

            const random_topic = topics[Math.floor(Math.random() * Object.keys(topics).length).toString()];
            const embed = new MessageEmbed()
                .setAuthor({ name: 'TripSit.Me ', url: 'http://www.tripsit.me', iconURL: ts_icon_url })
                .setColor('BLUE')
                .setDescription(`Welcome to the TripSit Network ${member}!\n\n We're a positive-enforced, harm-reduction space.\nHere's a random question to get to know you:\n\n${random_topic}`)
                .setFooter({ text: footer_text, iconURL: ts_flame_url });
            welcome_channel.send({ embeds: [embed] });
        }
    },
};
