import { ChannelType, DMChannel, TextChannel } from 'discord.js';
import { resolvingModal } from '../../../vitest/utils/commandStubs';
/* eslint-disable no-nested-ternary, no-restricted-syntax */
import {
  applicationApprove, applicationPermissions, applicationReject, applicationSetup, applicationStart,
} from '../../utils/application';
import { dbMock } from '../../../vitest/utils/mockDb';
import { flushPromises, stubInstance } from '../../../vitest/utils/discordStubs';

const e = env as unknown as Record<string, string>;

const mocks = vi.hoisted(() => ({ missing: vi.fn(), guildOnly: vi.fn(), context: vi.fn() }));
vi.mock('../../utils/checkPermissions', () => ({ missingPermission: mocks.missing }));
vi.mock('../../utils/guildOnly', () => ({ replyGuildOnly: mocks.guildOnly }));
vi.mock('../../utils/context', () => ({ default: mocks.context }));

const DAY = 86_400_000;
const textChannel = (id = 'post', createdAgo = 2 * DAY, extra: Record<string, unknown> = {}) => stubInstance<TextChannel>(TextChannel, {
  id, type: ChannelType.GuildText, createdAt: new Date(Date.now() - createdAgo), send: vi.fn(), setName: vi.fn(), toString: (): string => `#${id}`, ...extra,
});

beforeEach(() => {
  mocks.missing.mockReset();
  mocks.missing.mockResolvedValue(null);
  mocks.context.mockResolvedValue('ctx');
  (global as unknown as { emojiGet: unknown }).emojiGet = vi.fn(() => ({ id: 'emoji-id' }));
});

describe('applicationPermissions', () => {
  const base = (over: Record<string, unknown> = {}) => ({
    guild: { toString: (): string => 'Guild' }, member: {}, channel: { type: ChannelType.GuildText }, reply: vi.fn(), ...over,
  });
  const run = (i: ReturnType<typeof base>, post: unknown = null, threads: unknown = textChannel('threads')) => applicationPermissions(i as never, post as never, threads as never);

  it('requires a guild, member, channel and text channel', async () => {
    const dm = base({ guild: null });
    expect(await run(dm)).toBe(false);
    expect(mocks.guildOnly).toHaveBeenCalledWith(dm, { ephemeral: true });
    const noMember = base({ member: null });
    expect(await run(noMember)).toBe(false);
    expect(noMember.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('member of a guild') }));
    const noChannel = base({ channel: null });
    expect(await run(noChannel)).toBe(false);
    const voice = base({ channel: { type: ChannelType.GuildVoice } });
    expect(await run(voice)).toBe(false);
    expect(voice.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('text channel') }));
  });

  it('reports missing guild, post channel and thread channel permissions', async () => {
    const guildMissing = base();
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    expect(await run(guildMissing)).toBe(false);
    expect(guildMissing.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Manage Roles') }));
    const postMissing = base();
    mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce('SendMessages');
    expect(await run(postMissing, textChannel('post'))).toBe(false);
    expect(postMissing.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Send Messages') }));
    const threadMissing = base();
    mocks.missing.mockResolvedValueOnce(null).mockResolvedValueOnce('ManageThreads');
    expect(await run(threadMissing)).toBe(false);
    expect(threadMissing.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('Manage Threads') }));
  });

  it('rejects identical or non-text channels for the post and thread channels', async () => {
    const same = base();
    const channel = textChannel('same');
    expect(await run(same, channel, channel)).toBe(false);
    expect(same.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('cannot be the same') }));
    const wrongType = base();
    expect(await run(wrongType, { id: 'x', type: ChannelType.GuildVoice })).toBe(false);
  });

  it('passes when everything is in order', async () => {
    expect(await run(base(), textChannel('post'))).toBe(true);
    expect(await run(base(), null)).toBe(true);
  });
});

