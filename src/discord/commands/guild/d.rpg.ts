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
  EmbedBuilder,
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
  ColorResolvable,
  Emoji,
  ButtonInteraction,
} from 'discord.js';
import {
  APIEmbed,
  APISelectMenuOption,
  ButtonStyle,
  ComponentType,
  TextInputStyle,
} from 'discord-api-types/v10';
import { stripIndents } from 'common-tags';
import he from 'he';
import { rpg_inventory } from '@prisma/client';
import { SlashCommand } from '../../@types/commandDef';
import { embedTemplate } from '../../utils/embedTemplate';
import commandContext from '../../utils/context';
import getAsset from '../../utils/getAsset';
import { customButton } from '../../utils/emoji';
import { getProfilePreview } from './d.profile';
import { aiFlairMod } from '../../../global/commands/g.ai';

const Trivia = require('trivia-api');

const tripSitProfileImage = 'tripsit-profile-image.png';
const tripSitProfileImageAttachment = 'attachment://tripsit-profile-image.png';

const F = f(__filename);

// Value in milliseconds (1000 * 60 * 1 = 1 minute)
// const intervals = {
//   quest: env.NODE_ENV === 'production' ? 1000 * 60 * 60 : 1000 * 1,
//   dungeon: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 : 1000 * 1,
//   raid: env.NODE_ENV === 'production' ? 1000 * 60 * 60 * 24 * 7 : 1000 * 1,
// };

const timesUp = 'Time\'s up!';

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

function sleep(ms:number):Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

export type GameName = 'Coinflip' | 'Roulette' | 'Blackjack' | 'Slots';

const wagers = {} as {
  [key: string]: {
    gameName: GameName,
    tokens: number,
  },
};

const optionDict = {
  easy: {
    name: 'Normal',
    bonus: 1,
  },
  medium: {
    name: 'Hard',
    bonus: 1.5,
  },
  hard: {
    name: 'Expert',
    bonus: 2,
  },
};

const bonusDict = {
  5: {
    perfectBonus: 1.5,
    perfectBonusMessage: ' *(+50% perfect bonus)*',
  },
  10: {
    perfectBonus: 2,
    perfectBonusMessage: ' *(+100% perfect bonus)*',
  },
  20: {
    perfectBonus: 3,
    perfectBonusMessage: ' *(+200% perfect bonus)*',
  },
};

type TriviaQuestion = {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  all_answers: string[];
};

const bonusMessageDict = {
  easy: '',
  medium: ' *(+50% difficulty bonus)*',
  hard: ' *(+100% difficulty bonus)*',
};

const gameQuitMessageList = [ // Random messages to display when the user quits the game
  'If you\'re tired of starting over, stop giving up!',
  'Believe in yourself more!',
  'Come back later?',
  'Did you leave the oven on?',
  'Sometimes it\'s ok to cut your losses...',
  'Perhaps another time?',
  'Perhaps you should try a different game?',
  'Did I do something wrong?',
  'Was it something I said?',
];

const timeOutMessageList = [ // Random messages to display when the user runs out of time
  'Be faster next time!',
  'Be a bit quicker next time!',
  'You were far too slow!',
  'If you were any slower, you would have been going backwards!',
  'You were almost as slow as a snail!',
  'You were slower than a turtle!',
  'A sloth could have answered that faster!',
];

const awfulScoreMessageList = [ // Random messages to display when the user got no questions right
  'Yikes...',
  'Ouch...',
  'That was awful...',
  'That was terrible...',
  'That was horrible...',
  'Were you even trying?',
  'I\'ll pretend I didn\'t see that...',
  'Let\'s just forget that ever happened...',
  '...',
  'I\'m speechless...',
  'Sheeeeeesh...',
  'Beep Bop Bloop... Error... Error... Error...',
  'Tip: A score of 0 is not a good score...',
];

const badScoreMessageList = [ // Random messages to display when the user got less than half the questions right
  'Is that all you got?',
  'You can do better than that!',
  'Is that the best you can do?',
  'Better than nothing, I guess...',
  'You wouldn\'t want to vs my grandma...',
  'Come on, you can do better than that!',
  'Try harder next time!',
  'Tip: You get more points for answering correctly!',
];

const goodScoreMessageList = [ // Random messages to display when the user got more than half the questions right
  'Not bad!',
  'Not too shabby!',
  'Getting close!',
  'Almost there!',
  'You\'re getting there!',
  'Now we\'re talking!',
  'Let\'s see if you can keep it up!',
  'Let\'s go for gold next time!',
  'You\'re a natural!',
];

const perfectScoreMessageList = [ // Random messages to display when the user got all the questions right
  'Now that\'s what I call a fine score!',
  'You\'re a genius!',
  'You\'re a trivia master!',
  'You\'re a trivia god!',
  'Have you ever considered being a professional trivia player?',
  'That last player could learn a thing or two from you!',
  'Very impressive!',
  'You\'re on a roll!',
];

