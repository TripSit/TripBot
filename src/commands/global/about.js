const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Shows information about this bot!'),
    async execute(interaction) {
        const embed = template.embed_template()
            .setColor('DARK_BLUE')
            .setTitle('About TripSit')
            .setURL('https://tripsit.me/about/')
            .setDescription(
                'This app is created by TripSit, an organisation which helps to provide factual information about \
            drugs and how to reduce the harms involved in using them.',
            )
            .addFields(
                {
                    name: 'Disclaimer',
                    value: 'Although we have a team dedicated to keeping the information on this app up to date, it is not \
                always possible to provide entirely accurate information on the safety level of drugs. The \
                information here should be used as guidelines only, and it is important to do your own research from \
                multiple sources before ingesting a substance. We also strongly advise using a testing kit and scales \
                to ensure you are taking the correct dosage. These can both be bought online for reasonable prices.',
                },
                {
                    name: 'Support TripSit',
                    value: '\
                    TripSit is a completely free service run by volunteers.\
                    If you wish to help out, feel free to join the IRC or the Discord,\
                    follow and share our content on social media, or make a donation to keep \
                    the servers running.',
                },
                {
                    name: 'Feedback',
                    value: '\
                    We would love to hear your feedback on this bot!\n\
                    Join the TripSit discord and talk with Moonbear!\n\
                    Or use the /bug command and to send a message!\n\
                    https://discord.gg/TripSit\
                    ',
                },
                {
                    name: 'Credits',
                    value: '\
                    The bot is built using the Discord.js library: https://discordjs.guide/\n\
                    A majority of this code is original, and is available on GitHub: https://github.com/tripsit/tripsit-discord-bot\n\
                    The data is sourced from the TripSit and Psychonaut Wiki API combined: https://github.com/NoahSaso/merge-psychonautwiki-tripsit-data\n\
                    The DXM calculator comes from Tripsit: https://github.com/TripSit/DXM-Calculator\n\
                    The Benzo calculator comes from Tripsit: https://github.com/TripSit/Benzo-Calculator\n\
                    The Ketamine calculator and pill_id code was inspired by: https://github.com/v0idp/PsyBot\n\
                    The LSD calculator info was inspired from: https://codepen.io/cyberoxide/pen/BaNarGd\n\
                    The actual research for the LSD calculator: https://www.reddit.com/r/LSD/comments/4dzh9s/lsd_tolerance_calculator_improved/\n\
                    ',
                },
            );
        try {
            logger.debug(`[${PREFIX}] replied: ${interaction.replied}`);
            if (!interaction.replied) {
                interaction.reply({ embeds: [embed], ephemeral: false });
            }
            else {
                interaction.followUp({ embeds: [embed], ephemeral: false });
            }
        }
        catch (err) {
            logger.error(`[${PREFIX}] ${err}`);

        }
        logger.debug(`[${PREFIX}] finished!`);
        return;
    },
};
