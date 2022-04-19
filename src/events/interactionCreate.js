const fs = require('node:fs');
const PREFIX = require('path').parse(__filename).name;
const Fuse = require('fuse.js');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}
const ownerId = process.env.ownerId;
const guildId = process.env.guildId;

const cooldown = new Set();
// /This is 1 minute, you can change it to whatever value
const cooldown_seconds = 5;
const cooldownTime = cooldown_seconds * 1000;

const raw_drug_data = fs.readFileSync('./src/assets/allDrugData.json');
const allDrugData = JSON.parse(raw_drug_data);

module.exports = {
    name: 'interactionCreate',
    execute(interaction, logger, client) {
        // print what the user typed in the interaction
        logger.debug(`[${PREFIX}] ${interaction.user.username} (${interaction.user.id}) started: ${interaction.message}`);

        // check if the user is a bot and if so, ignore it
        if (interaction.user.bot) {
            logger.debug(`[${PREFIX}] Ignoring bot interaction`);
            return;
        }
        const db_name = 'ts_data.json';
        const raw_ts_data = fs.readFileSync(`./src/assets/${db_name}`);
        const ts_data = JSON.parse(raw_ts_data);
        const blacklist_users = ts_data.blacklist.users;

        // Check if the user is in blacklist_users and if so, ignore it
        logger.debug(`[${PREFIX}] blacklist_users: ${blacklist_users}`);
        if (blacklist_users.includes(interaction.member.id)) {
            logger.info(`[${PREFIX}] ${interaction.member.username}#${interaction.member.discriminator} (${interaction.member.id}) is banned from using commands.`);
            return interaction.reply('You are banned from using commands.');
        }
        logger.debug(`[${PREFIX}] ${interaction.user.username} is not banned!`);

        // check if the interaction is a request for autocomplete
        if (interaction.isAutocomplete()) {
            const options = {
                shouldSort: true,
                keys: [
                    'name',
                    'aliasesStr',
                ],
            };

            // For each dictionary in the allDrugData list, find the "name" key and add it to a list
            const drugNames = allDrugData.map(d => d.name);
            // logger.debug(`[${PREFIX}] drugNames: ${drugNames}`);

            const fuse = new Fuse(drugNames, options);

            const focusedValue = interaction.options.getFocused();

            const results = fuse.search(focusedValue);
            // logger.debug(`[${PREFIX}] results: ${results}`);

            let top_25 = [];
            if (results.length > 0) {
                top_25 = results.slice(0, 25);
                // logger.debug(`[${PREFIX}] top_25: ${top_25}`);
                // for (const result of top_25) {
                // 	logger.debug(`[${PREFIX}] result: ${result.item}`);
                // }
                // await interaction.respond(
                //     top_25.map(choice => ({ name: choice.item, value: choice.item })),
                // );
                interaction.respond(
                    top_25.map(choice => ({ name: choice.item, value: choice.item })),
                );
            }
            else {
                const TOP_PSYCHS = ['Cannabis', 'MDMA', 'LSD', 'DMT', 'Mushrooms'];
                const TOP_DISSOS = ['Zolpidem', 'Ketamine', 'DXM', 'PCP', 'Salvia'];
                const TOP_OPIATE = ['Alcohol', 'Hydrocodone', 'Oxycodone', 'Tramadol', 'Heroin'];
                const TOP_BENZOS = ['Alprazolam', 'Clonazepam', 'Diazepam', 'Lorazepam', 'Flunitrazepam'];
                const TOP_SPEEDS = ['Nicotine', 'Amphetamine', 'Cocaine', 'Methamphetamine', 'Methylphenidate'];
                const TOP_DRUGS = TOP_PSYCHS.concat(TOP_DISSOS, TOP_OPIATE, TOP_BENZOS, TOP_SPEEDS);
                interaction.respond(
                    TOP_DRUGS.map(choice => ({ name: choice, value: choice })),
                );
            }
        }

        // check if the interaction is a button press
        if (interaction.isButton()) {
            const buttonID = interaction.customId;
            logger.debug(`[${PREFIX}] buttonID: ${buttonID}`);
            const command = client.commands.get(interaction.customId);
            logger.debug(`[${PREFIX}] command: ${command}`);
            if (!command) return;

            try {
                logger.debug(`[${PREFIX}] Executing command: ${command.name}`);
                command.execute(interaction, logger);
            }
            catch (error) {
                logger.error(error);
                interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
            return;
        }

        // Cooldown logic
        if (interaction.user.id !== ownerId) {
            if (cooldown.has(interaction.user.id)) {
            // / If the cooldown did not end
                interaction.reply({ content: 'Don\'t be a coconut ( ͡° ͜ʖ ͡°)', ephemeral: true });
                return;
            }
            else {
            // Set cooldown
                cooldown.add(interaction.user.id);
                setTimeout(() => {
                // Removes the user from the set after 1 minute
                    cooldown.delete(interaction.user.id);
                }, cooldownTime);
            }
        }

        // Failsafe to make sure only commands get past this point
        if (!interaction.isCommand()) return;
        logger.debug(`[${PREFIX}] isCommand`);

        const commandName = interaction.commandName;

        const command = client.commands.get(commandName);
        if (!command) return;

        const commands_tripsit = ['tripsit', 'karma', 'tripsitme'];
        // const commands_global = ['about', 'breathe', 'chitragupta', 'combo', 'contact', 'hydrate', 'info', 'kipp', 'topic'];
        const commands_admin = ['button', 'gban', 'gunban', 'uban', 'uunban', 'test'];
        const commands_pm = ['idose'];

        // Check if the command is in commands_admin list and then check to see if the user is moonbear
        if (commands_admin.includes(commandName) && interaction.user.id !== ownerId) {
            interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            return;
        }

        // Check if the command is in the commands_tripsit list and then check to see if the guilds = tripsit
        if (commands_tripsit.includes(commandName)) {
            logger.debug(`[${PREFIX}] int.guild.id: ${interaction.guild.id}`);
            logger.debug(`[${PREFIX}] guildId: ${guildId}`);
            if (interaction.guild.id !== guildId && interaction.user.id !== ownerId) {
                interaction.reply({ content: 'This command is only available in the Tripsit server.', ephemeral: true });
                return;
            }
        }

        // Check if the command is in the commands_pm list and check if the command came in from a DM
        if (commands_pm.includes(commandName)) {
            if (!interaction.isDM && interaction.user.id !== ownerId) {
                interaction.reply({ content: 'This command is only available in DMs.', ephemeral: true });
                return;
            }
        }

        try {
            command.execute(interaction, logger);
        }
        catch (error) {
            logger.error(error);
            interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};