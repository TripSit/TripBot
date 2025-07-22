export enum Chemical {
  '4-oxazolidinone' = '4-oxazolidinone',
  Adamantanes = 'Adamantanes',
  Alcohol = 'Alcohol',
  Alkanediol = 'Alkanediol',
  Amine = 'Amine',
  'Amino acid' = 'Amino acid',
  'Amino acid analogue' = 'Amino acid analogue',
  Aminoindane = 'Aminoindane',
  'Ammonium salt' = 'Ammonium salt',
  Amphetamine = 'Amphetamine',
  Anilidopiperidine = 'Anilidopiperidine',
  Arylcyclohexylamines = 'Arylcyclohexylamines',
  Barbiturates = 'Barbiturates',
  Benzamide = 'Benzamide',
  Benzazepine = 'Benzazepine',
  Benzhydryl = 'Benzhydryl',
  Benzisoxazole = 'Benzisoxazole',
  Benzodiazepines = 'Benzodiazepines',
  'Butyric acid' = 'Butyric acid',
  Butyrophenone = 'Butyrophenone',
  Cannabinoid = 'Cannabinoid',
  Carbamate = 'Carbamate',
  'Choline derivative' = 'Choline derivative',
  Cycloalkylamines = 'Cycloalkylamines',
  Cyclopyrrolone = 'Cyclopyrrolone',
  Cysteine = 'Cysteine',
  Diarylethylamines = 'Diarylethylamines',
  Dibenzothiazepine = 'Dibenzothiazepine',
  Diol = 'Diol',
  Diphenylpropylamine = 'Diphenylpropylamine',
  'Ethanolamine#1#' = 'Ethanolamine#1#',
  Gabapentinoids = 'Gabapentinoids',
  Imidazoline = 'Imidazoline',
  Imidazopyridine = 'Imidazopyridine',
  Indazole = 'Indazole',
  Indazolecarboxamide = 'Indazolecarboxamide',
  'Indole alkaloids' = 'Indole alkaloids',
  'Indole cannabinoid' = 'Indole cannabinoid',
  Indolecarboxamide = 'Indolecarboxamide',
  Indolecarboxylate = 'Indolecarboxylate',
  'Inorganic molecule' = 'Inorganic molecule',
  'Khat#1#' = 'Khat#1#',
  Lactone = 'Lactone',
  Lysergamides = 'Lysergamides',
  MDxx = 'MDxx',
  Naphthoylindazole = 'Naphthoylindazole',
  Naphthoylindole = 'Naphthoylindole',
  'Nitrogenous organic acid' = 'Nitrogenous organic acid',
  Peptide = 'Peptide',
  Phenothiazine = 'Phenothiazine',
  Phenylmorpholine = 'Phenylmorpholine',
  Phenylpropenes = 'Phenylpropenes',
  Phenylpropylamine = 'Phenylpropylamine',
  Piperazinoazepine = 'Piperazinoazepine',
  Poppers = 'Poppers',
  'Purine alkaloid' = 'Purine alkaloid',
  Pyridine = 'Pyridine',
  Quinazolinone = 'Quinazolinone',
  Racetams = 'Racetams',
  Salvinorin = 'Salvinorin',
  'Substituted aminorexes' = 'Substituted aminorexes',
  'Substituted amphetamines' = 'Substituted amphetamines',
  'Substituted benzofurans' = 'Substituted benzofurans',
  'Substituted cathinones' = 'Substituted cathinones',
  'Substituted morphinans' = 'Substituted morphinans',
  'Substituted phenethylamines' = 'Substituted phenethylamines',
  'Substituted phenidates' = 'Substituted phenidates',
  'Substituted piperazines' = 'Substituted piperazines',
  'Substituted piperidines' = 'Substituted piperidines',
  'Substituted pyrrolidines' = 'Substituted pyrrolidines',
  'Substituted tropanes' = 'Substituted tropanes',
  'Substituted tryptamines' = 'Substituted tryptamines',
  Terpenoid = 'Terpenoid',
  Tetrahydroisoxazole = 'Tetrahydroisoxazole',
  Tetrahydroisoxazolopyridine = 'Tetrahydroisoxazolopyridine',
  Thienodiazepines = 'Thienodiazepines',
  Thiophene = 'Thiophene',
  'Tricyclic antidepressant' = 'Tricyclic antidepressant',
  Xanthines = 'Xanthines',
}

export enum Psychoactive {
  Antidepressants = 'Antidepressants',
  Antipsychotic = 'Antipsychotic',
  'Atypical neuroleptic' = 'Atypical neuroleptic',
  Cannabinoid = 'Cannabinoid',
  Deliriant = 'Deliriant',
  Depressant = 'Depressant',
  Dissociatives = 'Dissociatives',
  Entactogen = 'Entactogen',
  Eugeroics = 'Eugeroics',
  Hallucinogens = 'Hallucinogens',
  Hypnotic = 'Hypnotic',
  Nootropic = 'Nootropic',
  Oneirogen = 'Oneirogen',
  Opioids = 'Opioids',
  Psychedelic = 'Psychedelic',
  Stimulants = 'Stimulants',
}

export interface Class {
  chemical: [Chemical];
  psychoactive: [Psychoactive];
}

export interface Dose {
  common: Range;
  heavy: number;
  light: Range;
  strong: Range;
  threshold: number;
  units: string;
}

export interface Duration {
  afterglow: Range;
  comeup: Range;
  duration: Range;
  offset: Range;
  onset: Range;
  peak: Range;
  total: Range;
}

export interface PwSubstance {
  addictionPotential: string;
  class: Class;
  commonNames: [string];
  crossTolerances: [string];
  dangerousInteractions: [PwSubstance];
  effects: [Effect];
  experiences: [Experience];
  featured: boolean;
  images: [Image];
  name: string;
  roa: Types;
  roas: [Roa];
  summary: string;
  tolerance: Tolerance;
  toxicity: [string];
  uncertainInteractions: [PwSubstance];
  unsafeInteractions: [PwSubstance];
  url: string;
}

export interface Range {
  max: number;
  min: number;
  units?: string;
}

export interface Roa {
  bioavailability: Range;
  dose: Dose;
  duration: Duration;
  name: string;
}

export interface Tolerance {
  full: string;
  half: string;
  zero: string;
}

export interface Types {
  buccal: Roa;
  insufflated: Roa;
  intramuscular: Roa;
  intravenous: Roa;
  oral: Roa;
  rectal: Roa;
  smoked: Roa;
  subcutaneous: Roa;
  sublingual: Roa;
  transdermal: Roa;
}

interface Effect {
  experiences: [Experience];
  name: string;
  substances: [PwSubstance];
  url: string;
}

interface Experience {
  effects: [Experience];
  substances: [PwSubstance];
}

interface Image {
  image: string;
  thumb: string;
}

interface Query {
  effects_by_substance(substance: string, limit: number, offset: number): [Effect];
  experiences(
    substances_by_effect: string,
    effects_by_substance: string,
    substance: string,
  ): [Experience];
  substances(
    effect: string,
    query: string,
    chemicalClass: string,
    psychoactiveClass: string,
    limit: number,
    offset: number,
  ): [PwSubstance];
  substances_by_effect(effect: [string], limit: number, offset: number): [PwSubstance];
}
