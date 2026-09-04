import { dIdose } from '../../commands/global/d.idose';

// Proves the '@db/tripbot' path alias (used across ~28 source files) resolves at test
// runtime under Vitest's native tsconfig-paths support.
describe('d.idose module resolution', () => {
  it('loads without alias resolution errors', () => {
    expect(dIdose.data.name).toBe('idose');
  });
});
