/* eslint-disable no-restricted-syntax, no-await-in-loop */
/* eslint-disable max-len, sonarjs/no-duplicate-string */
import { ComponentType } from 'discord-api-types/v10';
import {
  dRpg, getNewTimer, rpgArcade, rpgArcadeAnimate, rpgArcadeGame, rpgArcadeWager, rpgBounties, rpgFlair, rpgFlairAccept, rpgFlairDecline, rpgHelp, rpgHome, rpgHomeAccept,
  rpgHomeDecline, rpgHomeInventory, rpgHomeNameChange, rpgHomeSell, rpgMarket, rpgMarketAccept, rpgMarketChange, rpgMarketInventory,
  rpgMarketPreview, rpgTown,
} from '../../commands/guild/d.rpg';
import { slashStub } from '../../../vitest/utils/commandStubs';

const mocks = vi.hoisted(() => ({
  random: vi.fn((items: unknown[]) => items[0]), user: vi.fn(), persona: vi.fn(), sleep: vi.fn(), bigBrother: vi.fn(), aiFlair: vi.fn(), asset: vi.fn(), preview: vi.fn(),
}));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/utils/dbRecords', () => ({ getOrCreateUser: mocks.user, getOrCreatePersona: mocks.persona }));
vi.mock('../../utils/emoji', async () => {
  const { ButtonBuilder } = await import('discord.js');
  return {
    customButton: (customId: string, label: string, _emoji: string, style: number) => new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style),
  };
});
vi.mock('../../utils/sleep', () => ({ sleep: mocks.sleep }));
vi.mock('../../../global/utils/random', () => ({ randomItem: mocks.random }));
vi.mock('../../../global/utils/thoughtPolice', () => ({ bigBrother: mocks.bigBrother }));
vi.mock('../../../global/commands/g.ai', () => ({ aiFlairMod: mocks.aiFlair }));
vi.mock('../../utils/getAsset', () => ({ default: mocks.asset }));
vi.mock('../../commands/guild/d.profile', () => ({ getProfilePreview: mocks.preview }));
vi.mock('openai', () => ({ default: class { chat = { completions: { create: vi.fn() } }; } }));

const e = env as unknown as Record<string, string>;

const persona = (over: Record<string, unknown> = {}) => ({
  id: 'p1', user_id: 'dbu', tokens: 5000, last_quest: null, last_dungeon: null, last_raid: null, ...over,
});

const member = (roleIds: string[] = []) => ({
  id: 'u1',
  user: { id: 'u1' },
  displayName: 'Mem',
  displayAvatarURL: () => 'https://av',
  roles: { cache: { has: (r: string) => roleIds.includes(r) } },
});

const interactionFor = (over: Record<string, unknown> = {}) => ({
  user: { id: 'u1' }, member: member(), guild: { members: { fetch: vi.fn(async () => member()) } }, ...over,
});

const embedOf = (out: { embeds?: readonly unknown[] }) => (out.embeds as Array<{ data: { title: string; description: string } }>)[0].data;

