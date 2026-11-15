import { readdirSync, readFileSync } from 'node:fs';
import { matchesGlob } from 'node:path';

const properties = Object.fromEntries(readFileSync('sonar-project.properties', 'utf8')
  .split(/\r?\n/)
  .filter(line => line.includes('=') && !line.startsWith('#'))
  .map(line => {
    const separator = line.indexOf('=');
    return [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
  }));
const patterns = (key: string) => properties[key].split(',');
const matches = (file: string, globs: string[]) => globs.some(glob => matchesGlob(file, glob));
const coverageConfig = readFileSync('vitest.config.mts', 'utf8').split('    coverage: {')[1];
const coveragePatterns = (key: string) => {
  const block = coverageConfig.split(`      ${key}: [`)[1].split('      ],')[0];
  return Array.from(block.matchAll(/'([^']+)'/g), match => match[1]);
};

describe('Sonar coverage scope', () => {
  it('matches Vitest coverage for application TypeScript files', () => {
    const included = coveragePatterns('include');
    const excluded = coveragePatterns('exclude');
    const mismatches = readdirSync('src', { recursive: true })
      .map(file => `src/${file.toString().replaceAll('\\', '/')}`)
      .filter(file => file.endsWith('.ts') && !file.endsWith('.d.ts'))
      .filter(file => !matches(file, patterns('sonar.test.inclusions')))
      .filter(file => {
        const vitest = matches(file, included) && !matches(file, excluded);
        const sonar = !matches(file, patterns('sonar.exclusions'))
          && !matches(file, patterns('sonar.coverage.exclusions'));
        return vitest !== sonar;
      });
    expect(mismatches).toEqual([]);
  });

  it('classifies colocated tests and shared test infrastructure separately from sources', () => {
    [
      'src/api/app.gaps.test.ts',
      'src/discord/tests/global/command.test.ts',
      'src/vitest/setup/globals.setup.ts',
      'src/irc/tests/bridge.test.ts',
    ].forEach(file => {
      expect(matches(file, patterns('sonar.test.inclusions'))).toBe(true);
      expect(matches(file, patterns('sonar.exclusions'))).toBe(true);
    });
  });
});
