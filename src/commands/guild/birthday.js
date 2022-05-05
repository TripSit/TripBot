const { SlashCommandBuilder } = require('@discordjs/builders');
const logger = require('../../utils/logger.js');
const PREFIX = require('path').parse(__filename).name;
const template = require('../../utils/embed_template');
const { get_user_info } = require('../../utils/get_user_info');
const { set_user_info } = require('../../utils/set_user_info');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Get birthday info!')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set your own birthday')
                .addStringOption(option => option
                    .setRequired(true)
                    .setName('month')
                    .setDescription('Month value')
                    .addChoice('January', 'January')
                    .addChoice('February', 'February')
                    .addChoice('March', 'March')
                    .addChoice('April', 'April')
                    .addChoice('May', 'May')
                    .addChoice('June', 'June')
                    .addChoice('July', 'July')
                    .addChoice('August', 'August')
                    .addChoice('September', 'September')
                    .addChoice('October', 'October')
                    .addChoice('November', 'November')
                    .addChoice('December', 'December'),
                )
                .addIntegerOption(option => option
                    .setName('day')
                    .setDescription('Day value')
                    .setRequired(true),
                ),
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('get')
                .setDescription('Get someone\'s birthday!')
                .addUserOption(option => option.setName('user').setDescription('User to lookup!').setRequired(true)),
        ),
    async execute(interaction) {
        const embed = template.embed_template();
        const month = interaction.options.getString('month');
        const day = interaction.options.getInteger('day');

        const month_30 = ['April', 'June', 'September', 'November'];
        const month_31 = ['January', 'March', 'May', 'July', 'August', 'October', 'December'];
        if (month_30.includes(month) && day > 30) {
            embed.setDescription(`${month} only has 30 days!`);
            interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        if (month_31.includes(month) && day > 31) {
            embed.setDescription(`${month} only has 31 days!`);
            interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        if (month == 'February' && day > 28) {
            embed.setDescription('February only has 28 days!');
            interaction.reply({ embeds: [embed], ephemeral: true });
            return;
        }
        const birthday = [month, day];

        let target = interaction.options.getMember('user');
        if (!target) {target = interaction.member;}
        const actor = interaction.member;

        let command = '';
        try {
            command = interaction.options.getSubcommand();
        }
        catch (err) {
            command = 'get';
        }

        if (command == 'set') {
            logger.debug(`${PREFIX} Birthday: ${month} ${day}`);

            const actor_results = await get_user_info(actor);
            const actor_data = actor_results[0];
            if ('birthday' in actor_data) {
                if (actor_data.birthday == birthday) {

                    embed.setDescription(`${birthday[0]} ${birthday[1]} already is your birthday, you don't need to update it!`);
                    interaction.reply({ embeds: [embed], ephemeral: true });
                    logger.debug(`[${PREFIX}] Done!!`);
                    return;
                }
            }

            actor_data['birthday'] = birthday;

            await set_user_info(actor_results[1], actor_data);

            embed.setDescription(`I set your birthday to ${birthday[0]} ${birthday[1]}`);
            interaction.reply({ embeds: [embed], ephemeral: true });
            logger.debug(`[${PREFIX}] Done!!`);
            return;
        }
        if (command == 'get') {
            let stored_date = [];

            const target_results = await get_user_info(target);
            const target_data = target_results[0];

            if ('birthday' in target_data) {
                stored_date = target_data.birthday;
            }
            logger.debug(`[${PREFIX}] Birthday: ${stored_date}`);

            if (!stored_date[0]) {
                embed.setDescription(`${target.user.username} is ageless (and has not set a birthday)!`);
                interaction.reply({ embeds: [embed], ephemeral: false });
                logger.debug(`[${PREFIX}] Done!!`);
                return;
            }

            // get the user's timezone from the database
            embed.setDescription(`${target.user.username} was born on ${stored_date[0]} ${stored_date[1]}`);
            if (!interaction.replied) { interaction.reply({ embeds: [embed], ephemeral: false });}
            else {interaction.followUp({ embeds: [embed], ephemeral: false });}
            logger.debug(`[${PREFIX}] finished!`);
            return;
        }
    },
};
