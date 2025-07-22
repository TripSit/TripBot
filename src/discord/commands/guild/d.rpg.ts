import type { rpg_inventory } from '@prisma/client';
import type { APIEmbed, APISelectMenuOption } from 'discord-api-types/v10';
import type {
  ActionRow,
  ButtonBuilder,
  ChatInputCommandInteraction,
  GuildMember,
  InteractionEditReplyOptions,
  InteractionUpdateOptions,
  MessageActionRowComponent,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  SelectMenuComponentOptionData,
  StringSelectMenuComponent,
  TextChannel,
} from 'discord.js';
import type OpenAI from 'openai';

import { stripIndents } from 'common-tags';
import { ButtonStyle, ComponentType, MessageFlags, TextInputStyle } from 'discord-api-types/v10';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  Colors,
  ModalBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  time,
} from 'discord.js';

import type { SlashCommand } from '../../@types/commandDef';

import { aiFlairMod as aiFlairModule } from '../../../global/commands/g.ai';
import commandContext from '../../utils/context';
import { embedTemplate } from '../../utils/embedTemplate';
import { customButton } from '../../utils/emoji';
import getAsset from '../../utils/getAsset';
import { getProfilePreview } from './d.profile';

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
  backgrounds: {
    AbstractTriangles: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'AbstractTriangles',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Abstract Triangles',
      quantity: 1,
      value: 'AbstractTriangles',
      weight: 0,
    },
    ArcadeCarpet: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'ArcadeCarpet',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Arcade Carpet',
      quantity: 1,
      value: 'ArcadeCarpet',
      weight: 0,
    },
    CircuitBoard: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'CircuitBoard',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Circuit Board',
      quantity: 1,
      value: 'CircuitBoard',
      weight: 0,
    },
    CoffeeSwirl: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'CoffeeSwirl',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Coffee Swirl',
      quantity: 1,
      value: 'CoffeeSwirl',
      weight: 0,
    },
    Concentric: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Concentric',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Concentric',
      quantity: 1,
      value: 'Concentric',
      weight: 0,
    },
    Connected: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Connected',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Connected',
      quantity: 1,
      value: 'Connected',
      weight: 0,
    },
    CubeTunnels: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'CubeTunnels',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Cube Tunnels',
      quantity: 1,
      value: 'CubeTunnels',
      weight: 0,
    },
    DiamondChevron: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'DiamondChevron',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Diamond Chevron',
      quantity: 1,
      value: 'DiamondChevron',
      weight: 0,
    },
    Dissociating: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Dissociating',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Dissociating',
      quantity: 1,
      value: 'Dissociating',
      weight: 0,
    },
    DotnDash: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'DotnDash',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Dot n Dash',
      quantity: 1,
      value: 'DotnDash',
      weight: 0,
    },
    Drunk: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Drunk',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Drunk',
      quantity: 1,
      value: 'Drunk',
      weight: 0,
    },
    Emoticons: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Emoticons',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Emoticons',
      quantity: 1,
      value: 'Emoticons',
      weight: 0,
    },
    Equations: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Equations',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Equations',
      quantity: 1,
      value: 'Equations',
      weight: 0,
    },
    Flow: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Flow',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Flow',
      quantity: 1,
      value: 'Flow',
      weight: 0,
    },
    Flowers: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Flowers',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Flowers',
      quantity: 1,
      value: 'Flowers',
      weight: 0,
    },
    Geolines: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Geolines',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Geolines',
      quantity: 1,
      value: 'Geolines',
      weight: 0,
    },
    Halftone: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Halftone',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Halftone',
      quantity: 1,
      value: 'Halftone',
      weight: 0,
    },
    High: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'High',
      emoji: 'itemBackground',
      equipped: false,
      label: 'High',
      quantity: 1,
      value: 'High',
      weight: 0,
    },
    Leaves: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Leaves',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Leaves',
      quantity: 1,
      value: 'Leaves',
      weight: 0,
    },
    LineLeaves: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'LineLeaves',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Line Leaves',
      quantity: 1,
      value: 'LineLeaves',
      weight: 0,
    },
    LiquidMaze: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'LiquidMaze',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Liquid Maze',
      quantity: 1,
      value: 'LiquidMaze',
      weight: 0,
    },
    Memphis: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Memphis',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Memphis',
      quantity: 1,
      value: 'Memphis',
      weight: 0,
    },
    Mindsets: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Mindsets',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Mindsets',
      quantity: 1,
      value: 'Mindsets',
      weight: 0,
    },
    Musical: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Musical',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Musical',
      quantity: 1,
      value: 'Musical',
      weight: 0,
    },
    Noise: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Noise',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Noise',
      quantity: 1,
      value: 'Noise',
      weight: 0,
    },
    Paisley: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Paisley',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Paisley',
      quantity: 1,
      value: 'Paisley',
      weight: 0,
    },
    Paws: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Paws',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Paws',
      quantity: 1,
      value: 'Paws',
      weight: 0,
    },
    PixelCamo: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'PixelCamo',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Pixel Camo',
      quantity: 1,
      value: 'PixelCamo',
      weight: 0,
    },
    Plaid: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Plaid',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Plaid',
      quantity: 1,
      value: 'Plaid',
      weight: 0,
    },
    Rolling: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Rolling',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Rolling',
      quantity: 1,
      value: 'Rolling',
      weight: 0,
    },
    Safari: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Safari',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Safari',
      quantity: 1,
      value: 'Safari',
      weight: 0,
    },
    Sedated: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Sedated',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Sedated',
      quantity: 1,
      value: 'Sedated',
      weight: 0,
    },
    SpaceIcons: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'SpaceIcons',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Space Icons',
      quantity: 1,
      value: 'SpaceIcons',
      weight: 0,
    },
    Sprinkles: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Sprinkles',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Sprinkles',
      quantity: 1,
      value: 'Sprinkles',
      weight: 0,
    },
    SquareTwist: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'SquareTwist',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Square Twist',
      quantity: 1,
      value: 'SquareTwist',
      weight: 0,
    },
    Squiggles: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Squiggles',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Squiggles',
      quantity: 1,
      value: 'Squiggles',
      weight: 0,
    },
    Stimming: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Stimming',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Stimming',
      quantity: 1,
      value: 'Stimming',
      weight: 0,
    },
    Topography: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Topography',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Topography',
      quantity: 1,
      value: 'Topography',
      weight: 0,
    },
    TriangleOverlap: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'TriangleOverlap',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Triangle Overlap',
      quantity: 1,
      value: 'TriangleOverlap',
      weight: 0,
    },
    Tripping: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Tripping',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Tripping',
      quantity: 1,
      value: 'Tripping',
      weight: 0,
    },
    Waves: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'Waves',
      emoji: 'itemBackground',
      equipped: false,
      label: 'Waves',
      quantity: 1,
      value: 'Waves',
      weight: 0,
    },
    XandO: {
      consumable: false,
      cost: 1000,
      description: 'Background',
      effect: 'background',
      effect_value: 'XandO',
      emoji: 'itemBackground',
      equipped: false,
      label: 'XandO',
      quantity: 1,
      value: 'XandO',
      weight: 0,
    },
  },
  fonts: {
    AbrilFatFace: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'AbrilFatFace',
      emoji: 'itemFont',
      equipped: false,
      label: 'Abril Fatface',
      quantity: 1,
      value: 'AbrilFatFace',
      weight: 0,
    },
    AudioWide: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'AudioWide',
      emoji: 'itemFont',
      equipped: false,
      label: 'Audio Wide',
      quantity: 1,
      value: 'AudioWide',
      weight: 0,
    },
    Barcode: {
      consumable: false,
      cost: 7500,
      description: 'Font',
      effect: 'font',
      effect_value: 'Barcode',
      emoji: 'itemFont',
      equipped: false,
      label: 'Barcode',
      quantity: 1,
      value: 'Barcode',
      weight: 0,
    },
    BlackOpsOne: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'BlackOpsOne',
      emoji: 'itemFont',
      equipped: false,
      label: 'Black Ops One',
      quantity: 1,
      value: 'BlackOpsOne',
      weight: 0,
    },
    CabinSketch: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'CabinSketch',
      emoji: 'itemFont',
      equipped: false,
      label: 'Cabin Sketch',
      quantity: 1,
      value: 'CabinSketch',
      weight: 0,
    },
    Creepster: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Creepster',
      emoji: 'itemFont',
      equipped: false,
      label: 'Creepster',
      quantity: 1,
      value: 'Creepster',
      weight: 0,
    },
    Fascinate: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Fascinate',
      emoji: 'itemFont',
      equipped: false,
      label: 'Fascinate',
      quantity: 1,
      value: 'Fascinate',
      weight: 0,
    },
    FontdinerSwanky: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'FontdinerSwanky',
      emoji: 'itemFont',
      equipped: false,
      label: 'Fontdiner Swanky',
      quantity: 1,
      value: 'FontdinerSwanky',
      weight: 0,
    },
    Graduate: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Graduate',
      emoji: 'itemFont',
      equipped: false,
      label: 'Graduate',
      quantity: 1,
      value: 'Graduate',
      weight: 0,
    },
    IndieFlower: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'IndieFlower',
      emoji: 'itemFont',
      equipped: false,
      label: 'Indie Flower',
      quantity: 1,
      value: 'IndieFlower',
      weight: 0,
    },
    Kablammo: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Kablammo',
      emoji: 'itemFont',
      equipped: false,
      label: 'Kablammo',
      quantity: 1,
      value: 'Kablammo',
      weight: 0,
    },
    KumarOne: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'KumarOne',
      emoji: 'itemFont',
      equipped: false,
      label: 'Kumar One',
      quantity: 1,
      value: 'KumarOne',
      weight: 0,
    },
    LilitaOne: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'LilitaOne',
      emoji: 'itemFont',
      equipped: false,
      label: 'Lilita One',
      quantity: 1,
      value: 'LilitaOne',
      weight: 0,
    },
    Lobster: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Lobster',
      emoji: 'itemFont',
      equipped: false,
      label: 'Lobster',
      quantity: 1,
      value: 'Lobster',
      weight: 0,
    },
    Mogra: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Mogra',
      emoji: 'itemFont',
      equipped: false,
      label: 'Mogra',
      quantity: 1,
      value: 'Mogra',
      weight: 0,
    },
    PressStart2P: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'PressStart2P',
      emoji: 'itemFont',
      equipped: false,
      label: 'Press Start 2P',
      quantity: 1,
      value: 'PressStart2P',
      weight: 0,
    },
    ProtestRevolution: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'ProtestRevolution',
      emoji: 'itemFont',
      equipped: false,
      label: 'Protest Revolution',
      quantity: 1,
      value: 'ProtestRevolution',
      weight: 0,
    },
    ReggaeOne: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'ReggaeOne',
      emoji: 'itemFont',
      equipped: false,
      label: 'Reggae One',
      quantity: 1,
      value: 'ReggaeOne',
      weight: 0,
    },
    RubikGlitch: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'RubikGlitch',
      emoji: 'itemFont',
      equipped: false,
      label: 'Rubik Glitch',
      quantity: 1,
      value: 'RubikGlitch',
      weight: 0,
    },
    Rye: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Rye',
      emoji: 'itemFont',
      equipped: false,
      label: 'Rye',
      quantity: 1,
      value: 'Rye',
      weight: 0,
    },
    Satisfy: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Satisfy',
      emoji: 'itemFont',
      equipped: false,
      label: 'Satisfy',
      quantity: 1,
      value: 'Satisfy',
      weight: 0,
    },
    SedwickAve: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'SedwickAve',
      emoji: 'itemFont',
      equipped: false,
      label: 'Sedwick Ave',
      quantity: 1,
      value: 'SedwickAve',
      weight: 0,
    },
    SpecialElite: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'SpecialElite',
      emoji: 'itemFont',
      equipped: false,
      label: 'Special Elite',
      quantity: 1,
      value: 'SpecialElite',
      weight: 0,
    },
    SpicyRice: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'SpicyRice',
      emoji: 'itemFont',
      equipped: false,
      label: 'Spicy Rice',
      quantity: 1,
      value: 'SpicyRice',
      weight: 0,
    },
    Workbench: {
      consumable: false,
      cost: 700,
      description: 'Font',
      effect: 'font',
      effect_value: 'Workbench',
      emoji: 'itemFont',
      equipped: false,
      label: 'Workbench',
      quantity: 1,
      value: 'Workbench',
      weight: 0,
    },
  },
  general: {
    PremiumMember: {
      consumable: true,
      cost: 25_000,
      description: 'Grants the Premium Member role',
      effect: 'role',
      effect_value: 'PremiumMembership',
      emoji: 'itemPremium',
      equipped: false,
      label: 'Premium Member Role',
      quantity: 1,
      value: 'PremiumMembership',
      weight: 0,
    },
    userflair: {
      consumable: false,
      cost: 1000,
      description: 'User Flair',
      effect: 'userflair',
      effect_value: 'Use /rpg flair to set',
      emoji: 'itemFlair',
      equipped: false,
      label: 'User Flair',
      quantity: 1,
      value: 'userflair',
      weight: 0,
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
  },
} as Record<
  string,
  Record<
    string,
    {
      consumable: boolean;
      cost: number;
      description: string;
      effect: string;
      effect_value: string;
      emoji: string;
      equipped: boolean;
      label: string;
      quantity: number;
      value: string;
      weight: number;
    }
  >
