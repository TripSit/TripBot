import { describeError, findErrorCode, redactDiscordUrl } from '../../utils/networkErrors';

describe('networkErrors edge cases', () => {
  it('describes non-objects as strings', () => {
    expect(describeError('plain')).toBe('plain');
    expect(describeError(undefined)).toBe('undefined');
  });

  it('stops following causes after the depth limit', () => {
    let err: Error = new Error('leaf');
    for (let i = 0; i < 10; i += 1) err = new Error(`level${i}`, { cause: err });
    const text = describeError(err);
    expect(text).toContain('level9');
    expect(text).not.toContain('leaf');
    expect(findErrorCode(err)).toBeUndefined();
  });

  it('falls back to String() when the message is not a string, and shows addresses', () => {
    expect(describeError({ message: 42, code: 'ENOTFOUND', address: '1.2.3.4' })).toContain('[ENOTFOUND] (1.2.3.4)');
  });

  it('redacts relative paths that are not valid URLs', () => {
    expect(redactDiscordUrl('/api/v10/webhooks/123/secret?wait=true')).toBe('/webhooks/123/<token>');
  });
});
