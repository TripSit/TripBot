/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
import OpenAI from 'openai';
import {
  Colors,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  MessageComponentInteraction,
  time,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  ModalSubmitInteraction,
  StringSelectMenuComponent,
  InteractionEditReplyOptions,
  InteractionUpdateOptions,
  SelectMenuComponentOptionData,
  AttachmentBuilder,
  GuildMember,
  TextChannel,
  ActionRow,
  MessageActionRowComponent,
  LabelBuilder,
} from 'discord.js';
import {
  APIEmbed,
  APISelectMenuOption,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import { rpg_inventory } from '@db/tripbot';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import getAsset from '../../utils/getAsset';
import { customButton } from '../../utils/emoji';
import { getProfilePreview } from './d.profile';
import { aiFlairMod } from '../../../global/commands/g.ai';
import { bigBrother } from '../../../global/utils/thoughtPolice';
import { getOrCreatePersona, getOrCreateUser } from '../../../global/utils/dbRecords';
import { randomItem } from '../../../global/utils/random';
import { sleep } from '../../utils/sleep';

const tripSitProfileImage = 'tripsit-profile-image.png';
const tripSitProfileImageAttachment = 'attachment://tripsit-profile-image.png';

const F = f(__filename);

// Value in milliseconds (1000 * 60 * 1 = 1 minute)
// const intervals = {
//   quest: env.NODE_ENV === 'production' ? 1000 * 60 * 60 : 1000 * 1,
//   dungeon: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000 * 1,
//   raid: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 7 : 1000 * 1,
// };

const items = {
  general: {
    userflair: {
      // eslint-disable-next-line sonarjs/no-duplicate-string
      label: 'User Flair',
      value: 'userflair',
      description: 'User Flair',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'userflair',
      effect_value: 'Use /rpg flair to set',
      emoji: 'itemFlair',
    // },
    // testkit: {
    //   label: 'TestKit',
    //   value: 'testkit',
    //   description: '10% more tokens from all sources!',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 2000,
    //   equipped: true,
    //   consumable: false,
    //   effect: 'tokenMultiplier',
    //   effect_value: '0.1',
    //   emoji: 'itemBonus',
    // },
    // scale: {
    //   label: 'Scale',
    //   value: 'scale',
    //   description: '10% more tokens from all sources!',
    //   quantity: 1,
    //   weight: 0,
    //   cost: 3000,
    //   equipped: true,
    //   consumable: false,
    //   effect: 'tokenMultiplier',
    //   effect_value: '0.1',
    //   emoji: 'itemBonus',
    },
    PremiumMember: {
      // eslint-disable-next-line sonarjs/no-duplicate-string
      label: 'Premium Member Role',
      value: 'PremiumMembership',
      description: 'Grants the Premium Member role',
      quantity: 1,
      weight: 0,
      cost: 25000,
      equipped: false,
      consumable: true,
      effect: 'role',
      effect_value: 'PremiumMembership',
      emoji: 'itemPremium',
    },
  },
  fonts: {
    AbrilFatFace: {
      label: 'Abril Fatface',
      value: 'AbrilFatFace',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'AbrilFatFace',
      emoji: 'itemFont',
    },
    AudioWide: {
      label: 'Audio Wide',
      value: 'AudioWide',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'AudioWide',
      emoji: 'itemFont',
    },
    BlackOpsOne: {
      label: 'Black Ops One',
      value: 'BlackOpsOne',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'BlackOpsOne',
      emoji: 'itemFont',
    },
    CabinSketch: {
      label: 'Cabin Sketch',
      value: 'CabinSketch',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'CabinSketch',
      emoji: 'itemFont',
    },
    Creepster: {
      label: 'Creepster',
      value: 'Creepster',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Creepster',
      emoji: 'itemFont',
    },
    Fascinate: {
      label: 'Fascinate',
      value: 'Fascinate',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Fascinate',
      emoji: 'itemFont',
    },
    FontdinerSwanky: {
      label: 'Fontdiner Swanky',
      value: 'FontdinerSwanky',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'FontdinerSwanky',
      emoji: 'itemFont',
    },
    Graduate: {
      label: 'Graduate',
      value: 'Graduate',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Graduate',
      emoji: 'itemFont',
    },
    IndieFlower: {
      label: 'Indie Flower',
      value: 'IndieFlower',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'IndieFlower',
      emoji: 'itemFont',
    },
    Kablammo: {
      label: 'Kablammo',
      value: 'Kablammo',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Kablammo',
      emoji: 'itemFont',
    },
    KumarOne: {
      label: 'Kumar One',
      value: 'KumarOne',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'KumarOne',
      emoji: 'itemFont',
    },
    LilitaOne: {
      label: 'Lilita One',
      value: 'LilitaOne',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'LilitaOne',
      emoji: 'itemFont',
    },
    Lobster: {
      label: 'Lobster',
      value: 'Lobster',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Lobster',
      emoji: 'itemFont',
    },
    Mogra: {
      label: 'Mogra',
      value: 'Mogra',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Mogra',
      emoji: 'itemFont',
    },
    PressStart2P: {
      label: 'Press Start 2P',
      value: 'PressStart2P',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'PressStart2P',
      emoji: 'itemFont',
    },
    ProtestRevolution: {
      label: 'Protest Revolution',
      value: 'ProtestRevolution',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'ProtestRevolution',
      emoji: 'itemFont',
    },
    ReggaeOne: {
      label: 'Reggae One',
      value: 'ReggaeOne',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'ReggaeOne',
      emoji: 'itemFont',
    },
    RubikGlitch: {
      label: 'Rubik Glitch',
      value: 'RubikGlitch',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'RubikGlitch',
      emoji: 'itemFont',
    },
    Rye: {
      label: 'Rye',
      value: 'Rye',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Rye',
      emoji: 'itemFont',
    },
    Satisfy: {
      label: 'Satisfy',
      value: 'Satisfy',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Satisfy',
      emoji: 'itemFont',
    },
    SedwickAve: {
      label: 'Sedwick Ave',
      value: 'SedwickAve',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'SedwickAve',
      emoji: 'itemFont',
    },
    SpecialElite: {
      label: 'Special Elite',
      value: 'SpecialElite',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'SpecialElite',
      emoji: 'itemFont',
    },
    SpicyRice: {
      label: 'Spicy Rice',
      value: 'SpicyRice',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'SpicyRice',
      emoji: 'itemFont',
    },
    Workbench: {
      label: 'Workbench',
      value: 'Workbench',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 700,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Workbench',
      emoji: 'itemFont',
    },
    Barcode: {
      label: 'Barcode',
      value: 'Barcode',
      description: 'Font',
      quantity: 1,
      weight: 0,
      cost: 7500,
      equipped: false,
      consumable: false,
      effect: 'font',
      effect_value: 'Barcode',
      emoji: 'itemFont',
    },
  },
  backgrounds: {
    AbstractTriangles: {
      label: 'Abstract Triangles',
      value: 'AbstractTriangles',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'AbstractTriangles',
      emoji: 'itemBackground',
    },
    ArcadeCarpet: {
      label: 'Arcade Carpet',
      value: 'ArcadeCarpet',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'ArcadeCarpet',
      emoji: 'itemBackground',
    },
    CircuitBoard: {
      label: 'Circuit Board',
      value: 'CircuitBoard',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'CircuitBoard',
      emoji: 'itemBackground',
    },
    CoffeeSwirl: {
      label: 'Coffee Swirl',
      value: 'CoffeeSwirl',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'CoffeeSwirl',
      emoji: 'itemBackground',
    },
    Concentric: {
      label: 'Concentric',
      value: 'Concentric',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Concentric',
      emoji: 'itemBackground',
    },
    Connected: {
      label: 'Connected',
      value: 'Connected',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Connected',
      emoji: 'itemBackground',
    },
    CubeTunnels: {
      label: 'Cube Tunnels',
      value: 'CubeTunnels',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'CubeTunnels',
      emoji: 'itemBackground',
    },
    DiamondChevron: {
      label: 'Diamond Chevron',
      value: 'DiamondChevron',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'DiamondChevron',
      emoji: 'itemBackground',
    },
    Dissociating: {
      label: 'Dissociating',
      value: 'Dissociating',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Dissociating',
      emoji: 'itemBackground',
    },
    DotnDash: {
      label: 'Dot n Dash',
      value: 'DotnDash',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'DotnDash',
      emoji: 'itemBackground',
    },
    Drunk: {
      label: 'Drunk',
      value: 'Drunk',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Drunk',
      emoji: 'itemBackground',
    },
    Emoticons: {
      label: 'Emoticons',
      value: 'Emoticons',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Emoticons',
      emoji: 'itemBackground',
    },
    Equations: {
      label: 'Equations',
      value: 'Equations',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Equations',
      emoji: 'itemBackground',
    },
    Flow: {
      label: 'Flow',
      value: 'Flow',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Flow',
      emoji: 'itemBackground',
    },
    Flowers: {
      label: 'Flowers',
      value: 'Flowers',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Flowers',
      emoji: 'itemBackground',
    },
    Geolines: {
      label: 'Geolines',
      value: 'Geolines',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Geolines',
      emoji: 'itemBackground',
    },
    Halftone: {
      label: 'Halftone',
      value: 'Halftone',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Halftone',
      emoji: 'itemBackground',
    },
    High: {
      label: 'High',
      value: 'High',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'High',
      emoji: 'itemBackground',
    },
    Leaves: {
      label: 'Leaves',
      value: 'Leaves',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Leaves',
      emoji: 'itemBackground',
    },
    LineLeaves: {
      label: 'Line Leaves',
      value: 'LineLeaves',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'LineLeaves',
      emoji: 'itemBackground',
    },
    LiquidMaze: {
      label: 'Liquid Maze',
      value: 'LiquidMaze',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'LiquidMaze',
      emoji: 'itemBackground',
    },
    Memphis: {
      label: 'Memphis',
      value: 'Memphis',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Memphis',
      emoji: 'itemBackground',
    },
    Mindsets: {
      label: 'Mindsets',
      value: 'Mindsets',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Mindsets',
      emoji: 'itemBackground',
    },
    Musical: {
      label: 'Musical',
      value: 'Musical',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Musical',
      emoji: 'itemBackground',
    },
    Noise: {
      label: 'Noise',
      value: 'Noise',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Noise',
      emoji: 'itemBackground',
    },
    Paisley: {
      label: 'Paisley',
      value: 'Paisley',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Paisley',
      emoji: 'itemBackground',
    },
    Paws: {
      label: 'Paws',
      value: 'Paws',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Paws',
      emoji: 'itemBackground',
    },
    PixelCamo: {
      label: 'Pixel Camo',
      value: 'PixelCamo',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'PixelCamo',
      emoji: 'itemBackground',
    },
    Plaid: {
      label: 'Plaid',
      value: 'Plaid',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Plaid',
      emoji: 'itemBackground',
    },
    Rolling: {
      label: 'Rolling',
      value: 'Rolling',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Rolling',
      emoji: 'itemBackground',
    },
    Safari: {
      label: 'Safari',
      value: 'Safari',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Safari',
      emoji: 'itemBackground',
    },
    Sedated: {
      label: 'Sedated',
      value: 'Sedated',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Sedated',
      emoji: 'itemBackground',
    },
    SpaceIcons: {
      label: 'Space Icons',
      value: 'SpaceIcons',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'SpaceIcons',
      emoji: 'itemBackground',
    },
    Sprinkles: {
      label: 'Sprinkles',
      value: 'Sprinkles',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Sprinkles',
      emoji: 'itemBackground',
    },
    SquareTwist: {
      label: 'Square Twist',
      value: 'SquareTwist',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'SquareTwist',
      emoji: 'itemBackground',
    },
    Squiggles: {
      label: 'Squiggles',
      value: 'Squiggles',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Squiggles',
      emoji: 'itemBackground',
    },
    Stimming: {
      label: 'Stimming',
      value: 'Stimming',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Stimming',
      emoji: 'itemBackground',
    },
    Topography: {
      label: 'Topography',
      value: 'Topography',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Topography',
      emoji: 'itemBackground',
    },
    TriangleOverlap: {
      label: 'Triangle Overlap',
      value: 'TriangleOverlap',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'TriangleOverlap',
      emoji: 'itemBackground',
    },
    Tripping: {
      label: 'Tripping',
      value: 'Tripping',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Tripping',
      emoji: 'itemBackground',
    },
    Waves: {
      label: 'Waves',
      value: 'Waves',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'Waves',
      emoji: 'itemBackground',
    },
    XandO: {
      label: 'XandO',
      value: 'XandO',
      description: 'Background',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: false,
      consumable: false,
      effect: 'background',
      effect_value: 'XandO',
      emoji: 'itemBackground',
    },
  },
} as {
  [key: string]: {
    [key: string]: {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
  }
};

const genome = {
  classes: {
    jobless: {
      label: 'No Job',
      value: 'jobless',
      description: 'A jobless person',
      emoji: '👨‍🌾',
    },
    warrior: {
      label: 'Warrior',
      value: 'warrior',
      description: 'A strong fighter',
      emoji: '⚔️',
    },
    mage: {
      label: 'Mage',
      value: 'mage',
      description: 'A powerful spell caster',
      emoji: '🧙',
    },
    rogue: {
      label: 'Rogue',
      value: 'rogue',
      description: 'A stealthy assassin',
      emoji: '🗡️',
    },
    archer: {
      label: 'Archer',
      value: 'archer',
      description: 'A ranged attacker',
      emoji: '🏹',
    },
  },
  species: {
    formless: {
      label: 'No Form',
      value: 'formless',
      description: 'A formless being',
      emoji: '👻',
    },
    human: {
      label: 'Human',
      value: 'human',
      description: 'A human',
      emoji: '👨',
    },
    elf: {
      label: 'Elf',
      value: 'elf',
      description: 'An elf',
      emoji: '🧝',
    },
    dwarf: {
      label: 'Dwarf',
      value: 'dwarf',
      description: 'A dwarf',
      emoji: '🪓',
    },
    orc: {
      label: 'Orc',
      value: 'orc',
      description: 'An orc',
      emoji: '👹',
    },
  },
  guilds: {
    guildless: {
      label: 'No Guild',
      value: 'guildless',
      description: 'No guild',
      emoji: '🏳️',
    },
    gryffindor: {
      label: 'Gryffindor',
      value: 'gryffindor',
      description: 'Gryffindor guild',
      emoji: '🦁',
    },
    hufflepuff: {
      label: 'Hufflepuff',
      value: 'hufflepuff',
      description: 'Hufflepuff guild',
      emoji: '🦡',
    },
    ravenclaw: {
      label: 'Ravenclaw',
      value: 'ravenclaw',
      description: 'Ravenclaw guild',
      emoji: '🦅',
    },
    slytherin: {
      label: 'Slytherin',
      value: 'slytherin',
      description: 'Slytherin guild',
      emoji: '🐍',
    },
  },
} as {
  [key: string]: {
    [key: string]: {
      label: string;
      value: string;
      description: string;
      emoji: string;
      default?: boolean;
    }
  }
};

const BetLossMessageList = [
  'Let\'s just pretend you didn\'t lose anything.',
  'Thank you for your donation.',
  'You lost your bet, but you gained a friend.',
  'We can still be friends, right?',
  'Perhaps this is a sign that you should stop gambling.',
  'Maybe you should try a different game.',
  'I promise I\'ll spend it wisely.',
  'I hope you didn\'t need that.',
  'I\'m sure you\'ll win it back...',
  'There is probably a better way to spend your money.',
  'I\'m sure you can find some more under the couch cushions...',
  'Sheeeeeesh...',
  'Sometimes you win, sometimes you lose.',
  'It is what it is.',
  'That\'s just how the cookie crumbles.',
  'I promise the odds are perfectly fair!.',
  'Perhaps it is time to take a break.',
  'I hope you\'re ok with eating ramen',
  'I hope you\'re not too upset.',
  'Was it rigged? Who knows!',
  'I triple checked the math, and can confirm you\'re just unlucky.',
  'At least your wallet is a bit easier to carry now.',
  'I\'ll pretend I didn\'t see that.',
  'I promise I won\'t tell anyone.',
  'Tip: Try not to lose next time.',
];

const BetWinMessageList = [
  'Free lunch!',
  'Wowee!',
  'I\'m jealous!',
  'I hope you spend it wisely.',
  'Looks like you\'re having lobster tonight!',
  'Someone is feeling lucky!',
  'Congratulations!',
  'Gee whiz!',
  'Time to party!',
  'Today is your lucky day!',
  'You\'re gonna spend it wisely, right?',
  'You\'re gonna buy me something nice, right?',
  'Luck? Skill? Who knows!',
  'Sometimes chance favors the prepared mind.',
  'A.K.A. you\'re a lucky soul.',
  'Free money!',
  'It\'s a Christmas miracle!',
  'You\'re going to need a bigger wallet.',
  'I\'m so glad we could witness this special moment together.',
  'Yippee!',
];

const text = {
  enter: [
    'take a bus to',
    'walk to',
    'ride a bike to',
    'drive to',
    'somehow wind up in',
    'teleport to',
    'fly to',
    'take a taxi to',
    'take a train to',
    'take a boat to',
    'take a plane to',
    'take a helicopter to',
    'ride by eagle to',
    'trek through the lands of middle earth to get to ',
  ],
  quest: [
    'You find some missing children and return them to their parents.\nThe children give you the **{tokens} tokens **they found on their adventure.',
    'You find a lost puppy and return it to its owner.\nAs you were chasing the puppy you found **{tokens} tokens **on the ground, nice!',
    'You find a lost cat and return it to its owner.\nThe cat coughs up a hairball.\nOh, that\'s actually **{tokens} tokens!**\nYou wipe them off and pocket them.',
    'You find a lost dog and return it to its owner.\nThe dog looks into your eyes and you feel a connection to their soul.\nYour pocket feels **{tokens} tokens **heavier.',
    'You find a lost bird and return it to its owner.\nThe bird gives you a really cool feather.\nYou trade the feather to some kid for **{tokens} tokens.**',
    'You find a lost fish and return it to its owner.\nHow do you lose a fish?\nYou decide not to ask and leave with your **{tokens} tokens **as soon as you can.',
    'You borrow a metal detector and find a lost ring.\nYou return the ring to its owner and they are so grateful they give you **{tokens} tokens.**',
    'You find someone worried that their pill could be dangerous.\nYou use one of your fentanyl strips to make sure they can rule that out!\nThey\'re so grateful they give you **{tokens} tokens.**',
    'Someone asks if you can help make sure their bag of powder is what they think it is.\nYou use your test kit to help identify for them and they give you **{tokens} tokens **for keeping them safe.',
    'You happen upon along with wide pupils and sweating in a t-shirt.\nAfter an enthusiastic conversation that has no point you give them some gatorade that they down almost instantly.\nThey hug you and slip **{tokens} tokens **into your pocket.',
    'You do some hunting and bring back some food for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You go fishing and bring back some food for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You go mining and bring back some ore for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You help build a new house in the town.\nThe town gives you **{tokens} tokens **for your troubles.',
  ],
  dungeon: [
    'You voyaged to fight the evil wizard in the dark tower!\nBut they\'re just misunderstood and enjoy earth tones.\nThey appreciate the visit and gave you **{tokens} tokens **for your troubles.',
    'You were tasked with killing a dragon that has looted the countryside!\nBut it was only feeding its baby dragon.\nYou taught the dragon how to farm and it gave you **{tokens} Tokens.**',
    'You attempted to subdue the ogre known for assaulting people!\nBut it turns out they just hug too hard.\nYou taught them about personal boundaries and they gave you **{tokens} Tokens.**',
    'You went to the local cave to fight the goblin king!\nBut it turns out he was just a goblin who wanted to be king.\nYou taught him about democracy and he gave you **{tokens} Tokens.**',
    'You journey to the dark forest to fight the evil witch!\nBut they turn out to be a gardner with too much property.\nYou taught her about landscapers and she gave you **{tokens} Tokens.**',
  ],
};

export type GameName = 'Coinflip' | 'Roulette' | 'Blackjack' | 'Slots';

const wagers = {} as {
  [key: string]: {
    gameName: GameName,
    tokens: number,
  },
};

function getLastMonday(d:Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return new Date(d);
}

export async function rpgBounties(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  command: 'quest' | 'dungeon' | 'raid' | null,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  const rowBounties = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      customButton(`rpgQuest,user:${interaction.user.id}`, 'Quest', 'buttonQuest', ButtonStyle.Secondary),
      customButton(`rpgDungeon,user:${interaction.user.id}`, 'Dungeon', 'buttonDungeon', ButtonStyle.Secondary),
      customButton(`rpgRaid,user:${interaction.user.id}`, 'Raid', 'buttonRaid', ButtonStyle.Secondary),
      customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
    );

  const contracts = {
    quest: {
      success: {
        title: `${emojiGet('buttonQuest')} Quest Success (Hourly)`,
        description: stripIndents`${randomItem(text.quest)}`,
        color: Colors.Green,
      },
      fail: {
        title: `${emojiGet('buttonQuest')} Quest Fail (Hourly)`,
        description: stripIndents`
          There are no more quests available at the moment. New quests are posted every hour!
        `,
        color: Colors.Red,
      },
    },
    dungeon: {
      success: {
        title: `${emojiGet('buttonDungeon')} Dungeon Success (Daily)`,
        description: stripIndents`${randomItem(text.dungeon)}`,
        color: Colors.Green,
      },
      fail: {
        title: `${emojiGet('buttonDungeon')} Dungeon Fail (Daily)`,
        description: stripIndents`
          You already cleared a dungeon today, you're still tired and need to prepare.
        `,
        color: Colors.Red,
      },
    },
    raid: {
      success: {
        title: `${emojiGet('buttonRaid')} Raid Success (Weekly)`,
        description: stripIndents`
          You stormed into Moonbear's office, rustle their jimmies and stole {tokens} TripTokens!
        `,
        color: Colors.Green,
      },
      fail: {
        title: `${emojiGet('buttonRaid')} Raid Fail (Weekly)`,
        description: stripIndents`
          You've already raided Moonbear's office this week, give them a break!
        `,
        color: Colors.Red,
      },
    },
  };

  const allResetTimes: { [key: string]: Date } = {
    quest: new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)),
    dungeon: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)),
    raid: new Date(new Date(getLastMonday(new Date()).getTime() + 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)),
  };

  // If the command is not null, we need to check the respective reset time
  if (command !== null) {
    const dbKey = `last_${command}`;
    const lastBounties = personaData[dbKey as 'last_quest' | 'last_dungeon' | 'last_raid'] as Date;
    let timeout = false;

    if (lastBounties) {
      // Check if the user has already completed the bounty type today, hourly, or weekly
      const currentDate = new Date();

      const timeComparison = {
        quest: () => lastBounties.getHours() === currentDate.getHours(),
        dungeon: () => lastBounties.getDate() === currentDate.getDate(),
        raid: () => lastBounties.getTime() > getLastMonday(currentDate).getTime(),
      };

      if (timeComparison[command]?.()) {
        timeout = true;
      }
    }

    // Including all reset times in the response
    const resetTimesMessage = stripIndents`
      **Reset Times:**
      - Quest: ${time(allResetTimes.quest, 'R')}
      - Dungeon: ${time(allResetTimes.dungeon, 'R')}
      - Raid: ${time(allResetTimes.raid, 'R')}
    `;

    if (timeout) {
      return {
        embeds: [embedTemplate()
          .setAuthor(null)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
          .setTitle(contracts[command].fail.title)
          .setDescription(stripIndents`${contracts[command].fail.description}
            ${resetTimesMessage}
            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`)
          .setColor(contracts[command].fail.color)],
        components: [rowBounties],
      };
    }

    // Process tokens and other logic here...
    let tokens = 10;
    if (command === 'dungeon') { tokens = 50; } else if (command === 'raid') { tokens = 100; }

    let tokenMultiplier = inventoryData
      .filter(item => item.effect === 'tokenMultiplier')
      .reduce((acc, item) => acc + parseFloat(item.effect_value), 1);

    // Check for roles and adjust multiplier
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (member?.roles.cache.has(env.ROLE_BOOSTER) || member?.roles.cache.has(env.ROLE_PATRON)) {
      tokenMultiplier += 0.1;
    }

    tokenMultiplier = Math.round(tokenMultiplier * 10) / 10;
    tokens *= tokenMultiplier;

    if (env.NODE_ENV === 'development') { tokens *= 10; }

    tokens = Math.round(tokens);

    // Award tokens to the user
    personaData.tokens += tokens;
    personaData[dbKey as 'last_quest' | 'last_dungeon' | 'last_raid'] = new Date();

    await db.personas.upsert({
      where: {
        id: personaData.id,
      },
      create: personaData,
      update: personaData,
    });

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(contracts[command].success.title)
        .setDescription(stripIndents`${contracts[command].success.description.replace('{tokens}', tokens.toString())}
          ${resetTimesMessage}
          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`)
        .setColor(contracts[command].success.color)],
      components: [rowBounties],
    };
  }

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonBounties')} Bounties`)
      .setDescription(stripIndents`
      You are at the bounty board, you can go on a quest, clear a dungeon, or go on a raid.
    `)
      .setColor(Colors.Green)],
    components: [rowBounties],
  };
}