>;

const genome = {
  classes: {
    archer: {
      description: 'A ranged attacker',
      emoji: '🏹',
      label: 'Archer',
      value: 'archer',
    },
    jobless: {
      description: 'A jobless person',
      emoji: '👨‍🌾',
      label: 'No Job',
      value: 'jobless',
    },
    mage: {
      description: 'A powerful spell caster',
      emoji: '🧙',
      label: 'Mage',
      value: 'mage',
    },
    rogue: {
      description: 'A stealthy assassin',
      emoji: '🗡️',
      label: 'Rogue',
      value: 'rogue',
    },
    warrior: {
      description: 'A strong fighter',
      emoji: '⚔️',
      label: 'Warrior',
      value: 'warrior',
    },
  },
  guilds: {
    gryffindor: {
      description: 'Gryffindor guild',
      emoji: '🦁',
      label: 'Gryffindor',
      value: 'gryffindor',
    },
    guildless: {
      description: 'No guild',
      emoji: '🏳️',
      label: 'No Guild',
      value: 'guildless',
    },
    hufflepuff: {
      description: 'Hufflepuff guild',
      emoji: '🦡',
      label: 'Hufflepuff',
      value: 'hufflepuff',
    },
    ravenclaw: {
      description: 'Ravenclaw guild',
      emoji: '🦅',
      label: 'Ravenclaw',
      value: 'ravenclaw',
    },
    slytherin: {
      description: 'Slytherin guild',
      emoji: '🐍',
      label: 'Slytherin',
      value: 'slytherin',
    },
  },
  species: {
    dwarf: {
      description: 'A dwarf',
      emoji: '🪓',
      label: 'Dwarf',
      value: 'dwarf',
    },
    elf: {
      description: 'An elf',
      emoji: '🧝',
      label: 'Elf',
      value: 'elf',
    },
    formless: {
      description: 'A formless being',
      emoji: '👻',
      label: 'No Form',
      value: 'formless',
    },
    human: {
      description: 'A human',
      emoji: '👨',
      label: 'Human',
      value: 'human',
    },
    orc: {
      description: 'An orc',
      emoji: '👹',
      label: 'Orc',
      value: 'orc',
    },
  },
} as Record<
  string,
  Record<
    string,
    {
      default?: boolean;
      description: string;
      emoji: string;
      label: string;
      value: string;
    }
  >
>;

const BetLossMessageList = [
  "Let's just pretend you didn't lose anything.",
  'Thank you for your donation.',
  'You lost your bet, but you gained a friend.',
  'We can still be friends, right?',
  'Perhaps this is a sign that you should stop gambling.',
  'Maybe you should try a different game.',
  "I promise I'll spend it wisely.",
  "I hope you didn't need that.",
  "I'm sure you'll win it back...",
  'There is probably a better way to spend your money.',
  "I'm sure you can find some more under the couch cushions...",
  'Sheeeeeesh...',
  'Sometimes you win, sometimes you lose.',
  'It is what it is.',
  "That's just how the cookie crumbles.",
  'I promise the odds are perfectly fair!.',
  'Perhaps it is time to take a break.',
  "I hope you're ok with eating ramen",
  "I hope you're not too upset.",
  'Was it rigged? Who knows!',
  "I triple checked the math, and can confirm you're just unlucky.",
  'At least your wallet is a bit easier to carry now.',
  "I'll pretend I didn't see that.",
  "I promise I won't tell anyone.",
  'Tip: Try not to lose next time.',
];

const BetWinMessageList = [
  'Free lunch!',
  'Wowee!',
  "I'm jealous!",
  'I hope you spend it wisely.',
  "Looks like you're having lobster tonight!",
  'Someone is feeling lucky!',
  'Congratulations!',
  'Gee whiz!',
  'Time to party!',
  'Today is your lucky day!',
  "You're gonna spend it wisely, right?",
  "You're gonna buy me something nice, right?",
  'Luck? Skill? Who knows!',
  'Sometimes chance favors the prepared mind.',
  "A.K.A. you're a lucky soul.",
  'Free money!',
  "It's a Christmas miracle!",
  "You're going to need a bigger wallet.",
  "I'm so glad we could witness this special moment together.",
  'Yippee!',
];

const text = {
  dungeon: [
    "You voyaged to fight the evil wizard in the dark tower!\nBut they're just misunderstood and enjoy earth tones.\nThey appreciate the visit and gave you **{tokens} tokens **for your troubles.",
    'You were tasked with killing a dragon that has looted the countryside!\nBut it was only feeding its baby dragon.\nYou taught the dragon how to farm and it gave you **{tokens} Tokens.**',
    'You attempted to subdue the ogre known for assaulting people!\nBut it turns out they just hug too hard.\nYou taught them about personal boundaries and they gave you **{tokens} Tokens.**',
    'You went to the local cave to fight the goblin king!\nBut it turns out he was just a goblin who wanted to be king.\nYou taught him about democracy and he gave you **{tokens} Tokens.**',
    'You journey to the dark forest to fight the evil witch!\nBut they turn out to be a gardner with too much property.\nYou taught her about landscapers and she gave you **{tokens} Tokens.**',
  ],
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
    "You find a lost cat and return it to its owner.\nThe cat coughs up a hairball.\nOh, that's actually **{tokens} tokens!**\nYou wipe them off and pocket them.",
    'You find a lost dog and return it to its owner.\nThe dog looks into your eyes and you feel a connection to their soul.\nYour pocket feels **{tokens} tokens **heavier.',
    'You find a lost bird and return it to its owner.\nThe bird gives you a really cool feather.\nYou trade the feather to some kid for **{tokens} tokens.**',
    'You find a lost fish and return it to its owner.\nHow do you lose a fish?\nYou decide not to ask and leave with your **{tokens} tokens **as soon as you can.',
    'You borrow a metal detector and find a lost ring.\nYou return the ring to its owner and they are so grateful they give you **{tokens} tokens.**',
    "You find someone worried that their pill could be dangerous.\nYou use one of your fentanyl strips to make sure they can rule that out!\nThey're so grateful they give you **{tokens} tokens.**",
    'Someone asks if you can help make sure their bag of powder is what they think it is.\nYou use your test kit to help identify for them and they give you **{tokens} tokens **for keeping them safe.',
    'You happen upon along with wide pupils and sweating in a t-shirt.\nAfter an enthusiastic conversation that has no point you give them some gatorade that they down almost instantly.\nThey hug you and slip **{tokens} tokens **into your pocket.',
    'You do some hunting and bring back some food for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You go fishing and bring back some food for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You go mining and bring back some ore for the town.\nThe town gives you **{tokens} tokens **for your troubles.',
    'You help build a new house in the town.\nThe town gives you **{tokens} tokens **for your troubles.',
  ],
};

export type GameName = 'Blackjack' | 'Coinflip' | 'Roulette' | 'Slots';

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const wagers = {} as Record<
  string,
  {
    gameName: GameName;
    tokens: number;
  }
>;

export async function getNewTimer(seconds: number) {
  const currentDate = new Date();
  return new Date(currentDate.getTime() + seconds * 1000);
}

export async function rpgArcade(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  return {
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        customButton(
          `rpgCoinFlip,user:${interaction.user.id}`,
          'CoinFlip',
          'buttonCoinflip',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRoulette,user:${interaction.user.id}`,
          'Roulette',
          'buttonRoulette',
          ButtonStyle.Secondary,
        ),
        // customButton(`rpgBlackjack,user:${interaction.user.id}`, 'Blackjack', '🃏', ButtonStyle.Primary),
        // customButton(`rpgSlots,user:${interaction.user.id}`, 'Slots', '🎰', ButtonStyle.Primary),
        customButton(
          `rpgTown,user:${interaction.user.id}`,
          'Town',
          'buttonTown',
          ButtonStyle.Primary,
        ),
      ),
    ],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonArcade')} Arcade`)
        .setDescription(
          stripIndents`
        You ${rand(text.enter)} the arcade and see a variety of games.

        ***More games coming soon!***
      `,
        )
        .setColor(Colors.Green),
    ],
  };
}

