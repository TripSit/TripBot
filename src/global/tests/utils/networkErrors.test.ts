import {
  describeError, findErrorCode, isPreSendFailure, redactDiscordUrl,
} from '../../utils/networkErrors';

const V6 = '2606:4700::1';
const ENETUNREACH = 'ENETUNREACH';
const withCode = (message: string, code: string, extra: object = {}) => (
  Object.assign(new Error(message), { code, ...extra })
);

describe('networkErrors', () => {
  it('recognises a connect timeout and reads its code', () => {
    const err = withCode('Connect Timeout Error (attempted address: discord.com:443)', 'UND_ERR_CONNECT_TIMEOUT');
    expect(isPreSendFailure(err)).toBe(true);
    expect(findErrorCode(err)).toBe('UND_ERR_CONNECT_TIMEOUT');
  });

  it('finds codes in a cause chain and in AggregateError members', () => {
    const wrapped = new TypeError('fetch failed', { cause: withCode('lookup', 'EAI_AGAIN') });
    expect(findErrorCode(wrapped)).toBe('EAI_AGAIN');
    const aggregate = Object.assign(new Error('all failed'), {
      errors: [withCode('v6', ENETUNREACH, { address: V6 }), withCode('v4', 'ETIMEDOUT')],
    });
    expect(findErrorCode(aggregate)).toBe(ENETUNREACH);
  });

  it('does not treat a reset or API error as a pre-send failure', () => {
    expect(isPreSendFailure(withCode('reset', 'ECONNRESET'))).toBe(false);
    expect(isPreSendFailure('nope')).toBe(false);
    expect(isPreSendFailure(undefined)).toBe(false);
  });

  it('describes every address and cause', () => {
    const aggregate = Object.assign(new Error('all failed'), {
      errors: [
        withCode('v6', ENETUNREACH, { address: V6 }),
        withCode('v4', 'ETIMEDOUT', { address: '162.159.0.1' }),
      ],
    });
    const text = describeError(new Error('fetch failed', { cause: aggregate }));
    expect(text).toContain(V6);
    expect(text).toContain('162.159.0.1');
    expect(text).toContain('[ENETUNREACH]');
  });

  it('redacts webhook and interaction tokens and drops the query', () => {
    expect(redactDiscordUrl('https://discord.com/api/v10/webhooks/123/secrettoken?wait=true'))
      .toBe('/webhooks/123/<token>');
    expect(redactDiscordUrl('https://discord.com/api/v10/interactions/9/abc/callback'))
      .toBe('/interactions/9/<token>/callback');
    expect(redactDiscordUrl('https://discord.com/api/v10/channels/5/messages')).toBe('/channels/5/messages');
  });
});
