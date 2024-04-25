export interface OpioidProperties {
  name: string;
  conversionFactor: number;
  duration?: string;
  aliases: string[];
  notes?: string;
  equivDose30mgMorphine?: number;
  converter?(dosage: number, toOpioid: string): number | null;
}

export const opioids: OpioidProperties[] = [
  {
    name: 'codeine',
    conversionFactor: 0.15,
    duration: '4-6 hours',
    aliases: ['codeine', 'lean', 'purple drank', 'syrup'],
    notes: 'Be cautious if taking a large dose, as Tylenol usually exists in codeine pills/syrups.',
    equivDose30mgMorphine: 200,
  },
  {
    name: 'hydrocodone',
    conversionFactor: 1,
    duration: '3-6 hours',
    equivDose30mgMorphine: 30,
    aliases: ['vicodin', 'lortab', 'tussionex', 'hydros'],
  },
  {
    name: 'hydromorphone',
    conversionFactor: 4,
    duration: '4-5 hours',
    equivDose30mgMorphine: 7.5,
    aliases: ['hydromorphone', 'diluadid', 'dillies'],
  },
  {
    name: 'morphine',
    conversionFactor: 1,
    duration: '3-6 hours',
    equivDose30mgMorphine: 30,
    aliases: ['morphine'],
  },
  {
    name: 'oxycodone',
    conversionFactor: 1.5,
    duration: '4-6 hours',
    equivDose30mgMorphine: 20,
    aliases: ['morphine'],
  },
  {
    name: 'oxymorphone',
    conversionFactor: 3,
    duration: '3-6 hours',
    equivDose30mgMorphine: 10,
    aliases: ['oxymorphone'],
  },
  {
    name: 'methadone',
    conversionFactor: 8,
    notes: 'The conversion factor increases as dose increases!',
    aliases: ['methadone'],
    converter(dosage, toOpioid) {
      let conversionFactor: number = 8; // most common dosage
      if (dosage <= 20) {
        conversionFactor = 4;
        this.conversionFactor = conversionFactor;
        this.equivDose30mgMorphine = 7.5;
      } else if (dosage > 20 && dosage <= 40) {
        conversionFactor = 8;
        this.conversionFactor = conversionFactor;
        this.equivDose30mgMorphine = 3.75;
      } else if (dosage > 40 && dosage <= 60) {
        conversionFactor = 10;
        this.conversionFactor = conversionFactor;
        this.equivDose30mgMorphine = 3;
      } else if (dosage > 60) {
        conversionFactor = 12;
        this.conversionFactor = conversionFactor;
        this.equivDose30mgMorphine = 2.5;
      }

      const toOpioidCleaned = toOpioid.trim().toLowerCase();

      const MMES_OPIOID1: number = dosage * conversionFactor;
      const TO_OPIOID = opioids.find(o => o.aliases.includes(toOpioidCleaned));
      if (!TO_OPIOID) {
        return null;
      }
      const MMES_OPIOID2 = MMES_OPIOID1 / TO_OPIOID.conversionFactor;
      return MMES_OPIOID2 * 0.75; // reducing dose by 25% as per CDC.gov conversion table
    },
  },
];