export async function rpgMarketInventory(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    marketInventory:SelectMenuComponentOptionData[];
    personaTokens:number;
    personaInventory:string;
    personaDiscounts:string;
    personaDiscount:number;
  }> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // Get a string display of the user's discounts
  // Check if they have the Premium Member role
  // Define the discount types
  const discountTypes = [
    {
      roleId: env.ROLE_PREMIUM, discount: 0.2, name: 'Premium Member', amount: '20%',
    },
    {
      roleId: env.ROLE_BOOSTER, discount: 0.1, name: 'Server Booster', amount: '10%',
    },
    // Add more discount types here
  ];

  let discount = 0;
  let discountString = '';
  const member = await interaction.guild?.members.fetch(interaction.user.id);

  // Iterate over the discount types
  for (const discountType of discountTypes) {
    if (member?.roles.cache.has(discountType.roleId)) {
      discount += discountType.discount;
      discountString += `**${discountType.name}** - ${discountType.amount} off\n`;
    }
  }

  // Add the "Discounts" heading if there are any discounts
  if (discountString) {
    discountString = `${emojiGet('itemDiscount')} **Discounts**\n${discountString}`;
  }

  // Get a string display of the user's inventory
  const inventoryList = inventoryData.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = inventoryData.length > 0
    ? stripIndents`
    ${emojiGet('itemInventory')} **Inventory (${inventoryData.length}/20)**
      ${inventoryList}
      `
    : '';

  interface MarketItem extends SelectMenuComponentOptionData {
    category: string;
  }

  // Go through items.general and items.backgrounds and create a new object of items that the user doesn't have yet
  const marketInventory: MarketItem[] = [];

  for (const [category, categoryItems] of Object.entries(items)) {
    for (const item of Object.values(categoryItems)) {
      if (!inventoryData.find(i => i.value === item.value)
          && !(item.value === 'PremiumMembership' && member?.roles.cache.has(env.ROLE_PREMIUM))) {
        marketInventory.push({
          label: `${item.label} - ${(item.cost - (discount * item.cost))} TT$`,
          value: item.value,
          description: `${item.description}`,
          emoji: emojiGet(item.emoji).id,
          category,
        });
      }
    }
  }

  return {
    marketInventory,
    personaTokens: personaData.tokens,
    personaInventory: inventoryString,
    personaDiscounts: discountString,
    personaDiscount: discount,
  };
}

