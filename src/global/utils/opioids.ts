/**
 * Opioid equianalgesic data and conversion logic.
 *
 * Source: the opioid equivalency table (Wikipedia, "Equianalgesic"), which expresses every analgesic's
 * potency relative to ORAL morphine (= 1). Per that table's preamble, a potency figure refers to the oral
 * route unless the source states another route, so entries without a stated route are marked `assumedRoute`.
 *
 * Every figure here comes from that table, so please do not add numbers from anywhere else. The non-opioid
 * rows (paracetamol, the NSAIDs, nefopam) are left out on purpose: those figures describe pain relief only
 * and say nothing useful about opioid tolerance.
 */

export type Roa =
  | 'oral'
  | 'parenteral'
  | 'intranasal'
  | 'sublingual'
  | 'buccal'
  | 'transdermal'
  | 'rectal'
  | 'intrathecal';

/** A [min, max] pair. Both members are equal when the source gives a single figure. */
export type Range = readonly [number, number];

export type Pharmacology = 'partial-agonist' | 'mixed-agonist-antagonist' | 'kappa-agonist';

export interface Opioid {
  /** Canonical display name. */
  name: string;
  /** Lowercase search terms; always includes the lowercased canonical name. */
  aliases: string[];
  /** Potency relative to oral morphine (= 1), keyed by the route the source figure describes. */
  potency: Partial<Record<Roa, Range>>;
  /** Percentage bioavailability by route, where the source provides it. */
  bioavailability?: Partial<Record<Roa, Range>>;
  /** True when the source states no route and the table's oral default has been applied. */
  assumedRoute?: boolean;
  halfLife?: string;
  onset?: string;
  duration?: string;
  oralToParenteral?: string;
  /** Anything other than a straightforward full mu-agonist. */
  pharmacology?: Pharmacology;
  /** Harm-reduction notes, shown as-is in the result. */
  notes?: string[];
}

/** The drug every conversion pivots on; the 1x reference in the source table. */
export const MORPHINE_NAME = 'Morphine';

export const ROUTE_LABELS: Record<Roa, string> = {
  oral: 'Oral',
  parenteral: 'Injected (IV / IM / SC)',
  intranasal: 'Intranasal (snorted)',
  sublingual: 'Sublingual (under the tongue)',
  buccal: 'Buccal (against the cheek)',
  transdermal: 'Transdermal (patch)',
  rectal: 'Rectal',
  intrathecal: 'Intrathecal (spinal)',
};

/** Order used when listing alternative routes, roughly least to most invasive. */
const ROUTE_ORDER: Roa[] = [
  'oral', 'sublingual', 'buccal', 'intranasal', 'rectal', 'transdermal', 'parenteral', 'intrathecal',
];

/** Preferred route for the conversion itself when a drug has figures for more than one. */
const ROUTE_PREFERENCE: Roa[] = [
  'oral', 'sublingual', 'parenteral', 'transdermal', 'intranasal', 'buccal', 'rectal', 'intrathecal',
];

const PRODRUG_NOTE = 'A prodrug. CYP2D6 liver-enzyme variation means the same dose lands far harder in '
  + 'some people than others.';
const PARACETAMOL_NOTE = 'Combination pills usually contain paracetamol. Scaling the opioid up scales that '
  + 'up too, and it damages the liver with no warning at the time.';
const RESEARCH_NOTE = 'A novel synthetic opioid. Potency may come from animal studies, so treat this as an '
  + 'order of magnitude, not a dose.';
const AGONIST_ANTAGONIST_NOTE = 'A mixed agonist-antagonist. In someone already physically dependent on a '
  + 'full agonist it can trigger immediate, severe withdrawal instead of adding to the effect.';

const MIXED_AGONIST: Pharmacology = 'mixed-agonist-antagonist';
/** The source gives the fast-acting morphine prodrugs the same onset figures. */
const PRODRUG_ONSET = '5-15 seconds (IV); 2-5 minutes (IM)';