function rand(array:string[]):string {
  return array[Math.floor(Math.random() * array.length)];
}

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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

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
        description: stripIndents`${rand(text.quest)}`,
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
        description: stripIndents`${rand(text.dungeon)}`,
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

      if (timeComparison[command] && timeComparison[command]()) {
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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

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
  let choice = '' as string;
  if (interaction.isButton()) {
    // const itemComponent = interaction.message.components[0].components[0];
    let selectedItem: APISelectMenuOption | undefined;
    for (const component of interaction.message.components) {
      for (const subComponent of component.components) {
        if (subComponent.type === ComponentType.SelectMenu) {
          selectedItem = (subComponent as StringSelectMenuComponent).options.find(
            (o:APISelectMenuOption) => o.default === true,
          );
          if (selectedItem) {
            break;
          }
        }
      }
      if (selectedItem) {
        break;
      }
    }
    choice = selectedItem?.value ?? '';
  } else if (interaction.isStringSelectMenu()) {
    [choice] = interaction.values;
  }

  // log.debug(F, `choice: ${choice}`);

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
  // log.debug(F, `itemData (change): ${JSON.stringify(itemData, null, 2)}`);
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

  interface MarketItem extends SelectMenuComponentOptionData {
    category: string;
  }

  const groups = (marketInventory as MarketItem[]).reduce((groupData: Record<string, MarketItem[]>, item) => {
    const { category } = item;
    const newGroupData = { ...groupData };
    newGroupData[category] = newGroupData[category] ? [...newGroupData[category], item] : [item];
    return newGroupData;
  }, {});

  // For each group, split the group into chunks of 25 items each and create a new rowItems for each chunk
  for (const [group, itemsData] of Object.entries(groups)) {
    // Create chunks of 25 items each
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
      components.push(rowItems);
    }
  }

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
  // if the option is a background, run profile preview as the embed image
  if (itemData && itemData.effect === 'background') {
    const imagePath = await getAsset(itemData.effect_value);
    const target = interaction.member as GuildMember;
    const option = 'background';
    const previewImage = await getProfilePreview(target, option, imagePath);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  }
  // if the option is a font, run profile preview as the embed image
  if (itemData && itemData.effect === 'font') {
    const target = interaction.member as GuildMember;
    const fontName = itemData.effect_value;
    const option = 'font';
    const previewImage = await getProfilePreview(target, option, undefined, fontName);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  }
  // if the option is a userflair, run profile preview as the embed image
  if (itemData && itemData.effect === 'userflair') {
    const target = interaction.member as GuildMember;
    const option = 'userflair';
    const previewImage = await getProfilePreview(target, option);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
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
  let selectedItem: APISelectMenuOption | undefined;
  for (const component of interaction.message.components) {
    for (const subComponent of component.components) {
      if (subComponent.type === ComponentType.SelectMenu) {
        selectedItem = (subComponent as StringSelectMenuComponent).options.find(
          (o:APISelectMenuOption) => o.default === true,
        );
        if (selectedItem) {
          break;
        }
      }
    }
    if (selectedItem) {
      break;
    }
  }
  // log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const allItems = [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)];
  const itemData = allItems.find(item => item.value === selectedItem?.value) as {
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
  // log.debug(F, `itemData (accept): ${JSON.stringify(itemData, null, 2)}`);

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
  if (itemData && itemData.effect === 'background') {
    const imagePath = await getAsset(itemData.effect_value);
    const target = interaction.member as GuildMember;
    const option = 'background';
    const previewImage = await getProfilePreview(target, option, imagePath);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    imageFiles.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  } else if (itemData && itemData.effect === 'font') {
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

export async function rpgMarketAccept(
  interaction:MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Get the info used in the market
  // const {
  //   marketInventory,
  //   personaTokens,
  //   personaInventory,
  // } = await rpgMarketInventory(interaction);

  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  // log.debug(F, `personaData (Accept): ${JSON.stringify(personaData, null, 2)}`);

  // If the user confirms the information, save the persona information
  let selectedItem: APISelectMenuOption | undefined;
  for (const component of interaction.message.components) {
    for (const subComponent of component.components) {
      if (subComponent.type === ComponentType.SelectMenu) {
        selectedItem = (subComponent as StringSelectMenuComponent).options.find(
          (o:APISelectMenuOption) => o.default === true,
        );
        if (selectedItem) {
          break;
        }
      }
    }
    if (selectedItem) {
      break;
    }
  }
  log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const allItems = [...Object.values(items.general), ...Object.values(items.fonts), ...Object.values(items.backgrounds)];
  const itemData = allItems.find(item => item.value === selectedItem?.value) as {
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
  // log.debug(F, `itemData (accept): ${JSON.stringify(itemData, null, 2)}`);

  // Check that the user has less than 25 items in their inventory
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  if (inventoryData.length >= 20 && (itemData.value !== 'PremiumMembership')) {
    const { embeds, components } = await rpgMarketChange(interaction);

    // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
    const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(stripIndents`**You cannot buy this item because your inventory is full. Sell some items from your home inventory to make room!**
    
    ${description}`)
      .setColor(Colors.Red);
    const imageFiles = [] as AttachmentBuilder[];

    return {
      embeds: [embed],
      components,
      files: imageFiles,
    };
  }

  const {
    personaDiscount,
  } = await rpgMarketInventory(interaction);

  const itemCost = (itemData.cost - (itemData.cost * personaDiscount));
  let embedInfoText = '';

  // Check if the user has enough tokens to buy the item
  if (personaData.tokens < itemCost) {
  // log.debug(F, 'Not enough tokens to buy item');

    const { embeds, components } = await rpgMarketChange(interaction);

    // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
    const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(stripIndents`**You do not have enough tokens to buy this item.**
    
    ${description}`)
      .setColor(Colors.Red);
    const imageFiles = [] as AttachmentBuilder[];
    if (itemData.effect === 'background') {
      const imagePath = await getAsset(itemData.effect_value);
      // log.debug(F, `imagePath: ${imagePath}`);
      imageFiles.push(new AttachmentBuilder(imagePath));
      embed.setImage(`attachment://${itemData.effect_value}.png`);
    }

    return {
      embeds: [embed],
      components,
      files: imageFiles,
    };
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
    // log.debug(F, `personaInventory: ${JSON.stringify(newItem, null, 2)}`);

    // await inventorySet(newItem);
    await db.rpg_inventory.create({
      data: newItem,
    });
  }

  // if the item is a background or font, automatically equip it and unequip the other items of the same type
  if (itemData.effect === 'background' || itemData.effect === 'font') {
    const inventory = await db.rpg_inventory.findMany({
      where: {
        persona_id: personaData.id,
      },
    });
    const itemIndex = inventory.findIndex(i => i.value === itemData.value);
    // log.debug(F, `itemIndex: ${itemIndex}`);

    // Unequip all items of the same type
    const unequipItems = inventory.filter(i => i.effect === itemData.effect && i.equipped === true);
    // log.debug(F, `unequipItems: ${JSON.stringify(unequipItems, null, 2)}`);
    for (const item of unequipItems) {
      // log.debug(F, `item: ${JSON.stringify(item, null, 2)}`);
      item.equipped = false;
      await db.rpg_inventory.upsert({
        where: {
          id: item.id,
        },
        create: item,
        update: item,
      });
    }

    // Equip the new item
    const equipItem = inventory[itemIndex];
    // log.debug(F, `equipItem: ${JSON.stringify(equipItem, null, 2)}`);
    equipItem.equipped = true;
    await db.rpg_inventory.upsert({
      where: {
        id: equipItem.id,
      },
      create: equipItem,
      update: equipItem,
    });
    embedInfoText = `Your ${itemData.effect} has been equipped! Head home to unequip it or change ${itemData.effect}s.`;
  }
  // If the item is the flair item, equip it and tell them about /rpg flair
  if (itemData.effect === 'userflair') {
    const inventory = await db.rpg_inventory.findMany({
      where: {
        persona_id: personaData.id,
      },
    });
    const itemIndex = inventory.findIndex(i => i.value === itemData.value);
    // log.debug(F, `itemIndex: ${itemIndex}`);

    // Equip the new item
    const equipItem = inventory[itemIndex];
    // log.debug(F, `equipItem: ${JSON.stringify(equipItem, null, 2)}`);
    equipItem.equipped = true;
    await db.rpg_inventory.upsert({
      where: {
        id: equipItem.id,
      },
      create: equipItem,
      update: equipItem,
    });
    embedInfoText = 'Your flair has been equipped! Use `/rpg flair` to change your flair, or head Home to unequip it.';
  }

  if (itemData.value === 'PremiumMembership') {
    try {
      (interaction.member as GuildMember)?.roles.add(env.ROLE_PREMIUM);
    } catch (err) {
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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // log.debug(F, `Persona home inventory: ${JSON.stringify(inventoryData, null, 2)}`);

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
  // log.debug(F, `generalOptions: ${JSON.stringify(homeInventory, null, 2)}`);
  return {
    homeInventory,
    personaTokens: personaData.tokens,
    personaInventory: inventoryString,
  };
}

export async function rpgFlair(interaction: ChatInputCommandInteraction) {
  // First check if the flair contains a @mention
  let newFlair = interaction.options.getString('flair') as string;
  // log.debug(F, `newFlair: ${newFlair}`);
  const mentionRegex = /<@!?\d{18,}>/g;
  const mentions = newFlair.match(mentionRegex);
  log.debug(F, `mentions: ${mentions}`);
  // If the flair contains a mention, check if the user has mod permissions
  const member = await interaction.guild?.members.fetch(interaction.user.id);

  // If they are a mod, update the user mentioned's flair
  if (mentions && member?.roles.cache.has(env.ROLE_MODERATOR)) {
    const targetId = mentions[0].replace(/[^0-9]/g, '');
    // log.debug(F, `targetId: ${targetId}`);
    const targetMember = await interaction.guild?.members.fetch(targetId);
    // Remove the mention from the flair and the space after the mention
    newFlair = newFlair.replace(mentionRegex, '').replace(' ', '');
    // log.debug(F, `targetMember: ${JSON.stringify(targetMember, null, 2)}`);
    if (targetMember) {
    // Run rpgFlairAccept for the target member
      const targetInteraction = interaction as unknown as MessageComponentInteraction;
      targetInteraction.user = targetMember?.user;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      return rpgFlairAccept(targetInteraction, newFlair);
    }
  } else if (mentions) {
    // If they are not a mod, send an error message
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setTitle(`${emojiGet('itemFlair')} Flair Error`)
        .setDescription(stripIndents`
        You cannot use a mention in your flair!`)
        .setColor(Colors.Red)],
    };
  }
  // Check that the user owns the flair item
  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
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
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Error`)
        .setDescription(stripIndents`
        You don't own the flair item! You can buy it in the \`/rpg market\`.`)
        .setColor(Colors.Red)],
    };
  }
  // If the chosen flair is too long, send an error message
  if (newFlair.length > 50) {
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
        .setDescription(stripIndents`
        Your flair is too long! Please keep it under 50 characters.`)
        .setColor(Colors.Red)],
    };
  }
  // If the user does own the flair item, get the old flair and continue
  const oldFlair = flairItem.effect_value;

  let aiApproved = 'rejected';
  // eslint-disable-next-line sonarjs/no-duplicate-string
  let adjustmentReason = 'No reason given';

  // Query the AI for approval
  const aiPersona = await db.ai_personas.upsert({
    where: {
      name: 'FlairMod',
    },
    create: {
      name: 'FlairMod',
      public: false,
      ai_model: 'GPT_3_5_TURBO',
      prompt: `You are acting as a moderation API. You will receive an input that a user wants to set as their user flair text.

      Drug references and jokes and adult humour are allowed as long as they are not extremely vulgur or offensive. You can swap any very rude words with more PG rated family friendly ones. If there are no alternative words, reject the flair.
      
      After that, adjust it to correct spelling, grammar and such. Made up words are allowed unless they are obvious misspellings, but no random keyboard gibberish (EG. ALRJRBSIEIR)
      
      IMPORTANT! You must correct capitalisation so that the flair fits headline capitalisation rules (every word should be capitalised except short words like "i love going to the supermarket" becomes "I Love Going to the Supermarket")
      
      You must reply with this strict format:
      Status: Approved, Adjusted, Rejected
      Reason: Spelling, grammar, etc
      Adjusted: The new edited flair, or the original flair if nothing was changed or adjusted`,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_tokens: 500,
      created_by: userData.id,
    },
    update: {},
  });

  const messageList = [{
    role: 'user',
    content: newFlair,
  }] as OpenAI.Chat.ChatCompletionMessageParam[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { response, promptTokens, completionTokens } = await aiFlairMod(aiPersona, messageList);
  log.debug(F, `aiResponse: ${JSON.stringify(response, null, 2)}`);

  // Regex to see the approval status
  if (response.match(/Status: Approved/g)) {
    aiApproved = 'approved';
  } else if (response.match(/Status: Adjusted/g)) {
    aiApproved = 'adjusted';
  } else if (response.match(/Status: Rejected/g)) {
    aiApproved = 'rejected';
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
    };
  }

  // If the flair needed to be adjusted, ask the user if they want to use the adjusted flair
  // Also check if the flair was set as approved but the flair is actually different than what the user entered
  if ((aiApproved === 'adjusted' || newFlair.toLowerCase() !== aiAdjusted?.toLowerCase()) && aiApproved !== 'rejected') {
  // If the flair is null, send an error message
    if (!aiAdjusted) {
      return {
        embeds: [embedTemplate()
          .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Error`)
          .setDescription(stripIndents`
        Oops!

        Something went wrong with TripBot's AI.

        Please try again later or contact a moderator to have your flair manually reviewed.`)
          .setColor(Colors.Red)],
      };
    }
    // Regex to get the reason for adjustment from the AI response where it says "Reason: "
    // If it doesn't exist, set it to "No reason given"
    adjustmentReason = response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') || 'No reason given';
    // log.debug(F, `adjustmentReason: ${adjustmentReason}`);

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

  if (aiApproved === 'rejected') {
    adjustmentReason = response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') || 'No reason given';

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

  // If this code runs, something went wrong with TripBot's AI
  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
      .setTitle(`${emojiGet('itemFlair')} Flair Error`)
      .setDescription(stripIndents`
      Oops!

      Something went wrong with TripBot's AI.

      Please try again later or contact a moderator to have your flair manually reviewed.`)
      .setColor(Colors.Red)],
  };
}

export async function rpgFlairAccept(
  interaction:MessageComponentInteraction,
  overrideFlair:string,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

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
    // log.debug(F, `personaInventory: ${JSON.stringify(newItem, null, 2)}`);

    // await inventorySet(newItem);
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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  // When this button is clicked, a modal appears where the user can enter their name
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`rpgNameModal~${interaction.id}`)
    .setTitle('Setup your TripSit room!');

  const body = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
    .setLabel('What do you want to name your persona?')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setCustomId(`rpgNewName,user:${interaction.user.id}`));
  modal.addComponents([body]);
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const modalFilter = (i:ModalSubmitInteraction) => (i.customId.startsWith('rpgNameModal')
    && i.customId.split('~')[1] === interaction.id
    && i.guild !== null);
  await interaction.awaitModalSubmit({ filter: modalFilter, time: 0 })
    .then(async i => {
      if (i.customId.split('~')[1] !== interaction.id) return;
      const choice = i.fields.getTextInputValue('rpgNewName');
      await i.deferReply({ ephemeral: true });

      // log.debug(F, `name: ${choice}`);

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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  // log.debug(F, `personaData home (Change) ${JSON.stringify(personaData, null, 2)}`);

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // log.debug(F, `Persona home inventory (change): ${JSON.stringify(inventoryData, null, 2)}`);

  let defaultOption = '' as string;
  // Get the equipped background
  const equippedBackground = inventoryData.find(item => item.equipped === true && item.effect === 'background');
  // log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
  if (equippedBackground) {
    defaultOption = equippedBackground.value;
  }
  // log.debug(F, `defaultOption1: ${defaultOption} `);

  // Get the item the user selected
  if (interaction.isButton()) {
    const backgroundComponent = interaction.message.components[0].components[0];
    if ((backgroundComponent as StringSelectMenuComponent).options) {
      const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
        (o:APISelectMenuOption) => o.default === true,
      );
      if (selectedItem) {
        defaultOption = selectedItem.value;
      }
    }
  } else if (interaction.isStringSelectMenu() && interaction.values) {
    [defaultOption] = interaction.values;
  }

  // log.debug(F, `defaultOption2: ${defaultOption}`);

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
    // log.debug(F, `allItems: ${JSON.stringify(allItems, null, 2)}`);
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
  // log.debug(F, `backgroundData (home change): ${JSON.stringify(backgroundData, null, 2)}`);
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
    .setDescription(stripIndents`${message !== null ? message : ''}

      You ${rand(text.enter)} your home.
      
      You can equip an item by selecting it from the menu below.

      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}

      ${personaInventory}
    `)
    .setColor(Colors.Purple);

  // If the select item has the 'background' effect, add the image to the embed
  const files = [] as AttachmentBuilder[];

  if (interaction.isStringSelectMenu() && backgroundData && backgroundData.effect === 'background') {
    const imagePath = await getAsset(backgroundData.effect_value);
    const target = interaction.member as GuildMember;
    const option = 'background';
    const previewImage = await getProfilePreview(target, option, imagePath);
    const attachment = new AttachmentBuilder(previewImage, { name: tripSitProfileImage });
    files.push(attachment);
    embed.setImage(tripSitProfileImageAttachment);
  // log.debug(F, 'Set image!');
  }

  // If the select item has the 'font' effect, add the image to the embed
  if (interaction.isStringSelectMenu() && backgroundData && backgroundData.effect === 'font') {
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
  if (interaction.isStringSelectMenu() && backgroundData && backgroundData.effect === 'userflair') {
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
  // const filteredItems = Object.values(genome.species).filter(item => item.value !== choice);

  // // Reset the options menu to be empty
  // new StringSelectMenuBuilder()
  // .setCustomId('rpgSpecies,user:${interaction.user.id}')
  // .setPlaceholder('Pick a species').setOptions();

  // new StringSelectMenuBuilder()
  // .setCustomId('rpgSpecies,user:${interaction.user.id}')
  // .setPlaceholder('Pick a species').addOptions(filteredItems);

  // new StringSelectMenuBuilder()
  // .setCustomId('rpgSpecies,user:${interaction.user.id}')
  // .setPlaceholder('Pick a species').addOptions([
  //   {
  //     label: { ...genome.species }[choice as keyof typeof genome.species].label,
  //     value: { ...genome.species }[choice as keyof typeof genome.species].value,
  //     description: { ...genome.species }[choice as keyof typeof genome.species].description,
  //     emoji: { ...genome.species }[choice as keyof typeof genome.species].emoji,
  //     default: true,
  //   },
  // ]);

  // selectSpecies.addOptions(Object.values(speciesDef).filter(s => s.value !== choice));

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

  // log.debug(F, `classDef: ${JSON.stringify(classDef, null, 2)}`);
  // const selectedClassList = { ...genome.classes };
  // log.debug(F, `selectedClassList1: ${JSON.stringify(selectedClassList, null, 2)}`);
  // selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;
  // log.debug(F, `selectedClassList2: ${JSON.stringify(selectedClassList, null, 2)}`);

  // new StringSelectMenuBuilder()
  // .setCustomId('rpgClass,user:${interaction.user.id}')
  // .setPlaceholder('Select a class').setOptions(Object.values({ ...selectedClassList }));

  // const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>()
  // //   .setComponents(new StringSelectMenuBuilder()
  // .setCustomId('rpgClass,user:${interaction.user.id}')
  // .setPlaceholder('Select a class'));

  // log.debug(F, `speciesDef: ${JSON.stringify(genome.species, null, 2)}`);
  // const selectedSpeciesList = { ...genome.species };
  // log.debug(F, `selectedSpeciesList1: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  // selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;
  // log.debug(F, `selectedSpeciesList2: ${JSON.stringify(selectedSpeciesList, null, 2)}`);
  // log.debug(F, `speciesDef2: ${JSON.stringify(genome.species, null, 2)}`);

  // new StringSelectMenuBuilder()
  //   .setCustomId('rpgSpecies,user:${interaction.user.id}')
  //   .setPlaceholder('Pick a species').setOptions(Object.values({ ...selectedSpeciesList }));
  // // const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>()
  //   .addComponents(new StringSelectMenuBuilder()
  // .setCustomId('rpgSpecies,user:${interaction.user.id}')
  // .setPlaceholder('Pick a species'));

  // const selectedGuildList = { ...genome.guilds };
  // selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;
  // log.debug(F, `Selected guild list: ${JSON.stringify(selectedGuildList, null, 2)}`);

  // new StringSelectMenuBuilder()
  //   .setCustomId('rpgGuild,user:${interaction.user.id}')
  //   .setPlaceholder('Select a guild').setOptions(Object.values(selectedGuildList));
  // // const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>()
  // //   .addComponents(new StringSelectMenuBuilder()
  //   .setCustomId('rpgGuild,user:${interaction.user.id}')
  //   .setPlaceholder('Select a guild'));

  // const { embeds, components } = await rpgHomeChange(interaction);

  // // The user has clicked the home button, send them the home embed
  // return {
  //   embeds,
  //   components,
  // };
}

export async function rpgHomeAccept(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  // If the user confirms the information, save the persona information
  const backgroundComponent = interaction.message.components[0].components[0];
  const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
    (o:APISelectMenuOption) => o.default === true,
  );

  // // If the user confirms the information, save the persona information
  // const nameComponent = interaction.message.components[0].components[0];
  // const selectedName = (nameComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const speciesComponent = interaction.message.components[1].components[0];
  // const selectedSpecies = (speciesComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const classComponent = interaction.message.components[2].components[0];
  // const selectedClass = (classComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );
  // const guildComponent = interaction.message.components[3].components[0];
  // const selectedGuild = (guildComponent as StringSelectMenuComponent).options.find(
  //   (o:APISelectMenuOption) => o.default === true,
  // );

  // log.debug(F, `selectedItem (accept home): ${JSON.stringify(selectedItem, null, 2)}`);
  // log.debug(F, `selectedName: ${JSON.stringify(selectedName, null, 2)}`);
  // log.debug(F, `selectedSpecies: ${JSON.stringify(selectedSpecies, null, 2)}`);
  // log.debug(F, `selectedClass: ${JSON.stringify(selectedClass, null, 2)}`);
  // log.debug(F, `selectedGuild: ${JSON.stringify(selectedGuild, null, 2)}`);

  // Get the existing inventory data
  // const inventoryData = await inventoryGet(personaData.id);
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // log.debug(F, `Persona home inventory (accept): ${JSON.stringify(inventoryData, null, 2)}`);

  // Find the selectedItem in the inventoryData
  const chosenItem = inventoryData.find(item => item.value === selectedItem?.value);
  // Find the item type from inventoryData
  // const itemType = inventoryData.find(item => item.value === selectedItem?.value)?.effect;

  // Equip the item
  if (chosenItem) {
    chosenItem.equipped = true;
    // await inventorySet(chosenItem);
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

  // log.debug(F, `Setting Persona data: ${JSON.stringify(personaData, null, 2)}`);

  // await personaSet(personaData);
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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  const itemComponent = interaction.message.components[0].components[0];
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
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  let personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  const itemComponent = interaction.message.components[0].components[0];
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

  personaData = await db.personas.upsert({
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
        You ${rand(text.enter)} the arcade and see a variety of games.

        ***More games coming soon!***
      `)
      .setColor(Colors.Green)],
    components: [new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        customButton(`rpgCoinFlip,user:${interaction.user.id}`, 'CoinFlip', 'buttonCoinflip', ButtonStyle.Secondary),
        customButton(`rpgRoulette,user:${interaction.user.id}`, 'Roulette', 'buttonRoulette', ButtonStyle.Secondary),
        customButton(`rpgTrivia,user:${interaction.user.id}`, 'Trivia', 'buttonTrivia', ButtonStyle.Secondary),
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
  // if (env.NODE_ENV === 'development') {
  //   await (interaction as MessageComponentInteraction).editReply({
  //     embeds: [embedTemplate()
  //       .setAuthor(null)
  //       .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
  //       .setTitle(gameName),
  //     ],
  //   });
  //   return;
  // }

  if (gameName === 'Coinflip') {
    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [],
      content: 'https://media.tenor.com/tewn7lzVDgcAAAAC/coin-flip-flip.gif',
      components: [],
    });

    await sleep(4 * 1000);

    // const spaceField = { name: '\u200B', value: '\u200B' };
    // const embed = embedTemplate()
    //   .setAuthor(null)
    //   .setFooter(null)
    //   .setFields([
    //     { name: '🪙', value: '🫱' },
    //   ]);

    // await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //   embeds: [embed],
    //   components: [],
    // });

    // await sleep(1 * 1000);

    // await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //   embeds: [embed.setFields([
    //     { name: '🪙', value: '👍' },
    //   ])],
    // });

    // await sleep(0.5 * 1000);

    // let height = 1;
    // const ceiling = 3;
    // while (height < ceiling) {
    //   await sleep(0.25 * 1000); // eslint-disable-line no-await-in-loop
    //   embed.setFields([{ name: '\u200B', value: '🪙' }]);
    //   const spaceArray = Array(height).fill(spaceField);
    //   if (spaceArray && spaceArray.length > 0) {
    //     embed.addFields(spaceArray);
    //   }
    //   embed.addFields([{ name: '\u200B', value: '🫴' }]);

    //   await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //     embeds: [embed],
    //   });
    //   height += 1;
    //   // log.debug(F, `height up: ${height}`);
    // }
    // while (height > 0) {
    //   await sleep(0.25 * 1000); // eslint-disable-line no-await-in-loop
    //   embed.setFields([{ name: '\u200B', value: '🪙' }]);
    //   const spaceArray = Array(height).fill({ name: '\u200B', value: '\u200B' });
    //   if (spaceArray && spaceArray.length > 0) {
    //     embed.addFields(spaceArray);
    //   }
    //   embed.addFields([{ name: '\u200B', value: '🫴' }]);

    //   await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //     embeds: [embed],
    //   });
    //   height -= 1;
    //   // log.debug(F, `height down: ${height}`);
    // }

    // await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //   embeds: [embed.setFields([
    //     { name: '🪙', value: '🫴' },
    //   ])],
    // });
    // await sleep(0.5 * 1000);

    // await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
    //   embeds: [embed.setFields([
    //     { name: '🪙', value: '🫴', inline: true },
    //   ])],
    // });
    // await sleep(1 * 1000);
  }

  if (gameName === 'Roulette') {
    await (interaction as MessageComponentInteraction).editReply({ // eslint-disable-line no-await-in-loop
      embeds: [],
      content: 'https://media2.giphy.com/media/1DEJwfwdknKZq/giphy.gif',
      components: [],
    });

    await sleep(4 * 1000);
    //   // Make an animation out of embeds that shows an arrow spinning

    //   const wheelTop = [
    //     { name: '\u200B', value: '⬛', inline: true },
    //     { name: '\u200B', value: '🟥', inline: true },
    //     { name: '\u200B', value: '⬛', inline: true },
    //     { name: '🟥', value: '⬛', inline: true },
    //   ];
    //   const wheelBottom = [
    //     { name: '🟥', value: '⬛', inline: true },
    //     // { name: '🟥', value: '\u200B', inline: true },
    //     // { name: '⬛', value: '\u200B', inline: true },
    //     // { name: '🟥', value: '\u200B', inline: true },
    //   ];

    //   const embed = embedTemplate()
    //     .setAuthor(null)
    //     .setFooter(null)
    //     .setFields(
    //       ...wheelTop,
    //       { name: '⬆️', value: '🟥', inline: true },
    //       ...wheelBottom,
    //     );
    //   await (interaction as MessageComponentInteraction).editReply({ embeds: [embed] }); // eslint-disable-line no-await-in-loop
    //   await sleep(0.5 * 1000); // eslint-disable-line no-await-in-loop

    //   const arrows = ['↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '⬆️', '↗️', '➡️', '↘️'];
    //   for (const arrow of arrows) { // eslint-disable-line no-restricted-syntax
    //     embed.setFields(
    //       ...wheelTop,
    //       { name: arrow, value: '🟥', inline: true },
    //       ...wheelBottom,
    //     );
    //     await (interaction as MessageComponentInteraction).editReply({ embeds: [embed], components: [] }); // eslint-disable-line no-await-in-loop
    //     // await sleep(0.1 * 1000); // eslint-disable-line no-await-in-loop
    //   }

  //   await sleep(2 * 1000);
  }
}

export async function rpgArcadeGame(
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
  gameName: GameName,
  choice?: 'heads' | 'tails' | '0'
  | 'evens' | 'odds' | 'red' | 'black'
  | 'high' | 'low' | 'first' | 'second' | 'third'
  | '1-12' | '13-24' | '25-36',
  message?: string,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // log.debug(F, `Started rpgArcadeGame(${gameName}, ${choice}, ${message})`);
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
      customButton(`rpgWager1,user:${interaction.user.id}`, 'Bet 1', 'buttonBetSmall', ButtonStyle.Success),
      customButton(`rpgWager10,user:${interaction.user.id}`, 'Bet 10', 'buttonBetMedium', ButtonStyle.Success),
      customButton(`rpgWager100,user:${interaction.user.id}`, 'Bet 100', 'buttonBetLarge', ButtonStyle.Success),
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

  const rowBetsD = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(...bets.slice(15, 20));

  // log.debug(F, `rowWagers: ${JSON.stringify(rowWagers, null, 2)}`);
  // log.debug(F, `rowBetsA: ${JSON.stringify(rowBetsA, null, 2)}`);

  const components = [rowWagers, rowBetsA];
  if (rowBetsB.components.length > 0) components.push(rowBetsB);
  if (rowBetsC.components.length > 0) components.push(rowBetsC);
  if (rowBetsD.components.length > 0) components.push(rowBetsD);

  // log.debug(F, `components: ${JSON.stringify(components, null, 2)}`);

  if (!wagers[interaction.user.id]) {
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
  }

  if (wagers[interaction.user.id].gameName !== gameName) {
    wagers[interaction.user.id] = {
      tokens: 0,
      gameName,
    };
  }

  // Check get fresh persona data
  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
  // log.debug(F, `personaData (Coinflip): ${JSON.stringify(personaData, null, 2)}`);

  const currentBet = wagers[interaction.user.id].tokens;
  // log.debug(F, `currentBet: ${currentBet}`);

  // log.debug(F, `choice: ${choice}`);
  if (choice && currentBet === 0) {
    // await (interaction as MessageComponentInteraction).editReply(noBetError);
    return {
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(gameName)
        .setDescription(stripIndents`
          **You can't start a game without first placing a bet!**

          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
        `)
        .setColor(Colors.Gold)],
      components,
    };
  }

  if (choice) {
    await rpgArcadeAnimate(interaction, gameName);
    const { object } = gameData[gameName as keyof typeof gameData];

    const { options } = gameData[gameName as keyof typeof gameData];
    const result = rand(options);
    // log.debug(F, `result: ${result}`);

    let payout = 0;
    if (gameName === 'Coinflip') {
      if (result === choice) payout = currentBet;
    } else if (gameName === 'Roulette') {
      const number = parseInt(result, 10);
      if (choice === '0' && number === 0) payout = currentBet * 17;
      else if ((choice === 'red' || choice === 'evens') && (number % 2 === 0)) payout = currentBet;
      else if ((choice === 'black' || choice === 'odds') && (number % 2 !== 0)) payout = currentBet;
      else if ((choice === 'high') && (number > 18)) payout = currentBet;
      else if ((choice === 'low') && (number < 18)) payout = currentBet;
      else if ((choice === '1-12') && (number < 13)) payout = currentBet * 2;
      else if ((choice === '13-24') && (number > 12 && number < 25)) payout = currentBet * 2;
      else if ((choice === '25-36') && (number > 24)) payout = currentBet * 2;
      else if ((choice === 'first') && ([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(number))) payout = currentBet * 2;
      else if ((choice === 'second') && ([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(number))) payout = currentBet * 2;
      else if ((choice === 'third') && ([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(number))) payout = currentBet * 2;
    }

    // log.debug(F, `result: ${result}`);

    if (payout !== 0) {
      // The user won
      const BetOutcomeMessage = BetWinMessageList[Math.floor(Math.random() * BetWinMessageList.length)];
      personaData.tokens += payout;
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
      return {
        content: null,
        embeds: [embedTemplate()
          .setAuthor(null)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
          .setTitle(`${emojiGet(emojiName)} ${gameName}`)
          .setDescription(stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You won ${payout} tokens!**
            *${BetOutcomeMessage}*

            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `)
          .setColor(Colors.Gold)],
        components,
      };
    }
    // The user lost
    const BetOutcomeMessage = BetLossMessageList[Math.floor(Math.random() * BetLossMessageList.length)];
    personaData.tokens -= currentBet;
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
    return {
      content: null,
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(`${emojiGet(emojiName)} ${gameName}`)
        .setDescription(stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You lost ${currentBet} tokens!**
            *${BetOutcomeMessage}*

            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `)
        .setColor(Colors.Grey)],
      components,
    };
  }

  // The user has clicked the market button, send them the market embed
  if (currentBet !== 0) {
  // log.debug(F, 'No choice made, but a bet was made, return the bet screen');
    return {
      content: null,
      embeds: [embedTemplate()
        .setAuthor(null)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
        .setTitle(`${emojiGet(emojiName)} ${gameName}`)
        .setDescription(stripIndents`${message ?? ''}
          You are betting ${currentBet} tokens.

          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
        `)
        .setColor(Colors.Green)],
      components,
    };
  }

  return {
    content: null,
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet(emojiName)} ${gameName}`)
      .setDescription(stripIndents`You start a game of ${gameName}.

        ${instructions}

        ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
      `)
      .setColor(Colors.Green)],
    components,
  };
}