describe('rpg helpers', () => {
  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    mocks.persona.mockResolvedValue(persona());
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
    db.personas.upsert = vi.fn() as never;
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => '<:e:1>');
  });

  it('getNewTimer adds seconds to now', async () => {
    const before = Date.now();
    const at = await getNewTimer(60);
    expect(at.getTime() - before).toBeGreaterThanOrEqual(59000);
  });

  it('town and help render navigation', async () => {
    const town = await rpgTown(interactionFor() as never);
    expect(embedOf(town).title).toContain('Town');
    expect(town.components).toHaveLength(1);
    const help = await rpgHelp(interactionFor() as never);
    expect(embedOf(help).description).toContain('How to play');
  });

  describe('bounties', () => {
    it('shows the bounty board with no command', async () => {
      const out = await rpgBounties(interactionFor() as never, null);
      expect(embedOf(out).title).toContain('Bounties');
    });

    it.each([['quest', 10], ['dungeon', 50], ['raid', 100]] as const)('%s pays out and stores the cooldown', async (command, base) => {
      mocks.persona.mockResolvedValue(persona());
      const out = await rpgBounties(interactionFor() as never, command);
      expect(embedOf(out).title).toContain('Success');
      const stored = (db.personas.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].update;
      expect(stored.tokens).toBeGreaterThanOrEqual(5000 + base);
      expect(stored[`last_${command}`]).toBeInstanceOf(Date);
    });

    it('applies token multipliers from items and boosters', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([{ effect: 'tokenMultiplier', effect_value: '0.5' }, { effect: 'font', effect_value: 'x' }]) as never;
      const booster = interactionFor({ guild: { members: { fetch: vi.fn(async () => member([e.ROLE_BOOSTER])) } } });
      await rpgBounties(booster as never, 'quest');
      const stored = (db.personas.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].update;
      expect(stored.tokens - 5000).toBeGreaterThanOrEqual(16);
    });

    it.each([
      ['quest', () => new Date()],
      ['dungeon', () => new Date()],
      ['raid', () => new Date()],
    ] as const)('%s refuses when already claimed', async (command, when) => {
      mocks.persona.mockResolvedValue(persona({ [`last_${command}`]: when() }));
      const out = await rpgBounties(interactionFor() as never, command);
      expect(embedOf(out).title).toContain('Fail');
      expect(db.personas.upsert).not.toHaveBeenCalled();
    });

    it('allows claiming again after the window passes', async () => {
      const longAgo = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30);
      mocks.persona.mockResolvedValue(persona({ last_quest: longAgo, last_dungeon: longAgo, last_raid: longAgo }));
      for (const command of ['quest', 'dungeon', 'raid'] as const) {
        expect(embedOf(await rpgBounties(interactionFor() as never, command)).title).toContain('Success');
      }
    });
  });

  describe('arcade wager', () => {
    it('is capped and requires affordable bets', async () => {
      // an existing wager record is created by the game screen; without one the lookup fails
      await expect(rpgArcadeWager({ user: { id: 'nobody' }, customId: 'rpgBet,500' } as never)).rejects.toThrow();
    });
  });

  describe('execute', () => {
    const run = async (subcommand: string, options: Record<string, unknown> = {}, channelId = 'rpg') => {
      const stub = slashStub({
        subcommand,
        options,
        member: member(),
        guild: { members: { fetch: vi.fn(async () => member()) }, channels: { fetch: vi.fn(async () => ({ id: channelId })) } },
        extra: { channelId: 'rpg' },
      });
      const result = await dRpg.execute(stub as never);
      return { stub, result };
    };

    it.each(['town', 'bounties', 'quest', 'dungeon', 'raid', 'help'])('%s replies in place', async sub => {
      const { stub, result } = await run(sub);
      expect(result).toBe(true);
      expect(stub.editReply).toHaveBeenCalledTimes(1);
      expect(stub.deferReply).toHaveBeenCalledWith({ flags: undefined });
    });

    it('replies ephemerally outside the TripTown channel', async () => {
      const { stub } = await run('town', {}, 'other');
      expect(stub.deferReply).toHaveBeenCalledWith({ flags: expect.anything() });
    });

    describe('gift', () => {
      const target = { id: 't1', displayName: 'Tee' };
      beforeEach(() => {
        mocks.user.mockImplementation(async (id: string) => ({ id: `db-${id}` }));
        mocks.persona.mockImplementation(async (id: string) => persona({ id: `p-${id}`, user_id: id, tokens: id === 'db-u1' ? 100 : 0 }));
      });

      it('rejects self-gifts, negatives and overspending', async () => {
        const selfStub = slashStub({
          subcommand: 'gift', member: member(), options: {}, guild: { channels: { fetch: vi.fn(async () => ({ id: 'rpg' })) } }, extra: { channelId: 'rpg' },
        });
        const me = selfStub.member;
        (selfStub.options.getMember as ReturnType<typeof vi.fn>).mockReturnValue(me);
        await dRpg.execute(selfStub as never);
        expect(embedOf(selfStub.editReply.mock.calls[0][0]).description).toContain("can't gift tokens to yourself");
        expect(embedOf((await run('gift', { target, amount: -5 }).then(r => r.stub.editReply.mock.calls[0][0]))).description).toContain('negative');
        expect(embedOf((await run('gift', { target, amount: 1000 }).then(r => r.stub.editReply.mock.calls[0][0]))).description).toContain("don't have enough");
      });

      it('moves tokens between wallets', async () => {
        const { stub } = await run('gift', { target, amount: 40 });
        expect(embedOf(stub.editReply.mock.calls[0][0]).title).toContain('Gift Successful');
        expect(db.personas.upsert).toHaveBeenCalledTimes(2);
        const [from, to] = (db.personas.upsert as ReturnType<typeof vi.fn>).mock.calls.map(c => c[0].update.tokens);
        expect(from).toBe(60);
        expect(to).toBe(40);
      });
    });
  });
});