describe('applicationSetup', () => {
  function setup(over: Record<string, unknown> = {}, roles: Record<string, { id: string; name: string } | null> = {}, submitOver: Record<string, unknown> = {}) {
    const submit = {
      customId: 'appModal~int1',
      deferReply: vi.fn(),
      editReply: vi.fn(),
      reply: vi.fn(),
      guild: { id: 'g1' },
      fields: { getTextInputValue: vi.fn(() => 'Apply now!') },
      channel: { send: vi.fn() },
      ...submitOver,
    };
    const interaction = {
      id: 'int1',
      guild: { id: 'g1', name: 'Guild' },
      member: {},
      channel: textChannel('post'),
      reply: vi.fn(),
      showModal: vi.fn(),
      options: { getChannel: vi.fn(() => textChannel('threads')), getRole: vi.fn((name: string) => roles[name] ?? null) },
      awaitModalSubmit: vi.fn(resolvingModal(submit)),
      ...over,
    };
    return { interaction, submit };
  }

  it('ignores contexts without a guild or text channel', async () => {
    await applicationSetup(setup({ guild: null }).interaction as never);
    await applicationSetup(setup({ channel: null }).interaction as never);
    await applicationSetup(setup({ channel: { type: ChannelType.GuildVoice } }).interaction as never);
    expect(mocks.missing).not.toHaveBeenCalled();
  });

  it('stops when permissions are missing', async () => {
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    const { interaction } = setup();
    await applicationSetup(interaction as never);
    expect(interaction.showModal).not.toHaveBeenCalled();
  });

  it('posts the role menu and records the applications channel', async () => {
    const { interaction, submit } = setup({}, {
      application_role_a: { id: 'ra', name: 'Helper' }, application_reviewer_a: { id: 'rv', name: 'Mods' },
    });
    await applicationSetup(interaction as never);
    await flushPromises();
    expect(interaction.showModal).toHaveBeenCalled();
    expect(dbMock.discord_guilds.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: { channel_applications: 'threads' } }));
    const [{ content, components }] = submit.channel.send.mock.calls[0] as unknown as [{ content: string; components: Array<{ toJSON(): unknown }> }];
    expect(content).toBe('Apply now!');
    expect(JSON.stringify(components[0].toJSON())).toContain('ra~rv');
    expect(submit.editReply).toHaveBeenCalledWith({ content: 'Donezo!' });
  });

  it('complains about a role without a reviewer, and ignores other users\' modals', async () => {
    const { interaction, submit } = setup({}, { application_role_a: { id: 'ra', name: 'Helper' } });
    await applicationSetup(interaction as never);
    await flushPromises();
    expect(submit.reply).toHaveBeenCalledWith(expect.stringContaining('both a role and a reviewer'));
    const other = setup({}, {}, { customId: 'appModal~someone-else' });
    await applicationSetup(other.interaction as never);
    await flushPromises();
    expect(other.submit.deferReply).not.toHaveBeenCalled();
  });
});

describe('applicationStart', () => {
  function setup(opts: { values?: string[]; guild?: boolean; channel?: boolean; appChannel?: string | null; channelFetch?: 'ok' | 'fail'; submitMember?: boolean; joined?: boolean; submitId?: string } = {}) {
    const thread = { send: vi.fn(async () => ({ react: vi.fn() })) };
    const applications = textChannel('apps', DAY, { threads: { create: vi.fn(async () => thread) } });
    const submit = {
      customId: `applicationSubmit~${opts.submitId ?? 'int1'}`,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      fields: { getTextInputValue: vi.fn((k: string) => `${k} text`) },
      member: opts.submitMember === false ? null : {
        id: 'm1',
        displayName: 'Ally',
        joinedAt: opts.joined === false ? null : new Date('2023-01-01'),
        user: {
          username: 'ally', discriminator: '0', id: 'm1', createdAt: new Date('2020-01-01'),
        },
      },
    };
    const interaction = {
      id: 'int1',
      values: opts.values ?? ['r1~r2'],
      user: { username: 'ally' },
      member: {},
      reply: vi.fn(),
      showModal: vi.fn(),
      channel: opts.channel === false ? null : textChannel('post'),
      guild: opts.guild === false ? null : {
        id: 'g1',
        name: 'Guild',
        channels: { fetch: vi.fn(async () => { if (opts.channelFetch === 'fail') throw new Error('Unknown Channel'); return applications; }) },
        roles: { fetch: vi.fn(async (id: string) => ({ id, name: `role-${id}`, toString: (): string => `@${id}` })) },
      },
      awaitModalSubmit: vi.fn(resolvingModal(submit)),
    };
    dbMock.discord_guilds.upsert.mockResolvedValue({ channel_applications: opts.appChannel === undefined ? 'apps' : opts.appChannel } as never);
    return {
      interaction, submit, thread, applications,
    };
  }

  it('handles the empty selection and missing context', async () => {
    const none = setup({ values: ['none'] });
    await applicationStart(none.interaction as never);
    expect(none.interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: 'No application selected.' }));
    await applicationStart(setup({ guild: false }).interaction as never);
    await applicationStart(setup({ channel: false }).interaction as never);
  });

  it('requires a configured, existing applications channel', async () => {
    const unset = setup({ appChannel: null });
    await applicationStart(unset.interaction as never);
    expect(unset.interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('not been set up') }));
    const gone = setup({ channelFetch: 'fail' });
    await applicationStart(gone.interaction as never);
    expect(dbMock.discord_guilds.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { channel_applications: null } });
    expect(gone.interaction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining('no longer exists') }));
  });

  it('stops when permissions are missing', async () => {
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    const { interaction } = setup();
    await applicationStart(interaction as never);
    expect(interaction.showModal).not.toHaveBeenCalled();
  });

  it('opens a private review thread with approve and reject controls', async () => {
    const {
      interaction, submit, thread, applications,
    } = setup();
    await applicationStart(interaction as never);
    await flushPromises();
    expect(interaction.showModal).toHaveBeenCalled();
    expect(applications.threads.create).toHaveBeenCalledWith(expect.objectContaining({ name: "💛│Ally's role-r1 application!", invitable: false }));
    expect(thread.send).toHaveBeenCalledTimes(2);
    const body = JSON.stringify((thread.send.mock.calls[1] as unknown[])[0]);
    expect(body).toContain('applicationApprove~m1~r1');
    expect(body).toContain('applicationReject~m1~r1');
    expect(body).toContain('Joined');
    expect(submit.editReply).toHaveBeenCalled();
  });

  it('handles applicants without a join date, anonymous submits and other users\' modals', async () => {
    const noJoin = setup({ joined: false });
    await applicationStart(noJoin.interaction as never);
    await flushPromises();
    expect(JSON.stringify((noJoin.thread.send.mock.calls[1] as unknown[])[0])).not.toContain('Joined');
    const anon = setup({ submitMember: false });
    await applicationStart(anon.interaction as never);
    await flushPromises();
    expect(anon.applications.threads.create).not.toHaveBeenCalled();
    const other = setup({ submitId: 'other' });
    await applicationStart(other.interaction as never);
    await flushPromises();
    expect(other.submit.deferReply).not.toHaveBeenCalled();
  });
});