export async function rpgArcadeAnimate(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
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
    await (interaction as MessageComponentInteraction).editReply({
      components: [],
      content: 'https://media.tenor.com/tewn7lzVDgcAAAAC/coin-flip-flip.gif',
      embeds: [],
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
    await (interaction as MessageComponentInteraction).editReply({
      components: [],
      content: 'https://media2.giphy.com/media/1DEJwfwdknKZq/giphy.gif',
      embeds: [],
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
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  gameName: GameName,
  choice?:
    | '0'
    | '1-12'
    | '13-24'
    | '25-36'
    | 'black'
    | 'evens'
    | 'first'
    | 'heads'
    | 'high'
    | 'low'
    | 'odds'
    | 'red'
    | 'second'
    | 'tails'
    | 'third',
  message?: string,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // log.debug(F, `Started rpgArcadeGame(${gameName}, ${choice}, ${message})`);
  const gameData = {
    Coinflip: {
      bets: [
        customButton(
          `rpgCoinflipHeads,user:${interaction.user.id}`,
          'Heads',
          'buttonHeads',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgCoinflipTails,user:${interaction.user.id}`,
          'Tails',
          'buttonTails',
          ButtonStyle.Secondary,
        ),
      ],
      gameName: 'Coinflip' as GameName,
      instructions: stripIndents`**How to play**
    - Set a bet amount using the buttons below
    - You can bet any amount by using a button more than once
    - Choose heads or tails to flip the coin

    - If you win, you get the amount you bet
    - If you lose, you lose the amount you bet`,
      object: 'coin',
      options: ['heads', 'tails'],
    },
    Roulette: {
      bets: [
        customButton(
          `rpgRouletteRed,user:${interaction.user.id}`,
          'Red',
          'buttonHalf',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteBlack,user:${interaction.user.id}`,
          'Black',
          'buttonHalf',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteFirst,user:${interaction.user.id}`,
          'First Row',
          'buttonRows',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteSecond,user:${interaction.user.id}`,
          'Second Row',
          'buttonRows',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteThird,user:${interaction.user.id}`,
          'Third Row',
          'buttonRows',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteEven,user:${interaction.user.id}`,
          'Even',
          'buttonBoxB',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteOdd,user:${interaction.user.id}`,
          'Odd',
          'buttonBoxA',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRoulette1to12,user:${interaction.user.id}`,
          '1-12',
          'menuNormal',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRoulette13to24,user:${interaction.user.id}`,
          '13-24',
          'menuHard',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRoulette25to36,user:${interaction.user.id}`,
          '25-36',
          'menuExpert',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteZero,user:${interaction.user.id}`,
          '0',
          'menuEasy',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteHigh,user:${interaction.user.id}`,
          'High',
          'buttonUpDown',
          ButtonStyle.Secondary,
        ),
        customButton(
          `rpgRouletteLow,user:${interaction.user.id}`,
          'Low',
          'buttonUpDown',
          ButtonStyle.Secondary,
        ),
      ],
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
      options: [
        '00',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        '11',
        '12',
        '13',
        '14',
        '15',
        '16',
        '17',
        '18',
        '19',
        '20',
        '21',
        '22',
        '23',
        '24',
        '25',
        '26',
        '27',
        '28',
        '29',
        '30',
        '31',
        '32',
        '33',
        '34',
        '35',
        '36',
      ],
    },
  };

  const emojiName = `button${gameName}`;

  const { instructions } = gameData[gameName as keyof typeof gameData];

  const rowWagers = new ActionRowBuilder<ButtonBuilder>().addComponents(
    customButton(
      `rpgWager1,user:${interaction.user.id}`,
      'Bet 1',
      'buttonBetSmall',
      ButtonStyle.Success,
    ),
    customButton(
      `rpgWager10,user:${interaction.user.id}`,
      'Bet 10',
      'buttonBetMedium',
      ButtonStyle.Success,
    ),
    customButton(
      `rpgWager100,user:${interaction.user.id}`,
      'Bet 100',
      'buttonBetLarge',
      ButtonStyle.Success,
    ),
    customButton(
      `rpgWager1000,user:${interaction.user.id}`,
      'Bet 1000',
      'buttonBetHuge',
      ButtonStyle.Success,
    ),
    customButton(
      `rpgArcade,user:${interaction.user.id}`,
      'Arcade',
      'buttonArcade',
      ButtonStyle.Primary,
    ),
  );

  const { bets } = gameData[gameName as keyof typeof gameData];

  const rowBetsA = new ActionRowBuilder<ButtonBuilder>().addComponents(...bets.slice(0, 5));

  const rowBetsB = new ActionRowBuilder<ButtonBuilder>().addComponents(...bets.slice(5, 10));

  const rowBetsC = new ActionRowBuilder<ButtonBuilder>().addComponents(...bets.slice(10, 15));

  const rowBetsD = new ActionRowBuilder<ButtonBuilder>().addComponents(...bets.slice(15, 20));

  // log.debug(F, `rowWagers: ${JSON.stringify(rowWagers, null, 2)}`);
  // log.debug(F, `rowBetsA: ${JSON.stringify(rowBetsA, null, 2)}`);

  const components = [rowWagers, rowBetsA];
  if (rowBetsB.components.length > 0) {
    components.push(rowBetsB);
  }
  if (rowBetsC.components.length > 0) {
    components.push(rowBetsC);
  }
  if (rowBetsD.components.length > 0) {
    components.push(rowBetsD);
  }

  // log.debug(F, `components: ${JSON.stringify(components, null, 2)}`);

  if (!wagers[interaction.user.id]) {
    wagers[interaction.user.id] = {
      gameName,
      tokens: 0,
    };
  }

  if (wagers[interaction.user.id].gameName !== gameName) {
    wagers[interaction.user.id] = {
      gameName,
      tokens: 0,
    };
  }

  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  // log.debug(F, `personaData (Coinflip): ${JSON.stringify(personaData, null, 2)}`);

  const currentBet = wagers[interaction.user.id].tokens;
  // log.debug(F, `currentBet: ${currentBet}`);

  // log.debug(F, `choice: ${choice}`);
  if (choice && currentBet === 0) {
    // await (interaction as MessageComponentInteraction).editReply(noBetError);
    return {
      components,
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(gameName)
          .setDescription(
            stripIndents`
          **You can't start a game without first placing a bet!**

          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
        `,
          )
          .setColor(Colors.Gold),
      ],
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
      if (result === choice) {
        payout = currentBet;
      }
    } else if (gameName === 'Roulette') {
      const number = Number.parseInt(result, 10);
      if (choice === '0' && number === 0) {
        payout = currentBet * 17;
      } else if ((choice === 'red' || choice === 'evens') && number % 2 === 0) {
        payout = currentBet;
      } else if ((choice === 'black' || choice === 'odds') && number % 2 !== 0) {
        payout = currentBet;
      } else if (choice === 'high' && number > 18) {
        payout = currentBet;
      } else if (choice === 'low' && number < 18) {
        payout = currentBet;
      } else if (choice === '1-12' && number < 13) {
        payout = currentBet * 2;
      } else if (choice === '13-24' && number > 12 && number < 25) {
        payout = currentBet * 2;
      } else if (choice === '25-36' && number > 24) {
        payout = currentBet * 2;
      } else if (
        choice === 'first' &&
        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34].includes(number)
      ) {
        payout = currentBet * 2;
      } else if (
        choice === 'second' &&
        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35].includes(number)
      ) {
        payout = currentBet * 2;
      } else if (
        choice === 'third' &&
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36].includes(number)
      ) {
        payout = currentBet * 2;
      }
    }

    // log.debug(F, `result: ${result}`);

    if (payout !== 0) {
      // The user won
      const BetOutcomeMessage =
        BetWinMessageList[Math.floor(Math.random() * BetWinMessageList.length)];
      personaData.tokens += payout;
      await db.personas.upsert({
        create: personaData,
        update: personaData,
        where: {
          user_id: userData.id,
        },
      });

      wagers[interaction.user.id] = {
        gameName,
        tokens: 0,
      };
      return {
        components,
        content: null,
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setFooter({
              iconURL: (interaction.member as GuildMember).displayAvatarURL(),
              text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
            })
            .setTitle(`${emojiGet(emojiName)} ${gameName}`)
            .setDescription(
              stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You won ${payout} tokens!**
            *${BetOutcomeMessage}*

            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `,
            )
            .setColor(Colors.Gold),
        ],
      };
    }
    // The user lost
    const BetOutcomeMessage =
      BetLossMessageList[Math.floor(Math.random() * BetLossMessageList.length)];
    personaData.tokens -= currentBet;
    await db.personas.upsert({
      create: personaData,
      update: personaData,
      where: {
        user_id: userData.id,
      },
    });
    wagers[interaction.user.id] = {
      gameName,
      tokens: 0,
    };
    return {
      components,
      content: null,
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(`${emojiGet(emojiName)} ${gameName}`)
          .setDescription(
            stripIndents`
            The ${object} came up **${result}** and you chose **${choice}**!

            **You lost ${currentBet} tokens!**
            *${BetOutcomeMessage}*

            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
          `,
          )
          .setColor(Colors.Grey),
      ],
    };
  }

  // The user has clicked the market button, send them the market embed
  if (currentBet !== 0) {
    // log.debug(F, 'No choice made, but a bet was made, return the bet screen');
    return {
      components,
      content: null,
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(`${emojiGet(emojiName)} ${gameName}`)
          .setDescription(
            stripIndents`${message ?? ''}
          You are betting ${currentBet} tokens.

          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
        `,
          )
          .setColor(Colors.Green),
      ],
    };
  }

  return {
    components,
    content: null,
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet(emojiName)} ${gameName}`)
        .setDescription(
          stripIndents`You start a game of ${gameName}.

        ${instructions}

        ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}
      `,
        )
        .setColor(Colors.Green),
    ],
  };
}

export async function rpgArcadeWager(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  let newBet = wagers[interaction.user.id] ? wagers[interaction.user.id].tokens : 0;
  const bet = Number.parseInt(interaction.customId.slice(8), 10);
  newBet += bet || 0;

  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  if (personaData.tokens < newBet) {
    const notEnough = "**You don't have enough to bet that much**\n";
    return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName, undefined, notEnough);
  }

  wagers[interaction.user.id].tokens = newBet;

  return rpgArcadeGame(interaction, wagers[interaction.user.id].gameName);
}

