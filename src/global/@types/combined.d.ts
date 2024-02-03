/* eslint-disable no-unused-vars */

export interface CbSubstance {
  url: string;
  experiencesUrl?: string;
  name: string;
  aliases?: string[];
  aliasesStr?: string;
  summary?: string;
  reagents?: string;
  classes?: Classes;
  toxicity?: string[] ;
  addictionPotential?: string;
  tolerance?: Tolerance;
  crossTolerances?: string[];
  roas?: Roa[];
  interactions?: Interaction[];
}

export interface Classes {
  chemical?: [Chemical];
  psychoactive?: [Psychoactive];
}

export enum Psychoactive {
  Antidepressant = 'Antidepressant',
  Antipsychotic = 'Antipsychotic',
  'Atypical neuroleptic' = 'Atypical neuroleptic',
  Cannabinoid = 'Cannabinoid',
  Deliriant = 'Deliriant',
  Depressant = 'Depressant',
  Dissociative = 'Dissociative',
  Empathogen = 'Empathogen',
  Entactogen = 'Entactogen',
  Eugeroic = 'Eugeroic',
  'Habit Forming' = 'Habit Forming',
  Hallucinogen = 'Hallucinogen',
  Hypnotic = 'Hypnotic',
  Inactive = 'Inactive',
  Nootropic = 'Nootropic',
  Oneirogen = 'Oneirogen',
  Opioid = 'Opioid',
  Psychedelic = 'Psychedelic',
  'Research Chemical' = 'Research Chemical',
  SSRI = 'SSRI',
  Stimulant = 'Stimulant',
  Supplement = 'Supplement',
  Tentative = 'Tentative',
}

export enum Chemical {
  '4-oxazolidinone' = '4-oxazolidinone',
  'Amino acid' = 'Amino acid',
  'Amino acid analogue' = 'Amino acid analogue',
  'Ammonium salt' = 'Ammonium salt',
  Amine = 'Amine',
  Aminoindane = 'Aminoindane',
  Amphetamine = 'Amphetamine',
  Adamantanes = 'Adamantanes',
  Alcohol = 'Alcohol',
  Alkanediol = 'Alkanediol',
  Anilidopiperidine = 'Anilidopiperidine',
  Arylcyclohexylamines = 'Arylcyclohexylamines',
  Barbiturates = 'Barbiturates',
  Benzamide = 'Benzamide',
  Benzazepine = 'Benzazepine',
  Benzhydryl = 'Benzhydryl',
  Benzisoxazole = 'Benzisoxazole',
  Benzodiazepines = 'Benzodiazepines',
  Butyrophenone = 'Butyrophenone',
  'Butyric acid' = 'Butyric acid',
  Cannabinoid = 'Cannabinoid',
  Carbamate = 'Carbamate',
  Common = 'Common',
  'Choline derivative' = 'Choline derivative',
  Cysteine = 'Cysteine',
  Cycloalkylamines = 'Cycloalkylamines',
  Cyclopyrrolone = 'Cyclopyrrolone',
  Diarylethylamines = 'Diarylethylamines',
  Diol = 'Diol',
  Diphenylpropylamine = 'Diphenylpropylamine',
  Dibenzothiazepine = 'Dibenzothiazepine',
  'Ethanolamine#1#' = 'Ethanolamine#1#',
  Gabapentinoids = 'Gabapentinoids',
  Imidazoline = 'Imidazoline',
  Imidazopyridine = 'Imidazopyridine',
  Indazole = 'Indazole',
  Indazolecarboxamide = 'Indazolecarboxamide',
  Indolecarboxamide = 'Indolecarboxamide',
  Indolecarboxylate = 'Indolecarboxylate',
  'Indole alkaloids' = 'Indole alkaloids',
  'Indole cannabinoid' = 'Indole cannabinoid',
  Khat = 'Khat#1#',
  Lactone = 'Lactone',
  Lysergamides = 'Lysergamides',
  MDxx = 'MDxx',
  Naphthoylindole = 'Naphthoylindole',
  Naphthoylindazole = 'Naphthoylindazole',
  'Nitrogenous organic acid' = 'Nitrogenous organic acid',
  Peptide = 'Peptide',
  Phenothiazine = 'Phenothiazine',
  Phenylmorpholine = 'Phenylmorpholine',
  Phenylpropenes = 'Phenylpropenes',
  Phenylpropylamine = 'Phenylpropylamine',
  Piperazinoazepine = 'Piperazinoazepine',
  Poppers = 'Poppers',
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
  'Purine alkaloid' = 'Purine alkaloid',
  Xanthines = 'Xanthines',
}

export interface Interaction {
  status: Status;
  note?: string;
  name: string;
  sources?: {
    author: string;
    title: string;
    url: string;
  }[];
}

export enum Status {
  Caution = 'Caution',
  Dangerous = 'Dangerous',
  LowRiskDecrease = 'Low Risk & Decrease',
  LowRiskNoSynergy = 'Low Risk & No Synergy',
  LowRiskSynergy = 'Low Risk & Synergy',
  Unsafe = 'Unsafe',
}

export interface Roa {
  name: string;
  dosage?: Dosage[];
  duration?: Duration[];
  bioavailability?: string;
}

export interface Dosage {
  name: Strength;
  value: string;
  note?: string;
}

export interface Duration {
  name: Period;
  value: null | string;
  note?: string;
}

export enum Strength {
  Common = 'Common',
  Heavy = 'Heavy',
  Light = 'Light',
  Strong = 'Strong',
  Threshold = 'Threshold',
}

export enum Period {
  AfterEffects = 'After effects',
  ComeUp = 'Come up',
  Duration = 'Duration',
  Offset = 'Offset',
  Onset = 'Onset',
  Peak = 'Peak',
  Total = 'Total',
}

export interface Tolerance {
  full: string;
  half: null | string;
  zero: null | string;
}