export async function rpgMarket(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Get the info used in the market
  const {
    marketInventory,
    personaTokens,
    personaInventory,
    personaDiscounts,
  } = await rpgMarketInventory(interaction);

  // This is the row of nav buttons. It starts with the town button.
  const rowMarket = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
    );

  // Everyone gets the town button, but only people with purchased items get the items select menu
  const componentList = [rowMarket] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];

  interface MarketItem extends SelectMenuComponentOptionData {
    category: string;
  }

  // Group marketInventory items by their category property
  const groups = (marketInventory as MarketItem[]).reduce((groupData: Record<string, MarketItem[]>, item) => {
    const { category } = item;
    const newGroupData = { ...groupData };
    newGroupData[category] = newGroupData[category] ? [...newGroupData[category], item] : [item];
    return newGroupData;
  }, {});

  // For each group, split the group into chunks of 20 items each and create a new rowItems for each chunk
  for (const [group, itemsData] of Object.entries(groups)) {
    // Create chunks of 20 items each
    const chunks = [];
    for (let i = 0; i < itemsData.length; i += 25) {
      chunks.push(itemsData.slice(i, i + 25));
    }

    // Create a new rowItems for each chunk
    for (const [index, chunk] of chunks.entries()) {
      const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgGeneralSelect,user:${interaction.user.id},group:${group},chunk:${index}`)
            .setPlaceholder(chunks.length === 1 ? `${group.charAt(0).toUpperCase() + group.slice(1)}` : `${group.charAt(0).toUpperCase() + group.slice(1)} ${index + 1}`)
            .addOptions(chunk),
        );
      componentList.push(rowItems);
    }
  }

  // The user has clicked the market button, send them the market embed
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(stripIndents`
      You are in the local market, you can buy some items to help you on your journey.

      ${emojiGet('itemFont')} ***Fonts*** change the font of your /profile username
      ${emojiGet('itemBackground')} ***Backgrounds*** change the background of your /profile
      
      ***More items coming soon! Check back later.***
      
      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}
      ${personaDiscounts ? `\n${personaDiscounts}` : ''}
    ${personaInventory}`)
      .setColor(Colors.Gold)],
    components: componentList,
  };
}

interface MarketItem extends SelectMenuComponentOptionData {
  category: string;
}

/** The option marked as default in any select menu of the message, if there is one. */
function defaultMenuOption(interaction: MessageComponentInteraction): APISelectMenuOption | undefined {
  return interaction.message.components
    .flatMap(component => (component.type === ComponentType.ActionRow && 'components' in component ? component.components : []))
    .flatMap(subComponent => (subComponent.type === ComponentType.StringSelect ? subComponent.options : []))
    .find((o:APISelectMenuOption) => o.default === true);
}

type MarketItemData = {
  label: string;
  value: string;
  description: string;
  quantity: number;
  weight: number;
  cost: number;
  equipped: boolean;
  consumable: boolean;
  effect: string;
  effect_value: string;
  emoji: string;
};

const findMarketItemData = (value: string | undefined): MarketItemData => (
  [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)]
    .find(item => item.value === value) as MarketItemData
);

/** Finds the item selected in the market: the default option of the menu on a button click, or the chosen value. */
function selectedMarketChoice(interaction: MessageComponentInteraction): string {
  if (interaction.isButton()) {
    return defaultMenuOption(interaction)?.value ?? '';
  }
  if (interaction.isStringSelectMenu()) {
    return interaction.values[0];
  }
  return '';
}

/** One select menu per group of items, split into chunks of 25 (the most a menu holds). */
function marketSelectRows(marketInventory: MarketItem[], userId: string): ActionRowBuilder<StringSelectMenuBuilder>[] {
  const groups = marketInventory.reduce((groupData: Record<string, MarketItem[]>, item) => {
    const { category } = item;
    const newGroupData = { ...groupData };
    newGroupData[category] = newGroupData[category] ? [...newGroupData[category], item] : [item];
    return newGroupData;
  }, {});

  const rows: ActionRowBuilder<StringSelectMenuBuilder>[] = [];
  // For each group, split the group into chunks of 25 items each and create a new rowItems for each chunk
  for (const [group, itemsData] of Object.entries(groups)) { // eslint-disable-line no-restricted-syntax
    // Create chunks of 25 items each
    const chunks = [];
    for (let i = 0; i < itemsData.length; i += 25) {
      chunks.push(itemsData.slice(i, i + 25));
    }

    // Create a new rowItems for each chunk
    const groupName = group.charAt(0).toUpperCase() + group.slice(1);
    for (const [index, chunk] of chunks.entries()) { // eslint-disable-line no-restricted-syntax
      rows.push(new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgGeneralSelect,user:${userId},group:${group},chunk:${index}`)
            .setPlaceholder(chunks.length === 1 ? groupName : `${groupName} ${index + 1}`)
            .addOptions(chunk),
        ));
    }
  }
  return rows;
}