export async function rpgBounties(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  command: 'dungeon' | 'quest' | 'raid' | null,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // log.debug(F, `Persona inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  const rowBounties = new ActionRowBuilder<ButtonBuilder>().addComponents(
    customButton(
      `rpgQuest,user:${interaction.user.id}`,
      'Quest',
      'buttonQuest',
      ButtonStyle.Secondary,
    ),
    customButton(
      `rpgDungeon,user:${interaction.user.id}`,
      'Dungeon',
      'buttonDungeon',
      ButtonStyle.Secondary,
    ),
    customButton(
      `rpgRaid,user:${interaction.user.id}`,
      'Raid',
      'buttonRaid',
      ButtonStyle.Secondary,
    ),
    customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
  );

  const contracts = {
    dungeon: {
      fail: {
        color: Colors.Red,
        description: stripIndents`
          You already cleared a dungeon today, you're still tired and need to prepare.
        `,
        title: `${emojiGet('buttonDungeon')} Dungeon Fail (Daily)`,
      },
      success: {
        color: Colors.Green,
        description: stripIndents`${rand(text.dungeon)}`,
        title: `${emojiGet('buttonDungeon')} Dungeon Success (Daily)`,
      },
    },
    quest: {
      fail: {
        color: Colors.Red,
        description: stripIndents`
          There are no more quests available at the moment. New quests are posted every hour!
        `,
        title: `${emojiGet('buttonQuest')} Quest Fail (Hourly)`,
      },
      success: {
        color: Colors.Green,
        description: stripIndents`${rand(text.quest)}`,
        title: `${emojiGet('buttonQuest')} Quest Success (Hourly)`,
      },
    },
    raid: {
      fail: {
        color: Colors.Red,
        description: stripIndents`
          You've already raided Moonbear's office this week, give them a break!
        `,
        title: `${emojiGet('buttonRaid')} Raid Fail (Weekly)`,
      },
      success: {
        color: Colors.Green,
        description: stripIndents`
          You stormed into Moonbear's office, rustle their jimmies and stole {tokens} TripTokens!
        `,
        title: `${emojiGet('buttonRaid')} Raid Success (Weekly)`,
      },
    },
  };

  const allResetTimes: Record<string, Date> = {
    dungeon: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(0, 0, 0, 0)),
    quest: new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)),
    raid: new Date(
      new Date(getLastMonday(new Date()).getTime() + 7 * 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0),
    ),
  };

  // If the command is not null, we need to check the respective reset time
  if (command !== null) {
    const databaseKey = `last_${command}`;
    const lastBounties = personaData[databaseKey as 'last_dungeon' | 'last_quest' | 'last_raid']!;
    let timeout = false;

    if (lastBounties) {
      // Check if the user has already completed the bounty type today, hourly, or weekly
      const currentDate = new Date();

      const timeComparison = {
        dungeon: () => lastBounties.getDate() === currentDate.getDate(),
        quest: () => lastBounties.getHours() === currentDate.getHours(),
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
        components: [rowBounties],
        embeds: [
          embedTemplate()
            .setAuthor(null)
            .setFooter({
              iconURL: (interaction.member as GuildMember).displayAvatarURL(),
              text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
            })
            .setTitle(contracts[command].fail.title)
            .setDescription(
              stripIndents`${contracts[command].fail.description}
            ${resetTimesMessage}
            ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`,
            )
            .setColor(contracts[command].fail.color),
        ],
      };
    }

    // Process tokens and other logic here...
    let tokens = 10;
    if (command === 'dungeon') {
      tokens = 50;
    } else if (command === 'raid') {
      tokens = 100;
    }

    let tokenMultiplier = inventoryData
      .filter((item) => item.effect === 'tokenMultiplier')
      .reduce((accumulator, item) => accumulator + Number.parseFloat(item.effect_value), 1);

    // Check for roles and adjust multiplier
    const member = await interaction.guild?.members.fetch(interaction.user.id);
    if (member?.roles.cache.has(env.ROLE_BOOSTER) || member?.roles.cache.has(env.ROLE_PATRON)) {
      tokenMultiplier += 0.1;
    }

    tokenMultiplier = Math.round(tokenMultiplier * 10) / 10;
    tokens *= tokenMultiplier;

    if (env.NODE_ENV === 'development') {
      tokens *= 10;
    }

    tokens = Math.round(tokens);

    // Award tokens to the user
    personaData.tokens += tokens;
    personaData[databaseKey as 'last_dungeon' | 'last_quest' | 'last_raid'] = new Date();

    await db.personas.upsert({
      create: personaData,
      update: personaData,
      where: {
        id: personaData.id,
      },
    });

    return {
      components: [rowBounties],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(contracts[command].success.title)
          .setDescription(
            stripIndents`${contracts[command].success.description.replace('{tokens}', tokens.toString())}
          ${resetTimesMessage}
          ${emojiGet('buttonBetSmall')} **Wallet:** ${personaData.tokens}`,
          )
          .setColor(contracts[command].success.color),
      ],
    };
  }

  return {
    components: [rowBounties],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonBounties')} Bounties`)
        .setDescription(
          stripIndents`
      You are at the bounty board, you can go on a quest, clear a dungeon, or go on a raid.
    `,
        )
        .setColor(Colors.Green),
    ],
  };
}