export const opioids: Opioid[] = [
  {
    name: 'Dextropropoxyphene',
    aliases: ['dextropropoxyphene', 'propoxyphene', 'darvon', 'darvocet'],
    potency: { oral: [0.05, 0.05] },
    assumedRoute: true,
    notes: [PARACETAMOL_NOTE],
  },
  {
    name: 'Codeine',
    aliases: ['codeine', 'lean', 'purple drank', 'syrup', 't3', 'tylenol 3'],
    potency: { oral: [0.1, 0.1] },
    bioavailability: { oral: [90, 90] },
    halfLife: '2.5-3 hours (morphine metabolite 2-3)',
    onset: '15-30 minutes (oral)',
    duration: '4-6 hours',
    notes: [PRODRUG_NOTE, PARACETAMOL_NOTE],
  },
  {
    name: 'Tramadol',
    aliases: ['tramadol', 'ultram', 'tramal'],
    potency: { oral: [0.1, 0.1] },
    bioavailability: { oral: [75, 90] },
    halfLife: '6.0-8.8 hours (M1 metabolite)',
    notes: [
      PRODRUG_NOTE,
      'Tramadol gets stronger over consecutive days as its active metabolite builds up and its oral '
        + 'bioavailability rises, so a repeat dose is not equivalent to the first.',
      'It also lowers the seizure threshold and acts on serotonin, which matters if anything else '
        + 'serotonergic is on board.',
    ],
  },
  {
    name: 'Opium',
    aliases: ['opium', 'raw opium', 'poppy'],
    potency: { oral: [0.1, 0.1] },
    bioavailability: { oral: [25, 25] },
    halfLife: '2.5-3.0 hours (morphine, codeine)',
    notes: ['A plant preparation, so alkaloid content varies between batches far more than a pill does.'],
  },
  {
    name: 'Tilidine',
    aliases: ['tilidine', 'valoron'],
    potency: { oral: [0.1, 0.1] },
    bioavailability: { oral: [6, 6] },
    halfLife: 'nortilidine 3.3 hours (oral), 4.9 hours (IV)',
    onset: '10-15 minutes (oral); peak effect 25-50 minutes',
    duration: '3-4 hours',
    oralToParenteral: '2.2:1',
    notes: [PRODRUG_NOTE],
  },
  {
    name: 'Dihydrocodeine',
    aliases: ['dihydrocodeine', 'dhc', 'paracodin'],
    potency: { oral: [0.1, 0.1] },
    bioavailability: { oral: [20, 20] },
    halfLife: '4 hours',
    notes: [PRODRUG_NOTE, PARACETAMOL_NOTE],
  },
  {
    name: 'Alphaprodine',
    aliases: ['alphaprodine', 'nisentil'],
    potency: { oral: [0.2, 0.2] },
    assumedRoute: true,
  },
  {
    name: 'Anileridine',
    aliases: ['anileridine', 'leritine'],
    potency: { oral: [0.25, 0.25] },
    assumedRoute: true,
  },
  {
    name: 'Tapentadol',
    aliases: ['tapentadol', 'nucynta', 'palexia'],
    potency: { oral: [0.3, 0.3] },
    bioavailability: { oral: [32, 32] },
    notes: ['Also acts on noradrenaline, so it is not a clean swap for a pure opioid.'],
  },
  {
    name: 'Pethidine (meperidine)',
    aliases: ['pethidine', 'meperidine', 'demerol'],
    potency: { oral: [0.0333, 0.0333], parenteral: [0.3333, 0.3333] },
    bioavailability: { oral: [50, 60], parenteral: [100, 100] },
    halfLife: '3-5 hours',
    onset: '5-15 seconds (IV); 15-25 minutes (oral)',
    notes: [
      'Its metabolite norpethidine accumulates with repeated dosing and is neurotoxic, so pethidine is a '
        + 'poor choice for anything other than a one-off.',
    ],
  },
  {
    name: 'Dipipanone',
    aliases: ['dipipanone', 'diconal'],
    potency: { oral: [0.4, 0.4] },
    halfLife: '3.2-3.8 hours',
    duration: 'about 4 hours',
  },
  {
    name: 'Benzylfentanyl',
    aliases: ['benzylfentanyl'],
    potency: { oral: [0.5, 0.5] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'AH-7921',
    aliases: ['ah-7921', 'ah7921', 'doxylam'],
    potency: { oral: [0.8, 0.8] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'SR-17018',
    aliases: ['sr-17018', 'sr17018'],
    potency: { oral: [0.8, 0.8] },
    assumedRoute: true,
    onset: '5-10 seconds (IV); 15-25 minutes (oral)',
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Nalbuphine',
    aliases: ['nalbuphine', 'nubain'],
    potency: { oral: [0.9, 0.9] },
    bioavailability: { oral: [33, 33], parenteral: [76, 81] },
    halfLife: '3-6 hours',
    onset: '3 minutes; peak effect 10 minutes',
    duration: '3-6 hours',
    pharmacology: MIXED_AGONIST,
    notes: [AGONIST_ANTAGONIST_NOTE],
  },
  {
    name: 'Hydrocodone',
    aliases: ['hydrocodone', 'vicodin', 'lortab', 'norco', 'tussionex', 'hydros'],
    potency: { oral: [1, 1] },
    bioavailability: { oral: [70, 70] },
    halfLife: '3.8-6 hours (instant release, oral)',
    onset: '10-30 minutes (instant release, oral)',
    duration: '4-6 hours',
    notes: [PARACETAMOL_NOTE],
  },
  {
    name: 'Pentazocine',
    aliases: ['pentazocine', 'talwin', 'fortral'],
    potency: { oral: [0.0667, 0.0667], parenteral: [1, 1] },
    pharmacology: MIXED_AGONIST,
    notes: [AGONIST_ANTAGONIST_NOTE],
  },
  {
    name: 'Morphine',
    aliases: ['morphine', 'ms contin', 'mst', 'oramorph', 'sevredol'],
    potency: { oral: [1, 1], parenteral: [3, 4] },
    bioavailability: { oral: [25, 25], parenteral: [100, 100] },
    halfLife: '2-4 hours (oral); 3-4 hours (injected)',
    onset: '30 minutes (oral); 5-15 seconds (IV); 5-15 minutes (IM)',
    duration: '3-6 hours (oral); 3-7 hours (injected)',
    oralToParenteral: '3:1',
  },
  {
    name: 'Oxycodone',
    aliases: ['oxycodone', 'oxy', 'oxycontin', 'percocet', 'perc', 'percs', 'roxicodone', 'roxy', 'endone'],
    potency: { oral: [1.5, 1.5], parenteral: [3, 4] },
    bioavailability: { oral: [60, 87], intranasal: [78.2, 78.2], parenteral: [100, 100] },
    halfLife: '2-3 hours (instant release, oral); 4.5 hours (controlled release)',
    onset: '10-30 minutes (instant release, oral); 1 hour (controlled release)',
    duration: '3-6 hours (instant release); 10-12 hours (controlled release)',
    notes: [
      PARACETAMOL_NOTE,
      'Crushing a controlled-release tablet delivers the whole 10-12 hour payload at once.',
    ],
  },
  {
    name: 'Spiradoline',
    aliases: ['spiradoline', 'u-62066'],
    potency: { oral: [1.5, 7] },
    assumedRoute: true,
    pharmacology: 'kappa-agonist',
  },
  {
    name: 'Nicomorphine',
    aliases: ['nicomorphine', 'vilan'],
    potency: { oral: [2, 3] },
    bioavailability: { oral: [20, 20] },
    halfLife: '4 hours',
  },
  {
    name: 'Clonitazene',
    aliases: ['clonitazene'],
    potency: { oral: [2, 3] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Butorphanol',
    aliases: ['butorphanol', 'stadol'],
    potency: { oral: [2.3, 2.3] },
    bioavailability: { oral: [12, 12], sublingual: [25, 35], intranasal: [70, 70] },
    halfLife: '3 hours (IM/IV); 4.5-5.5 hours (intranasal)',
    onset: '15 minutes',
    duration: '3-4 hours',
    oralToParenteral: '5.8:1',
    pharmacology: MIXED_AGONIST,
    notes: [AGONIST_ANTAGONIST_NOTE],
  },
  {
    name: 'Metopon',
    aliases: ['metopon'],
    potency: { oral: [3, 3] },
    assumedRoute: true,
  },
  {
    name: 'Methadone',
    aliases: ['methadone', 'dolophine', 'methadose', 'physeptone'],
    potency: { oral: [2.5, 5] },
    bioavailability: { oral: [40, 90] },
    halfLife: '15-60 hours',
    oralToParenteral: '2:1',
    notes: [
      'Potency is not fixed: about 3-4x over 1-3 days, 2.5-5x with sustained use, and clinical tables '
        + 'treat higher daily doses as stronger still.',
      'The 15-60 hour half-life is the real hazard: it accumulates, so a dose that felt mild on day one '
        + 'can be fatal by day three. Never chase the effect.',
      'It also prolongs the QT interval, a cardiac risk that is independent of overdose.',
    ],
  },
  {
    name: 'Phenazocine',
    aliases: ['phenazocine', 'narphen'],
    potency: { oral: [3.2, 4.3] },
    onset: '15 minutes (IV); 30 minutes (IM); 30-60 minutes (oral)',
    duration: '3-5 hours',
  },
  {
    name: 'Diamorphine (heroin)',
    aliases: ['diamorphine', 'heroin', 'diacetylmorphine', 'gear', 'smack', 'dope', 'brown', 'china white'],
    potency: { parenteral: [4, 5], intranasal: [2, 2.5] },
    bioavailability: { parenteral: [100, 100] },
    halfLife: 'under 0.6 hours (it is a morphine prodrug)',
    onset: PRODRUG_ONSET,
    duration: '3-7 hours (as the morphine it becomes)',
    notes: [
      PRODRUG_NOTE,
      'Street purity varies hugely and much of the supply now contains fentanyl or nitazenes, so this says '
        + 'nothing about what is in a given bag.',
    ],
  },
  {
    name: '6-MAM',
    aliases: ['6-mam', '6mam', '6-monoacetylmorphine', '6-acetylmorphine'],
    potency: { parenteral: [6, 7] },
    bioavailability: { parenteral: [100, 100] },
    halfLife: 'under 0.6 hours (morphine prodrug)',
    onset: PRODRUG_ONSET,
    duration: '3-7 hours',
    oralToParenteral: 'presumed 2:1',
    notes: [PRODRUG_NOTE],
  },
  {
    name: 'U-47700',
    aliases: ['u-47700', 'u47700', 'u4', 'pink', 'pinky'],
    potency: { oral: [7.5, 7.5] },
    assumedRoute: true,
    halfLife: '1.5-3 hours',
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Dezocine',
    aliases: ['dezocine', 'dalgan'],
    potency: { oral: [7.7, 13] },
    bioavailability: { parenteral: [97, 97] },
    halfLife: '2.2 hours',
    onset: '5 minutes (IV); 5-15 minutes (IM/buccal)',
    pharmacology: MIXED_AGONIST,
    notes: [AGONIST_ANTAGONIST_NOTE],
  },
  {
    name: 'Levorphanol',
    aliases: ['levorphanol', 'levo-dromoran'],
    potency: { oral: [8, 8] },
    bioavailability: { oral: [70, 70] },
    halfLife: '11-16 hours',
    oralToParenteral: '1:1',
    notes: [
      'The half-life is far longer than the effect lasts, so it accumulates across repeated doses much '
        + 'as methadone does.',
    ],
  },
  {
    name: 'Desomorphine',
    aliases: ['desomorphine', 'krokodil', 'permonid'],
    potency: { oral: [8, 10] },
    assumedRoute: true,
    bioavailability: { parenteral: [100, 100] },
    halfLife: '2-3 hours',
    onset: PRODRUG_ONSET,
    duration: '3-4 hours',
    notes: [
      'The tissue damage "krokodil" is known for comes from crude home synthesis leaving red phosphorus, '
        + 'iodine and solvents in the product, not from desomorphine itself.',
    ],
  },
  {
    name: 'N-Phenethylnormorphine',
    aliases: ['n-phenethylnormorphine', 'phenethylnormorphine'],
    potency: { oral: [8, 14] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Hydromorphone',
    aliases: ['hydromorphone', 'dilaudid', 'diluadid', 'dillies', 'hydromorph contin', 'exalgo'],
    potency: { oral: [3, 3.75], parenteral: [10, 10] },
    bioavailability: { oral: [30, 35], intranasal: [52, 58], parenteral: [100, 100] },
    halfLife: '2-3 hours',
    oralToParenteral: '5:1',
  },
  {
    name: 'Oxymorphone',
    aliases: ['oxymorphone', 'opana', 'numorphan'],
    potency: { oral: [3, 4], parenteral: [10, 10] },
    bioavailability: {
      oral: [10, 10], buccal: [28, 28], sublingual: [37.5, 37.5], intranasal: [43, 43], parenteral: [100, 100],
    },
    halfLife: '7.25-9.43 hours',
    onset: '35 minutes (oral); 5-15 seconds (IV)',
    duration: '6-8 hours (oral); 2-6 hours (injected)',
  },
  {
    name: 'Alfentanil',
    aliases: ['alfentanil', 'alfenta', 'rapifen'],
    potency: { oral: [10, 25] },
    assumedRoute: true,
    halfLife: '1.5 hours (90-111 minutes)',
    onset: '5-15 seconds, about 4x faster than fentanyl',
    duration: '15 minutes; effects can persist up to 54 minutes',
    notes: ['A hospital anaesthetic, used with airway support because it stops breathing readily.'],
  },
  {
    name: 'Trefentanil',
    aliases: ['trefentanil', 'a-3665'],
    potency: { oral: [10, 10] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Brifentanil',
    aliases: ['brifentanil', 'a-3331'],
    potency: { oral: [10, 25] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Acetylfentanyl',
    aliases: ['acetylfentanyl', 'acetyl fentanyl'],
    potency: { oral: [15, 15] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: '7-Hydroxymitragynine',
    aliases: ['7-hydroxymitragynine', '7-oh', '7oh', '7-hydroxy'],
    potency: { oral: [17, 17] },
    notes: [
      'This is one isolated alkaloid, not kratom leaf. Whole kratom contains it in small and highly '
        + 'variable amounts, so this figure must not be used to dose plain leaf.',
    ],
  },
  {
    name: 'Butyrfentanyl',
    aliases: ['butyrfentanyl', 'butyrylfentanyl'],
    potency: { oral: [25, 25] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Enadoline',
    aliases: ['enadoline', 'ci-977'],
    potency: { oral: [25, 25] },
    assumedRoute: true,
    pharmacology: 'kappa-agonist',
  },
  {
    name: 'Buprenorphine',
    aliases: ['buprenorphine', 'bupe', 'subutex', 'suboxone', 'temgesic', 'butrans', 'subs'],
    potency: { sublingual: [40, 80], transdermal: [100, 115] },
    bioavailability: {
      sublingual: [30, 30], transdermal: [100, 100], buccal: [65, 65], intranasal: [48, 48],
    },
    halfLife: '20-70 hours (mean 37)',
    onset: '45 minutes (sublingual); 45-60 minutes (patch)',
    duration: '12-24 hours',
    oralToParenteral: '3:1',
    pharmacology: 'partial-agonist',
    notes: [
      'Taking it too soon after a full agonist is what causes precipitated withdrawal: wait until you are '
        + 'already in clear withdrawal before the first dose.',
      'That same tight binding makes an overdose on top of buprenorphine harder to reverse with a standard '
        + 'naloxone dose.',
    ],
  },
  {
    name: 'Fentanyl',
    aliases: ['fentanyl', 'fent', 'fenny', 'duragesic', 'actiq', 'sublimaze'],
    potency: { parenteral: [50, 100] },
    bioavailability: {
      sublingual: [33, 33], transdermal: [92, 92], intranasal: [89, 89], buccal: [50, 50], parenteral: [100, 100],
    },
    halfLife: '0.04 hours (IV); 7 hours (patch)',
    onset: '5 minutes (patch / IV)',
    duration: '30-60 minutes (IV)',
    notes: [
      'Active doses are in micrograms and it does not mix evenly through a powder, so one part of a batch '
        + 'can be many times stronger than another.',
      'The source gives no oral figure. Swallowed fentanyl is largely destroyed on first pass, so an oral '
        + 'equivalent would not be meaningful.',
    ],
  },
  {
    name: 'Phenaridine',
    aliases: ['phenaridine'],
    potency: { oral: [50, 100] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Furanylfentanyl',
    aliases: ['furanylfentanyl', 'fu-f'],
    potency: { oral: [50, 100] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Acrylfentanyl',
    aliases: ['acrylfentanyl', 'acryloylfentanyl'],
    potency: { oral: [50, 100] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'N-Phenethyl-14-ethoxymetopon',
    aliases: ['n-phenethyl-14-ethoxymetopon'],
    potency: { oral: [60, 60] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Phenomorphan',
    aliases: ['phenomorphan'],
    potency: { oral: [60, 80] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'N-Phenethylnordesomorphine',
    aliases: ['n-phenethylnordesomorphine'],
    potency: { oral: [85, 85] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Metonitazene',
    aliases: ['metonitazene', 'nitazene'],
    potency: { oral: [100, 100] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Remifentanil',
    aliases: ['remifentanil', 'ultiva'],
    potency: { parenteral: [100, 100] },
    bioavailability: { parenteral: [100, 100] },
    halfLife: '0.05 hours (3-6 minute context-sensitive half-life)',
    onset: '5-15 seconds',
    duration: '15 minutes; it wears off so fast that hospital use needs a continuous infusion',
    notes: ['A hospital anaesthetic, given with full airway support.'],
  },
  {
    name: 'Parafluorofentanyl',
    aliases: ['parafluorofentanyl', '2-fluorofentanyl', 'para-fluorofentanyl'],
    potency: { oral: [111, 111] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: '14-Cinnamoyloxycodeinone',
    aliases: ['14-cinnamoyloxycodeinone'],
    potency: { oral: [101, 310] },
    bioavailability: { oral: [2.8, 2.8], parenteral: [5.8, 5.8] },
    oralToParenteral: '250:7',
    notes: [RESEARCH_NOTE, 'Potency ranged from 101x to 310x across test subjects, median about 177x.'],
  },
  {
    name: 'Protonitazepyne',
    aliases: ['protonitazepyne'],
    potency: { oral: [190, 200] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Protonitazene',
    aliases: ['protonitazene'],
    potency: { oral: [200, 200] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Ocfentanil',
    aliases: ['ocfentanil', 'a-3217'],
    potency: { oral: [200, 200] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Ro4-1539',
    aliases: ['ro4-1539', 'ro41539'],
    potency: { oral: [240, 480] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Isotonitazene',
    aliases: ['isotonitazene', 'iso', 'iso-nitazene'],
    potency: { oral: [500, 500] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: '14-Methoxymetopon',
    aliases: ['14-methoxymetopon'],
    potency: { parenteral: [500, 500], intrathecal: [1000000, 1000000] },
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Sufentanil',
    aliases: ['sufentanil', 'sufenta', 'dsuvia'],
    potency: { oral: [500, 1000] },
    assumedRoute: true,
    bioavailability: {
      oral: [9, 9], sublingual: [52, 59], buccal: [78, 78], parenteral: [100, 100],
    },
    halfLife: '4.4 hours',
    onset: '1-3 minutes (IV); 5 minutes (intranasal); 6-15 minutes (sublingual)',
    duration: '30 minutes (IV); 40-50 minutes (sublingual)',
    oralToParenteral: '2:1',
    notes: ['A hospital anaesthetic, given with full airway support.'],
  },
  {
    name: 'BDPC',
    aliases: ['bdpc', 'bromadol'],
    potency: { oral: [504, 504] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Orthofluorofentanyl',
    aliases: ['orthofluorofentanyl', 'ortho-fluorofentanyl'],
    potency: { oral: [564, 564] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'C-8813',
    aliases: ['c-8813', 'c8813'],
    potency: { oral: [591, 591] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: '4-Phenylfentanyl',
    aliases: ['4-phenylfentanyl'],
    potency: { oral: [800, 800] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Etonitazene',
    aliases: ['etonitazene'],
    potency: { oral: [1000, 1500] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: '3-Methylfentanyl',
    aliases: ['3-methylfentanyl', '3-mf', 'tmf'],
    potency: { oral: [1000, 6600] },
    assumedRoute: true,
    notes: [
      RESEARCH_NOTE,
      'The two isomers differ more than sixfold (trans about 1,000x, cis about 6,600x) and street material '
        + 'is not separated, so the real potency of any given sample is unknowable.',
    ],
  },
  {
    name: 'Etorphine',
    aliases: ['etorphine', 'm99', 'immobilon'],
    potency: { oral: [500, 2000] },
    assumedRoute: true,
    notes: ['A large-animal veterinary immobilising agent, handled with an antidote drawn up ready.'],
  },
  {
    name: 'N-Desetylisotonitazene',
    aliases: ['n-desetylisotonitazene', 'desetylisotonitazene'],
    potency: { oral: [2000, 2000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Etonitazepyne',
    aliases: ['etonitazepyne', 'n-pyrrolidino etonitazene'],
    potency: { oral: [2000, 2000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Ohmefentanyl',
    aliases: ['ohmefentanyl'],
    potency: { oral: [6300, 6300] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Acetorphine',
    aliases: ['acetorphine'],
    potency: { oral: [8700, 8700] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Carfentanil',
    aliases: ['carfentanil', 'carfent', 'carfentanyl', 'wildnil'],
    potency: { oral: [10000, 10000] },
    assumedRoute: true,
    halfLife: '7.7 hours',
    notes: [
      'A veterinary agent for immobilising elephants and other large animals. There is no human dose.',
      'At this potency a barely visible speck is a lethal amount, and it cannot be measured or mixed '
        + 'evenly outside a laboratory.',
    ],
  },
  {
    name: 'Lofentanil',
    aliases: ['lofentanil'],
    potency: { oral: [10000, 11000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE, 'It binds for an extremely long time, so breathing stays suppressed after '
      + 'a naloxone dose has already worn off.'],
  },
  {
    name: 'Dihydroetorphine',
    aliases: ['dihydroetorphine', 'dhe'],
    potency: { oral: [12000, 12000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'R-30490',
    aliases: ['r-30490', 'r30490'],
    potency: { oral: [10000, 100000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE, 'The source spans a tenfold range, so this is barely more than a guess.'],
  },
  {
    name: '4-Carboethoxyohmefentanil',
    aliases: ['4-carboethoxyohmefentanil'],
    potency: { oral: [30000, 30000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
  {
    name: 'Ohmecarfentanil',
    aliases: ['ohmecarfentanil'],
    potency: { oral: [30000, 30000] },
    assumedRoute: true,
    notes: [RESEARCH_NOTE],
  },
];

const F = f(__filename);

/** Names offered by autocomplete before the user has typed anything. */
export const DEFAULT_OPIOID_SUGGESTIONS = [
  'Morphine', 'Codeine', 'Dihydrocodeine', 'Tramadol', 'Tapentadol', 'Hydrocodone', 'Oxycodone',
  'Oxymorphone', 'Hydromorphone', 'Methadone', 'Buprenorphine', 'Fentanyl', 'Diamorphine (heroin)',
  'Pethidine (meperidine)', 'Levorphanol', 'Nalbuphine', 'Butorphanol', 'Pentazocine',
  '7-Hydroxymitragynine', 'U-47700', 'Isotonitazene', 'Metonitazene', 'Protonitazene', 'Carfentanil',
  'Opium',
];

/** Largest dose accepted, in mg. Anything above this is a typo rather than a dose. */
const MAX_DOSE_MG = 100000;

/** Clinical practice reduces a converted dose because cross-tolerance between opioids is incomplete. */
const CAUTIOUS_FLOOR = 0.5;
const CAUTIOUS_CEILING = 0.75;

export interface RouteDose {
  roa: Roa;
  dose: Range;
  /** True when derived from bioavailability rather than read from a potency figure in the source. */
  estimated: boolean;
}

export type OpioidCalcFailure = 'invalid_dose' | 'unknown_from' | 'unknown_to' | 'no_potency_data';

export type OpioidCalcResult =
  | {
    ok: true;
    from: Opioid;
    to: Opioid;
    fromRoute: Roa;
    toRoute: Roa;
    dose: number;
    /** The intermediate step: the dose expressed as oral morphine. */
    morphineEquivalent: Range;
    /** The straight table conversion, before any safety reduction. */
    equianalgesic: Range;
    /** A conservative starting range, or null when both sides are the same drug. */
    cautiousStart: Range | null;
    /** The same effect delivered by other routes, where the source has data for them. */
    otherRoutes: RouteDose[];
    sameDrug: boolean;
  }
  | { ok: false; reason: OpioidCalcFailure; message: string };

/** Case-insensitive, alias-aware lookup. */
export function findOpioid(input: string): Opioid | undefined {
  const needle = input.trim().toLowerCase();
  if (!needle) return undefined;
  return opioids.find(opioid => opioid.name.toLowerCase() === needle || opioid.aliases.includes(needle));
}

/** Route a conversion is expressed in: oral where the source has an oral figure, otherwise the next best. */
export function referenceRoute(opioid: Opioid): Roa | undefined {
  return ROUTE_PREFERENCE.find(roa => opioid.potency[roa] !== undefined);
}

/** True when the source states no route and the table default of oral is doing the work. */
export function routeIsAssumed(opioid: Opioid, route: Roa): boolean {
  return opioid.assumedRoute === true && route === 'oral';
}

function significant(value: number, digits = 3): number {
  if (!Number.isFinite(value) || value === 0) return 0;
  const factor = 10 ** (digits - Math.ceil(Math.log10(Math.abs(value))));
  return Math.round(value * factor) / factor;
}

/** True when the whole range sits below a milligram, meaning it cannot be weighed on a normal scale. */
export function isMicrogramScale(range: Range): boolean {
  return range[1] < 1;
}

export type DoseUnit = 'mg' | 'mcg';

/** The unit a range reads best in. */
export function doseUnit(range: Range): DoseUnit {
  return isMicrogramScale(range) ? 'mcg' : 'mg';
}

/**
 * Renders a dose range, collapsing equal bounds.
 * Pass `unit` to keep every figure in one reply on the same scale. Without it each range picks its own,
 * which looks wrong when the headline is in mg and the reduced figure below it is in mcg.
 */
export function formatDose(range: Range, unit?: DoseUnit): string {
  const [low, high] = range;
  if (!Number.isFinite(low) || !Number.isFinite(high)) return 'not calculable';
  const resolved = unit ?? doseUnit(range);
  const scale = resolved === 'mcg' ? 1000 : 1;
  const from = significant(low * scale);
  const to = significant(high * scale);
  return from === to ? `${from} ${resolved}` : `${from} - ${to} ${resolved}`;
}

/** Renders a potency multiplier, for example "1x" or "3 - 4x". */
export function formatPotency(range: Range): string {
  const from = significant(range[0]);
  const to = significant(range[1]);
  return from === to ? `${from}x` : `${from} - ${to}x`;
}

/**
 * Builds the same-effect dose for every other route the source has data for.
 * Where the source lists a separate potency for a route, use it. It disagrees with the bioavailability
 * maths, and it is the figure that was actually measured.
 */
function buildRouteBreakdown(
  opioid: Opioid,
  referenceDose: Range,
  reference: Roa,
  morphineEquivalent: Range,
): RouteDose[] {
  const referenceBa = opioid.bioavailability?.[reference];

  return ROUTE_ORDER.reduce((routes, roa) => {
    if (roa === reference) return routes;

    const potency = opioid.potency[roa];
    if (potency) {
      routes.push({
        roa,
        dose: [morphineEquivalent[0] / potency[1], morphineEquivalent[1] / potency[0]],
        estimated: false,
      });
      return routes;
    }

    const routeBa = opioid.bioavailability?.[roa];
    if (referenceBa && routeBa) {
      routes.push({
        roa,
        dose: [
          (referenceDose[0] * referenceBa[0]) / routeBa[1],
          (referenceDose[1] * referenceBa[1]) / routeBa[0],
        ],
        estimated: true,
      });
    }
    return routes;
  }, [] as RouteDose[]);
}

/**
 * Converts a dose of one opioid into the equivalent dose of another, always by way of oral morphine.
 * Never returns null or NaN: every failure comes back as a described `ok: false` result.
 */
export function convertOpioid(dose: number, fromInput: string, toInput: string): OpioidCalcResult {
  if (!Number.isFinite(dose) || dose <= 0) {
    log.error(F, `Rejected dose "${dose}" converting ${fromInput} to ${toInput}`);
    return { ok: false, reason: 'invalid_dose', message: 'The dose needs to be a number greater than zero.' };
  }

  if (dose > MAX_DOSE_MG) {
    log.error(F, `Rejected out-of-range dose "${dose}" converting ${fromInput} to ${toInput}`);
    return {
      ok: false,
      reason: 'invalid_dose',
      message: `That is above ${MAX_DOSE_MG} mg, which is past anything this calculator can sensibly handle.`,
    };
  }

  const from = findOpioid(fromInput);
  if (!from) {
    log.error(F, `Unknown source opioid "${fromInput}"`);
    return {
      ok: false,
      reason: 'unknown_from',
      message: `I do not have "${fromInput}" in the opioid table. Pick one from the autocomplete list.`,
    };
  }

  const to = findOpioid(toInput);
  if (!to) {
    log.error(F, `Unknown target opioid "${toInput}"`);
    return {
      ok: false,
      reason: 'unknown_to',
      message: `I do not have "${toInput}" in the opioid table. Pick one from the autocomplete list.`,
    };
  }

  const fromRoute = referenceRoute(from);
  const toRoute = referenceRoute(to);
  const fromPotency = fromRoute ? from.potency[fromRoute] : undefined;
  const toPotency = toRoute ? to.potency[toRoute] : undefined;

  if (!fromRoute || !toRoute || !fromPotency || !toPotency) {
    log.error(F, `Missing potency data converting ${from.name} to ${to.name}`);
    return {
      ok: false,
      reason: 'no_potency_data',
      message: 'The source table has no usable potency figure for one of those, so I cannot convert between them.',
    };
  }

  const sameDrug = from.name === to.name;
  const morphineEquivalent: Range = [dose * fromPotency[0], dose * fromPotency[1]];

  // Converting a drug to itself must return the input, not a range widened by its own potency spread.
  const equianalgesic: Range = sameDrug
    ? [dose, dose]
    : [morphineEquivalent[0] / toPotency[1], morphineEquivalent[1] / toPotency[0]];

  const cautiousStart: Range | null = sameDrug
    ? null
    : [equianalgesic[0] * CAUTIOUS_FLOOR, equianalgesic[1] * CAUTIOUS_CEILING];

  return {
    ok: true,
    from,
    to,
    fromRoute,
    toRoute,
    dose,
    morphineEquivalent,
    equianalgesic,
    cautiousStart,
    otherRoutes: buildRouteBreakdown(to, equianalgesic, toRoute, morphineEquivalent),
    sameDrug,
  };
}

/** Compact route names for inline prose, e.g. "20 mg oral oxycodone". */
export const ROUTE_SHORT: Record<Roa, string> = {
  oral: 'oral',
  parenteral: 'injected',
  intranasal: 'intranasal',
  sublingual: 'sublingual',
  buccal: 'buccal',
  transdermal: 'transdermal',
  rectal: 'rectal',
  intrathecal: 'intrathecal',
};

/** Why a drug in one of these classes is not a like-for-like swap. */
export const PHARMACOLOGY_WARNINGS: Record<Pharmacology, string> = {
  'partial-agonist': 'Partial agonist: it binds tightly and caps out, so past a point more does not mean '
    + 'more.',
  'mixed-agonist-antagonist': 'Mixed agonist-antagonist. On top of physical dependence to a full agonist '
    + 'it can trigger immediate, severe withdrawal instead of adding to the effect.',
  'kappa-agonist': 'Kappa agonist. Effects are typically dysphoric rather than euphoric, so a pain-relief '
    + 'equivalence figure says very little about how it will actually feel.',
};