/** Renders what the profile would look like with the chosen item, for items that change it. */
async function marketPreviewImage(
  itemData: { effect: string; effect_value: string } | undefined,
  target: GuildMember,
): Promise<Buffer | null> {
  if (itemData?.effect === 'background') {
    const imagePath = await getAsset(itemData.effect_value);
    return getProfilePreview(target, 'background', imagePath);
  }
  if (itemData?.effect === 'font') {
    return getProfilePreview(target, 'font', undefined, itemData.effect_value);
  }
  if (itemData?.effect === 'userflair') {
    return getProfilePreview(target, 'userflair');
  }
  return null;
}

export async function rpgMarketChange(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Get the info used in the market
  const {
    marketInventory,
    personaTokens,
    personaInventory,
    personaDiscounts,
  } = await rpgMarketInventory(interaction);

  // Get the item the user selected
  const choice = selectedMarketChoice(interaction);

  // Get a list of marketInventory where the value does not equal the choice
  // const filteredItems = Object.values(marketInventory).filter(item => item.value !== choice);

  const stringMenu = new StringSelectMenuBuilder()
    .setCustomId(`rpgGeneralSelect,user:${interaction.user.id}`)
    .setPlaceholder('Select an item to buy');

  // Use marketInventory and find the item that matches the choice, make it default
  let itemData = {} as {
    label: string;
    value: string;
    description: string;
    quantity: number;
    weight: number;
    cost: number;
    equipped: boolean;
    consumable: boolean;
    effect: string;
    effect_value: string;
    emoji: string;
  };
  const chosenItem = marketInventory.find(marketItem => marketItem.value === choice);
  if (chosenItem) {
    chosenItem.default = true;
    stringMenu.addOptions(chosenItem);
    const allItems = [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)];
    itemData = allItems.find(item => item.value === chosenItem?.value) as {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
  }

  const rowMarket = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
    );

  if (chosenItem) {
    rowMarket.addComponents(
      customButton(`rpgMarketBuy,user:${interaction.user.id}`, 'Buy', 'buttonBuy', ButtonStyle.Success).setLabel(`Buy ${chosenItem.label}`),
    );
  }

  const components = [rowMarket] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];

  components.push(...marketSelectRows(marketInventory as MarketItem[], interaction.user.id));

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
    .setTitle(`${emojiGet('buttonMarket')} Market`)
    .setDescription(stripIndents`
      You are in the local market, you can buy some items to help you on your journey.

      ${emojiGet('itemFont')} ***Fonts*** change the font of your /profile username
      ${emojiGet('itemBackground')} ***Backgrounds*** change the background of your /profile
      
      ***More items coming soon! Check back later.***

      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}
      ${personaDiscounts ? `\n${personaDiscounts}` : ''}
      ${personaInventory}`)
    .setColor(Colors.Gold);

  const imageFiles = [] as AttachmentBuilder[];
  // if the option is a background, font or userflair, run profile preview as the embed image
  const previewImage = await marketPreviewImage(itemData, interaction.member as GuildMember);
  if (previewImage) {
    imageFiles.push(new AttachmentBuilder(previewImage, { name: tripSitProfileImage }));
    embed.setImage(tripSitProfileImageAttachment);
  }

  return {
    embeds: [embed],
    components,
    files: imageFiles,
  };
}

export async function rpgMarketPreview(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Get the info used in the market
  // const {
  //   marketInventory,
  //   personaTokens,
  //   personaInventory,
  // } = await rpgMarketInventory(interaction);

  // Check get fresh persona data
  // const personaData = await getPersonaInfo(interaction.user.id);
  // log.debug(F, `personaData (Accept): ${JSON.stringify(personaData, null, 2)}`);

  // If the user confirms the information, save the persona information
  const selectedItem = defaultMenuOption(interaction);

  const itemData = findMarketItemData(selectedItem?.value);

  const { embeds, components } = await rpgMarketChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
    .setTitle(`${emojiGet('buttonMarket')} Market`)
    .setDescription(stripIndents`
  
   ${description}`)
    .setColor(Colors.Gold);

  const imageFiles = [] as AttachmentBuilder[];
  if (itemData?.effect === 'background') {
    const imagePath = await getAsset(itemData.effect_value);
    const target = interaction.member as GuildMember;
    const option = 'background';
    const previewImage = await getProfilePreview(target, option, imagePath);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  } else if (itemData?.effect === 'font') {
    const target = interaction.member as GuildMember;
    const fontName = itemData.effect_value;
    const option = 'font';
    const previewImage = await getProfilePreview(target, option, undefined, fontName);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
    log.debug(F, `font: ${fontName}`);
  }

  return {
    embeds: [embed],
    components,
    files: imageFiles,
  };
}

/** The market with a message above it, used when a purchase can't go ahead. */
async function marketBlockedReply(
  interaction: MessageComponentInteraction,
  headline: string,
  previewItem?: MarketItemData,
): Promise<InteractionUpdateOptions> {
  const { embeds, components } = await rpgMarketChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
    .setTitle(`${emojiGet('buttonMarket')} Market`)
    .setDescription(stripIndents`${headline}

    ${description}`)
    .setColor(Colors.Red);
  const imageFiles = [] as AttachmentBuilder[];
  if (previewItem?.effect === 'background') {
    const imagePath = await getAsset(previewItem.effect_value);
    imageFiles.push(new AttachmentBuilder(imagePath));
    embed.setImage(`attachment://${previewItem.effect_value}.png`);
  }

  return {
    embeds: [embed],
    components,
    files: imageFiles,
  };
}

/** Marks a bought item as equipped (unequipping others of its type) and returns the note to show the buyer. */
async function equipBoughtItem(personaId: string, itemData: MarketItemData): Promise<string> {
  const isBackgroundOrFont = itemData.effect === 'background' || itemData.effect === 'font';
  if (!isBackgroundOrFont && itemData.effect !== 'userflair') return '';

  const inventory = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaId,
    },
  });
  const itemIndex = inventory.findIndex(i => i.value === itemData.value);

  // Unequip all items of the same type (flair is only ever one item, so nothing to unequip)
  if (isBackgroundOrFont) {
    const unequipItems = inventory.filter(i => i.effect === itemData.effect && i.equipped === true);
    for (const item of unequipItems) { // eslint-disable-line no-restricted-syntax
      item.equipped = false;
      await db.rpg_inventory.upsert({ // eslint-disable-line no-await-in-loop
        where: {
          id: item.id,
        },
        create: item,
        update: item,
      });
    }
  }

  // Equip the new item
  const equipItem = inventory[itemIndex];
  equipItem.equipped = true;
  await db.rpg_inventory.upsert({
    where: {
      id: equipItem.id,
    },
    create: equipItem,
    update: equipItem,
  });
  return isBackgroundOrFont
    ? `Your ${itemData.effect} has been equipped! Head home to unequip it or change ${itemData.effect}s.`
    : 'Your flair has been equipped! Use `/rpg flair` to change your flair, or head Home to unequip it.';
}

export async function rpgMarketAccept(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // If the user confirms the information, save the persona information
  const selectedItem = defaultMenuOption(interaction);
  log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const itemData = findMarketItemData(selectedItem?.value);

  // Check that the user has less than 25 items in their inventory
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  if (inventoryData.length >= 20 && (itemData.value !== 'PremiumMembership')) {
    return marketBlockedReply(
      interaction,
      '**You cannot buy this item because your inventory is full. Sell some items from your home inventory to make room!**',
    );
  }

  const {
    personaDiscount,
  } = await rpgMarketInventory(interaction);

  const itemCost = (itemData.cost - (itemData.cost * personaDiscount));

  // Check if the user has enough tokens to buy the item
  if (personaData.tokens < itemCost) {
    return marketBlockedReply(interaction, '**You do not have enough tokens to buy this item.**', itemData);
  }

  personaData.tokens -= itemCost;
  await db.personas.upsert({
    where: {
      id: personaData.id,
    },
    create: personaData,
    update: personaData,
  });

  if (itemData.value !== 'PremiumMembership') {
    // Add the item to the user's inventory
    const newItem = {
      persona_id: personaData.id,
      label: itemData.label,
      value: itemData.value,
      description: itemData.description,
      quantity: itemData.quantity,
      weight: itemData.weight,
      cost: itemData.cost,
      equipped: itemData.equipped,
      consumable: itemData.consumable,
      effect: itemData.effect,
      effect_value: itemData.effect_value,
      emoji: itemData.emoji,
    } as rpg_inventory;

    await db.rpg_inventory.create({
      data: newItem,
    });
  }

  // if the item is a background or font, automatically equip it and unequip the other items of the same type
  // If the item is the flair item, equip it and tell them about /rpg flair
  const embedInfoText = await equipBoughtItem(personaData.id, itemData);

  if (itemData.value === 'PremiumMembership') {
    try {
      await (interaction.member as GuildMember)?.roles.add(env.ROLE_PREMIUM);
    } catch {
      personaData.tokens += itemCost;

      await db.personas.upsert({
        where: {
          id: personaData.id,
        },
        create: personaData,
        update: personaData,
      });
    }
  }

  const { embeds, components } = await rpgMarketChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(stripIndents`**You have purchased ${itemData.label} for ${itemCost} TripTokens.
      
      ${embedInfoText}**
      
      ${description}`)
      .setColor(Colors.Green)],
    components,
    files: [],
  };
}

export async function rpgHomeInventory(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<{
    homeInventory:SelectMenuComponentOptionData[];
    personaTokens:number;
    personaInventory:string;
  }> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // Get a string display of the user's inventory
  const inventoryList = inventoryData.map(item => `**${item.label}** - ${item.description}`).join('\n');
  const inventoryString = inventoryData.length > 0
    ? stripIndents`
      ${emojiGet('itemInventory')} **Inventory (${inventoryData.length}/20)**
      ${inventoryList}
      `
    : '';

  // Go through items.general and create a new object of items that the user doesn't have yet
  const homeInventory = [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)]
    .map(item => {
      if (inventoryData.find(i => i.value === item.value)) {
        return {
          label: `${item.label} - ${(item.cost / 4)} TT$`,
          value: item.value,
          description: `${item.description}`,
          cost: item.cost,
          equipped: item.equipped,
          emoji: emojiGet(item.emoji).id,
        };
      }
      return null;
    })
    .filter(item => item !== null) as SelectMenuComponentOptionData[];
  return {
    homeInventory,
    personaTokens: personaData.tokens,
    personaInventory: inventoryString,
  };
}

