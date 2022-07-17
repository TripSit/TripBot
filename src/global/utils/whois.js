const logger = require('./logger');
const PREFIX = require('path').parse(__filename).name;
const { stripIndents } = require('common-tags');

module.exports = {

    async whois(target) {

        let data = null;

        if(global.ircClient) {
            await global.ircClient.whois(target, async resp => {
                data = resp;
            });
        } else {
            logger.debug(`[${PREFIX}] Failed! IRC Client not running`);
            throw new Error('IRC Client not running!');
        }

        // This is a hack substanc3 helped create to get around the fact that the whois command
        // is asyncronous by default, so we need to make this syncronous
        while (data === null) {
            await new Promise(resolve => setTimeout(resolve, 100)); // eslint-disable-line
          }

        if(!data.host) {
            logger.debug(`[${PREFIX}] Failed! ${target} not found on IRC.`);
            throw new Error('User not found on IRC!');
        }

        return stripIndents`
        **${data.nick}** (${data.user}@${data.host}) ${data.account ? `${data.accountinfo} ${data.account}` : ''}
        Channels include: ${data.channels.join(', ')}
      `;



    }

}