export async function rpgFlair(interaction: ChatInputCommandInteraction) {
  // First check if the flair contains a @mention
  let newFlair = interaction.options.getString('flair')!;
  // log.debug(F, `newFlair: ${newFlair}`);
  const mentionRegex = /<@!?\d{18,}>/g;
  const mentions = newFlair.match(mentionRegex);
  log.debug(F, `mentions: ${mentions}`);
  // If the flair contains a mention, check if the user has mod permissions
  const member = await interaction.guild?.members.fetch(interaction.user.id);

  // If they are a mod, update the user mentioned's flair
  if (mentions && member?.roles.cache.has(env.ROLE_MODERATOR)) {
    const targetId = mentions[0].replaceAll(/[^0-9]/g, '');
    // log.debug(F, `targetId: ${targetId}`);
    const targetMember = await interaction.guild?.members.fetch(targetId);
    // Remove the mention from the flair and the space after the mention
    newFlair = newFlair.replaceAll(mentionRegex, '').replace(' ', '');
    // log.debug(F, `targetMember: ${JSON.stringify(targetMember, null, 2)}`);
    if (targetMember) {
      // Run rpgFlairAccept for the target member
      const targetInteraction = interaction as unknown as MessageComponentInteraction;
      targetInteraction.user = targetMember?.user;

      return rpgFlairAccept(targetInteraction, newFlair);
    }
  } else if (mentions) {
    // If they are not a mod, send an error message
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setTitle(`${emojiGet('itemFlair')} Flair Error`)
          .setDescription(
            stripIndents`
        You cannot use a mention in your flair!`,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // Check that the user owns the flair item
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // Get the flair item
  const flairItem = inventoryData.find((index) => index.effect === 'userflair');

  // If the user does not own the flair item, send them an error message
  if (!flairItem) {
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Error`)
          .setDescription(
            stripIndents`
        You don't own the flair item! You can buy it in the \`/rpg market\`.`,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // If the chosen flair is too long, send an error message
  if (newFlair.length > 50) {
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
          .setDescription(
            stripIndents`
        Your flair is too long! Please keep it under 50 characters.`,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // If the user does own the flair item, get the old flair and continue
  const oldFlair = flairItem.effect_value;

  let aiApproved = 'rejected';

  let adjustmentReason = 'No reason given';

  // Query the AI for approval
  const aiPersona = await db.ai_personas.upsert({
    create: {
      ai_model: 'GPT_3_5_TURBO',
      created_by: userData.id,
      frequency_penalty: 0,
      max_tokens: 500,
      name: 'FlairMod',
      presence_penalty: 0,
      prompt: `You are acting as a moderation API. You will receive an input that a user wants to set as their user flair text.

      Drug references and jokes and adult humour are allowed as long as they are not extremely vulgur or offensive. You can swap any very rude words with more PG rated family friendly ones. If there are no alternative words, reject the flair.
      
      After that, adjust it to correct spelling, grammar and such. Made up words are allowed unless they are obvious misspellings, but no random keyboard gibberish (EG. ALRJRBSIEIR)
      
      IMPORTANT! You must correct capitalisation so that the flair fits headline capitalisation rules (every word should be capitalised except short words like "i love going to the supermarket" becomes "I Love Going to the Supermarket")
      
      You must reply with this strict format:
      Status: Approved, Adjusted, Rejected
      Reason: Spelling, grammar, etc
      Adjusted: The new edited flair, or the original flair if nothing was changed or adjusted`,
      public: false,
    },
    update: {},
    where: {
      name: 'FlairMod',
    },
  });

  const messageList = [
    {
      content: newFlair,
      role: 'user',
    },
  ] as OpenAI.Chat.ChatCompletionMessageParam[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { completionTokens, promptTokens, response } = await aiFlairModule(aiPersona, messageList);
  log.debug(F, `aiResponse: ${JSON.stringify(response, null, 2)}`);

  // Regex to see the approval status
  if (/Status: Approved/g.test(response)) {
    aiApproved = 'approved';
  } else if (/Status: Adjusted/g.test(response)) {
    aiApproved = 'adjusted';
  } else if (/Status: Rejected/g.test(response)) {
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
      create: flairItem,
      update: flairItem,
      where: {
        id: flairItem.id,
      },
    });
    // Send the user a confirmation message
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Updated`)
          .setDescription(
            stripIndents`
        Your flair has been updated!

        **Old flair:** ${oldFlair}
        **New flair:** ${newFlair}`,
          )
          .setColor(Colors.Green),
      ],
    };
  }

  // If the flair needed to be adjusted, ask the user if they want to use the adjusted flair
  // Also check if the flair was set as approved but the flair is actually different than what the user entered
  if (
    (aiApproved === 'adjusted' || newFlair.toLowerCase() !== aiAdjusted?.toLowerCase()) &&
    aiApproved !== 'rejected'
  ) {
    // If the flair is null, send an error message
    if (!aiAdjusted) {
      return {
        embeds: [
          embedTemplate()
            .setAuthor(null)
            // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
            .setTitle(`${emojiGet('itemFlair')} Flair Error`)
            .setDescription(
              stripIndents`
        Oops!

        Something went wrong with TripBot's AI.

        Please try again later or contact a moderator to have your flair manually reviewed.`,
            )
            .setColor(Colors.Red),
        ],
      };
    }
    // Regex to get the reason for adjustment from the AI response where it says "Reason: "
    // If it doesn't exist, set it to "No reason given"
    adjustmentReason =
      response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') || 'No reason given';
    // log.debug(F, `adjustmentReason: ${adjustmentReason}`);

    return {
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          customButton(
            `rpgFlairAccept,user:${interaction.user.id}`,
            'Accept',
            'buttonAccept',
            ButtonStyle.Success,
          ),
          customButton(
            `rpgFlairDecline,user:${interaction.user.id}`,
            'Reject',
            'buttonQuit',
            ButtonStyle.Danger,
          ),
        ),
      ],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Adjusted`)
          .setDescription(
            stripIndents`

        Your flair has been adjusted by TripBot to meet our guidelines.

        **Original:** ${newFlair}
        **TripBot Adjusted:** ${aiAdjusted}

        **Adjustment Reason:** ${adjustmentReason}
        
        Please confirm that you want to use the adjusted flair, or try something else.`,
          )
          .setColor(Colors.Gold),
      ],
    };
  }

  if (aiApproved === 'rejected') {
    adjustmentReason =
      response.match(/Reason: (.*)/g)?.[0].replace('Reason: ', '') || 'No reason given';

    // Send the user a rejection message
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
          .setDescription(
            stripIndents`
        Your flair has been rejected by TripBot.
        
        **Rejection Reason:** ${adjustmentReason}
        
        Please try something else.`,
          )
          .setColor(Colors.Red),
      ],
    };
  }

  // If this code runs, something went wrong with TripBot's AI
  return {
    embeds: [
      embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Error`)
        .setDescription(
          stripIndents`
      Oops!

      Something went wrong with TripBot's AI.

      Please try again later or contact a moderator to have your flair manually reviewed.`,
        )
        .setColor(Colors.Red),
    ],
  };
}

export async function rpgFlairAccept(
  interaction: MessageComponentInteraction,
  overrideFlair: string,
): Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });

  // Get the existing inventory data
  let inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  // Get the flair item
  let flairItem = inventoryData.find((index) => index.effect === 'userflair');
  // If the user does not own the flair item, give it to them (this could only ever be triggered by a mod)
  if (!flairItem) {
    const newItem = {
      consumable: false,
      cost: 1000,
      description: 'User Flair',
      effect: 'userflair',
      effect_value: 'Use /rpg flair to set',
      emoji: 'itemFlair',
      equipped: true,
      label: 'User Flair',
      persona_id: personaData.id,
      quantity: 1,
      value: 'userflair',
      weight: 0,
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
    flairItem = inventoryData.find((index) => index.effect === 'userflair');
  }

  // If there still isn't a flair item, send an error embed
  if (!flairItem) {
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Error`)
          .setDescription(
            stripIndents`
        Oops!
        Something went wrong.`,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // Get the old flair and the new flair
  const oldFlair = flairItem.effect_value;
  let newFlair = '';
  newFlair = overrideFlair
    ? overrideFlair
    : interaction.message.embeds[0].description?.split('**TripBot Adjusted:** ')[1].split('\n')[0]!;
  // If the flair is null, send an error embed
  if (!newFlair) {
    return {
      embeds: [
        embedTemplate()
          .setAuthor(null)
          // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
          .setTitle(`${emojiGet('itemFlair')} Flair Error`)
          .setDescription(
            stripIndents`
        Oops!
        Something went wrong.
        Please try again later or contact a moderator to have your flair manually reviewed.`,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // Update the flair
  flairItem.effect_value = newFlair;
  await db.rpg_inventory.upsert({
    create: flairItem,
    update: flairItem,
    where: {
      id: flairItem.id,
    },
  });
  // If overriding, also set the flair's equipped to true
  if (overrideFlair) {
    flairItem.equipped = true;
    await db.rpg_inventory.upsert({
      create: flairItem,
      update: flairItem,
      where: {
        id: flairItem.id,
      },
    });
  }

  // Send the user a confirmation message
  return {
    components: [],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Updated`)
        .setDescription(
          stripIndents`
      Your flair has been updated!

      **Old flair:** ${oldFlair}
      **New flair:** ${newFlair}`,
        )
        .setColor(Colors.Green),
    ],
  };
}

export async function rpgFlairDecline(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Send them the rejection message
  return {
    components: [],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        // .setFooter({ text: `${interaction.member?.displayName}'s TripSit RPG (BETA)`, iconURL: interaction.member?.displayAvatarURL() })
        .setTitle(`${emojiGet('itemFlair')} Flair Rejected`)
        .setDescription(
          stripIndents`
      You rejected TripBot's adjusted flair.

      Your flair has not been updated.
      
      If you believe TripBot made an error, please try again or contact a moderator for manual approval.`,
        )
        .setColor(Colors.Red),
    ],
  };
}

export async function rpgHelp(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  return {
    components: [
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        customButton(
          `rpgTown,user:${interaction.user.id}`,
          'Town',
          'buttonTown',
          ButtonStyle.Primary,
        ),
      ),
    ],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonHelp')} Help`)
        .setDescription(
          stripIndents`
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
      `,
        )
        .setColor(Colors.Blue),
    ],
  };
}

export async function rpgHome(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
  message: string,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  const { homeInventory, personaInventory, personaTokens } = await rpgHomeInventory(interaction);

  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
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
  const equippedBackground = inventoryData.find(
    (item) => item.equipped && item.effect === 'background',
  );
  // log.debug(F, `equippedBackground: ${JSON.stringify(equippedBackground, null, 2)} `);
  if (equippedBackground) {
    defaultOption = equippedBackground.value;
  }
  // log.debug(F, `defaultOption1: ${defaultOption} `);

  // Get the item the user selected
  if (interaction.isButton()) {
    const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
    const backgroundComponent = row.components[0];
    if ((backgroundComponent as StringSelectMenuComponent).options) {
      const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
        (o: APISelectMenuOption) => o.default === true,
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
  const filteredItems = Object.values(homeInventory).filter((item) => item.value !== defaultOption);

  // Reset the options menu to be empty
  const backgroundMenu = new StringSelectMenuBuilder()
    .setCustomId(`rpgBackgroundSelect,user:${interaction.user.id}`)
    .setPlaceholder('Select an item to use')
    .setOptions(filteredItems);

  // Get the item the user chose and display that as the default option
  let backgroundData = {} as {
    consumable: boolean;
    cost: number;
    description: string;
    effect: string;
    effect_value: string;
    emoji: string;
    equipped: boolean;
    label: string;
    quantity: number;
    value: string;
    weight: number;
  };
  const chosenItem = homeInventory.find((item) => item.value === defaultOption);
  let sellPrice = 0;
  const equipped = inventoryData.find((item) => item.value === chosenItem?.value)?.equipped!;
  let equippedButtonText = 'Equip';
  if (equipped) {
    equippedButtonText = 'Equipped';
  }

  if (chosenItem) {
    chosenItem.default = true;
    backgroundMenu.addOptions(chosenItem);
    // log.debug(F, `items.backgrounds: ${JSON.stringify(items.backgrounds, null, 2)}`);
    // convert the emoji property into an emoji using emojiGet
    const allItems = [
      ...Object.values(items.general),
      ...Object.values(items.fonts),
      ...Object.values(items.backgrounds),
    ].map((item) => {
      const newItem = item;
      newItem.emoji = `<:${emojiGet('itemBackground').identifier}>`;
      return item;
    });
    // log.debug(F, `allItems: ${JSON.stringify(allItems, null, 2)}`);
    backgroundData = allItems.find((item) => item.value === chosenItem?.value) as {
      consumable: boolean;
      cost: number;
      description: string;
      effect: string;
      effect_value: string;
      emoji: string;
      equipped: boolean;
      label: string;
      quantity: number;
      value: string;
      weight: number;
    };
    sellPrice = allItems.find((item) => item.value === chosenItem?.value)?.cost! / 4;
    log.debug(F, `equipped: ${equipped}`);
    log.debug(F, `sellPrice: ${sellPrice}`);
    // log.debug(F, `backgroundData (home change): ${JSON.stringify(backgroundData, null, 2)}`);
  }
  log.debug(F, `chosenItem: ${JSON.stringify(chosenItem, null, 2)}`);

  // Set the item row
  const rowBackgrounds = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    backgroundMenu,
  );

  // log.debug(F, `backgroundData (home change): ${JSON.stringify(backgroundData, null, 2)}`);
  // log.debug(F, `Button home: ${JSON.stringify(emojiGet('buttonHome'), null, 2)}`);
  // Build the embed
  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({
      iconURL: (interaction.member as GuildMember).displayAvatarURL(),
      text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
    })
    .setTitle(`${emojiGet('buttonHome')} Home`)
    .setDescription(
      stripIndents`${message === null ? '' : message}

      You ${rand(text.enter)} your home.
      
      You can equip an item by selecting it from the menu below.

      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}

      ${personaInventory}
    `,
    )
    .setColor(Colors.Purple);

  // If the select item has the 'background' effect, add the image to the embed
  const files = [] as AttachmentBuilder[];

  if (
    interaction.isStringSelectMenu() &&
    backgroundData &&
    backgroundData.effect === 'background'
  ) {
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
  const rowHome = new ActionRowBuilder<ButtonBuilder>().addComponents(
    // customButton(`rpgName,user:${interaction.user.id}`, 'Name', '📝', ButtonStyle.Primary),
    // customButton(`rpgAccept,user:${interaction.user.id}`, 'Accept', 'buttonAccept', ButtonStyle.Success),
    // customButton(`rpgDecline,user:${interaction.user.id}`, 'Decline', 'buttonQuit', ButtonStyle.Danger),
    customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
  );

  // if item is not equipped, show equip button

  if (chosenItem && !equipped) {
    rowHome.addComponents(
      customButton(
        `rpgAccept,user:${interaction.user.id}`,
        equippedButtonText,
        'buttonAccept',
        ButtonStyle.Success,
      ).setDisabled(equipped),
      customButton(
        `rpgSell,user:${interaction.user.id}`,
        `Sell +${sellPrice} TT$`,
        'buttonBetHuge',
        ButtonStyle.Danger,
      ),
    );
  } else if (chosenItem && equipped) {
    // else show unequip button
    rowHome.addComponents(
      customButton(
        `rpgDecline,user:${interaction.user.id}`,
        'Unequip',
        'buttonQuit',
        ButtonStyle.Danger,
      ),
      customButton(
        `rpgSell,user:${interaction.user.id}`,
        `Sell +${sellPrice} TT$`,
        'buttonBetHuge',
        ButtonStyle.Danger,
      ),
    );
  }

  // If the user has backgrounds, add the backgrounds row
  const components = backgroundMenu.options.length === 0 ? [rowHome] : [rowBackgrounds, rowHome];

  return {
    components,
    embeds: [embed],
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
): Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  // If the user confirms the information, save the persona information
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const backgroundComponent = row.components[0];
  const selectedItem = (backgroundComponent as StringSelectMenuComponent).options.find(
    (o: APISelectMenuOption) => o.default === true,
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
  const chosenItem = inventoryData.find((item) => item.value === selectedItem?.value);
  // Find the item type from inventoryData
  // const itemType = inventoryData.find(item => item.value === selectedItem?.value)?.effect;

  // Equip the item
  if (chosenItem) {
    chosenItem.equipped = true;
    // await inventorySet(chosenItem);
    await db.rpg_inventory.upsert({
      create: chosenItem,
      update: chosenItem,
      where: {
        id: chosenItem.id,
      },
    });
  } else {
    log.error(F, `Item not found in inventory: ${JSON.stringify(chosenItem, null, 2)}`);
  }

  // Un-equip all other backgrounds
  const otherItems = inventoryData.filter(
    (item) => item.effect === 'background' && item.value !== selectedItem?.value,
  );
  otherItems.forEach(async (item) => {
    const newItem = item;
    newItem.equipped = false;
    await db.rpg_inventory.upsert({
      create: newItem,
      update: newItem,
      where: {
        id: newItem.id,
      },
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
  const { components, embeds, files } = await rpgHome(
    interaction,
    `**You have equipped ${chosenItem?.label}!**\n`,
  );
  return {
    components,
    embeds,
    files,
  };
}

export async function rpgHomeDecline(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const itemComponent = row.components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o: APISelectMenuOption) => o.default === true,
  );

  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  const chosenItem = inventoryData.find((item) => item.value === selectedItem?.value);
  if (chosenItem) {
    chosenItem.equipped = false;
    await db.rpg_inventory.upsert({
      create: chosenItem,
      update: chosenItem,
      where: {
        id: chosenItem.id,
      },
    });
  }
  const { components, embeds, files } = await rpgHome(
    interaction,
    `**You have unequipped ${chosenItem?.label}.**\n`,
  );
  return {
    components,
    embeds,
    files,
  };
}

export async function rpgHomeInventory(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<{
  homeInventory: SelectMenuComponentOptionData[];
  personaInventory: string;
  personaTokens: number;
}> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });

  // Get the existing inventory data
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  // log.debug(F, `Persona home inventory: ${JSON.stringify(inventoryData, null, 2)}`);

  // Get a string display of the user's inventory
  const inventoryList = inventoryData
    .map((item) => `**${item.label}** - ${item.description}`)
    .join('\n');
  const inventoryString =
    inventoryData.length > 0
      ? stripIndents`
      ${emojiGet('itemInventory')} **Inventory (${inventoryData.length}/20)**
      ${inventoryList}
      `
      : '';

  // Go through items.general and create a new object of items that the user doesn't have yet
  const homeInventory = [
    ...Object.values(items.general),
    ...Object.values(items.fonts),
    ...Object.values(items.backgrounds),
  ]
    .map((item) => {
      if (inventoryData.find((index) => index.value === item.value)) {
        return {
          cost: item.cost,
          description: item.description,
          emoji: emojiGet(item.emoji).id,
          equipped: item.equipped,
          label: `${item.label} - ${item.cost / 4} TT$`,
          value: item.value,
        };
      }
      return null;
    })
    .filter((item) => item !== null) as SelectMenuComponentOptionData[];
  // log.debug(F, `generalOptions: ${JSON.stringify(homeInventory, null, 2)}`);
  return {
    homeInventory,
    personaInventory: inventoryString,
    personaTokens: personaData.tokens,
  };
}

export async function rpgHomeNameChange(interaction: MessageComponentInteraction): Promise<void> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  // When this button is clicked, a modal appears where the user can enter their name
  // Create the modal
  const modal = new ModalBuilder()
    .setCustomId(`rpgNameModal~${interaction.id}`)
    .setTitle('Setup your TripSit room!');

  const body = new ActionRowBuilder<TextInputBuilder>().addComponents(
    new TextInputBuilder()
      .setLabel('What do you want to name your persona?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setCustomId(`rpgNewName,user:${interaction.user.id}`),
  );
  modal.addComponents([body]);
  await interaction.showModal(modal);

  // Collect a modal submit interaction
  const modalFilter = (index: ModalSubmitInteraction) =>
    index.customId.startsWith('rpgNameModal') &&
    index.customId.split('~')[1] === interaction.id &&
    index.guild !== null;
  await interaction.awaitModalSubmit({ filter: modalFilter, time: 0 }).then(async (index) => {
    if (index.customId.split('~')[1] !== interaction.id) {
      return;
    }
    const choice = index.fields.getTextInputValue('rpgNewName');
    await index.deferReply({ flags: MessageFlags.Ephemeral });

    // log.debug(F, `name: ${choice}`);

    new StringSelectMenuBuilder()
      .setCustomId(`rpgNameDisplay,user:${interaction.user.id}`)
      .setPlaceholder('No Name!')
      .setOptions([
        {
          default: true,
          emoji: '👤',
          label: choice,
          value: choice,
        },
      ]);

    const rowHome = new ActionRowBuilder<ButtonBuilder>().addComponents(
      customButton(`rpgName,user:${interaction.user.id}`, 'Name', '📝', ButtonStyle.Primary),
      customButton(
        `rpgAccept,user:${interaction.user.id}`,
        'Accept',
        'buttonAccept',
        ButtonStyle.Success,
      ),
      customButton(
        `rpgDecline,user:${interaction.user.id}`,
        'Decline',
        'buttonQuit',
        ButtonStyle.Danger,
      ),
      customButton(
        `rpgTown,user:${interaction.user.id}`,
        'Town',
        'buttonTown',
        ButtonStyle.Primary,
      ),
    );

    const rowChangeNameDisplay = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rpgNameDisplay,user:${interaction.user.id}`)
        .setPlaceholder('No Name!')
        .setOptions([
          {
            default: true,
            emoji: '👤',
            label: choice,
            value: choice,
          },
        ]),
    );

    const selectedClassList = { ...genome.classes };
    selectedClassList[personaData.class as keyof typeof selectedClassList].default = true;

    const selectedSpeciesList = { ...genome.species };
    selectedSpeciesList[personaData.species as keyof typeof selectedSpeciesList].default = true;

    const selectedGuildList = { ...genome.guild };
    selectedGuildList[personaData.guild as keyof typeof selectedGuildList].default = true;

    const rowChangeClass = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rpgClass,user:${interaction.user.id}`)
        .setPlaceholder('Select a class')
        .setOptions(Object.values(selectedClassList)),
    );

    const rowChangeSpecies = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rpgSpecies,user:${interaction.user.id}`)
        .setPlaceholder('Pick a species')
        .setOptions(Object.values(selectedSpeciesList)),
    );

    const rowChangeGuild = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId(`rpgGuild,user:${interaction.user.id}`)
        .setPlaceholder('Select a guild')
        .setOptions(Object.values(selectedGuildList)),
    );

    await index.editReply({
      components: [rowChangeNameDisplay, rowChangeSpecies, rowChangeClass, rowChangeGuild, rowHome],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).user.displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG `,
          })
          .setTitle('Home')
          .setDescription(
            stripIndents`
            Your name has been set to ${choice}

            You are in your home, you can change your name, species, class and here.
          `,
          )
          .setColor(Colors.Green),
      ],
    });
  });
}