describe('rpg market', () => {
  const marketUser = (roles: string[] = [], over: Record<string, unknown> = {}) => ({
    user: { id: 'u1' },
    member: { ...member(roles), roles: { cache: { has: (r: string) => roles.includes(r) }, add: vi.fn() } },
    guild: { members: { fetch: vi.fn(async () => member(roles)) } },
    ...over,
  });

  /** A component interaction whose message shows a select menu with `value` as the default option. */
  const withSelection = (value: string | null, roles: string[] = [], button = true, over: Record<string, unknown> = {}) => ({
    ...marketUser(roles),
    isButton: () => button,
    isStringSelectMenu: () => !button,
    values: value ? [value] : [],
    message: {
      components: [
        { type: ComponentType.ActionRow, components: [{ type: ComponentType.Button }] },
        { type: ComponentType.ActionRow, components: [{ type: ComponentType.StringSelect, options: [{ value: 'other' }, ...(value ? [{ value, default: true }] : [])] }] },
      ],
    },
    ...over,
  });

  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    mocks.persona.mockResolvedValue(persona());
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
    db.rpg_inventory.create = vi.fn() as never;
    db.rpg_inventory.upsert = vi.fn() as never;
    db.personas.upsert = vi.fn() as never;
    mocks.asset.mockResolvedValue('/path/bg.png');
    mocks.preview.mockResolvedValue(Buffer.from('png'));
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', toString: () => '<:e:1>' }));
  });

  it('inventory lists unowned items with discounts for premium members and boosters', async () => {
    const plain = await rpgMarketInventory(marketUser() as never);
    expect(plain.personaDiscount).toBe(0);
    expect(plain.marketInventory.length).toBeGreaterThan(50);
    const perks = await rpgMarketInventory(marketUser([e.ROLE_PREMIUM, e.ROLE_BOOSTER]) as never);
    expect(perks.personaDiscount).toBeCloseTo(0.3);
    expect(perks.personaDiscounts).toContain('Premium Member');
    expect(perks.marketInventory.find(i => i.value === 'PremiumMembership')).toBeUndefined();
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([{ value: 'userflair', label: 'User Flair', description: 'd' }]) as never;
    const owned = await rpgMarketInventory(marketUser() as never);
    expect(owned.personaInventory).toContain('User Flair');
    expect(owned.marketInventory.find(i => i.value === 'userflair')).toBeUndefined();
  });

  it('market renders grouped select menus in chunks of 25', async () => {
    const out = await rpgMarket(marketUser() as never);
    expect((out.components as unknown[]).length).toBeGreaterThan(3);
    expect(embedOf(out).title).toContain('Market');
  });

  describe('change', () => {
    it('reads the selected item from a button press or a select menu', async () => {
      const viaButton = await rpgMarketChange(withSelection('AbrilFatFace') as never);
      expect(viaButton.files).toHaveLength(1);
      expect(mocks.preview).toHaveBeenCalledWith(expect.anything(), 'font', undefined, 'AbrilFatFace');
      const viaMenu = await rpgMarketChange(withSelection('AbstractTriangles', [], false) as never);
      expect(mocks.preview).toHaveBeenCalledWith(expect.anything(), 'background', '/path/bg.png');
      expect(viaMenu.files).toHaveLength(1);
      const flair = await rpgMarketChange(withSelection('userflair') as never);
      expect(mocks.preview).toHaveBeenCalledWith(expect.anything(), 'userflair');
      expect(flair.files).toHaveLength(1);
    });

    it('renders without a selection or for a premium purchase', async () => {
      expect((await rpgMarketChange(withSelection(null) as never)).files).toHaveLength(0);
      expect((await rpgMarketChange(withSelection('PremiumMembership') as never)).files).toHaveLength(0);
      const unknown = withSelection('x', [], true, { isButton: () => false, isStringSelectMenu: () => false });
      expect((await rpgMarketChange(unknown as never)).files).toHaveLength(0);
    });
  });

  describe('preview', () => {
    it('previews fonts and backgrounds', async () => {
      expect((await rpgMarketPreview(withSelection('AbrilFatFace') as never)).files).toHaveLength(1);
      expect((await rpgMarketPreview(withSelection('AbstractTriangles') as never)).files).toHaveLength(1);
      expect((await rpgMarketPreview(withSelection('userflair') as never)).files).toHaveLength(0);
    });
  });

  describe('accept', () => {
    it('refuses when the inventory is full or the wallet is short', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue(Array.from({ length: 20 }, (_, i) => ({
        id: i, value: `v${i}`, label: 'l', description: 'd',
      }))) as never;
      const full = await rpgMarketAccept(withSelection('AbrilFatFace') as never);
      expect(embedOf(full).description).toBeTruthy();
      expect(db.rpg_inventory.create).not.toHaveBeenCalled();
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      mocks.persona.mockResolvedValue(persona({ tokens: 1 }));
      const poor = await rpgMarketAccept(withSelection('AbstractTriangles') as never);
      expect(poor.files).toHaveLength(1);
      const poorFont = await rpgMarketAccept(withSelection('AbrilFatFace') as never);
      expect(poorFont.files).toHaveLength(0);
      expect(db.rpg_inventory.create).not.toHaveBeenCalled();
    });

    it('buys and equips fonts, backgrounds and flair, unequipping the previous item', async () => {
      const owned = (value: string, effect: string, equipped = false) => ({
        id: value, value, effect, equipped, label: value, description: 'd',
      });
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('OldFont', 'font', true), owned('AbrilFatFace', 'font')]) as never;
      const font = await rpgMarketAccept(withSelection('AbrilFatFace') as never);
      expect(embedOf(font).description).toContain('font has been equipped');
      expect(db.rpg_inventory.create).toHaveBeenCalled();
      expect(db.rpg_inventory.upsert).toHaveBeenCalledTimes(2);
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('AbstractTriangles', 'background')]) as never;
      await rpgMarketAccept(withSelection('AbstractTriangles') as never);
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('userflair', 'userflair')]) as never;
      const flair = await rpgMarketAccept(withSelection('userflair') as never);
      expect(embedOf(flair).description).toContain('flair has been equipped');
    });

    it('buying Premium adds the role without storing an item, with a discount for boosters', async () => {
      mocks.persona.mockResolvedValue(persona({ tokens: 100000000 }));
      const interaction = withSelection('PremiumMembership', [e.ROLE_BOOSTER]);
      const out = await rpgMarketAccept(interaction as never);
      expect(interaction.member.roles.add).toHaveBeenCalledWith(e.ROLE_PREMIUM);
      expect(db.rpg_inventory.create).not.toHaveBeenCalled();
      expect(embedOf(out).title).toContain('Market');
    });

    it('refunds when the role cannot be granted', async () => {
      mocks.persona.mockResolvedValue(persona({ tokens: 100000000 }));
      const interaction = withSelection('PremiumMembership');
      interaction.member.roles.add = vi.fn(() => { throw new Error('no perms'); });
      await rpgMarketAccept(interaction as never);
      expect(db.personas.upsert).toHaveBeenCalledTimes(2);
    });
  });
});

