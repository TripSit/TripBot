import { dFeedback, feedbackReportModal } from '../../commands/global/d.feedback';
import { mTranslate } from '../../commands/global/m.translate';
import { dRemindme } from '../../commands/global/d.remindme';
import { lastReply, slashStub, resolvingModal } from '../../../vitest/utils/commandStubs';
import { flushPromises } from '../../../vitest/utils/discordStubs';

const mocks = vi.hoisted(() => ({ aiTranslate: vi.fn(), remindMe: vi.fn(), paginate: vi.fn() }));

vi.mock('../../utils/context', () => ({ default: vi.fn(async () => 'ctx') }));
vi.mock('../../../global/commands/g.ai', () => ({ aiTranslate: mocks.aiTranslate }));
vi.mock('../../../global/commands/g.remindme', () => ({ remindMe: mocks.remindMe }));
vi.mock('../../utils/pagination', () => ({ paginationEmbed: mocks.paginate, default: mocks.paginate }));

(global as unknown as { commandContext: unknown }).commandContext = vi.fn(async () => 'ctx');

describe('feedback', () => {
  function modalFlow(over: { submitId?: string; guild?: boolean; devRole?: boolean; devChannel?: boolean } = {}) {
    const owner = { toString: (): string => '<@owner>', send: vi.fn() };
    const devChan = over.devChannel === false ? null : { send: vi.fn() };
    const submit = {
      customId: `feedbackReportModal~${over.submitId ?? 'int1'}`,
      deferReply: vi.fn(),
      editReply: vi.fn(),
      guild: over.guild === false ? null : { name: 'Guild' },
      user: { tag: 'alice#0' },
      fields: { getTextInputValue: vi.fn(() => 'Please add dark mode') },
      client: {
        users: { fetch: vi.fn(async () => owner) },
        guilds: { fetch: vi.fn(async () => ({ roles: { fetch: vi.fn(async () => (over.devRole === false ? null : { toString: (): string => '@dev' })) } })) },
        channels: { fetch: vi.fn(async () => devChan) },
      },
    };
    const stub = slashStub({ extra: { awaitModalSubmit: vi.fn(resolvingModal(submit)) } });
    return {
      stub, submit, owner, devChan,
    };
  }

  it('forwards feedback to the owner and the developer channel', async () => {
    const f = modalFlow();
    expect(await dFeedback.execute(f.stub as never)).toBe(true);
    await flushPromises();
    expect(f.stub.showModal).toHaveBeenCalled();
    expect(JSON.stringify(f.owner.send.mock.calls[0][0])).toContain('alice#0 in Guild reports');
    expect(JSON.stringify(f.devChan?.send.mock.calls[0][0])).toContain('New Feedback Report');
    expect(JSON.stringify(f.submit.editReply.mock.calls[0][0])).toContain('Thank you!');
  });

  it('labels feedback from DMs, ignores other modals, and stops when the developer role or channel is missing', async () => {
    const dm = modalFlow({ guild: false });
    await feedbackReportModal(dm.stub as never);
    await flushPromises();
    expect(JSON.stringify(dm.owner.send.mock.calls[0][0])).toContain('alice#0DM reports');
    const other = modalFlow({ submitId: 'else' });
    await feedbackReportModal(other.stub as never);
    await flushPromises();
    expect(other.submit.deferReply).not.toHaveBeenCalled();
    const noRole = modalFlow({ devRole: false });
    await feedbackReportModal(noRole.stub as never);
    await flushPromises();
    expect(noRole.submit.editReply).not.toHaveBeenCalled();
    const noChan = modalFlow({ devChannel: false });
    await feedbackReportModal(noChan.stub as never);
    await flushPromises();
    expect(noChan.submit.editReply).not.toHaveBeenCalled();
  });
});

describe('Translate (message command)', () => {
  it('translates the selected message', async () => {
    mocks.aiTranslate.mockResolvedValue({ response: 'Hello', promptTokens: 1, completionTokens: 1 });
    const stub = { ...slashStub(), targetMessage: { content: 'Hola' } };
    expect(await mTranslate.execute(stub as never)).toBe(true);
    expect(mocks.aiTranslate).toHaveBeenCalledWith('English', [{ role: 'user', content: 'Hola' }]);
    expect(JSON.stringify(lastReply(stub))).toContain('Hello');
  });

  it('does nothing outside guilds', async () => {
    const stub = { ...slashStub({ guild: null }), targetMessage: { content: 'x' } };
    expect(await mTranslate.execute(stub as never)).toBe(false);
  });
});

describe('remind_me', () => {
  const reminders = (n: number) => Array.from({ length: n }, (_, i) => ({ index: i, date: new Date('2030-01-01'), value: `reminder ${i}` }));
  const embedOf = (stub: ReturnType<typeof slashStub>) => (lastReply(stub).embeds as Array<{ data: { title?: string; description?: string; fields?: unknown[] } }>)[0].data;

  it('sets reminders from a duration offset', async () => {
    mocks.remindMe.mockResolvedValue(null);
    const stub = slashStub({ subcommand: 'set', options: { reminder: 'drink water', offset: '1h' } });
    expect(await dRemindme.execute(stub as never)).toBe(true);
    const when = mocks.remindMe.mock.calls[0][4] as Date;
    expect(when.getTime() - Date.now()).toBeGreaterThan(3_590_000);
    expect(embedOf(stub).description).toContain('I will remind you: drink water');
  });

  it('deletes reminders and echoes the result', async () => {
    mocks.remindMe.mockResolvedValue('I deleted: x');
    const stub = slashStub({ subcommand: 'delete', options: { record: 0 } });
    await dRemindme.execute(stub as never);
    expect(lastReply(stub).content).toBe('I deleted: x');
  });

  it('lists reminders, handling empty results', async () => {
    mocks.remindMe.mockResolvedValue(reminders(3));
    const some = slashStub({ subcommand: 'get' });
    await dRemindme.execute(some as never);
    expect(embedOf(some).fields).toHaveLength(3);
    mocks.remindMe.mockResolvedValue('no reminders');
    const none = slashStub({ subcommand: 'get' });
    expect(await dRemindme.execute(none as never)).toBe(false);
    expect(embedOf(none).description).toContain('You have no reminders');
    mocks.remindMe.mockResolvedValue(null);
    const nothing = slashStub({ subcommand: 'get' });
    await dRemindme.execute(nothing as never);
    expect(embedOf(nothing).title).toBe('No reminders!');
  });

  it('paginates more than 24 reminders', async () => {
    mocks.remindMe.mockResolvedValue(reminders(30));
    const stub = slashStub({ subcommand: 'get' });
    await dRemindme.execute(stub as never);
    expect(mocks.paginate).toHaveBeenCalledWith(stub, expect.arrayContaining([expect.anything(), expect.anything()]));
    mocks.paginate.mockClear();
    mocks.remindMe.mockResolvedValue(reminders(24 * 2 + 1));
    await dRemindme.execute(slashStub({ subcommand: 'get' }) as never);
    expect((mocks.paginate.mock.calls[0][1] as unknown[]).length).toBe(3);
    mocks.paginate.mockClear();
    mocks.remindMe.mockResolvedValue(reminders(48));
    await dRemindme.execute(slashStub({ subcommand: 'get' }) as never);
    expect((mocks.paginate.mock.calls[0][1] as unknown[]).length).toBe(2);
  });
});