const FLAIR_ERROR_TITLE = 'Flair Error';

/** A single-embed reply for the flair command. */
function flairReply(title: string, description: string, color: number) {
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setTitle(`${emojiGet('itemFlair')} ${title}`)
      .setDescription(stripIndents`${description}`)
      .setColor(color)],
  };
}

/** Has the AI (or keyword automod, when the AI is unavailable) review a new flair, and saves or answers accordingly. */
async function reviewFlair(
  interaction: ChatInputCommandInteraction,
  flairInventoryItem: rpg_inventory,
  flairInput: string,
) {
  const flairItem = flairInventoryItem;
  let newFlair = flairInput;
  const oldFlair = flairItem.effect_value;

  let aiApproved = 'rejected';
  // eslint-disable-next-line sonarjs/no-duplicate-string
  let adjustmentReason: string;

  const messageList = [{
    role: 'user',
    content: newFlair,
  }] as OpenAI.Chat.ChatCompletionMessageParam[];

  const { response } = await aiFlairMod(messageList);

  // AI moderation is unavailable (OpenAI errored, no key, or AI turned off), so aiFlairMod returns
  // an empty response. Fall back to the same keyword automod used on chat messages (bigBrother):
  // if it flags the flair, reject it; otherwise save it as-is. The length (<50) and @mention
  // checks above still apply.
  if (!response) {
    const flairCategory = await bigBrother(newFlair.toLowerCase());
    if (['offensive', 'harm', 'horny', 'pg13'].includes(flairCategory)) {
      return flairReply('Flair Rejected', 'Your flair contains language that isn\'t allowed here. Please try something else.', Colors.Red);
    }

    flairItem.effect_value = newFlair;
    await db.rpg_inventory.upsert({
      where: { id: flairItem.id },
      create: flairItem,
      update: flairItem,
    });
    return flairReply('Flair Updated', `Your flair has been updated!\n\n**Old flair:** ${oldFlair}\n**New flair:** ${newFlair}`, Colors.Green);
  }

  // Regex to see the approval status
  if (response.match(/Status: Approved/g)) {
    aiApproved = 'approved';
  } else if (response.match(/Status: Adjusted/g)) {
    aiApproved = 'adjusted';
  }

  const aiAdjusted = response.match(/Adjusted: (.*)/g)?.[0].replace('Adjusted: ', '');
  log.debug(F, `aiAdjusted: ${aiAdjusted}`);

  // If the flair is approved or the same as what the user entered, update the flair and send the user a confirmation message
  // Also regex to see if the flair is the same as what the user entered but ignoring capitalization
  if (newFlair.toLowerCase() === aiAdjusted?.toLowerCase()) {
    // Update the flair
    if (aiAdjusted) {
      flairItem.effect_value = aiAdjusted;
      newFlair = aiAdjusted;
    } else {
      flairItem.effect_value = newFlair;
    }
    await db.rpg_inventory.upsert({
      where: {
        id: flairItem.id,
      },
      create: flairItem,
      update: flairItem,
    });
    // Send the user a confirmation message
    return flairReply('Flair Updated', `Your flair has been updated!\n\n**Old flair:** ${oldFlair}\n**New flair:** ${newFlair}`, Colors.Green);
  }

  // If the flair needed to be adjusted, ask the user if they want to use the adjusted flair
  // Also check if the flair was set as approved but the flair is actually different than what the user entered
  if ((aiApproved === 'adjusted' || newFlair.toLowerCase() !== aiAdjusted?.toLowerCase()) && aiApproved !== 'rejected') {
  // If the flair is null, send an error message
    if (!aiAdjusted) {
      return flairReply(
        FLAIR_ERROR_TITLE,
        'Oops!\n\nSomething went wrong with TripBot\'s AI.\n\nPlease try again later or contact a moderator to have your flair manually reviewed.',
        Colors.Red,
      );
    }
    // Regex to get the reason for adjustment from the AI response where it says "Reason: "
    // If it doesn't exist, set it to "No reason given"
    adjustmentReason = response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') ?? 'No reason given';

    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Adjusted`)
        .setDescription(stripIndents`

        Your flair has been adjusted by TripBot to meet our guidelines.

        **Original:** ${newFlair}
        **TripBot Adjusted:** ${aiAdjusted}

        **Adjustment Reason:** ${adjustmentReason}
        
        Please confirm that you want to use the adjusted flair, or try something else.`)
        .setColor(Colors.Gold)],
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
            customButton(`rpgFlairAccept,user:${interaction.user.id}`, 'Accept', 'buttonAccept', ButtonStyle.Success),
            customButton(`rpgFlairDecline,user:${interaction.user.id}`, 'Reject', 'buttonQuit', ButtonStyle.Danger),
          ),
      ],
    };
  }

  // Everything else was handled above, so the verdict can only be a rejection
  adjustmentReason = response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') ?? 'No reason given';

  // Send the user a rejection message
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
      .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
      .setDescription(stripIndents`
      Your flair has been rejected by TripBot.
      
      **Rejection Reason:** ${adjustmentReason}
      
      Please try something else.`)
      .setColor(Colors.Red)],
  };
}

export async function rpgFlair(interaction: ChatInputCommandInteraction) {
  // First check if the flair contains a @mention
  let newFlair = interaction.options.getString('flair') as string;
  const mentionRegex = /<@!?\d{18,}>/g;
  const mentions = newFlair.match(mentionRegex);
  log.debug(F, `mentions: ${mentions}`);
  // If the flair contains a mention, check if the user has mod permissions
  const member = await interaction.guild?.members.fetch(interaction.user.id);

  // If they are a mod, update the user mentioned's flair
  if (mentions && member?.roles.cache.has(env.ROLE_MODERATOR)) {
    const targetId = mentions[0].replace(/\D/g, '');
    const targetMember = await interaction.guild?.members.fetch(targetId);
    // Remove the mention from the flair and the space after the mention
    newFlair = newFlair.replace(mentionRegex, '').replace(' ', '');
    if (targetMember) {
    // Run rpgFlairAccept for the target member
      const targetInteraction = interaction as unknown as MessageComponentInteraction;
      targetInteraction.user = targetMember?.user;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return rpgFlairAccept(targetInteraction, newFlair);
    }
  } else if (mentions) {
    // If they are not a mod, send an error message
    return flairReply(FLAIR_ERROR_TITLE, 'You cannot use a mention in your flair!', Colors.Red);
  }
  // Check that the user owns the flair item
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);
  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // Get the flair item
  const flairItem = inventoryData.find(i => i.effect === 'userflair');

  // If the user does not own the flair item, send them an error message
  if (!flairItem) {
    return flairReply(FLAIR_ERROR_TITLE, 'You don\'t own the flair item! You can buy it in the `/rpg market`.', Colors.Red);
  }
  // If the chosen flair is too long, send an error message
  if (newFlair.length > 50) {
    return flairReply('Flair Rejected', 'Your flair is too long! Please keep it under 50 characters.', Colors.Red);
  }
  // If the user does own the flair item, get the old flair and continue
  return reviewFlair(interaction, flairItem, newFlair);
}

export async function rpgFlairAccept(
  interaction:MessageComponentInteraction,
  overrideFlair:string,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // Get the existing inventory data
  let inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // Get the flair item
  let flairItem = inventoryData.find(i => i.effect === 'userflair');
  // If the user does not own the flair item, give it to them (this could only ever be triggered by a mod)
  if (!flairItem) {
    const newItem = {
      persona_id: personaData.id,
      label: 'User Flair',
      value: 'userflair',
      description: 'User Flair',
      quantity: 1,
      weight: 0,
      cost: 1000,
      equipped: true,
      consumable: false,
      effect: 'userflair',
      effect_value: 'Use /rpg flair to set',
      emoji: 'itemFlair',
    } as rpg_inventory;

    await db.rpg_inventory.create({
      data: newItem,
    });

    // Fetch the new flair item
    inventoryData = await db.rpg_inventory.findMany({
      where: {
        persona_id: personaData.id,
      },
    });
    flairItem = inventoryData.find(i => i.effect === 'userflair');
  }

  // If there still isn't a flair item, send an error embed
  if (!flairItem) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
      // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Error`)
        .setDescription(stripIndents`
        Oops!
        Something went wrong.`)
        .setColor(Colors.Red)],
    };
  }
  // Get the old flair and the new flair
  const oldFlair = flairItem.effect_value;
  let newFlair = '';
  if (overrideFlair) {
    newFlair = overrideFlair;
  } else {
    newFlair = interaction.message.embeds[0].description?.split('**TripBot Adjusted:** ')[1].split('\n')[0] as string;
  }
  // If the flair is null, send an error embed
  if (!newFlair) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
      // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Error`)
        .setDescription(stripIndents`
        Oops!
        Something went wrong.
        Please try again later or contact a moderator to have your flair manually reviewed.`)
        .setColor(Colors.Red)],
    };
  }
  // Update the flair
  flairItem.effect_value = newFlair;
  await db.rpg_inventory.upsert({
    where:
      {
        id: flairItem.id,
      },
    create: flairItem,
    update: flairItem,
  });
  // If overriding, also set the flair's equipped to true
  if (overrideFlair) {
    flairItem.equipped = true;
    await db.rpg_inventory.upsert({
      where:
        {
          id: flairItem.id,
        },
      create: flairItem,
      update: flairItem,
    });
  }

  // Send the user a confirmation message
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
      .setTitle(`${emojiGet('itemFlair')} Flair Updated`)
      .setDescription(stripIndents`
      Your flair has been updated!

      **Old flair:** ${oldFlair}
      **New flair:** ${newFlair}`)
      .setColor(Colors.Green)],
    components: [],
  };
}

export async function rpgFlairDecline(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Send them the rejection message
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
    // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
      .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
      .setDescription(stripIndents`
      You rejected TripBot's adjusted flair.

      Your flair has not been updated.
      
      If you believe TripBot made an error, please try again or contact a moderator for manual approval.`)
      .setColor(Colors.Red)],
    components: [],
  };
}

