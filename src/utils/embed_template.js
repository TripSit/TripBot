const { MessageEmbed } = require('discord.js');
if (process.env.NODE_ENV !== 'production') {require('dotenv').config();}
const ts_icon_url = process.env.ts_icon_url;
const ts_flame_url = process.env.ts_flame_url;
const disclaimer = process.env.disclaimer;

function embed_template() {
    return new MessageEmbed()
        .setAuthor({ name: 'TripSit.Me', iconURL: ts_icon_url, url: 'http://www.tripsit.me' })
        // .setThumbnail(ts_icon_url)
        // .setTitle('TITLE)
        // .setURL('https://tripsit.me/')
        .setColor('RANDOM')
        // .setDescription('DESCRIPTION')
        .setFooter({ text: disclaimer, iconURL: ts_flame_url });
}

exports.embed_template = embed_template;