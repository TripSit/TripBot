import { MessageFlags } from 'discord.js';
import { aiCommand } from '../../commands/global/d.ai';
import { dbMock } from '../../../vitest/utils/mockDb';
import { slashStub } from '../../../vitest/utils/commandStubs';

const CONSENT_USER_ID = 'consent-user';

beforeEach(() => {
  dbMock.users.upsert.mockResolvedValue({ id: CONSENT_USER_ID } as never);
});

describe('AI consent controls without chat', () => {
  it('registers only terms and privacy subcommands', () => {
    const command = aiCommand.data.toJSON();
    expect(command.options?.map(option => option.name)).toEqual(['tos', 'privacy']);
  });

  it.each(['tos', 'privacy'])('displays %s privately without changing consent', async subcommand => {
    const stub = slashStub({ subcommand });
    expect(await aiCommand.execute(stub as never)).toBe(true);
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: MessageFlags.Ephemeral });
    expect(stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('agree:True') });
    expect(dbMock.ai_info.upsert).not.toHaveBeenCalled();
    expect(dbMock.ai_info.updateMany).not.toHaveBeenCalled();
    expect(dbMock.users.upsert).not.toHaveBeenCalled();
  });

  it.each([
    ['tos', 'ai_tos_agree'], ['privacy', 'ai_privacy_agree'],
  ])('saves only the selected %s agreement', async (subcommand, field) => {
    const stub = slashStub({ subcommand, options: { agree: true } });
    await aiCommand.execute(stub as never);
    expect(dbMock.ai_info.upsert).toHaveBeenCalledWith({
      where: { user_id: CONSENT_USER_ID },
      create: { user_id: CONSENT_USER_ID, [field]: expect.any(Date) },
      update: { [field]: expect.any(Date) },
    });
    expect(stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('agreement was saved') });
  });

  it.each([
    ['tos', 'ai_tos_agree'], ['privacy', 'ai_privacy_agree'],
  ])('revokes the selected %s agreement without creating a new consent record', async (subcommand, field) => {
    const stub = slashStub({ subcommand, options: { agree: false } });
    await aiCommand.execute(stub as never);
    expect(dbMock.ai_info.updateMany).toHaveBeenCalledWith({
      where: { user_id: CONSENT_USER_ID }, data: { [field]: null },
    });
    expect(dbMock.ai_info.upsert).not.toHaveBeenCalled();
    expect(stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('agreement was revoked') });
  });

  it('honors an explicitly public response', async () => {
    const stub = slashStub({ subcommand: 'privacy', options: { ephemeral: false } });
    await aiCommand.execute(stub as never);
    expect(stub.deferReply).toHaveBeenCalledWith({ flags: undefined });
  });

  it('does not revive retired chat controls invoked from stale command definitions', async () => {
    const stub = slashStub({ subcommand: 'setup', options: { agree: true } });
    expect(await aiCommand.execute(stub as never)).toBe(false);
    expect(stub.editReply).toHaveBeenCalledWith({ content: expect.stringContaining('chat has been removed') });
    expect(dbMock.ai_info.upsert).not.toHaveBeenCalled();
  });
});