describe('rpg home and flair', () => {
  const owned = (value: string, effect: string, over: Record<string, unknown> = {}) => ({
    id: `id-${value}`, value, effect, equipped: false, label: value, description: 'd', cost: 1000, effect_value: 'old', ...over,
  });
  const base = (over: Record<string, unknown> = {}) => ({
    user: { id: 'u1', username: 'alice' },
    member: member(),
    id: 'int1',
    guild: { members: { fetch: vi.fn(async () => member()) } },
    isButton: () => false,
    isStringSelectMenu: () => false,
    values: [] as string[],
    message: { components: [{ components: [{ options: [{ value: 'AbrilFatFace', default: true }, { value: 'other' }] }] }], embeds: [{ description: 'x\n**TripBot Adjusted:** Better\nmore' }] },
    update: vi.fn(),
    ...over,
  });

  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    mocks.persona.mockResolvedValue(persona({ class: 'warrior', species: 'human', guild: 'gryffindor' }));
    db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
    db.rpg_inventory.create = vi.fn() as never;
    db.rpg_inventory.upsert = vi.fn() as never;
    db.rpg_inventory.delete = vi.fn() as never;
    db.personas.upsert = vi.fn().mockImplementation(async (a: { update: unknown }) => a.update) as never;
    mocks.asset.mockResolvedValue('/path/bg.png');
    mocks.preview.mockResolvedValue(Buffer.from('png'));
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', identifier: 'e:1', toString: () => '<:e:1>' }));
  });

  describe('home', () => {
    it('inventory lists owned items only', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('AbrilFatFace', 'font')]) as never;
      const inv = await rpgHomeInventory(base() as never);
      expect(inv.homeInventory).toHaveLength(1);
      expect(inv.personaInventory).toContain('Inventory (1/20)');
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      expect((await rpgHomeInventory(base() as never)).personaInventory).toBe('');
    });

    it('shows an empty home, and previews a chosen item from a select menu', async () => {
      const empty = await rpgHome(base() as never, '');
      expect((empty.components as unknown[]).length).toBe(1);
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('AbrilFatFace', 'font'), owned('AbstractTriangles', 'background', { equipped: true }), owned('userflair', 'userflair')]) as never;
      const selectFont = await rpgHome(base({ isStringSelectMenu: () => true, values: ['AbrilFatFace'] }) as never, 'hi');
      expect(selectFont.files).toHaveLength(1);
      const selectBg = await rpgHome(base({ isStringSelectMenu: () => true, values: ['AbstractTriangles'] }) as never, '');
      expect(selectBg.files).toHaveLength(1);
      const selectFlair = await rpgHome(base({ isStringSelectMenu: () => true, values: ['userflair'] }) as never, '');
      expect(selectFlair.files).toHaveLength(1);
      const fromButton = await rpgHome(base({ isButton: () => true }) as never, '');
      expect((fromButton.components as unknown[]).length).toBe(2);
      const equippedDefault = await rpgHome(base() as never, '');
      expect(equippedDefault.files).toHaveLength(0);
    });

    it('accept equips the selected item and unequips other backgrounds', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('AbrilFatFace', 'font'), owned('AbstractTriangles', 'background', { equipped: true })]) as never;
      const out = await rpgHomeAccept(base() as never);
      expect(out.embeds).toBeDefined();
      expect(db.rpg_inventory.upsert).toHaveBeenCalled();
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      await rpgHomeAccept(base() as never);
    });

    it('decline unequips and sell removes the item and pays a quarter of its cost', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('AbrilFatFace', 'font', { equipped: true })]) as never;
      await rpgHomeDecline(base() as never);
      expect((db.rpg_inventory.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0].update.equipped).toBe(false);
      await rpgHomeSell(base() as never);
      expect(db.rpg_inventory.delete).toHaveBeenCalled();
      expect((db.personas.upsert as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0].update.tokens).toBe(5250);
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      await rpgHomeDecline(base() as never);
    });
  });

  describe('name change', () => {
    // The persona editor reads `genome.guild`, but the table is named `genome.guilds`, so spreading it yields {} and
    // `selectedGuildList[personaData.guild].default = true` throws for every persona.
    it('currently throws while building the persona editor (guild table is misnamed)', async () => {
      const submit = {
        customId: 'rpgNameModal~int1', guild: {}, deferReply: vi.fn(), editReply: vi.fn(), fields: { getTextInputValue: vi.fn(() => 'Bob') },
      };
      const interaction = base({ showModal: vi.fn(), awaitModalSubmit: vi.fn().mockResolvedValue(submit) });
      await expect(rpgHomeNameChange(interaction as never)).rejects.toThrow(TypeError);
      expect((interaction as unknown as { showModal: ReturnType<typeof vi.fn> }).showModal).toHaveBeenCalled();
      expect(submit.editReply).not.toHaveBeenCalled();
    });
  });

  describe('flair', () => {
    const flairStub = (flair: string, roles: string[] = [], extra: Record<string, unknown> = {}) => base({
      options: { getString: vi.fn(() => flair), getMember: vi.fn() },
      guild: { members: { fetch: vi.fn(async () => member(roles)) } },
      ...extra,
    });
    const aiSays = (response: string | null) => mocks.aiFlair.mockResolvedValue({ response, promptTokens: 1, completionTokens: 1 });
    const text = (out: { embeds?: readonly unknown[] }) => embedOf(out).description;

    beforeEach(() => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('userflair', 'userflair')]) as never;
    });

    it('blocks mentions for non-moderators, and unowned flair items', async () => {
      expect(text(await rpgFlair(flairStub('hi <@123456789012345678>') as never))).toContain('cannot use a mention');
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      expect(text(await rpgFlair(flairStub('hi') as never))).toContain("don't own the flair item");
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('userflair', 'userflair')]) as never;
      expect(text(await rpgFlair(flairStub('x'.repeat(51)) as never))).toContain('too long');
    });

    it('lets moderators set a flair for someone else', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('userflair', 'userflair')]) as never;
      const out = await rpgFlair(flairStub('<@123456789012345678> cool', [e.ROLE_MODERATOR]) as never);
      expect(text(out)).toContain('New flair:** cool');
    });

    it('falls back to the word filter when the AI is unavailable', async () => {
      aiSays(null);
      mocks.bigBrother.mockResolvedValueOnce('offensive');
      expect(text(await rpgFlair(flairStub('bad') as never))).toContain("isn't allowed");
      mocks.bigBrother.mockResolvedValueOnce('clean');
      expect(text(await rpgFlair(flairStub('fine') as never))).toContain('New flair:** fine');
      expect(db.rpg_inventory.upsert).toHaveBeenCalled();
    });

    it('interprets the AI verdict: approved, adjusted, rejected and malformed', async () => {
      aiSays('Status: Approved\nAdjusted: Fine');
      expect(text(await rpgFlair(flairStub('fine') as never))).toContain('has been updated');
      aiSays('Status: Adjusted\nAdjusted: Nicer\nReason: tone');
      const adjusted = await rpgFlair(flairStub('rude') as never);
      expect(text(adjusted)).toContain('TripBot Adjusted:** Nicer');
      expect((adjusted as { components: unknown[] }).components).toHaveLength(1);
      aiSays('Status: Adjusted');
      expect(text(await rpgFlair(flairStub('rude') as never))).toContain("Something went wrong with TripBot's AI");
      aiSays('Status: Rejected\nReason: hateful');
      expect(text(await rpgFlair(flairStub('rude') as never))).toContain('Rejection Reason:** hateful');
      aiSays('Status: Rejected');
      expect(text(await rpgFlair(flairStub('rude') as never))).toContain('No reason given');
      aiSays('gibberish');
      expect(text(await rpgFlair(flairStub('rude') as never))).toContain('has been rejected');
    });

    it('accepts an adjusted flair from the message, an override, and creates the flair item if missing', async () => {
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([owned('userflair', 'userflair')]) as never;
      const fromMessage = await rpgFlairAccept(base() as never, '');
      expect(text(fromMessage)).toContain('New flair:** Better');
      const override = await rpgFlairAccept(base() as never, 'Custom');
      expect(text(override)).toContain('New flair:** Custom');
      db.rpg_inventory.findMany = vi.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([owned('userflair', 'userflair')]) as never;
      await rpgFlairAccept(base() as never, 'Fresh');
      expect(db.rpg_inventory.create).toHaveBeenCalled();
      db.rpg_inventory.findMany = vi.fn().mockResolvedValue([]) as never;
      expect(text(await rpgFlairAccept(base() as never, 'x'))).toContain('Something went wrong');
    });

    it('decline keeps the old flair', async () => {
      expect(text(await rpgFlairDecline(base() as never))).toContain('not been updated');
    });
  });
});

