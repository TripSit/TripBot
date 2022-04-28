const commando = require('discord.js-commando');

// Calculate weight in pounds
function calculateWeight(weight, isKilos) {
    if (isKilos) {
        return Math.floor(weight * 2.2);
    }
    else {
        return weight;
    }
}

// Calculate insufflated dosages
function generateInsufflatedDosages(weight, isKilos) {
    const weightInLbs = calculateWeight(weight, isKilos);
    const dosageArray = [];

    dosageArray.push(`**Threshold**: ${Math.round(weightInLbs * 0.1)}mg`);
    dosageArray.push(`**Light**: ${Math.round(weightInLbs * 0.15)}mg`);
    dosageArray.push(`**Common**: ${Math.round(weightInLbs * 0.3)}mg`);
    dosageArray.push(`**Strong**: ${Math.round(weightInLbs * 0.5)}-${Math.round(weightInLbs * 0.75)}mg`);
    dosageArray.push(`**K-hole**: ${weightInLbs}mg`);

    return dosageArray.join('\n');
}

// Calculate rectal dosages
function generateRectalDosages(weight, isKilos) {
    const weightInLbs = calculateWeight(weight, isKilos);
    const dosageArray = [];

    dosageArray.push(`**Threshold**: ${Math.round(weightInLbs * 0.3)}mg`);
    dosageArray.push(`**Light**: ${Math.round(weightInLbs * 0.6)}mg`);
    dosageArray.push(`**Common**: ${Math.round(weightInLbs * 0.75)}-${Math.round(weightInLbs * 2)}mg`);
    dosageArray.push(`**Strong**: ${Math.round(weightInLbs * 2)}-${Math.round(weightInLbs * 2.5)}mg`);
    dosageArray.push(`**K-hole**: ${Math.round(weightInLbs * 3)}-${Math.round(weightInLbs * 4)}mg`);

    return dosageArray.join('\n');
}

module.exports = class ketacalcCommand extends commando.Command {
    constructor(client) {
        super(client, {
            'name': 'ketacalc',
            'memberName': 'ketacalc',
            'aliases': ['ketaminecalc'],
            'group': 'everyone',
            'description': 'calculate the various ketamine doses by your weight',
            'examples': ['ketacalc 200'],
            'guildOnly': false,
            'argsPromptLimit': 0,

            'args': [
                {
                    'key': 'weight',
                    'prompt': 'what was your previous dosage ?',
                    'type': 'string',
                },
                {
                    'key': 'units',
                    'prompt': 'is the weight you entered in kg?',
                    'type': 'string',
                    'default': 'null',
                },
            ],
        });
    }

    run(msg, args) {

        // parse weight from result
        const weight = parseInt(args.weight);
        let weightIsKilos = false;
        let unit = args.units;
        if (args.units === 'null') {
            const unitregex = /\d+(\D+)/;
            const unitmatched = args.weight.toString().match(unitregex);
            if (unitmatched) {
                unit = unitmatched[1];
            }
        }
        if (unit.includes('kg')) {
            weightIsKilos = true;
            unit = 'kg';
        }
        else {
            unit = 'lbs';
        }

        if (!unit.includes('kg') && !unit.includes('lbs')) {
            return msg.say('Please enter a valid weight.');
        }
        if (unit === 'kg' && weight > 179) {
            return msg.say('Please enter a valid weight.');
        }
        if (unit === 'lbs' && weight > 398) {
            return msg.say('Please enter a valid weight.');
        }

        const insufflatedosearray = generateInsufflatedDosages(weight, weightIsKilos);
        const boofdosearray = generateRectalDosages(weight, weightIsKilos);

        return msg.say({ embed: {
            color: 3447003,
            author: {
                name: this.client.user.username,
                icon_url: this.client.user.avatarURL,
            },
            description: `Dosages for your entered weight of: **${weight}${unit}**`,
            title: 'Personalized Ketamine Dosage Calculator',
            fields: [
                {
                    name: 'Insufflated Dosages',
                    value: `${insufflatedosearray}`,
                    inline: true,
                },
                {
                    name: 'Boof/Oral Dosages',
                    value: `${boofdosearray}`,
                    inline: true,
                },
            ],
            timestamp: new Date(),
            footer: {
                text: 'This is just a guideline. Please use drugs responsibly.',
                icon_url: this.client.user.avatarURL,
            },
        },
        });
    }
};