export async function rpgHomeNameChange(
  interaction: MessageComponentInteraction,
):Promise<void> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);
  // When this button is clicked, a modal appears where the user can enter their name
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`rpgNameModal~${interaction.id}`)
    .setTitle('Setup your TripSit room!');

  const body = new LabelBuilder().setLabel('What do you want to name your persona?').setTextInputComponent(new TextInputBuilder()

    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setCustomId(`rpgNewName,user:${interaction.user.id}`));
  modal.addLabelComponents(body);
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const modalFilter = (i:ModalSubmitInteraction) => (i.customId.startsWith('rpgNameModal')
    && i.customId.split('~')[1] === interaction.id
    && i.guild !== null);
  await interaction.awaitModalSubmit({ filter: modalFilter, time: 0 })
    .then(async i => {
      const choice = i.fields.getTextInputValue('rpgNewName');
      await i.deferReply({ flags: MessageFlags.Ephemeral });

      new StringSelectMenuBuilder()
        .setCustomId(`rpgNameDisplay,user:${interaction.user.id}`)
        .setPlaceholder('No Name!')
        .setOptions([{
          label: choice,
          value: choice,
          emoji: '👤',
          default: true,
        }]);

      const rowHome = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          customButton(`rpgName,user:${interaction.user.id}`, 'Name', '📝', ButtonStyle.Primary),
          customButton(`rpgAccept,user:${interaction.user.id}`, 'Accept', 'buttonAccept', ButtonStyle.Success),
          customButton(`rpgDecline,user:${interaction.user.id}`, 'Decline', 'buttonQuit', ButtonStyle.Danger),
          customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
        );

      const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgNameDisplay,user:${interaction.user.id}`)
            .setPlaceholder('No Name!')
            .setOptions([{
              label: choice,
              value: choice,
              emoji: '👤',
              default: true,
            }]),
        );

      const selectedClassList = { ...genome.classes };
      selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;

      const selectedSpeciesList = { ...genome.species };
      selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;

      const selectedGuildList = { ...genome.guild };
      selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;

      const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgClass,user:${interaction.user.id}`)
            .setPlaceholder('Select a class')
            .setOptions(Object.values(selectedClassList)),
        );

      const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgSpecies,user:${interaction.user.id}`)
            .setPlaceholder('Pick a species')
            .setOptions(Object.values(selectedSpeciesList)),
        );

      const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId(`rpgGuild,user:${interaction.user.id}`)
            .setPlaceholder('Select a guild')
            .setOptions(Object.values(selectedGuildList)),
        );

      await i.editReply({
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG `, iconURL: (interaction.member as GuildMember).user.displayAvatarURL() })
            .setTitle('Home')
            .setDescription(stripIndents`
            Your name has been set to ${choice}

            You are in your home, you can change your name, species, class and here.
          `)
            .setColor(Colors.Green),
        ],
        components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowHome],
      });
    });
}

/** The item selected in the home menu: the menu's default on a button click, the chosen value on a menu change. */
function homeSelectedOption(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  equippedValue: string,
): string {
  if (interaction.isButton()) {
    const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
    const backgroundComponent = row.components[0] as StringSelectMenuComponent;
    const selectedItem = backgroundComponent.options?.find(
      (o:APISelectMenuOption) => o.default === true,
    );
    return selectedItem ? selectedItem.value : equippedValue;
  }
  if (interaction.isStringSelectMenu() && interaction.values) {
    return interaction.values[0];
  }
  return equippedValue;
}

export async function rpgHome(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  message: string,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  const {
    homeInventory,
    personaTokens,
    personaInventory,
  } = await rpgHomeInventory(interaction);

  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // Get the equipped background, then the item the user selected
  const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
  const defaultOption = homeSelectedOption(interaction, equippedBackground?.value ?? '');

  // Get a list of marketInventory where the value does not equal the choice
  // If there is no choice, it will return all items the user has
  const filteredItems = Object.values(homeInventory).filter(item => item.value !== defaultOption);

  // Reset the options menu to be empty
  const backgroundMenu = new StringSelectMenuBuilder()
    .setCustomId(`rpgBackgroundSelect,user:${interaction.user.id}`)
    .setPlaceholder('Select an item to use')
    .setOptions(filteredItems);

  // Get the item the user chose and display that as the default option
  let backgroundData = {} as {
    label: string;
    value: string;
    description: string;
    quantity: number;
    weight: number;
    cost: number;
    equipped: boolean;
    consumable: boolean;
    effect: string;
    effect_value: string;
    emoji: string;
  };
  const chosenItem = homeInventory.find(item => item.value === defaultOption);
  let sellPrice = 0;
  const equipped = (inventoryData.find(item => item.value === chosenItem?.value)?.equipped as boolean);
  let equippedButtonText = 'Equip';
  if (equipped) {
    equippedButtonText = 'Equipped';
  }

  if (chosenItem) {
    chosenItem.default = true;
    backgroundMenu.addOptions(chosenItem);
    // log.debug(F, `items.backgrounds: ${JSON.stringify(items.backgrounds, null, 2)}`);
    // convert the emoji property into an emoji using emojiGet
    const allItems = [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)].map(item => {
      const newItem = item;
      newItem.emoji = `<:${emojiGet('itemBackground').identifier}>`;
      return item;
    });
    backgroundData = allItems.find(item => item.value === chosenItem?.value) as {
      label: string;
      value: string;
      description: string;
      quantity: number;
      weight: number;
      cost: number;
      equipped: boolean;
      consumable: boolean;
      effect: string;
      effect_value: string;
      emoji: string;
    };
    sellPrice = (allItems.find(item => item.value === chosenItem?.value)?.cost as number) / 4;
    log.debug(F, `equipped: ${equipped}`);
    log.debug(F, `sellPrice: ${sellPrice}`);
  }
  log.debug(F, `chosenItem: ${JSON.stringify(chosenItem, null, 2)}`);

  // Set the item row
  const rowBackgrounds = new ActionRowBuilder<StringSelectMenuBuilder>()
    .addComponents(backgroundMenu);

  // log.debug(F, `backgroundData (home change): ${JSON.stringify(backgroundData, null, 2)}`);
  // log.debug(F, `Button home: ${JSON.stringify(emojiGet('buttonHome'), null, 2)}`);
  // Build the embed
  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
    .setTitle(`${emojiGet('buttonHome')} Home`)
    .setDescription(stripIndents`${message ?? ''}

      You ${randomItem(text.enter)} your home.
      
      You can equip an item by selecting it from the menu below.

      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}

      ${personaInventory}
    `)
    .setColor(Colors.Purple);

  // If the select item has the 'background' effect, add the image to the embed
  const files = [] as AttachmentBuilder[];

  if (interaction.isStringSelectMenu() && backgroundData?.effect === 'background') {
    const imagePath = await getAsset(backgroundData.effect_value);
    const target = interaction.member as GuildMember;
    const option = 'background';
    const previewImage = await getProfilePreview(target, option, imagePath);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    files.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  }

  // If the select item has the 'font' effect, add the image to the embed
  if (interaction.isStringSelectMenu() && backgroundData?.effect === 'font') {
    const target = interaction.member as GuildMember;
    const fontName = backgroundData.effect_value;
    const option = 'font';
    const previewImage = await getProfilePreview(target, option, undefined, fontName);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    files.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
    log.debug(F, `font: ${fontName}`);
  }

  // If the select item has the 'userflair' effect, add the image to the embed
  if (interaction.isStringSelectMenu() && backgroundData?.effect === 'userflair') {
    const target = interaction.member as GuildMember;
    const option = 'userflair';
    const previewImage = await getProfilePreview(target, option);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    files.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  }

  // Build out the home navigation buttons
  const rowHome = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
    // customButton(`rpgName,user:${interaction.user.id}`, 'Name', '📝', ButtonStyle.Primary),
    // customButton(`rpgAccept,user:${interaction.user.id}`, 'Accept', 'buttonAccept', ButtonStyle.Success),
    // customButton(`rpgDecline,user:${interaction.user.id}`, 'Decline', 'buttonQuit', ButtonStyle.Danger),
      customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
    );

  // if item is not equipped, show equip button

  if (chosenItem && (equipped === false)) {
    rowHome.addComponents(
      customButton(`rpgAccept,user:${interaction.user.id}`, `${equippedButtonText}`, 'buttonAccept', ButtonStyle.Success).setDisabled(equipped),
      customButton(`rpgSell,user:${interaction.user.id}`, `Sell +${sellPrice} TT$`, 'buttonBetHuge', ButtonStyle.Danger),
    );
  } else if (chosenItem && (equipped === true)) { // else show unequip button
    rowHome.addComponents(
      customButton(`rpgDecline,user:${interaction.user.id}`, 'Unequip', 'buttonQuit', ButtonStyle.Danger),
      customButton(`rpgSell,user:${interaction.user.id}`, `Sell +${sellPrice} TT$`, 'buttonBetHuge', ButtonStyle.Danger),
    );
  }

  // If the user has backgrounds, add the backgrounds row
  const components = backgroundMenu.options.length === 0
    ? [rowHome]
    : [rowBackgrounds, rowHome];

  return {
    embeds: [embed],
    components,
    files,
  };

  //       new StringSelectMenuBuilder()
  // .setCustomId('rpgNameDisplay,user:${interaction.user.id}')
  // .setPlaceholder('No Name!')
  // .setOptions([{
  //   label: choice,
  //   value: choice,
  //   emoji: '👤',
  //   default: true,
  // }]);.setOptions([{
  //   label: personaData.name,
  //   value: personaData.name,
  //   emoji: '👤',
  //   default: true,
  // }]);

  // const rowNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .setComponents(      new StringSelectMenuBuilder()
  // .setCustomId('rpgNameDisplay,user:${interaction.user.id}')
  // .setPlaceholder('No Name!')
  // .setOptions([{
  //   label: choice,
  //   value: choice,
  //   emoji: '👤',
  //   default: true,
  // }]););

  // const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
  // //   .setComponents(new StringSelectMenuBuilder()
  // .setCustomId('rpgClass,user:${interaction.user.id}')
  // .setPlaceholder('Select a class'));

  // new StringSelectMenuBuilder()
  //   .setCustomId('rpgSpecies,user:${interaction.user.id}')
  //   .setPlaceholder('Pick a species').setOptions(Object.values({ ...selectedSpeciesList }));
  // // const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .addComponents(new StringSelectMenuBuilder()
  // .setCustomId('rpgSpecies,user:${interaction.user.id}')
  // .setPlaceholder('Pick a species'));

  // new StringSelectMenuBuilder()
  //   .setCustomId('rpgGuild,user:${interaction.user.id}')
  //   .setPlaceholder('Select a guild').setOptions(Object.values(selectedGuildList));
  // // const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
  // //   .addComponents(new StringSelectMenuBuilder()
  //   .setCustomId('rpgGuild,user:${interaction.user.id}')
  //   .setPlaceholder('Select a guild'));
}

