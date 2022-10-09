/* eslint-disable no-unused-vars */

export interface PwSubstance {
  name: String;
  url: String;
  featured: Boolean;
  effects: [Effect];
  experiences: [Experience];
  class: SubstanceClass;
  tolerance: SubstanceTolerance;
  roa: SubstanceRoaTypes;
  roas: [SubstanceRoa];
  summary: String;
  images: [SubstanceImage];
  addictionPotential: String;
  toxicity: [String];
  crossTolerances: [String];
  commonNames: [String];
  uncertainInteractions: [PwSubstance];
  unsafeInteractions: [PwSubstance];
  dangerousInteractions: [PwSubstance];
}

export type SubstanceClass = {
  chemical: [String]
  psychoactive: [String]
}

export type SubstanceTolerance = {
  full: String
  half: String
  zero: String
}

export interface RoaRange {
  min: number
  max: number
  units?: string
}


export type SubstanceRoaDose = {
  units: String
  threshold: number
  heavy: number
  common: RoaRange
  light: RoaRange
  strong: RoaRange
}

  type SubstanceRoaDuration = {
    afterglow: RoaRange
    comeup: RoaRange
    duration: RoaRange
    offset: RoaRange
    onset: RoaRange
    peak: RoaRange
    total: RoaRange
  }

  type SubstanceRoa = {
    name: String
    dose: SubstanceRoaDose
    duration: SubstanceRoaDuration
    bioavailability: RoaRange
  }

  type SubstanceRoaTypes = {
    oral: SubstanceRoa
    sublingual: SubstanceRoa
    buccal: SubstanceRoa
    insufflated: SubstanceRoa
    rectal: SubstanceRoa
    transdermal: SubstanceRoa
    subcutaneous: SubstanceRoa
    intramuscular: SubstanceRoa
    intravenous: SubstanceRoa
    smoked: SubstanceRoa
  }

  type SubstanceImage = {
    thumb: String
    image: String
  }

  type Effect = {
    name: String
    url: String
    substances: [PwSubstance]
    experiences: [Experience]
  }

  type Experience = {
    substances: [PwSubstance]
    effects: [Experience]
  }

  type Query = {
    substances(
      effect: String,
      query: String,
      chemicalClass: String,
      psychoactiveClass: String,
      limit: number | 10,
      offset: number | 10,
    ): [PwSubstance]
    substances_by_effect(
      effect: [String],
      limit: number | 50,
      offset: number | 0,
    ): [PwSubstance]
    effects_by_substance(
      substance: String,
      limit: number | 50,
      offset: number | 0
    ): [Effect]
    experiences(
      substances_by_effect: String,
      effects_by_substance: String,
      substance: String
    ): [Experience]
  }