describe('applicationReject', () => {
  function setup(opts: { createdAgo?: number; manageRoles?: boolean; memberFetch?: 'ok' | 'fail'; role?: 'ok' | 'fail' | 'null'; reason?: string; guild?: boolean; member?: boolean; channel?: boolean } = {}) {
    const target = { displayName: 'Target', send: vi.fn() };
    const channel = textChannel('thread', opts.createdAgo ?? 2 * DAY);
    const interaction = {
      customId: 'applicationReject~m1~r1',
      values: [opts.reason ?? 'tooNew'],
      deferReply: vi.fn(),
      editReply: vi.fn(),
      reply: vi.fn(),
      channel: opts.channel === false ? null : channel,
      member: opts.member === false ? null : { displayName: 'Mod', permissions: { has: () => opts.manageRoles !== false } },
      guild: opts.guild === false ? null : {
        name: 'Guild',
        toString: (): string => 'Guild',
        members: { fetch: vi.fn(async () => { if (opts.memberFetch === 'fail') throw new Error('Unknown Member'); return target; }) },
        roles: { fetch: vi.fn(async () => { if (opts.role === 'fail') throw new Error('Unknown Role'); return opts.role === 'null' ? null : { name: 'Helper' }; }) },
      },
    };
    return { interaction, target, channel };
  }

  it('ignores incomplete contexts and failed permission checks', async () => {
    await applicationReject(setup({ guild: false }).interaction as never);
    await applicationReject(setup({ channel: false }).interaction as never);
    await applicationReject(setup({ member: false }).interaction as never);
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    const denied = setup();
    await applicationReject(denied.interaction as never);
    expect(denied.interaction.deferReply).not.toHaveBeenCalled();
  });

  it('makes reviewers wait a day, and requires Manage Roles', async () => {
    const early = setup({ createdAgo: 1000 });
    await applicationReject(early.interaction as never);
    expect(early.interaction.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('at least 24') });
    const weak = setup({ manageRoles: false });
    await applicationReject(weak.interaction as never);
    expect(weak.interaction.editReply).toHaveBeenCalledWith({ content: 'You do not have the Manage Roles permission!' });
  });

  it('explains missing members and roles', async () => {
    const gone = setup({ memberFetch: 'fail' });
    await applicationReject(gone.interaction as never);
    expect(gone.interaction.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Could not find target') });
    for (const role of ['fail', 'null'] as const) {
      const noRole = setup({ role });
      // eslint-disable-next-line no-await-in-loop
      await applicationReject(noRole.interaction as never);
      expect(noRole.interaction.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('Could not find role') });
    }
  });

  it('DMs the applicant the reason and renames the thread', async () => {
    const { interaction, target, channel } = setup({ reason: 'young' });
    await applicationReject(interaction as never);
    expect(interaction.editReply).toHaveBeenCalledWith("Mod rejected this application with reason code 'young'");
    expect(target.send).toHaveBeenCalledWith(expect.stringContaining('at least 21 years of age'));
    expect(channel.setName).toHaveBeenCalledWith("🖤│Target's Helper application!");
  });
});