export async function rpgHomeAccept(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);
  // If the user confirms the information, save the persona information
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const backgroundComponent = row.components[0];
  const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // Find the selectedItem in the inventoryData
  const chosenItem = inventoryData.find(item => item.value === selectedItem?.value);
  // Find the item type from inventoryData
  // const itemType = inventoryData.find(item => item.value === selectedItem?.value)?.effect;

  // Equip the item
  if (chosenItem) {
    chosenItem.equipped = true;
    await db.rpg_inventory.upsert({
      where: {
        id: chosenItem.id,
      },
      create: chosenItem,
      update: chosenItem,
    });
  } else {
    log.error(F, `Item not found in inventory: ${JSON.stringify(chosenItem, null, 2)}`);
  }

  // Un-equip all other backgrounds
  const otherItems = inventoryData.filter(item => item.effect === 'background' && item.value !== selectedItem?.value);
  otherItems.forEach(async item => {
    const newItem = item;
    newItem.equipped = false;
    await db.rpg_inventory.upsert({
      where: {
        id: newItem.id,
      },
      create: newItem,
      update: newItem,
    });
  });

  // Set persona data
  // personaData.name = selectedName?.label ?? 'No Name';
  // personaData.species = selectedSpecies?.value ?? 'formless';
  // personaData.class = selectedClass?.value ?? 'jobless';
  // personaData.guild = selectedGuild?.value ?? 'guildless';
  // personaData.tokens = 0;

  const { embeds, components, files } = await rpgHome(interaction, `**You have equipped ${chosenItem?.label}!**\n`);
  return {
    embeds,
    components,
    files,
  };
}

export async function rpgHomeDecline(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const itemComponent = row.components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );

  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  const chosenItem = inventoryData.find(item => item.value === selectedItem?.value);
  if (chosenItem) {
    chosenItem.equipped = false;
    await db.rpg_inventory.upsert({
      where: {
        id: chosenItem.id,
      },
      create: chosenItem,
      update: chosenItem,
    });
  }
  const { embeds, components, files } = await rpgHome(interaction, `**You have unequipped ${chosenItem?.label}.**\n`);
  return {
    embeds,
    components,
    files,
  };
}

export async function rpgHomeSell(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const itemComponent = row.components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );
  const itemName = inventoryData.find(item => item.value === selectedItem?.value)?.label;
  const sellPrice = ((inventoryData.find(item => item.value === selectedItem?.value)?.cost as number) / 4);

  await db.rpg_inventory.delete({
    where: {
      persona_id_value: {
        persona_id: personaData.id,
        value: selectedItem?.value as string,
      },
    },
  });

  personaData.tokens += sellPrice;

  await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: personaData,
    update: personaData,
  });
  log.debug(F, `itemName: ${JSON.stringify(itemName, null, 2)}`);
  const { embeds, components, files } = await rpgHome(interaction, `**You have sold ${itemName} for ${sellPrice} TripTokens!**\n`);
  return {
    embeds,
    components,
    files,
  };
}

export async function rpgArcade(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonArcade')} Arcade`)
      .setDescription(stripIndents`
        You ${randomItem(text.enter)} the arcade and see a variety of games.

        ***More games coming soon!***
      `)
      .setColor(Colors.Green)],
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        customButton(`rpgCoinFlip,user:${interaction.user.id}`, 'CoinFlip', 'buttonCoinflip', ButtonStyle.Secondary),
        customButton(`rpgRoulette,user:${interaction.user.id}`, 'Roulette', 'buttonRoulette', ButtonStyle.Secondary),
        // customButton(`rpgBlackjack,user:${interaction.user.id}`, 'Blackjack', '🃏', ButtonStyle.Primary),
        // customButton(`rpgSlots,user:${interaction.user.id}`, 'Slots', '🎰', ButtonStyle.Primary),
        customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
      )],
  };
}

export async function rpgArcadeAnimate(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  gameName: GameName,
) {
  if (gameName === 'Coinflip') {
    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [],
      content: 'https://media.tenor.com/tewn7lzVDgcAAAAC/coin-flip-flip.gif',
      components: [],
    });

    await sleep(4 * 1000);
  }

  if (gameName === 'Roulette') {
    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [],
      content: 'https://media2.giphy.com/media/1DEJwfwdknKZq/giphy.gif',
      components: [],
    });

    await sleep(4 * 1000);
    //   // Make an animation out of embeds that shows an arrow spinning
  }
}

const ROULETTE_ROWS = {
  first: [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  second: [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  third: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
};

// How a roulette bet wins, and what multiple of the bet it pays
const ROULETTE_BETS: Record<string, { wins: (number: number) => boolean; multiple: number }> = {
  0: { wins: number => number === 0, multiple: 17 },
  red: { wins: number => number % 2 === 0, multiple: 1 },
  evens: { wins: number => number % 2 === 0, multiple: 1 },
  black: { wins: number => number % 2 !== 0, multiple: 1 },
  odds: { wins: number => number % 2 !== 0, multiple: 1 },
  high: { wins: number => number > 18, multiple: 1 },
  low: { wins: number => number < 18, multiple: 1 },
  '1-12': { wins: number => number < 13, multiple: 2 },
  '13-24': { wins: number => number > 12 && number < 25, multiple: 2 },
  '25-36': { wins: number => number > 24, multiple: 2 },
  first: { wins: number => ROULETTE_ROWS.first.includes(number), multiple: 2 },
  second: { wins: number => ROULETTE_ROWS.second.includes(number), multiple: 2 },
  third: { wins: number => ROULETTE_ROWS.third.includes(number), multiple: 2 },
};

/** How many tokens the bet pays out (0 when it lost) for the result of a game. */
function arcadePayout(gameName: GameName, choice: string, result: string, currentBet: number): number {
  if (gameName === 'Coinflip') {
    return result === choice ? currentBet : 0;
  }
  const bet = Object.hasOwn(ROULETTE_BETS, choice) ? ROULETTE_BETS[choice] : undefined;
  return bet?.wins(parseInt(result, 10)) ? currentBet * bet.multiple : 0;
}

const arcadeEmbed = (
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  title: string,
  description: string,
  color: number,
) => embedTemplate()
  .setAuthor(null)
  .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
  .setTitle(title)
  .setDescription(stripIndents`${description}`)
  .setColor(color);

export async function rpgArcadeGame(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  gameName: GameName,
  choice?: 'heads' | 'tails' | '0'
  | 'evens' | 'odds' | 'red' | 'black'
  | 'high' | 'low' | 'first' | 'second' | 'third'
  | '1-12' | '13-24' | '25-36',
  message?: string,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  const gameData = {
    Coinflip: {
      gameName: 'Coinflip' as GameName,
      instructions: stripIndents`**How to play**
    - Set a bet amount using the buttons below
    - You can bet any amount by using a button more than once
    - Choose heads or tails to flip the coin

    - If you win, you get the amount you bet
    - If you lose, you lose the amount you bet`,
      object: 'coin',
      bets: [
        customButton(`rpgCoinflipHeads,user:${interaction.user.id}`, 'Heads', 'buttonHeads', ButtonStyle.Secondary),
        customButton(`rpgCoinflipTails,user:${interaction.user.id}`, 'Tails', 'buttonTails', ButtonStyle.Secondary),
      ],
      options: [
        'heads',
        'tails',
      ],
    },
    Roulette: {
      gameName: 'Roulette' as GameName,
      instructions: stripIndents`**How to play**
      - Set a bet amount using the buttons below
      - You can bet any amount by using a button more than once
      - Choose an option to bet on to spin the wheel
    
      - You win or lose depending on what you picked and where the ball lands

      **Odds**
      Red / Black / Even / Odd / High / Low - 1:1
      First / Second / Third - 2:1
      1-2 / 3-4 / 5-6 / 7-8 - 3:1
      0 -  8:1
    `,
      object: 'wheel',
      bets: [
        customButton(`rpgRouletteRed,user:${interaction.user.id}`, 'Red', 'buttonHalf', ButtonStyle.Secondary),
        customButton(`rpgRouletteBlack,user:${interaction.user.id}`, 'Black', 'buttonHalf', ButtonStyle.Secondary),
        customButton(`rpgRouletteFirst,user:${interaction.user.id}`, 'First Row', 'buttonRows', ButtonStyle.Secondary),
        customButton(`rpgRouletteSecond,user:${interaction.user.id}`, 'Second Row', 'buttonRows', ButtonStyle.Secondary),
        customButton(`rpgRouletteThird,user:${interaction.user.id}`, 'Third Row', 'buttonRows', ButtonStyle.Secondary),
        customButton(`rpgRouletteEven,user:${interaction.user.id}`, 'Even', 'buttonBoxB', ButtonStyle.Secondary),
        customButton(`rpgRouletteOdd,user:${interaction.user.id}`, 'Odd', 'buttonBoxA', ButtonStyle.Secondary),
        customButton(`rpgRoulette1to12,user:${interaction.user.id}`, '1-12', 'menuNormal', ButtonStyle.Secondary),
        customButton(`rpgRoulette13to24,user:${interaction.user.id}`, '13-24', 'menuHard', ButtonStyle.Secondary),
        customButton(`rpgRoulette25to36,user:${interaction.user.id}`, '25-36', 'menuExpert', ButtonStyle.Secondary),
        customButton(`rpgRouletteZero,user:${interaction.user.id}`, '0', 'menuEasy', ButtonStyle.Secondary),
        customButton(`rpgRouletteHigh,user:${interaction.user.id}`, 'High', 'buttonUpDown', ButtonStyle.Secondary),
        customButton(`rpgRouletteLow,user:${interaction.user.id}`, 'Low', 'buttonUpDown', ButtonStyle.Secondary),
      ],
      options: ['00', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'],
    },
  };

  const emojiName = `button${gameName}`;

  const { instructions } = gameData[gameName as keyof typeof gameData];

  const rowWagers = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      customButton(`rpgWager500,user:${interaction.user.id}`, 'Bet 500', 'buttonBetLarge', ButtonStyle.Success),
      customButton(`rpgWager1000,user:${interaction.user.id}`, 'Bet 1000', 'buttonBetHuge', ButtonStyle.Success),
      customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
    );

  const { bets } = gameData[gameName as keyof typeof gameData];

  const rowBetsA = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(0, 5));

  const rowBetsB = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(5, 10));

  const rowBetsC = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(10, 15));

  const components = [rowWagers, rowBetsA];
  if (rowBetsB.components.length > 0) components.push(rowBetsB);
  if (rowBetsC.components.length > 0) components.push(rowBetsC);

  if (wagers[interaction.user.id]?.gameName !== gameName) {
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
  }

  // Check get fresh persona data
  const userData = await getOrCreateUser(interaction.user.id);
  const personaData = await getOrCreatePersona(userData.id);

  const currentBet = wagers[interaction.user.id].tokens;
  const wallet = `${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`;
  const gameTitle = `${emojiGet(emojiName)} ${gameName}`;

  if (choice && currentBet === 0) {
    return {
      embeds: [arcadeEmbed(interaction, gameName, `**You can't start a game without first placing a bet!**\n\n${wallet}`, Colors.Gold)],
      components,
    };
  }

  if (choice) {
    await rpgArcadeAnimate(interaction, gameName);
    const { object, options } = gameData[gameName as keyof typeof gameData];
    const result = randomItem(options);

    const payout = arcadePayout(gameName, choice, result, currentBet);

    // The user won or lost
    const won = payout !== 0;
    const BetOutcomeMessage = randomItem(won ? BetWinMessageList : BetLossMessageList);
    personaData.tokens += won ? payout : -currentBet;
    await db.personas.upsert({
      where: {
        user_id: userData.id,
      },
      create: personaData,
      update: personaData,
    });

    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
    const outcome = won ? `**You won ${payout} tokens!**` : `**You lost ${currentBet} tokens!**`;
    // The wallet shown is the one after the payout, so it is rebuilt from the updated persona
    return {
      content: null,
      embeds: [arcadeEmbed(
        interaction,
        gameTitle,
        `The ${object} came up **${result}** and you chose **${choice}**!\n\n${outcome}\n*${BetOutcomeMessage}*\n\n${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`,
        won ? Colors.Gold : Colors.Grey,
      )],
      components,
    };
  }

  // The user has clicked the market button, send them the market embed
  if (currentBet !== 0) {
    return {
      content: null,
      embeds: [arcadeEmbed(
        interaction,
        gameTitle,
        `${message ?? ''}\nYou are betting ${currentBet} tokens.\n\n${wallet}`,
        Colors.Green,
      )],
      components,
    };
  }

  return {
    content: null,
    embeds: [arcadeEmbed(
      interaction,
      gameTitle,
      `You start a game of ${gameName}.\n\n${instructions}\n\n${wallet}`,
      Colors.Green,
    )],
    components,
  };
}

