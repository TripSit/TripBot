/* eslint-disable no-unused-vars */

export interface CbSubstance {
    url: string;
    experiencesUrl: null | string;
    name: string;
    aliases: string[];
    aliasesStr: string;
    summary: null | string;
    reagents: null | string;
    classes: Classes | null;
    toxicity: string[] | null;
    addictionPotential: null | string;
    tolerance: Tolerance | null;
    crossTolerances: string[] | null;
    roas: Roa[];
    interactions: Interaction[] | null;
}

export interface Classes {
    chemical: string[] | null;
    psychoactive: Psychoactive[] | null;
}

export enum Psychoactive {
    Antidepressants = 'Antidepressants',
    Antipsychotic = 'Antipsychotic',
    Cannabinoid = 'Cannabinoid',
    Deliriant = 'Deliriant',
    Depressant = 'Depressant',
    Dissociatives = 'Dissociatives',
    Entactogens = 'Entactogens',
    Eugeroics = 'Eugeroics',
    Hallucinogens = 'Hallucinogens',
    Nootropic = 'Nootropic',
    Oneirogen = 'Oneirogen',
    Opioids = 'Opioids',
    Psychedelics = 'Psychedelics',
    Sedative = 'Sedative',
    Stimulants = 'Stimulants',
}

export interface Interaction {
    status: Status;
    note?: string;
    name: string;
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
    dosage?: Dosage[] | null;
    duration?: Dosage[] | null;
    bioavailability?: string;
}

export interface Dosage {
    name: Name;
    value: null | string;
    note?: string;
}

export enum Name {
    AfterEffects = 'After effects',
    ComeUp = 'Come up',
    Common = 'Common',
    Duration = 'Duration',
    Heavy = 'Heavy',
    Light = 'Light',
    Offset = 'Offset',
    Onset = 'Onset',
    Peak = 'Peak',
    Strong = 'Strong',
    Threshold = 'Threshold',
    Total = 'Total',
}

export interface Tolerance {
    full: string;
    half: null | string;
    zero: null | string;
}