export async function getNewTimer(seconds: number) {
  const currentDate = new Date();
  return new Date(currentDate.getTime() + seconds * 1000);
}

type GameState = {
  [key:string]: {
    difficultyMenu: StringSelectMenuBuilder,
    questionsMenu: StringSelectMenuBuilder,
  }
};

const gameStates = {} as GameState;

export async function rpgTriviaGetQuestions(
  amount: number,
  difficulty:string,
):Promise<TriviaQuestion[]> {
  // log.debug(F, `Getting question with difficulty: ${difficulty}...`);
  const trivia = new Trivia({ encoding: 'url3986' });

  const { results } = await trivia.getQuestions({ amount, type: 'multiple', difficulty });

  // log.debug(F, `results: ${JSON.stringify(results, null, 2)}`);

  function anticheat(str: string) {
    const replacementMap: { [key: string]: string } = {
      a: 'α',
      e: 'є',
      u: 'υ',
    };

    return str.replace(/[aet]/gi, (replacement: string) => replacementMap[replacement] || replacement);
  }

  return results.map((questionData:{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }) => {
    // const answers = [...questionData.incorrect_answers, questionData.correct_answer];
    // Unescape HTML entities
    const Question = anticheat(he.unescape(questionData.question));
    const CorrectAnswer = anticheat(he.unescape(questionData.correct_answer));
    const IncorrectAnswers = anticheat(he.unescape(questionData.incorrect_answers.join('| ')));
    const Answers = [...IncorrectAnswers.split('| '), CorrectAnswer];
    // log.debug(F, `Broken Question: ${questionData.question}, Fixed Question: ${fixedQuestion}`);
    // log.debug(F, `Broken Answer: ${answers}, Fixed Answer: ${fixedAnswers}`);
    // Shuffle the answers (So the correct answer isn't always the last one)
    Answers.sort(() => Math.random() - 0.5);

    return {
      category: questionData.category,
      type: questionData.type,
      difficulty: questionData.difficulty,
      question: Question,
      correct_answer: CorrectAnswer,
      all_answers: Answers,
    } as TriviaQuestion;
  });
}