describe('applicationApprove', () => {
  function setup(opts: { createdAgo?: number; manageRoles?: boolean; roleId?: string; higher?: boolean; channelKind?: 'text' | 'dm' | 'other'; guild?: boolean } = {}) {
    const target = { displayName: 'Target', roles: { add: vi.fn() }, toString: (): string => '<@target>' };
    const channelProps = {
      id: 'thread', createdAt: new Date(Date.now() - (opts.createdAgo ?? 2 * DAY)), send: vi.fn(), setName: vi.fn(), type: ChannelType.GuildText,
    };
    const channel = opts.channelKind === 'dm' ? stubInstance(DMChannel, channelProps)
      : opts.channelKind === 'other' ? channelProps : stubInstance<TextChannel>(TextChannel, channelProps);
    const sendTo = vi.fn();
    const interaction = {
      customId: `applicationApprove~m1~${opts.roleId ?? 'r1'}`,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      reply: vi.fn(),
      channel,
      member: { displayName: 'Mod', permissions: { has: () => opts.manageRoles !== false } },
      guild: opts.guild === false ? null : {
        members: { me: { roles: { highest: {} } }, fetch: vi.fn(async () => target) },
        roles: { fetch: vi.fn(async (id: string) => ({ id, name: 'Helper', comparePositionTo: () => (opts.higher ? 1 : -1) })) },
        channels: { fetch: vi.fn(async () => ({ send: sendTo, toString: (): string => '#x' })) },
      },
    };
    return {
      interaction, target, channel: channel as unknown as { send: ReturnType<typeof vi.fn>; setName: ReturnType<typeof vi.fn> }, sendTo,
    };
  }

  it('ignores incomplete contexts and failed permission checks', async () => {
    await applicationApprove(setup({ guild: false }).interaction as never);
    mocks.missing.mockResolvedValueOnce('ManageRoles');
    const denied = setup();
    await applicationApprove(denied.interaction as never);
    expect(denied.interaction.deferReply).not.toHaveBeenCalled();
  });

  it('makes reviewers wait a day, and refuses roles above the bot', async () => {
    const early = setup({ createdAgo: 1000 });
    await applicationApprove(early.interaction as never);
    expect(early.interaction.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('at least 24') });
    expect(early.target.roles.add).not.toHaveBeenCalled();
    const high = setup({ higher: true });
    await applicationApprove(high.interaction as never);
    expect(high.interaction.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('I do not have permission to add') });
  });

  // Regression test for TripSit/TripBot#1369: a reviewer without Manage Roles used to be told no and then approved anyway.
  it('does not grant the role to reviewers without Manage Roles', async () => {
    const weak = setup({ manageRoles: false });
    await applicationApprove(weak.interaction as never);
    expect(weak.interaction.editReply).toHaveBeenCalledWith({ content: 'You do not have permission to modify roles!' });
    expect(weak.target.roles.add).not.toHaveBeenCalled();
  });

  it('ignores clicks without a channel or a member', async () => {
    const noChannel = setup();
    (noChannel.interaction as { channel: unknown }).channel = null;
    await applicationApprove(noChannel.interaction as never);
    expect(noChannel.interaction.deferReply).not.toHaveBeenCalled();
    const noMember = setup();
    (noMember.interaction as { member: unknown }).member = null;
    await applicationApprove(noMember.interaction as never);
    expect(noMember.interaction.deferReply).not.toHaveBeenCalled();
  });

  it('grants the role and announces it', async () => {
    const { interaction, target, channel } = setup();
    await applicationApprove(interaction as never);
    expect(target.roles.add).toHaveBeenCalled();
    expect(channel.send).toHaveBeenCalledWith(expect.stringContaining('accepted this application!'));
    expect(channel.setName).toHaveBeenCalledWith("💚│Target's Helper application1!");
    expect(interaction.editReply).toHaveBeenLastCalledWith('Done!');
    const dm = setup({ channelKind: 'dm' });
    await applicationApprove(dm.interaction as never);
    expect(dm.channel.send).toHaveBeenCalled();
    const other = setup({ channelKind: 'other' });
    await applicationApprove(other.interaction as never);
    expect(other.channel.send).not.toHaveBeenCalled();
  });

  it('welcomes new helpers and contributors in their team channels', async () => {
    const helper = setup({ roleId: e.ROLE_HELPER });
    await applicationApprove(helper.interaction as never);
    expect(helper.sendTo).toHaveBeenCalledWith(expect.stringContaining('our newest Helper'));
    const contributor = setup({ roleId: e.ROLE_CONTRIBUTOR });
    await applicationApprove(contributor.interaction as never);
    expect(contributor.sendTo).toHaveBeenCalledWith(expect.stringContaining('open source'));
  });
});