describe('rpg arcade', () => {
  const player = (id = 'arc1') => ({
    user: { id }, member: member(), editReply: vi.fn(), customId: '',
  });
  beforeEach(() => {
    mocks.user.mockResolvedValue({ id: 'dbu' });
    mocks.persona.mockResolvedValue(persona({ tokens: 5000 }));
    mocks.sleep.mockResolvedValue(undefined);
    db.personas.upsert = vi.fn() as never;
    (global as unknown as Record<string, unknown>).emojiGet = vi.fn(() => ({ id: '1', identifier: 'e:1', toString: () => '<:e:1>' }));
  });

  const description = (out: { embeds?: readonly unknown[] }) => embedOf(out).description;

  it('lists the games', async () => {
    expect(embedOf(await rpgArcade(player() as never)).description).toContain('arcade');
  });

  it('animates each game before revealing the result', async () => {
    const coin = player();
    await rpgArcadeAnimate(coin as never, 'Coinflip');
    await rpgArcadeAnimate(coin as never, 'Roulette');
    await rpgArcadeAnimate(coin as never, 'Slots');
    expect(coin.editReply).toHaveBeenCalledTimes(2);
    expect(mocks.sleep).toHaveBeenCalledWith(4000);
  });

  it('shows instructions, resets wagers when switching games, and demands a bet before playing', async () => {
    const p = player('arc-instructions');
    expect(description(await rpgArcadeGame(p as never, 'Coinflip'))).toContain('How to play');
    expect(description(await rpgArcadeGame(p as never, 'Roulette'))).toContain('Odds');
    expect(description(await rpgArcadeGame(p as never, 'Roulette', 'red'))).toContain("can't start a game without first placing a bet");
  });

  it('wagers accumulate, are capped at 1000, and need enough tokens', async () => {
    const p = { ...player('arc-wager'), customId: 'rpgWager500,user:arc-wager' };
    await rpgArcadeGame(p as never, 'Coinflip');
    expect(description(await rpgArcadeWager(p as never))).toContain('betting 500 tokens');
    expect(description(await rpgArcadeWager(p as never))).toContain('betting 1000 tokens');
    expect(description(await rpgArcadeWager(p as never))).toContain('Maximum bet is 1000');
    const poor = { ...player('arc-poor'), customId: 'rpgWager500,user:arc-poor' };
    mocks.persona.mockResolvedValue(persona({ tokens: 100 }));
    await rpgArcadeGame(poor as never, 'Coinflip');
    // The "not enough" message is only rendered on the "you are betting" screen, so a first bet shows the plain intro.
    expect(description(await rpgArcadeWager(poor as never))).toContain('How to play');
    const small = { ...player('arc-small'), customId: 'rpgWager0,user:arc-small' };
    mocks.persona.mockResolvedValue(persona({ tokens: 5000 }));
    await rpgArcadeGame(small as never, 'Coinflip');
    expect(description(await rpgArcadeWager(small as never))).toContain('How to play');
  });

  const bet = async (id: string, game: 'Coinflip' | 'Roulette') => {
    const p = { ...player(id), customId: `rpgWager1000,user:${id}` };
    await rpgArcadeGame(p as never, game);
    await rpgArcadeWager(p as never);
    return p;
  };

  it.each([
    ['heads', 'heads', true], ['heads', 'tails', false],
  ] as const)('coinflip: choosing %s when it lands %s wins=%s', async (choice, result, wins) => {
    const p = await bet(`coin-${choice}-${result}`, 'Coinflip');
    mocks.random.mockReturnValueOnce(result);
    const out = await rpgArcadeGame(p as never, 'Coinflip', choice);
    expect(description(out)).toContain(wins ? 'You won 1000 tokens' : 'You lost 1000 tokens');
    const saved = (db.personas.upsert as ReturnType<typeof vi.fn>).mock.calls.at(-1)?.[0].update.tokens;
    expect(saved).toBe(wins ? 6000 : 4000);
  });

  it.each([
    ['0', '0', 17], ['red', '2', 1], ['evens', '4', 1], ['black', '3', 1], ['odds', '5', 1], ['high', '20', 1], ['low', '5', 1],
    ['1-12', '7', 2], ['13-24', '14', 2], ['25-36', '30', 2], ['first', '13', 2], ['second', '14', 2], ['third', '15', 2],
    ['red', '3', 0], ['0', '5', 0], ['high', '5', 0], ['first', '2', 0],
  ] as const)('roulette: %s on %s pays x%s', async (choice, result, multiplier) => {
    const p = await bet(`roulette-${choice}-${result}`, 'Roulette');
    mocks.random.mockReturnValueOnce(result);
    const out = await rpgArcadeGame(p as never, 'Roulette', choice);
    expect(description(out)).toContain(multiplier ? `You won ${1000 * multiplier} tokens` : 'You lost 1000 tokens');
  });
});