export async function rpgTrivia( // eslint-disable-line
  interaction: MessageComponentInteraction | ChatInputCommandInteraction,
):Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // log.debug(F, `GameStates: ${JSON.stringify(gameStates, null, 2)}`);

  const difficulties = [
    {
      label: 'Normal Difficulty',
      value: 'easy',
      emoji: 'menuNormal',
      default: true,
    },
    {
      label: 'Hard Difficulty (50% difficulty bonus)',
      value: 'medium',
      emoji: 'menuHard',
    },
    {
      label: 'Expert Difficulty (100% difficulty bonus)',
      value: 'hard',
      emoji: 'menuExpert',
    },
  ];

  const numberOfQuestions = [
    {
      label: '5 Questions (50% perfect bonus)',
      value: '5',
      emoji: 'menuShort',
      default: true,
    },
    {
      label: '10 Questions (100% perfect bonus)',
      value: '10',
      emoji: 'menuMedium',
    },
    {
      label: '20 Questions (200% perfect bonus)',
      value: '20',
      emoji: 'menuLong',
    },
  ];

  const questionsMenu = gameStates[interaction.user.id]
    ? gameStates[interaction.user.id].questionsMenu
    : new StringSelectMenuBuilder()
      .setCustomId(`rpgQuestionLimit,user:${interaction.user.id}`)
      .setPlaceholder('How many questions?')
      .setOptions(numberOfQuestions.map(q => ({
        label: q.label,
        value: q.value,
        emoji: `<:${(emojiGet(q.emoji) as Emoji).identifier}>`,
        default: q.default,
      })));

  const difficultyMenu = gameStates[interaction.user.id]
    ? gameStates[interaction.user.id].difficultyMenu
    : new StringSelectMenuBuilder()
      .setCustomId(`rpgDifficulty,user:${interaction.user.id}`)
      .setPlaceholder('Easy')
      .setOptions(difficulties.map(d => ({
        label: d.label,
        value: d.value,
        emoji: `<:${(emojiGet(d.emoji) as Emoji).identifier}>`,
        default: d.default,
      })));

  // log.debug(F, `Questions Menu: ${JSON.stringify(questionsMenu, null, 2)}`);
  // log.debug(F, `Difficulty Menu: ${JSON.stringify(difficultyMenu, null, 2)}`);

  if (interaction.isButton() && interaction.customId.split(',')[0] === 'rpgStart') {
    // const channelRpg = await interaction.guild?.channels.fetch(env.CHANNEL_TRIPTOWN as string) as TextChannel;
    // await interaction.deferReply({ ephemeral: (channelRpg.id !== interaction.channelId) });
    const difficultyComponent = interaction.message.components[1].components[0];
    const selectedDifficulty = (difficultyComponent as StringSelectMenuComponent).options.find(
      (o:APISelectMenuOption) => o.default === true,
    );
    const chosenDifficulty = selectedDifficulty?.value ?? 'easy';

    const amountComponent = interaction.message.components[2].components[0];
    const selectedAmount = (amountComponent as StringSelectMenuComponent).options.find(
      (o:APISelectMenuOption) => o.default === true,
    );
    const amountOfQuestions = parseInt(selectedAmount?.value ?? '5', 10);

    const difficultyName = optionDict[chosenDifficulty as keyof typeof optionDict].name;
    const { bonus } = optionDict[chosenDifficulty as keyof typeof optionDict];
    const { perfectBonus } = bonusDict[amountOfQuestions as keyof typeof bonusDict];
    let questionTimer = {} as Date;
    // let perfectScore = bonusDict[amountOfQuestions as keyof typeof bonusDict].perfectBonusMessage;
    let bonusMessage = bonusMessageDict[chosenDifficulty as keyof typeof bonusMessageDict];
    let questionsCorrect = 0;
    let streak = 0;
    let maxStreak = 0;
    let score = 0;
    let scoreMessage = '';
    let timedOut = false as boolean;
    let gameQuit = false as boolean;
    let answerColor = Colors.Purple as ColorResolvable;
    let embedStatus = `Starting trivia with ${amountOfQuestions} questions!`;
    let questionAnswer = 'You have 30 seconds to answer each question.';
    const choices = [
      `<:${emojiGet('buttonBoxA').identifier}>`,
      `<:${emojiGet('buttonBoxB').identifier}>`,
      `<:${emojiGet('buttonBoxC').identifier}>`,
      `<:${emojiGet('buttonBoxD').identifier}>`,
    ] as string[];
    // log.debug(F, `Choices: ${choices}`);
    const choiceEmoji = (choice: string) => { // emoji for the buttons without the emoji name
      switch (choice) {
        case `<:${emojiGet('buttonBoxA').identifier}>`:
          return emojiGet('buttonBoxA').id;
        case `<:${emojiGet('buttonBoxB').identifier}>`:
          return emojiGet('buttonBoxB').id;
        case `<:${emojiGet('buttonBoxC').identifier}>`:
          return emojiGet('buttonBoxC').id;
        case `<:${emojiGet('buttonBoxD').identifier}>`:
          return emojiGet('buttonBoxD').id;
        default:
          return '❓';
      }
    };

    // Get the user's persona data
    const userData = await db.users.upsert({
      where: {
        discord_id: interaction.user.id,
      },
      create: {
        discord_id: interaction.user.id,
      },
      update: {},
    });
    const personaData = await db.personas.upsert({
      where: {
        user_id: userData.id,
      },
      create: {
        user_id: userData.id,
      },
      update: {},
    }); const questionList = await rpgTriviaGetQuestions(amountOfQuestions, chosenDifficulty);

    for (let qNumber = 0; (qNumber < amountOfQuestions); qNumber += 1) {
      // Get the first question from the array
      const [questionData] = questionList;
      const answerMap = new Map(questionData.all_answers.map((answer, index) => [choices[index], `**${choices[index]}** ${answer}`])); // eslint-disable-line max-len
      questionTimer = await getNewTimer(35); // eslint-disable-line no-await-in-loop
      let embed = new EmbedBuilder()
        .setColor(answerColor)
        .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
        .setDescription(`
        **Question ${qNumber + 1} of ${amountOfQuestions}**
        ${questionData.question}
        
        **Choices**
        ${[...answerMap.values()].join('\n')}

        Streak: ${streak}
        **Time's up <t:${Math.floor(questionTimer.getTime() / 1000)}:R>**`)
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len

      if (qNumber === 0) {
        // await (interaction as MessageComponentInteraction).update({}); // eslint-disable-line no-await-in-loop
        questionTimer = await getNewTimer(6); // eslint-disable-line no-await-in-loop
        const startingEmbed = new EmbedBuilder()
          .setColor(answerColor)
          .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
          .setDescription(`
          **Loading Trivia with ${amountOfQuestions} questions...**
          
          **Starting <t:${Math.floor(questionTimer.getTime() / 1000)}:R>**
          Get ready!`)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len
        await interaction.editReply({ embeds: [startingEmbed], components: [] }); // eslint-disable-line no-await-in-loop, max-len
        // If it's the first question, send a new message
        await sleep(5 * 1000); // eslint-disable-line no-await-in-loop
        await interaction.editReply({ // eslint-disable-line no-await-in-loop
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map(choice => new ButtonBuilder()
                .setDisabled(false)
                .setCustomId(`${choice},user:${interaction.user.id}`)
                .setEmoji(choiceEmoji(choice))
                .setStyle(ButtonStyle.Secondary))
                .concat([
                  customButton(`rpgQuit,user:${interaction.user.id}`, 'Quit', 'buttonQuit', ButtonStyle.Danger).setDisabled(false),
                ]),
            ),
          ],
        });
      } else {
        // await (interaction as MessageComponentInteraction).editReply({}); // eslint-disable-line no-await-in-loop
        // If not the first question, edit the previous message
        await sleep(5 * 1000); // eslint-disable-line no-await-in-loop
        await interaction.editReply({ // eslint-disable-line no-await-in-loop
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              choices.map(choice => new ButtonBuilder()
                .setDisabled(false)
                .setCustomId(`${choice},user:${interaction.user.id}`)
                .setEmoji(choiceEmoji(choice))
                .setStyle(ButtonStyle.Secondary))
                .concat([
                  customButton(`rpgQuit,user:${interaction.user.id}`, 'Quit', 'buttonQuit', ButtonStyle.Danger).setDisabled(false),
                ]),
            ),
          ],
        });
      }

      // Filter for the buttons
      const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id
          && i.componentType === ComponentType.Button;
      if (!interaction.channel) throw new Error('Channel not found');
      let collected = {} as ButtonInteraction;
      try {
        collected = await interaction.channel.awaitMessageComponent({ // eslint-disable-line no-await-in-loop
          filter,
          time: 30000,
        }) as ButtonInteraction;
      } catch (err) {
        // If the user doesn't answer in time
        // log.debug(F, 'User did not answer in time');
        embedStatus = timesUp;
        answerColor = Colors.Red as ColorResolvable;
        questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
        timedOut = true;
      }

      if (timedOut === true) break;
      await collected.update({}); // eslint-disable-line no-await-in-loop

      await collected.editReply({ // eslint-disable-line no-await-in-loop
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              choices.map(choice => new ButtonBuilder()
                .setCustomId(`${choice},user:${interaction.user.id}`)
                .setDisabled(true)
                .setEmoji(choice)
                .setStyle(ButtonStyle.Secondary))
                .concat([
                  customButton('rpgQuit', 'Quit', 'buttonQuit', ButtonStyle.Danger).setDisabled(true),
                ]),
            )],
      });

      if (collected.customId.split(',')[0] === 'rpgQuit') {
        gameQuit = true;
        // log.debug(F, 'User quit the game');
        break;
      }

      let answer = answerMap.get(collected.customId.split(',')[0]); // Get the answer from the map
      answer = answer?.substring(38);
      log.debug(F, `User chose: ${answer}`);
      log.debug(F, `Correct answer was: ${questionData.correct_answer}`);

      if (answer === questionData.correct_answer) { // If the user answers correctly
        questionTimer = await getNewTimer(6); // eslint-disable-line no-await-in-loop
        streak += 1;
        if (streak > maxStreak) {
          maxStreak = streak;
        }
        score += (1 * streak);
        questionsCorrect += 1;
        embed = new EmbedBuilder()
          .setColor(Colors.Green as ColorResolvable)
          .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
          .setDescription(`
            **Correct!**
            The answer was **${questionData.correct_answer}.**
            
            **Current Score**
            Correct: ${questionsCorrect} of ${(qNumber + 1)}
            Streak: ${streak}
            
            Next question <t:${Math.floor(questionTimer.getTime() / 1000)}:R>`)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len
        embedStatus = 'Correct!';
        questionAnswer = `The answer was **${questionData.correct_answer}.**`;
        if (interaction.isRepliable()) {
          await interaction.editReply({ // eslint-disable-line no-await-in-loop
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                  choices.map(choice => new ButtonBuilder()
                    .setDisabled(true)
                    .setCustomId(`${choice},user:${interaction.user.id}`)
                    .setEmoji(choiceEmoji(choice))
                    .setStyle(ButtonStyle.Secondary))
                    .concat([
                      customButton(`rpgQuit,user:${interaction.user.id}`, 'Quit', 'buttonQuit', ButtonStyle.Danger).setDisabled(true),
                    ]),
                ),
            ],
          });
        } else {
          embedStatus = timesUp;
          answerColor = Colors.Red as ColorResolvable;
          questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
          timedOut = true;
          break; // If the user timed out, break the loop
        }
      } else { // If the user answers incorrectly
        questionTimer = await getNewTimer(6); // eslint-disable-line no-await-in-loop
        streak = 0;
        embed = new EmbedBuilder()
          .setColor(Colors.Grey as ColorResolvable)
          .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
          .setDescription(`
          **Incorrect!**
          The correct answer was **${questionData.correct_answer}.**
          
          **Current Score**
          Correct: ${questionsCorrect} of ${(qNumber + 1)}
          Streak: ${streak}
          
          Next question <t:${Math.floor(questionTimer.getTime() / 1000)}:R>`)
          .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: env.TS_ICON_URL }); // eslint-disable-line max-len
        embedStatus = 'Incorrect!';
        questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
        if (interaction.isRepliable()) {
          await interaction.editReply({ // eslint-disable-line no-await-in-loop
            embeds: [embed],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                choices.map(choice => new ButtonBuilder()
                  .setDisabled(true)
                  .setCustomId(`${choice},user:${interaction.user.id}`)
                  .setEmoji(choiceEmoji(choice))
                  .setStyle(ButtonStyle.Secondary))
                  .concat([
                    customButton(`rpgQuit,user:${interaction.user.id}`, 'Quit', 'buttonQuit', ButtonStyle.Danger).setDisabled(true),
                  ]),
              ),
            ],
          });
        } else {
          embedStatus = timesUp;
          answerColor = Colors.Red as ColorResolvable;
          questionAnswer = `The correct answer was **${questionData.correct_answer}.**`;
          timedOut = true;
          break; // If the user timed out, break the loop
        }
      }
      questionList.splice(0, 1); // Remove the first question from the array
    }
    let payout = 0;
    // perfectScore = '';
    if (questionsCorrect !== 0) { // The user got at least one question correct
      if (questionsCorrect === amountOfQuestions) { // Bonus for getting all questions correct
        payout = Math.ceil(2 * (score * (bonus + perfectBonus)));
      } else {
        payout = Math.ceil(2 * (score * bonus));
        // perfectScore = '';
      }
      // log.debug(F, `Payout: ${payout} tokens`);
      // log.debug(F, `Rounded Payout: ${payout} tokens`);
      personaData.tokens += payout;
      // log.debug(F, `User scored: ${score}`);
      // log.debug(F, `User earned: ${payout} tokens`);
      await db.personas.upsert({
        where: {
          user_id: userData.id,
        },
        create: personaData,
        update: personaData,
      });
    } else {
      bonusMessage = '';
    }

    if (!timedOut) {
      if (questionsCorrect === 0) {
        scoreMessage = awfulScoreMessageList[Math.floor(Math.random() * awfulScoreMessageList.length)];
      }
      if (questionsCorrect <= (amountOfQuestions / 2)) {
        scoreMessage = badScoreMessageList[Math.floor(Math.random() * badScoreMessageList.length)];
      }
      if (questionsCorrect > (amountOfQuestions / 2)) {
        scoreMessage = goodScoreMessageList[Math.floor(Math.random() * goodScoreMessageList.length)];
      }
      if (questionsCorrect === amountOfQuestions) {
        scoreMessage = perfectScoreMessageList[Math.floor(Math.random() * perfectScoreMessageList.length)];
      }
      // log.debug(F, `Score Message: ${scoreMessage}`);
      const embed = new EmbedBuilder()
        .setColor(answerColor)
        .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
        .setDescription(
          `**${embedStatus}**
          ${questionAnswer}

          **Final Scores** 
          Correct: **${questionsCorrect}** out of **${amountOfQuestions}**
          Max Streak: **${maxStreak}** correct in a row
          *${scoreMessage}*

          Earned: **${payout} tokens**${bonusMessage}
          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `,
        )
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len
      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              customButton(`rpgStart,user:${interaction.user.id}`, 'Start', 'buttonStart', ButtonStyle.Success),
              customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
            ),
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              difficultyMenu,
            ),
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              questionsMenu,
            ),
        ],
      };
    }
    if (gameQuit) {
      const gameQuitMessage = gameQuitMessageList[Math.floor(Math.random() * gameQuitMessageList.length)];
      const embed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
        .setDescription(
          `**Game quit.**
          ${questionAnswer}

          **Final Scores** 
          Correct: **${questionsCorrect}** out of **${amountOfQuestions}**
          Max Streak: **${maxStreak}** questions correct in a row
          *${gameQuitMessage}*

          Earned: **${payout} tokens**${bonusMessage}
          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `,
        )
        .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len
      return {
        embeds: [embed],
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
              customButton(`rpgStart,user:${interaction.user.id}`, 'Start', 'buttonStart', ButtonStyle.Success),
              customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
            ),
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              difficultyMenu,
            ),
          new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
              questionsMenu,
            ),
        ],
      };
    }
    const timeOutMessage = timeOutMessageList[Math.floor(Math.random() * timeOutMessageList.length)];
    const embed = new EmbedBuilder()
      .setColor(Colors.Purple)
      .setTitle(`${emojiGet('buttonTrivia')} Trivia *(${difficultyName})*`)
      .setDescription(
        `**${embedStatus}**
        ${questionAnswer}

        **Final Scores** 
        Correct: **${questionsCorrect}** out of **${amountOfQuestions}**
        Max Streak: **${maxStreak}** correct in a row
        *${timeOutMessage}*

        Earned: **${payout} tokens**${bonusMessage}
        ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
        `,
      )
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() }); // eslint-disable-line max-len

    // log.debug(F, 'Trivia Game Ended');
    // log.debug(F, `Embed: ${JSON.stringify(embed, null, 2)}`);
    const components = [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          customButton(`rpgStart,user:${interaction.user.id}`, 'Start', 'buttonStart', ButtonStyle.Success),
          customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
        ),
      new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          difficultyMenu,
        ),
      new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(
          questionsMenu,
        ),
    ];
    // log.debug(F, `Components: ${JSON.stringify(components, null, 2)}`);
    return {
      embeds: [embed],
      components,
    };
  }

  // Get the item the user selected
  let selectedOption = '' as string;
  if (interaction.isStringSelectMenu() && interaction.values) {
    [selectedOption] = interaction.values;
  }
  // log.debug(F, `selectedOption: ${selectedOption}`);

  // Check if the selected option exists in the difficulties list
  const difficultyOption = Object.values(difficulties.map(d => ({
    label: d.label,
    value: d.value,
    emoji: emojiGet(d.emoji),
    default: d.default,
  }))).find(item => item.value === selectedOption);
  if (difficultyOption) {
    // log.debug(F, 'difficultyOption is not empty');
    // Get a list of marketInventory where the value does not equal the choice
    // If there is no choice, it will return all items the user has
    const filteredDifficulties = Object.values(difficulties.map(d => ({
      label: d.label,
      value: d.value,
      emoji: `<:${(emojiGet(d.emoji) as Emoji).identifier}>`,
      default: d.default,
    })))
      .filter(item => item.value !== selectedOption)
      .map(item => ({ ...item, default: false }));
    difficultyMenu.setOptions(filteredDifficulties);
    const chosenDifficulty = difficulties.map(d => ({
      label: d.label,
      value: d.value,
      emoji: `<:${(emojiGet(d.emoji) as Emoji).identifier}>`,
      default: d.default,
    })).find(item => item.value === selectedOption);
    if (chosenDifficulty) {
      chosenDifficulty.default = true;
      difficultyMenu.addOptions(chosenDifficulty);
    }
    // log.debug(F, `difficultyMenu: ${JSON.stringify(difficultyMenu, null, 2)}`);
    if (gameStates[interaction.user.id]) {
      gameStates[interaction.user.id].difficultyMenu = difficultyMenu;
    } else {
      gameStates[interaction.user.id] = {
        difficultyMenu,
        questionsMenu: new StringSelectMenuBuilder()
          .setCustomId(`rpgQuestionLimit,user:${interaction.user.id}`)
          .setPlaceholder('How many questions?')
          .setOptions(numberOfQuestions.map(q => ({
            label: q.label,
            value: q.value,
            emoji: `<:${(emojiGet(q.emoji) as Emoji).identifier}>`,
            default: q.default,
          }))),
      };
    }
  }

  // Check if the selected option exists in the number of questions list
  const amountOption = Object.values(numberOfQuestions.map(q => ({
    label: q.label,
    value: q.value,
    emoji: emojiGet(q.emoji),
    default: q.default,
  }))).find(item => item.value === selectedOption);
  if (amountOption) {
    // log.debug(F, 'amountOption is not empty');
    const filteredOptions = Object.values(numberOfQuestions.map(q => ({
      label: q.label,
      value: q.value,
      emoji: `<:${(emojiGet(q.emoji) as Emoji).identifier}>`,
      default: q.default,
    })))
      .filter(item => item.value !== selectedOption)
      .map(item => ({ ...item, default: false }));
    questionsMenu.setOptions(filteredOptions);
    const chosenQuestion = numberOfQuestions.map(q => ({
      label: q.label,
      value: q.value,
      emoji: `<:${(emojiGet(q.emoji) as Emoji).identifier}>`,
      default: q.default,
    })).find(item => item.value === selectedOption);
    if (chosenQuestion) {
      chosenQuestion.default = true;
      questionsMenu.addOptions(chosenQuestion);
    }
    if (gameStates[interaction.user.id]) {
      gameStates[interaction.user.id].questionsMenu = questionsMenu;
    } else {
      gameStates[interaction.user.id] = {
        difficultyMenu: new StringSelectMenuBuilder()
          .setCustomId(`rpgDifficulty,user:${interaction.user.id}`)
          .setPlaceholder('Easy')
          .setOptions(difficulties.map(d => ({
            label: d.label,
            value: d.value,
            emoji: `<:${(emojiGet(d.emoji) as Emoji).identifier}>`,
            default: d.default,
          }))),
        questionsMenu,
      };
    }
  }

  const components = [
    new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        customButton(`rpgStart,user:${interaction.user.id}`, 'Start', 'buttonStart', ButtonStyle.Success),
        customButton(`rpgArcade,user:${interaction.user.id}`, 'Arcade', 'buttonArcade', ButtonStyle.Primary),
      ),
    new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        difficultyMenu,
      ),
    new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        questionsMenu,
      ),
  ];

  // log.debug(F, `Components: ${JSON.stringify(components, null, 2)}`);

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonTrivia')} Trivia`)
      .setDescription(stripIndents`
        You ${rand(text.enter)} the trivia parlor where you can test your knowledge of random facts!

        **How to play**
        - All questions are multiple choice
        - Select a difficulty and number of questions
        - Answer the questions within 30 seconds

        - Earn 1 token (plus difficulty bonus) for each correct answer
        - Earn a streak multiplier for each correct answer in a row
        - Earn more bonus tokens if you get all questions correct

       *(Multiplayer coming soon!)*
      `)
      .setColor(Colors.Green)],
    components,
  };
}