export async function rpgHomeSell(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  let personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });
  const row = interaction.message.components[0] as ActionRow<MessageActionRowComponent>;
  const itemComponent = row.components[0];
  const selectedItem = (itemComponent as StringSelectMenuComponent).options.find(
    (o: APISelectMenuOption) => o.default === true,
  );
  const itemName = inventoryData.find((item) => item.value === selectedItem?.value)?.label;
  const sellPrice = inventoryData.find((item) => item.value === selectedItem?.value)?.cost! / 4;

  await db.rpg_inventory.delete({
    where: {
      persona_id_value: {
        persona_id: personaData.id,
        value: selectedItem?.value!,
      },
    },
  });

  personaData.tokens += sellPrice;

  personaData = await db.personas.upsert({
    create: personaData,
    update: personaData,
    where: {
      user_id: userData.id,
    },
  });
  log.debug(F, `itemName: ${JSON.stringify(itemName, null, 2)}`);
  const { components, embeds, files } = await rpgHome(
    interaction,
    `**You have sold ${itemName} for ${sellPrice} TripTokens!**\n`,
  );
  return {
    components,
    embeds,
    files,
  };
}

export async function rpgMarket(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Get the info used in the market
  const { marketInventory, personaDiscounts, personaInventory, personaTokens } =
    await rpgMarketInventory(interaction);

  // This is the row of nav buttons. It starts with the town button.
  const rowMarket = new ActionRowBuilder<ButtonBuilder>().addComponents(
    customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
  );

  // Everyone gets the town button, but only people with purchased items get the items select menu
  const componentList = [rowMarket] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];

  interface MarketItem extends SelectMenuComponentOptionData {
    category: string;
  }

  // Group marketInventory items by their category property
  const groups = (marketInventory as MarketItem[]).reduce(
    (groupData: Record<string, MarketItem[]>, item) => {
      const { category } = item;
      const newGroupData = { ...groupData };
      newGroupData[category] = newGroupData[category] ? [...newGroupData[category], item] : [item];
      return newGroupData;
    },
    {},
  );

  // For each group, split the group into chunks of 20 items each and create a new rowItems for each chunk
  for (const [group, itemsData] of Object.entries(groups)) {
    // Create chunks of 20 items each
    const chunks = [];
    for (let index = 0; index < itemsData.length; index += 25) {
      chunks.push(itemsData.slice(index, index + 25));
    }

    // Create a new rowItems for each chunk
    for (const [index, chunk] of chunks.entries()) {
      const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`rpgGeneralSelect,user:${interaction.user.id},group:${group},chunk:${index}`)
          .setPlaceholder(
            chunks.length === 1
              ? group.charAt(0).toUpperCase() + group.slice(1)
              : `${group.charAt(0).toUpperCase() + group.slice(1)} ${index + 1}`,
          )
          .addOptions(chunk),
      );
      componentList.push(rowItems);
    }
  }

  // The user has clicked the market button, send them the market embed
  return {
    components: componentList,
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonMarket')} Market`)
        .setDescription(
          stripIndents`
      You are in the local market, you can buy some items to help you on your journey.

      ${emojiGet('itemFont')} ***Fonts*** change the font of your /profile username
      ${emojiGet('itemBackground')} ***Backgrounds*** change the background of your /profile
      
      ***More items coming soon! Check back later.***
      
      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}
      ${personaDiscounts ? `\n${personaDiscounts}` : ''}
    ${personaInventory}`,
        )
        .setColor(Colors.Gold),
    ],
  };
}

