'use strict';

// Calculate insufflated dosages
function generateInsufflatedDosages(weightInLbs) {
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.1)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.15)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 0.5)}-${Math.round(weightInLbs * 0.75)}mg`,
    `**K-hole**: ${weightInLbs}mg`,
  ]
    .join('\n');
}

// Calculate rectal dosages
function generateRectalDosages(weightInLbs) {
  return [
    `**Threshold**: ${Math.round(weightInLbs * 0.3)}mg`,
    `**Light**: ${Math.round(weightInLbs * 0.6)}mg`,
    `**Common**: ${Math.round(weightInLbs * 0.75)}-${Math.round(weightInLbs * 2)}mg`,
    `**Strong**: ${Math.round(weightInLbs * 2)}-${Math.round(weightInLbs * 2.5)}mg`,
    `**K-hole**: ${Math.round(weightInLbs * 3)}-${Math.round(weightInLbs * 4)}mg`,
  ]
    .join('\n');
}

module.exports = {

  async calc(weight, unit) {
    const calcWeight = unit === 'kg' ? weight * 2.20462 : weight;
    return {
      insufflated: generateInsufflatedDosages(calcWeight),
      rectal: generateRectalDosages(calcWeight),
    };
  },

};
