/* eslint-disable no-unused-vars */
/* eslint-disable sonarjs/no-duplicate-string */

export interface TsSubstance {
  name: string;
  properties: Properties;
  pretty_name: string;
  formatted_dose?: FormattedDose;
  formatted_onset?: FormattedOnset;
  formatted_duration?: FormattedDuration;
  formatted_aftereffects?: FormattedAftereffects;
  categories?: Category[];
  aliases?: string[];
  formatted_effects?: string[];
  pweffects?: { [key: string]: string };
  dose_note?: string;
  links?: Links;
  combos?: { [key: string]: Combo };
  sources?: Sources;
}

export enum Category {
  Barbiturate = 'barbiturate',
  Benzodiazepine = 'benzodiazepine',
  Common = 'common',
  Deliriant = 'deliriant',
  Depressant = 'depressant',
  Dissociative = 'dissociative',
  Empathogen = 'empathogen',
  HabitForming = 'habit-forming',
  Inactive = 'inactive',
  Nootropic = 'nootropic',
  Opioid = 'opioid',
  Psychedelic = 'psychedelic',
  ResearchChemical = 'research-chemical',
  Ssri = 'ssri',
  Stimulant = 'stimulant',
  Supplement = 'supplement',
  Tentative = 'tentative',
}

export interface Combo {
  status: Status;
  note?: string;
}

export enum Status {
  Caution = 'Caution',
  Dangerous = 'Dangerous',
  LowRiskDecrease = 'Low Risk & Decrease',
  LowRiskNoSynergy = 'Low Risk & No Synergy',
  LowRiskSynergy = 'Low Risk & Synergy',
  Unsafe = 'Unsafe',
}

export interface FormattedAftereffects {
  value?: string;
  _unit?: The6;
  Intravenous?: string;
  Oral?: string;
  Insufflated?: string;
  Intramuscular?: string;
  '6'?: The6;
  Sublingual?: string;
  Vapourized?: string;
  'Insufflated/Inhaled'?: string;
  IM?: string;
  Smoked?: string;
  Vaporized?: string;
}

export enum The6 {
  Hours = 'hours',
  Minutes = 'minutes',
}

export interface FormattedDose {
  Oral?: Oral;
  Insufflated?: Insufflated;
  '(Tentative)'?: Tentative;
  Fresh?: BuccalSublingual;
  Dried?: BuccalSublingual;
  Threshold?: BuccalSublingual;
  'Insufflated/Rectal'?: BuccalSublingual;
  none?: BuccalSublingual;
  Therapeutic?: Common;
  Sleep?: Common;
  Recovery?: Common;
  Vapourized?: BuccalSublingual;
  'person-to-person'?: Empty;
  Intravenously?: BuccalSublingual;
  Rectal?: Rectal;
  Intramuscular?: BuccalSublingual;
  'Common:'?: Common;
  'Vapourized/Sublingual'?: BuccalSublingual;
  'Pain-relief'?: Common;
  Fever?: Common;
  Vaporized?: BuccalSublingual;
  '\u000303Light\u0003:'?: Empty;
  '\u0002WARNING\u0003:'?: Empty;
  Sublingually?: BuccalSublingual;
  Tilidine?: BuccalSublingual;
  Sublingual?: Insufflated;
  'Threshold:'?: BuccalSublingual;
  ''?: Empty;
  'Light:'?: BuccalSublingual;
  Wet?: BuccalSublingual;
  Dry?: BuccalSublingual;
  Intravenous?: BuccalSublingual;
  'Sublingual/Insufflated'?: BuccalSublingual;
  IM?: BuccalSublingual;
  IV?: BuccalSublingual;
  'Insufflated/Inhaled'?: BuccalSublingual;
  Vapourised?: BuccalSublingual;
  Smoked?: BuccalSublingual;
  '20-40mg'?: Empty;
  '250mg'?: Empty;
  'Plugged/Rectal'?: BuccalSublingual;
  'Sublingual/Buccal'?: BuccalSublingual;
  Oral_Tea?: OralTea;
  HBWR?: BuccalSublingual;
  Morning_Glory?: BuccalSublingual;
  'Oral(Pure)'?: BuccalSublingual;
  'Insufflated(Pure)'?: BuccalSublingual;
  'Oral(Benzedrex)'?: BuccalSublingual;
  Insufflted?: BuccalSublingual;
  'Insufflated/Plugged'?: BuccalSublingual;
  Intranasal?: BuccalSublingual;
  Transdermal?: BuccalSublingual;
  This?: Empty;
  'Buccal/Sublingual'?: BuccalSublingual;
  'Insufflated:'?: InsufflatedClass;
}

export interface Empty {
}

export interface Tentative {
  Oral: string;
  Common: string;
  Strong: string;
}

export interface BuccalSublingual {
  Threshold?: string;
  Light?: string;
  Common?: string;
  Strong?: string;
  Heavy?: string;
  Low?: string;
  NOTE?: string;
}

export interface Common {
  Common: string;
}