export async function rpgArcadeWager(
  interaction: MessageComponentInteraction,
):Promise<InteractionUpdateOptions> {
  let newBet = wagers[interaction.user.id] ? wagers[interaction.user.id].tokens : 0;
  const bet = parseInt(interaction.customId.slice(8), 10);
  newBet += bet || 0;

  const userData = await db.users.upsert({
    where: {
      discord_id: interaction.user.id,
    },
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
  });
  const personaData = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });
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

  // log.debug(F, `RPG Town End: ${JSON.stringify(rowTown)}`);

  return {
    embeds: [embedTemplate()
      .setAuthor(null)
      .setFooter({ text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`, iconURL: (interaction.member as GuildMember).displayAvatarURL() })
      .setTitle(`${emojiGet('buttonTown')} Town`)
      .setDescription(stripIndents`
      You ${rand(text.enter)} TripTown, a new settlement on the edge of Triptopia, the TripSit Kingdom.

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

  const userData = await db.users.upsert({
    where: {
      discord_id: commandUser.id,
    },
    create: {
      discord_id: commandUser.id,
    },
    update: {},
  });

  const userPersona = await db.personas.upsert({
    where: {
      user_id: userData.id,
    },
    create: {
      user_id: userData.id,
    },
    update: {},
  });

  const targetData = await db.users.upsert({
    where: {
      discord_id: targetUser.id,
    },
    create: {
      discord_id: targetUser.id,
    },
    update: {},
  });

  const targetPersona = await db.personas.upsert({
    where: {
      user_id: targetData.id,
    },
    create: {
      user_id: targetData.id,
    },
    update: {},
  });

  // Get the current token amounts for the command user and the target user
  const commandUserTokens = userPersona.tokens;
  // const targetUserTokens = targetData.tokens;

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
        You ${rand(text.enter)} the information centre and walk up to the help desk.

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
      .setName('trivia')
      .setDescription('Go to the trivia parlor'))
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
    await interaction.deferReply({ ephemeral: (channelRpg.id !== interaction.channelId) });
    const subcommand = interaction.options.getSubcommand();

    // const quietCommands = [
    //   'quest',
    //   'dungeon',
    //   'raid',
    //   'coinflip',
    //   'roulette',
    // ];

    // Get the user's persona data
    const userData = await db.users.upsert({
      where: {
        discord_id: interaction.user.id,
      },
      create: {
        discord_id: interaction.user.id,
      },
      update: {},
    });
    await db.personas.upsert({
      where: {
        user_id: userData.id,
      },
      create: {
        user_id: userData.id,
      },
      update: {},
    });
    // log.debug(F, `Initial Persona data: ${JSON.stringify(personaData, null, 2)}`);

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
    if (subcommand === 'trivia') {
      await interaction.editReply(await rpgTrivia(interaction));
    }
    if (subcommand === 'flair') {
      await interaction.editReply(await rpgFlair(interaction));
    }
    if (subcommand === 'gift') {
      await interaction.editReply(await rpgGift(interaction));
    }

    // if (subcommand === 'blackjack') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }
    // if (subcommand === 'slots') {
    //   await interaction.editReply(await rpgArcade(interaction));
    // }
    return true;
  },
};

export default dRpg;
