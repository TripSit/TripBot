/* eslint-disable no-unused-vars */

export interface PwSubstance {
  name: string;
  url: string;
  featured: Boolean;
  effects: [Effect];
  experiences: [Experience];
  class: Class;
  tolerance: Tolerance;
  roa: Types;
  roas: [Roa];
  summary: string;
  images: [Image];
  addictionPotential: string;
  toxicity: [string];
  crossTolerances: [string];
  commonNames: [string];
  uncertainInteractions: [PwSubstance];
  unsafeInteractions: [PwSubstance];
  dangerousInteractions: [PwSubstance];
}

export type Class = {
  chemical: [Chemical]
  psychoactive: [Psychoactive]
};

export enum Psychoactive {
  Stimulants = 'Stimulants',
  Depressant = 'Depressant',
  Psychedelic = 'Psychedelic',
  Entactogen = 'Entactogen',
  Dissociatives = 'Dissociatives',
  Nootropic = 'Nootropic',
  Cannabinoid = 'Cannabinoid',
  Opioids = 'Opioids',
  Eugeroics = 'Eugeroics',
  Deliriant = 'Deliriant',
  Hallucinogens = 'Hallucinogens',
  Hypnotic = 'Hypnotic',
  Oneirogen = 'Oneirogen',
  Antipsychotic = 'Antipsychotic',
  Antidepressants = 'Antidepressants',
  'Atypical neuroleptic' = 'Atypical neuroleptic',
}

export enum Chemical {
  Amine = 'Amine',
  Alkanediol = 'Alkanediol',
  Diol = 'Diol',
  Lysergamides = 'Lysergamides',
  Amphetamine = 'Amphetamine',
  Aminoindane = 'Aminoindane',
  'Substituted amphetamines' = 'Substituted amphetamines',
  Arylcyclohexylamines = 'Arylcyclohexylamines',
  'Substituted phenethylamines' = 'Substituted phenethylamines',
  'Substituted benzofurans' = 'Substituted benzofurans',
  Alcohol = 'Alcohol',
  'Substituted phenidates' = 'Substituted phenidates',
  Phenylmorpholine = 'Phenylmorpholine',
  'Khat#1#' = 'Khat#1#',
  'Substituted tryptamines' = 'Substituted tryptamines',
  'Amino acid' = 'Amino acid',
  Indazolecarboxamide = 'Indazolecarboxamide',
  Adamantanes = 'Adamantanes',
  Indolecarboxylate = 'Indolecarboxylate',
  Xanthines = 'Xanthines',
  'Substituted cathinones' = 'Substituted cathinones',
  'Substituted pyrrolidines' = 'Substituted pyrrolidines',
  Indolecarboxamide = 'Indolecarboxamide',
  'Indole cannabinoid' = 'Indole cannabinoid',
  Anilidopiperidine = 'Anilidopiperidine',
  'Choline derivative' = 'Choline derivative',
  Benzodiazepines = 'Benzodiazepines',
  Racetams = 'Racetams',
  Benzhydryl = 'Benzhydryl',
  'Substituted tropanes' = 'Substituted tropanes',
  'Butyric acid' = 'Butyric acid',
  Indazole = 'Indazole',
  'Substituted morphinans' = 'Substituted morphinans',
  MDxx = 'MDxx',
  Cannabinoid = 'Cannabinoid',
  Carbamate = 'Carbamate',
  'Ammonium salt' = 'Ammonium salt',
  Imidazoline = 'Imidazoline',
  'Nitrogenous organic acid' = 'Nitrogenous organic acid',
  'Substituted aminorexes' = 'Substituted aminorexes',
  '4-oxazolidinone' = '4-oxazolidinone',
  Thienodiazepines = 'Thienodiazepines',
  'Substituted piperidines' = 'Substituted piperidines',
  Phenylpropylamine = 'Phenylpropylamine',
  'Ethanolamine#1#' = 'Ethanolamine#1#',
  Diarylethylamines = 'Diarylethylamines',
  Cyclopyrrolone = 'Cyclopyrrolone',
  Gabapentinoids = 'Gabapentinoids',
  Lactone = 'Lactone',
  Tetrahydroisoxazole = 'Tetrahydroisoxazole',
  Tetrahydroisoxazolopyridine = 'Tetrahydroisoxazolopyridine',
  Benzazepine = 'Benzazepine',
  Butyrophenone = 'Butyrophenone',
  'Inorganic molecule' = 'Inorganic molecule',
  Naphthoylindole = 'Naphthoylindole',
  'Indole alkaloids' = 'Indole alkaloids',
  'Substituted piperazines' = 'Substituted piperazines',
  Quinazolinone = 'Quinazolinone',
  Diphenylpropylamine = 'Diphenylpropylamine',
  Thiophene = 'Thiophene',
  Piperazinoazepine = 'Piperazinoazepine',
  Phenylpropenes = 'Phenylpropenes',
  Cysteine = 'Cysteine',
  Pyridine = 'Pyridine',
  Peptide = 'Peptide',
  Barbiturates = 'Barbiturates',
  Poppers = 'Poppers',
  Phenothiazine = 'Phenothiazine',
  Cycloalkylamines = 'Cycloalkylamines',
  Dibenzothiazepine = 'Dibenzothiazepine',
  Benzisoxazole = 'Benzisoxazole',
  Salvinorin = 'Salvinorin',
  Terpenoid = 'Terpenoid',
  Naphthoylindazole = 'Naphthoylindazole',
  'Purine alkaloid' = 'Purine alkaloid',
  'Amino acid analogue' = 'Amino acid analogue',
  'Tricyclic antidepressant' = 'Tricyclic antidepressant',
  Benzamide = 'Benzamide',
  Imidazopyridine = 'Imidazopyridine',
}

export type Tolerance = {
  full: string
  half: string
  zero: string
};

export interface Range {
  min: number
  max: number
  units?: string
}

export type Dose = {
  units: string
  threshold: number
  heavy: number
  common: Range
  light: Range
  strong: Range
};

export type Duration = {
  afterglow: Range
  comeup: Range
  duration: Range
  offset: Range
  onset: Range
  peak: Range
  total: Range
};

export type Roa = {
  name: string
  dose: Dose
  duration: Duration
  bioavailability: Range
};

export type Types = {
  oral: Roa
  sublingual: Roa
  buccal: Roa
  insufflated: Roa
  rectal: Roa
  transdermal: Roa
  subcutaneous: Roa
  intramuscular: Roa
  intravenous: Roa
  smoked: Roa
};

  type Image = {
    thumb: string
    image: string
  };

  type Effect = {
    name: string
    url: string
    substances: [PwSubstance]
    experiences: [Experience]
  };

  type Experience = {
    substances: [PwSubstance]
    effects: [Experience]
  };

  type Query = {
    substances(
      effect: string,
      query: string,
      chemicalClass: string,
      psychoactiveClass: string,
      limit: number | 10,
      offset: number | 10,
    ): [PwSubstance]
    substances_by_effect(
      effect: [string],
      limit: number | 50,
      offset: number | 0,
    ): [PwSubstance]
    effects_by_substance(
      substance: string,
      limit: number | 50,
      offset: number | 0
    ): [Effect]
    experiences(
      substances_by_effect: string,
      effects_by_substance: string,
      substance: string
    ): [Experience]
  };
