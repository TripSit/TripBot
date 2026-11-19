import fs from 'fs';
import path from 'path';
import { parseDoseValue } from '../../utils/updateDb';

vi.mock('graphql-request', () => ({ GraphQLClient: vi.fn() }));

type DoseTable = Record<string, { formatted_dose?: Record<string, Record<string, string>> }>;

describe('parseDoseValue', () => {
  it('spaces the unit on plain doses and ranges', () => {
    expect(parseDoseValue('10mg')).toBe('10 mg');
    expect(parseDoseValue('10-20mg')).toBe('10-20 mg');
    expect(parseDoseValue('7.5-15ug.')).toBe('7.5-15 ug');
    expect(parseDoseValue(' 5 ')).toBe('5 ');
  });

  it.each([
    ['200mg+', '200mg+'],
    ['100-200ug+', '100-200ug+'],
    ['100+mg', '100+mg'],
    ['25-35+mg', '25-35+mg'],
    ['50mg-70mg', '50mg-70mg'],
    ['150mg-300mg+', '150mg-300mg+'],
    ['750ug-1mg', '750ug-1mg'],
    ['7.5-15mg/kg', '7.5-15mg/kg'],
    ['150mg+.', '150mg+'],
  ])('keeps the TripSit wording of %s', (source, expected) => {
    expect(parseDoseValue(source)).toBe(expected);
  });

  it('handles long dotted input without changing meaningful dose text', () => {
    expect(parseDoseValue(`10mg${'.'.repeat(100_000)}`)).toBe('10 mg');
    const source = `10${'.'.repeat(100_000)}mg`;
    expect(parseDoseValue(source)).toBe(source);
    expect(parseDoseValue('.'.repeat(100_000))).toBeNull();
  });

  it('returns null when there is no number', () => {
    expect(parseDoseValue('unknown')).toBeNull();
    expect(parseDoseValue('')).toBeNull();
  });

  it('never loses a "+", unit or upper bound for any bundled TripSit dose', () => {
    const db = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'assets/data/tripsitDB.json'), 'utf8')) as DoseTable;
    const squash = (text: string) => text.replace(/\s+/g, '').replace(/\.+$/, '');
    let checked = 0;
    Object.values(db).forEach(drug => {
      Object.values(drug.formatted_dose ?? {}).forEach(strengths => {
        Object.entries(strengths).forEach(([strength, source]) => {
          const parsed = parseDoseValue(source);
          if (strength.toLowerCase() === 'note' || parsed === null) return;
          checked += 1;
          expect(squash(parsed), source).toBe(squash(source).replace(/^0+(?=\d)/, ''));
        });
      });
    });
    expect(checked).toBeGreaterThan(1000);
  });
});