export interface Insufflated {
  Light?: string;
  Common?: string;
  Strong?: string;
  Heavy?: string;
  Threshold?: string;
  Low?: string;
  'M-Hole'?: string;
}

export interface InsufflatedClass {
  Insufflated: string;
  Common: string;
  Strong: string;
}

export interface Oral {
  Light?: string;
  Common?: string;
  Strong?: string;
  Threshold?: string;
  Heavy?: string;
  NOTE?: string;
  Moderate?: string;
  Low?: string;
  'First-Plateau'?: string;
  'Second-Plateau'?: string;
  'Third-Plateau'?: string;
  Fourth?: string;
  Dangerous?: string;
  'M-Hole'?: string;
  t?: string;
  Medium?: string;
  Note?: string;
  Commong?: string;
}

export interface OralTea {
  Common: string;
  Fatal: string;
}

export interface Rectal {
  Light?: string;
  Common: string;
  strong?: string;
  Threshold?: string;
  Strong?: string;
  Low?: string;
}

export interface FormattedDuration {
  value?: string;
  _unit?: The6;
  Vapourized?: string;
  Oral?: string;
  Insufflated?: string;
  Intravenous?: string;
  Oral_IR?: string;
  Oral_ER?: string;
  Plugged?: string;
  'IV/IM'?: string;
  onset?: string;
  Intramuscular?: string;
  Vaporized?: string;
  Low?: string;
  Sublingual?: string;
  Smoked?: string;
  Duration?: string;
  'Oral-IR'?: string;
  'Oral-XR'?: string;
  Intravenously?: string;
  IM?: string;
  IV?: string;
  'Insufflated/Inhaled'?: string;
  'Vaporized/smoked'?: string;
  Oral_MAOI?: string;
  Intranasally?: string;
  Parent?: string;
  Metabolites?: string;
  Transdermal?: string;
  Buccal?: string;
  'Insufflated/Plugged'?: string;
  Vapourised?: string;
  Vaped?: string;
}

export interface FormattedOnset {
  value?: string;
  _unit?: The6;
  Insufflated?: string;
  Vapourized?: string;
  Oral?: string;
  Intravenous?: string;
  Oral_IR?: string;
  Oral_ER?: string;
  Plugged?: string;
  'IV/IM'?: string;
  Intramuscular?: string;
  Sublingual?: string;
  Vaporized?: string;
  IM?: string;
  Smoked?: string;
  Nasal?: string;
  oral?: string;
  Rectal?: string;
  IV?: string;
  Intranasal?: string;
  'Oral-IR'?: string;
  'Oral-XR'?: string;
  'Insufflated-XR'?: string;
  'Insufflated-IR'?: string;
  Intravenously?: string;
  'Vaporized/smoked'?: string;
  Oral_MAOI?: string;
  Intranasally?: string;
  Chewed?: string;
  '60'?: string;
  Transdermal?: string;
  Buccal?: string;
  'Insufflated/Plugged'?: string;
  Vapourised?: string;
  Smoking?: string;
  Vaped?: string;
  Orally?: string;
}

export interface Links {
  experiences: string;
  pihkal?: string;
  tihkal?: string;
}

export interface Properties {
  summary?: string;
  dose?: string;
  onset?: string;
  duration?: string;
  'after-effects'?: string;
  categories?: Category[];
  aliases?: string[];
  effects?: string;
  dose_to_diazepam?: string;
  bioavailability?: string;
  detection?: string;
  marquis?: string;
  'general-advice'?: string;
  wiki?: string;
  a?: string;
  avoid?: string;
  mdma?: string;
  'test-kits'?: string;
  experiences?: string;
  'duration:'?: string;
  an?: string;
  warning?: string;
  'half-life'?: string;
  risks?: string;
  'adverse-effects'?: string;
  'drug-contradictions'?: string;
  'overdose-symptoms'?: string;
  pharmacology?: string;
  chemistry?: string;
  legal?: string;
  'side-effects'?: string;
  pharmacodynamics?: string;
  bioavailabity?: string;
  dosage?: string;
  obtain?: string;
  note?: string;
  'after-effect'?: string;
  'after-efects'?: string;
  calculator?: string;
  chart?: string;
  avod?: string;
  '4-fa'?: string;
  Duration?: string;
  warn?: string;
  Onset?: string;
  oral?: string;
  '2-6'?: string;
  'bioavailability:'?: string;
  '1-6'?: string;
  legality?: string;
  tolerance?: string;
  'onset:'?: string;
  smmary?: string;
  molecule?: string;
  vaporization?: string;
  pregabalin?: string;
  Bioavailability?: string;
  pubchemcid?: string;
  'dose:'?: string;
  bioavaiability?: string;
  'general-effects'?: string;
  pharmacokinetics?: string;
  contradictions?: string;
  category?: string;
  Summary?: string;
  draft?: string;
  potentiators?: string;
  alias?: string;
  'summary=a'?: string;
  Avoid?: string;
  comeup?: string;
  contraindictions?: string;
}

export interface Sources {
  _general?: string[];
  dose?: string[];
  duration?: string[];
  bioavailability?: string[];
  legality?: string[];
  onset?: string[];
}
