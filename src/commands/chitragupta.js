const fs = require('node:fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const PREFIX = require('path').parse(__filename).name;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chitragupta')
        .setDescription('Keep it positive please!'),

    async execute(interaction, logger, actor, action, emoji, target) {
        logger.debug(`[${PREFIX}] ${actor} ${action} ${emoji} ${target}!`);

        const db_name = 'ts_data.json';
        const RAW_TS_DATA = fs.readFileSync(`./src/assets/${db_name}`);
        const ALL_TS_DATA = JSON.parse(RAW_TS_DATA);

        let actorData = ALL_TS_DATA['users'][actor.id];
        // logger.debug(`[${PREFIX}] actorData: ${JSON.stringify(actorData, null, 4)}`);

        // Check if the patient data exists, if not create a blank one
        if (!actorData) {
            logger.debug(`[${PREFIX}] No actor data found, creating a blank one`);
            actorData = {
                'name': actor.username,
                'discriminator': actor.discriminator,
                'roles': [],
                'karma_given': {},
                'karma_received': {},
            };
        }
        const karma_given = actorData['karma_given'];
        if (!karma_given[emoji]) {
            logger.debug(`[${PREFIX}] No karma_given data found, creating a blank one`);
            if (action === 1) {
                karma_given[emoji] = 1;
            }
            else {
                karma_given[emoji] = 0;
            }
        }
        else {
            logger.debug(`[${PREFIX}] karma_given data found, incrementing`);
            karma_given[emoji] += action;
        }
        actorData['karma_given'] = karma_given;
        ALL_TS_DATA['users'][actor.id] = actorData;

        fs.writeFile(`src/assets/${db_name}`, JSON.stringify(ALL_TS_DATA, null, 4), function(err) {
            if (err) {
                console.log(err);
            }
        });

        let targetData = ALL_TS_DATA['users'][target.id];
        // logger.debug(`[${PREFIX}] targetData: ${JSON.stringify(targetData, null, 4)}`);

        // Check if the patient data exists, if not create a blank one
        if (!targetData) {
            logger.debug(`[${PREFIX}] No target data found, creating a blank one`);
            targetData = {
                'name': target.username,
                'discriminator': target.discriminator,
                'roles': [],
                'karma_given': {},
                'karma_received': {},
            };
        }
        const karma_received = targetData['karma_received'];
        if (!karma_received[emoji]) {
            logger.debug(`[${PREFIX}] No karma_received data found, creating a blank one`);
            if (action === 1) {
                karma_received[emoji] = 1;
            }
            else {
                karma_received[emoji] = 0;
            }
        }
        else {
            logger.debug(`[${PREFIX}] karma_received data found, incrementing`);
            karma_received[emoji] += action;
        }

        targetData['karma_received'] = karma_received;
        ALL_TS_DATA['users'][target.id] = targetData;

        fs.writeFile(`src/assets/${db_name}`, JSON.stringify(ALL_TS_DATA, null, 4), function(err) {
            if (err) {
                console.log(err);
            }
        });
    },
};
