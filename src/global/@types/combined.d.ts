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
  Common = 'Common',
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
  Khat = 'Khat#1#',
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

export enum Period {
  AfterEffects = 'After effects',
  ComeUp = 'Come up',
  Duration = 'Duration',
  Offset = 'Offset',
  Onset = 'Onset',
  Peak = 'Peak',
  Total = 'Total',
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

export enum Status {
  Caution = 'Caution',
  Dangerous = 'Dangerous',
  LowRiskDecrease = 'Low Risk & Decrease',
  LowRiskNoSynergy = 'Low Risk & No Synergy',
  LowRiskSynergy = 'Low Risk & Synergy',
  Unsafe = 'Unsafe',
}

export enum Strength {
  Common = 'Common',
  Heavy = 'Heavy',
  Light = 'Light',
  Strong = 'Strong',
  Threshold = 'Threshold',
}

export interface CallbackSubstance {
  addictionPotential?: string;
  aliases?: string[];
  aliasesStr?: string;
  classes?: Classes;
  crossTolerances?: string[];
  experiencesUrl?: string;
  interactions?: Interaction[];
  name: string;
  reagents?: string;
  roas?: Roa[];
  summary?: string;
  tolerance?: Tolerance;
  toxicity?: string[];
  url: string;
}

export interface Classes {
  chemical?: [Chemical];
  psychoactive?: [Psychoactive];
}

export interface Dosage {
  name: Strength;
  note?: string;
  value: string;
}

export interface Duration {
  name: Period;
  note?: string;
  value: null | string;
}

export interface Interaction {
  name: string;
  note?: string;
  sources?: {
    author: string;
    title: string;
    url: string;
  }[];
  status: Status;
}

export interface Roa {
  bioavailability?: string;
  dosage?: Dosage[];
  duration?: Duration[];
  name: string;
}

export interface Tolerance {
  full: string;
  half: null | string;
  zero: null | string;
}