export async function rpgMarketAccept(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Get the info used in the market
  // const {
  //   marketInventory,
  //   personaTokens,
  //   personaInventory,
  // } = await rpgMarketInventory(interaction);

  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });
  // log.debug(F, `personaData (Accept): ${JSON.stringify(personaData, null, 2)}`);

  // If the user confirms the information, save the persona information
  let selectedItem: APISelectMenuOption | undefined;
  for (const component of interaction.message.components) {
    if (component.type === ComponentType.ActionRow && 'components' in component) {
      for (const subComponent of component.components) {
        if (subComponent.type === ComponentType.SelectMenu) {
          selectedItem = subComponent.options.find((o: APISelectMenuOption) => o.default === true);
          if (selectedItem) {
            break;
          }
        }
      }
    }
    if (selectedItem) {
      break;
    }
  }
  log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const allItems = [
    ...Object.values(items.general),
    ...Object.values(items.fonts),
    ...Object.values(items.backgrounds),
  ];
  const itemData = allItems.find((item) => item.value === selectedItem?.value) as {
    consumable: boolean;
    cost: number;
    description: string;
    effect: string;
    effect_value: string;
    emoji: string;
    equipped: boolean;
    label: string;
    quantity: number;
    value: string;
    weight: number;
  };
  // log.debug(F, `itemData (accept): ${JSON.stringify(itemData, null, 2)}`);

  // Check that the user has less than 25 items in their inventory
  const inventoryData = await db.rpg_inventory.findMany({
    where: {
      persona_id: personaData.id,
    },
  });

  if (inventoryData.length >= 20 && itemData.value !== 'PremiumMembership') {
    const { components, embeds } = await rpgMarketChange(interaction);

    // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
    const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({
        iconURL: (interaction.member as GuildMember).displayAvatarURL(),
        text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
      })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(
        stripIndents`**You cannot buy this item because your inventory is full. Sell some items from your home inventory to make room!**
    
    ${description}`,
      )
      .setColor(Colors.Red);
    const imageFiles = [] as AttachmentBuilder[];

    return {
      components,
      embeds: [embed],
      files: imageFiles,
    };
  }

  const { personaDiscount } = await rpgMarketInventory(interaction);

  const itemCost = itemData.cost - itemData.cost * personaDiscount;
  let embedInfoText = '';

  // Check if the user has enough tokens to buy the item
  if (personaData.tokens < itemCost) {
    // log.debug(F, 'Not enough tokens to buy item');

    const { components, embeds } = await rpgMarketChange(interaction);

    // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
    const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

    const embed = embedTemplate()
      .setAuthor(null)
      .setFooter({
        iconURL: (interaction.member as GuildMember).displayAvatarURL(),
        text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
      })
      .setTitle(`${emojiGet('buttonMarket')} Market`)
      .setDescription(
        stripIndents`**You do not have enough tokens to buy this item.**
    
    ${description}`,
      )
      .setColor(Colors.Red);
    const imageFiles = [] as AttachmentBuilder[];
    if (itemData.effect === 'background') {
      const imagePath = await getAsset(itemData.effect_value);
      // log.debug(F, `imagePath: ${imagePath}`);
      imageFiles.push(new AttachmentBuilder(imagePath));
      embed.setImage(`attachment://${itemData.effect_value}.png`);
    }

    return {
      components,
      embeds: [embed],
      files: imageFiles,
    };
  }

  personaData.tokens -= itemCost;
  await db.personas.upsert({
    create: personaData,
    update: personaData,
    where: {
      id: personaData.id,
    },
  });

  if (itemData.value !== 'PremiumMembership') {
    // Add the item to the user's inventory
    const newItem = {
      consumable: itemData.consumable,
      cost: itemData.cost,
      description: itemData.description,
      effect: itemData.effect,
      effect_value: itemData.effect_value,
      emoji: itemData.emoji,
      equipped: itemData.equipped,
      label: itemData.label,
      persona_id: personaData.id,
      quantity: itemData.quantity,
      value: itemData.value,
      weight: itemData.weight,
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
    const itemIndex = inventory.findIndex((index) => index.value === itemData.value);
    // log.debug(F, `itemIndex: ${itemIndex}`);

    // Unequip all items of the same type
    const unequipItems = inventory.filter(
      (index) => index.effect === itemData.effect && index.equipped,
    );
    // log.debug(F, `unequipItems: ${JSON.stringify(unequipItems, null, 2)}`);
    for (const item of unequipItems) {
      // log.debug(F, `item: ${JSON.stringify(item, null, 2)}`);
      item.equipped = false;
      await db.rpg_inventory.upsert({
        create: item,
        update: item,
        where: {
          id: item.id,
        },
      });
    }

    // Equip the new item
    const equipItem = inventory[itemIndex];
    // log.debug(F, `equipItem: ${JSON.stringify(equipItem, null, 2)}`);
    equipItem.equipped = true;
    await db.rpg_inventory.upsert({
      create: equipItem,
      update: equipItem,
      where: {
        id: equipItem.id,
      },
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
    const itemIndex = inventory.findIndex((index) => index.value === itemData.value);
    // log.debug(F, `itemIndex: ${itemIndex}`);

    // Equip the new item
    const equipItem = inventory[itemIndex];
    // log.debug(F, `equipItem: ${JSON.stringify(equipItem, null, 2)}`);
    equipItem.equipped = true;
    await db.rpg_inventory.upsert({
      create: equipItem,
      update: equipItem,
      where: {
        id: equipItem.id,
      },
    });
    embedInfoText =
      'Your flair has been equipped! Use `/rpg flair` to change your flair, or head Home to unequip it.';
  }

  if (itemData.value === 'PremiumMembership') {
    try {
      (interaction.member as GuildMember)?.roles.add(env.ROLE_PREMIUM);
    } catch {
      personaData.tokens += itemCost;

      await db.personas.upsert({
        create: personaData,
        update: personaData,
        where: {
          id: personaData.id,
        },
      });
    }
  }

  const { components, embeds } = await rpgMarketChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  return {
    components,
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonMarket')} Market`)
        .setDescription(
          stripIndents`**You have purchased ${itemData.label} for ${itemCost} TripTokens.
      
      ${embedInfoText}**
      
      ${description}`,
        )
        .setColor(Colors.Green),
    ],
    files: [],
  };
}

export async function rpgMarketChange(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
  // Get the info used in the market
  const { marketInventory, personaDiscounts, personaInventory, personaTokens } =
    await rpgMarketInventory(interaction);

  // Get the item the user selected
  let choice = '' as string;
  if (interaction.isButton()) {
    // const itemComponent = interaction.message.components[0].components[0];
    let selectedItem: APISelectMenuOption | undefined;
    for (const component of interaction.message.components) {
      if (component.type === ComponentType.ActionRow && 'components' in component) {
        for (const subComponent of component.components) {
          if (subComponent.type === ComponentType.SelectMenu) {
            selectedItem = subComponent.options.find(
              (o: APISelectMenuOption) => o.default === true,
            );
            if (selectedItem) {
              break;
            }
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
    consumable: boolean;
    cost: number;
    description: string;
    effect: string;
    effect_value: string;
    emoji: string;
    equipped: boolean;
    label: string;
    quantity: number;
    value: string;
    weight: number;
  };
  const chosenItem = marketInventory.find((marketItem) => marketItem.value === choice);
  if (chosenItem) {
    chosenItem.default = true;
    stringMenu.addOptions(chosenItem);
    const allItems = [
      ...Object.values(items.general),
      ...Object.values(items.fonts),
      ...Object.values(items.backgrounds),
    ];
    itemData = allItems.find((item) => item.value === chosenItem?.value) as {
      consumable: boolean;
      cost: number;
      description: string;
      effect: string;
      effect_value: string;
      emoji: string;
      equipped: boolean;
      label: string;
      quantity: number;
      value: string;
      weight: number;
    };
    // log.debug(F, `itemData (change): ${JSON.stringify(itemData, null, 2)}`);
  }

  const rowMarket = new ActionRowBuilder<ButtonBuilder>().addComponents(
    customButton(`rpgTown,user:${interaction.user.id}`, 'Town', 'buttonTown', ButtonStyle.Primary),
  );

  if (chosenItem) {
    rowMarket.addComponents(
      customButton(
        `rpgMarketBuy,user:${interaction.user.id}`,
        'Buy',
        'buttonBuy',
        ButtonStyle.Success,
      ).setLabel(`Buy ${chosenItem.label}`),
    );
  }

  const components = [rowMarket] as ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[];

  interface MarketItem extends SelectMenuComponentOptionData {
    category: string;
  }

  const groups = (marketInventory as MarketItem[]).reduce(
    (groupData: Record<string, MarketItem[]>, item) => {
      const { category } = item;
      const newGroupData = { ...groupData };
      newGroupData[category] = newGroupData[category] ? [...newGroupData[category], item] : [item];
      return newGroupData;
    },
    {},
  );

  // For each group, split the group into chunks of 25 items each and create a new rowItems for each chunk
  for (const [group, itemsData] of Object.entries(groups)) {
    // Create chunks of 25 items each
    const chunks = [];
    for (let index = 0; index < itemsData.length; index += 25) {
      chunks.push(itemsData.slice(index, index + 25));
    }

    // Create a new rowItems for each chunk
    for (const [index, chunk] of chunks.entries()) {
      const rowItems = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`rpgGeneralSelect,user:${interaction.user.id},group:${group},chunk:${index}`)
          .setPlaceholder(
            chunks.length === 1
              ? group.charAt(0).toUpperCase() + group.slice(1)
              : `${group.charAt(0).toUpperCase() + group.slice(1)} ${index + 1}`,
          )
          .addOptions(chunk),
      );
      components.push(rowItems);
    }
  }

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({
      iconURL: (interaction.member as GuildMember).displayAvatarURL(),
      text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
    })
    .setTitle(`${emojiGet('buttonMarket')} Market`)
    .setDescription(
      stripIndents`
      You are in the local market, you can buy some items to help you on your journey.

      ${emojiGet('itemFont')} ***Fonts*** change the font of your /profile username
      ${emojiGet('itemBackground')} ***Backgrounds*** change the background of your /profile
      
      ***More items coming soon! Check back later.***

      ${emojiGet('buttonBetSmall')} **Wallet:** ${personaTokens}
      ${personaDiscounts ? `\n${personaDiscounts}` : ''}
      ${personaInventory}`,
    )
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
    components,
    embeds: [embed],
    files: imageFiles,
  };
}

export async function rpgMarketInventory(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<{
  marketInventory: SelectMenuComponentOptionData[];
  personaDiscount: number;
  personaDiscounts: string;
  personaInventory: string;
  personaTokens: number;
}> {
  // Check get fresh persona data
  const userData = await db.users.upsert({
    create: {
      discord_id: interaction.user.id,
    },
    update: {},
    where: {
      discord_id: interaction.user.id,
    },
  });
  const personaData = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
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
      amount: '20%',
      discount: 0.2,
      name: 'Premium Member',
      roleId: env.ROLE_PREMIUM,
    },
    {
      amount: '10%',
      discount: 0.1,
      name: 'Server Booster',
      roleId: env.ROLE_BOOSTER,
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
  const inventoryList = inventoryData
    .map((item) => `**${item.label}** - ${item.description}`)
    .join('\n');
  const inventoryString =
    inventoryData.length > 0
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
      if (
        !inventoryData.find((index) => index.value === item.value) &&
        !(item.value === 'PremiumMembership' && member?.roles.cache.has(env.ROLE_PREMIUM))
      ) {
        marketInventory.push({
          category,
          description: item.description,
          emoji: emojiGet(item.emoji).id,
          label: `${item.label} - ${item.cost - discount * item.cost} TT$`,
          value: item.value,
        });
      }
    }
  }

  return {
    marketInventory,
    personaDiscount: discount,
    personaDiscounts: discountString,
    personaInventory: inventoryString,
    personaTokens: personaData.tokens,
  };
}

export async function rpgMarketPreview(
  interaction: MessageComponentInteraction,
): Promise<InteractionUpdateOptions> {
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
    if (component.type === ComponentType.ActionRow && 'components' in component) {
      for (const subComponent of component.components) {
        if (subComponent.type === ComponentType.SelectMenu) {
          selectedItem = subComponent.options.find((o: APISelectMenuOption) => o.default === true);
          if (selectedItem) {
            break;
          }
        }
      }
    }
    if (selectedItem) {
      break;
    }
  }
  // log.debug(F, `selectedItem (accept): ${JSON.stringify(selectedItem, null, 2)}`);

  const allItems = [
    ...Object.values(items.general),
    ...Object.values(items.fonts),
    ...Object.values(items.backgrounds),
  ];
  const itemData = allItems.find((item) => item.value === selectedItem?.value) as {
    consumable: boolean;
    cost: number;
    description: string;
    effect: string;
    effect_value: string;
    emoji: string;
    equipped: boolean;
    label: string;
    quantity: number;
    value: string;
    weight: number;
  };
  // log.debug(F, `itemData (accept): ${JSON.stringify(itemData, null, 2)}`);

  const { components, embeds } = await rpgMarketChange(interaction);

  // This grossness takes the APIEmbed object, turns it into a JSON object, and pulls the description
  const { description } = JSON.parse(JSON.stringify((embeds as APIEmbed[])[0]));

  const embed = embedTemplate()
    .setAuthor(null)
    .setFooter({
      iconURL: (interaction.member as GuildMember).displayAvatarURL(),
      text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
    })
    .setTitle(`${emojiGet('buttonMarket')} Market`)
    .setDescription(
      stripIndents`
  
   ${description}`,
    )
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
    components,
    embeds: [embed],
    files: imageFiles,
  };
}