export async function getNewTimer(seconds: number) {
  const currentDate = new Date();
  return new Date(currentDate.getTime() + seconds * 1000);
}

export async function rpgArcadeWager(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Check if there's already an existing wager that's at max bet (1000)
  if (wagers[interaction.user.id] && wagers[interaction.user.id].tokens >= 1000) {
    return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName, undefined, '**Maximum bet is 1000 tokens**\n');
  }

  const currentBet = wagers[interaction.user.id] ? wagers[interaction.user.id].tokens : 0;
  const bet = parseInt(interaction.customId.slice(8), 10);
  let newBet = currentBet + (bet || 0);

  // If new bet would exceed 1000, cap it at 1000
  if (newBet > 1000) {
    newBet = 1000;
  }

  // Ensure minimum bet of 500 (if betting at all)
  if (newBet > 0 && newBet < 500) {
    newBet = 500;
  }

  const userData = await getOrCreateUser(interaction.user.id);

  const personaData = await getOrCreatePersona(userData.id);

  if (personaData.tokens < newBet) {
    const notEnough = '**You don\'t have enough to bet that much**\n';
    return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName, undefined, notEnough);
  }

  wagers[interaction.user.id].tokens = newBet;

  return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName);
}

export async function rpgTown(
  interaction:MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  // const personaData = await getPersonaInfo(interaction.user.id);

  const rowTown = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      customButton(`rpgBounties,user:${interaction.user.id}`, 'Bounties', 'buttonBounties', ButtonStyle.Primary),
      customButton(`rpgMarket,user:${interaction.user.id}`, 'Market', 'buttonMarket', ButtonStyle.Primary),
      customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
      customButton(`rpgHome,user:${interaction.user.id}`, 'Home', 'buttonHome', ButtonStyle.Primary),
      customButton(`rpgHelp,user:${interaction.user.id}`, 'Help', 'buttonHelp', ButtonStyle.Primary),
    );

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonTown')} Town`)
      .setDescription(stripIndents`
      You ${randomItem(text.enter)} TripTown, a new settlement on the edge of Triptopia, the TripSit Kingdom.

      The town is still under construction with only a few buildings.
      
      *You get the impression that you're one of the first people to visit.*
      
      A recruitment center to take on jobs, and a small market.
  
      What would you like to do?`)
      .setColor(Colors.Green)],
    components: [rowTown],
    files: [],
  };
}

async function rpgGift(interaction: ChatInputCommandInteraction) {
  const commandUser = interaction.member as GuildMember;
  const targetUser = interaction.options.getMember('target') as GuildMember;
  const giftAmount = interaction.options.getInteger('amount') ?? 0;

  if (!targetUser) throw new Error('Target user not found');
  if (targetUser === commandUser) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
        .setDescription(stripIndents`
            **You can't gift tokens to yourself!**
          `)
        .setColor(Colors.Red)],
      components: [],
    };
  }

  const userData = await getOrCreateUser(commandUser.id);

  const userPersona = await getOrCreatePersona(userData.id);

  const targetData = await getOrCreateUser(targetUser.id);

  const targetPersona = await getOrCreatePersona(targetData.id);

  // Get the current token amounts for the command user and the target user
  const commandUserTokens = userPersona.tokens;

  // Check if the amount is negative
  if (giftAmount < 0) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
        .setDescription(stripIndents`
            **You can't gift negative tokens!**
          `)
        .setColor(Colors.Red)],
      components: [],
    };
  }

  // Check if the command user has enough tokens
  if (commandUserTokens < giftAmount) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
        .setDescription(stripIndents`
            **You don't have enough tokens!**

            ${emojiGet('buttonBetSmall')} **Wallet:** ${userPersona.tokens}
          `)
        .setColor(Colors.Red)],
      components: [],
    };
  }
  // Remove the tokens from the command user
  userPersona.tokens -= giftAmount;
  // Add the tokens to the target user
  targetPersona.tokens += giftAmount;
  // Save the data

  await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: userPersona,
    update: userPersona,
  });

  await db.personas.upsert({
    where: {
      user_id: targetData.id,
    },
    create: targetPersona,
    update: targetPersona,
  });

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonBetHuge')} Gift Successful`)
      .setDescription(stripIndents`
          **You gifted ${giftAmount} ${giftAmount === 1 ? 'token' : 'tokens'} to ${targetUser?.displayName}**

          ${emojiGet('buttonBetSmall')} **${targetUser?.displayName}'s Wallet:** ${targetPersona.tokens}
          ${emojiGet('buttonBetSmall')} **Your Wallet:** ${userPersona.tokens}
        `)
      .setColor(Colors.Green)],
    components: [],
  };
}

export async function rpgHelp(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonHelp')} Help`)
      .setDescription(stripIndents`
        You ${randomItem(text.enter)} the information centre and walk up to the help desk.

        ***Welcome to TripSit's RPG!***
        TripSit's RPG is a discord based RPG that plays out using discord embeds.

        **How to play**
        - Earn tokens by heading to the **Bounties** section and completing the tasks.
        - Earn extra or gamble for more tokens by playing the **Arcade** games.
        - Spend tokens in the **Market** to buy items for your */profile and /levels*.
        - Head **Home** to equip items and see your inventory.

        - Use the navigation buttons to move between any sections.
        - Use the **/rpg** subcommands to quickly access most parts.

        *This is still a work in progress.*
        *Please report any bugs or suggestions to <@121115330637594625> or <@177537158419054592>.*
      `)
      .setColor(Colors.Blue)],
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
      )],
  };
}

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG (BETA)!')
    .setIntegrationTypes([0])
    .addSubcommand(subcommand => subcommand
      .setName('town')
      .setDescription('Go to TripTown!'))
    .addSubcommand(subcommand => subcommand
      .setName('market')
      .setDescription('Go to the Market!'))
    .addSubcommand(subcommand => subcommand
      .setName('home')
      .setDescription('Go to your Home!'))
    .addSubcommand(subcommand => subcommand
      .setName('bounties')
      .setDescription('Go to the bounty board!'))
    .addSubcommand(subcommand => subcommand
      .setName('help')
      .setDescription('Learn how to play!'))
    .addSubcommand(subcommand => subcommand
      .setName('quest')
      .setDescription('Quest and earn 10 tokens!'))
    .addSubcommand(subcommand => subcommand
      .setName('dungeon')
      .setDescription('Clear a dungeon and earn 50 tokens!'))
    .addSubcommand(subcommand => subcommand
      .setName('raid')
      .setDescription('Raid a boss and earn 100 tokens!'))
    .addSubcommand(subcommand => subcommand
      .setName('arcade')
      .setDescription('Go to the arcade'))
    .addSubcommand(subcommand => subcommand
      .setName('coinflip')
      .setDescription('Go to the coinflip game'))
    .addSubcommand(subcommand => subcommand
      .setName('roulette')
      .setDescription('Go to the roulette game'))
    .addSubcommand(subcommand => subcommand
      .setName('flair')
      .setDescription('Change your flair')
      .addStringOption(option => option
        .setName('flair')
        .setDescription('Flair to change to')
        .setRequired(true)))
    .addSubcommand(subcommand => subcommand
      .setName('gift')
      .setDescription('Gift tokens to another user')
      .addUserOption(option => option
        .setName('target')
        .setDescription('User to gift tokens to')
        .setRequired(true))
      .addIntegerOption(option => option
        .setName('amount')
        .setDescription('Amount of tokens to gift')
        .setRequired(true))),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const channelRpg = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPTOWN as string) as TextChannel;
    const ephemeral = channelRpg.id !== interaction.channelId ? MessageFlags.Ephemeral : undefined;
    await interaction.deferReply({ flags: ephemeral });
    const subcommand = interaction.options.getSubcommand();

    // Get the user's persona data
    const userData = await getOrCreateUser(interaction.user.id);
    await getOrCreatePersona(userData.id);

    if (subcommand === 'town') {
      await interaction.editReply(await rpgTown(interaction));
    }
    if (subcommand === 'bounties') {
      await interaction.editReply(await rpgBounties(interaction, null));
    }
    if (subcommand === 'quest' || subcommand === 'dungeon' || subcommand === 'raid') {
      await interaction.editReply(await rpgBounties(interaction, subcommand));
    }
    if (subcommand === 'market') {
      await interaction.editReply(await rpgMarket(interaction));
    }
    if (subcommand === 'help') {
      await interaction.editReply(await rpgHelp(interaction));
    }
    if (subcommand === 'home') {
      await interaction.editReply(await rpgHome(interaction, ''));
    }
    if (subcommand === 'arcade') {
      await interaction.editReply(await rpgArcade(interaction));
    }
    if (subcommand === 'coinflip') {
      await interaction.editReply(await rpgArcadeGame(interaction, 'Coinflip'));
    }
    if (subcommand === 'roulette') {
      await interaction.editReply(await rpgArcadeGame(interaction, 'Roulette'));
    }
    if (subcommand === 'flair') {
      await interaction.editReply(await rpgFlair(interaction));
    }
    if (subcommand === 'gift') {
      await interaction.editReply(await rpgGift(interaction));
    }

    return true;
  },
};

export default dRpg;