export async function rpgTown(
  interaction: ChatInputCommandInteraction | MessageComponentInteraction,
): Promise<InteractionEditReplyOptions | InteractionUpdateOptions> {
  // Check if the user has a persona
  // const personaData = await getPersonaInfo(interaction.user.id);

  const rowTown = new ActionRowBuilder<ButtonBuilder>().addComponents(
    customButton(
      `rpgBounties,user:${interaction.user.id}`,
      'Bounties',
      'buttonBounties',
      ButtonStyle.Primary,
    ),
    customButton(
      `rpgMarket,user:${interaction.user.id}`,
      'Market',
      'buttonMarket',
      ButtonStyle.Primary,
    ),
    customButton(
      `rpgArcade,user:${interaction.user.id}`,
      'Arcade',
      'buttonArcade',
      ButtonStyle.Primary,
    ),
    customButton(`rpgHome,user:${interaction.user.id}`, 'Home', 'buttonHome', ButtonStyle.Primary),
    customButton(`rpgHelp,user:${interaction.user.id}`, 'Help', 'buttonHelp', ButtonStyle.Primary),
  );

  // log.debug(F, `RPG Town End: ${JSON.stringify(rowTown)}`);

  return {
    components: [rowTown],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonTown')} Town`)
        .setDescription(
          stripIndents`
      You ${rand(text.enter)} TripTown, a new settlement on the edge of Triptopia, the TripSit Kingdom.

      The town is still under construction with only a few buildings.
      
      *You get the impression that you're one of the first people to visit.*
      
      A recruitment center to take on jobs, and a small market.
  
      What would you like to do?`,
        )
        .setColor(Colors.Green),
    ],
    files: [],
  };
}

function getLastMonday(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return new Date(d);
}

function rand(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

async function rpgGift(interaction: ChatInputCommandInteraction) {
  const commandUser = interaction.member as GuildMember;
  const targetUser = interaction.options.getMember('target') as GuildMember;
  const giftAmount = interaction.options.getInteger('amount') ?? 0;

  if (!targetUser) {
    throw new Error('Target user not found');
  }
  if (targetUser === commandUser) {
    return {
      components: [],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
          .setDescription(
            stripIndents`
            **You can't gift tokens to yourself!**
          `,
          )
          .setColor(Colors.Red),
      ],
    };
  }

  const userData = await db.users.upsert({
    create: {
      discord_id: commandUser.id,
    },
    update: {},
    where: {
      discord_id: commandUser.id,
    },
  });

  const userPersona = await db.personas.upsert({
    create: {
      user_id: userData.id,
    },
    update: {},
    where: {
      user_id: userData.id,
    },
  });

  const targetData = await db.users.upsert({
    create: {
      discord_id: targetUser.id,
    },
    update: {},
    where: {
      discord_id: targetUser.id,
    },
  });

  const targetPersona = await db.personas.upsert({
    create: {
      user_id: targetData.id,
    },
    update: {},
    where: {
      user_id: targetData.id,
    },
  });

  // Get the current token amounts for the command user and the target user
  const commandUserTokens = userPersona.tokens;
  // const targetUserTokens = targetData.tokens;

  // Check if the amount is negative
  if (giftAmount < 0) {
    return {
      components: [],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
          .setDescription(
            stripIndents`
            **You can't gift negative tokens!**
          `,
          )
          .setColor(Colors.Red),
      ],
    };
  }

  // Check if the command user has enough tokens
  if (commandUserTokens < giftAmount) {
    return {
      components: [],
      embeds: [
        embedTemplate()
          .setAuthor(null)
          .setFooter({
            iconURL: (interaction.member as GuildMember).displayAvatarURL(),
            text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
          })
          .setTitle(`${emojiGet('buttonBetHuge')} Gift Unsuccessful`)
          .setDescription(
            stripIndents`
            **You don't have enough tokens!**

            ${emojiGet('buttonBetSmall')} **Wallet:** ${userPersona.tokens}
          `,
          )
          .setColor(Colors.Red),
      ],
    };
  }
  // Remove the tokens from the command user
  userPersona.tokens -= giftAmount;
  // Add the tokens to the target user
  targetPersona.tokens += giftAmount;
  // Save the data

  await db.personas.upsert({
    create: userPersona,
    update: userPersona,
    where: {
      user_id: userData.id,
    },
  });

  await db.personas.upsert({
    create: targetPersona,
    update: targetPersona,
    where: {
      user_id: targetData.id,
    },
  });

  return {
    components: [],
    embeds: [
      embedTemplate()
        .setAuthor(null)
        .setFooter({
          iconURL: (interaction.member as GuildMember).displayAvatarURL(),
          text: `${(interaction.member as GuildMember).displayName}'s TripSit RPG (BETA)`,
        })
        .setTitle(`${emojiGet('buttonBetHuge')} Gift Successful`)
        .setDescription(
          stripIndents`
          **You gifted ${giftAmount} ${giftAmount === 1 ? 'token' : 'tokens'} to ${targetUser?.displayName}**

          ${emojiGet('buttonBetSmall')} **${targetUser?.displayName}'s Wallet:** ${targetPersona.tokens}
          ${emojiGet('buttonBetSmall')} **Your Wallet:** ${userPersona.tokens}
        `,
        )
        .setColor(Colors.Green),
    ],
  };
}

export const dRpg: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('rpg')
    .setDescription('A TripSit RPG (BETA)!')
    .setIntegrationTypes([0])
    .addSubcommand((subcommand) => subcommand.setName('town').setDescription('Go to TripTown!'))
    .addSubcommand((subcommand) => subcommand.setName('market').setDescription('Go to the Market!'))
    .addSubcommand((subcommand) => subcommand.setName('home').setDescription('Go to your Home!'))
    .addSubcommand((subcommand) =>
      subcommand.setName('bounties').setDescription('Go to the bounty board!'),
    )
    .addSubcommand((subcommand) => subcommand.setName('help').setDescription('Learn how to play!'))
    .addSubcommand((subcommand) =>
      subcommand.setName('quest').setDescription('Quest and earn 10 tokens!'),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('dungeon').setDescription('Clear a dungeon and earn 50 tokens!'),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('raid').setDescription('Raid a boss and earn 100 tokens!'),
    )
    .addSubcommand((subcommand) => subcommand.setName('arcade').setDescription('Go to the arcade'))
    .addSubcommand((subcommand) =>
      subcommand.setName('coinflip').setDescription('Go to the coinflip game'),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('roulette').setDescription('Go to the roulette game'),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('flair')
        .setDescription('Change your flair')
        .addStringOption((option) =>
          option.setName('flair').setDescription('Flair to change to').setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('gift')
        .setDescription('Gift tokens to another user')
        .addUserOption((option) =>
          option.setName('target').setDescription('User to gift tokens to').setRequired(true),
        )
        .addIntegerOption((option) =>
          option.setName('amount').setDescription('Amount of tokens to gift').setRequired(true),
        ),
    ),

  async execute(interaction) {
    log.info(F, await commandContext(interaction));
    const channelRpg = (await interaction.guild?.channels.fetch(
      env.CHANNEL_TRIPTOWN!,
    )) as TextChannel;
    const ephemeral = channelRpg.id === interaction.channelId ? undefined : MessageFlags.Ephemeral;
    await interaction.deferReply({ flags: ephemeral });
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
      create: {
        discord_id: interaction.user.id,
      },
      update: {},
      where: {
        discord_id: interaction.user.id,
      },
    });
    await db.personas.upsert({
      create: {
        user_id: userData.id,
      },
      update: {},
      where: {
        user_id: userData.id,
      },
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
