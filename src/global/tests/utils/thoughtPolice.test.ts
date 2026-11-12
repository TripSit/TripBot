import { bigBrother } from '../../utils/thoughtPolice';

describe('bigBrother', () => {
  it.each([
    ['nazi', 'offensive'],
    ['suicide', 'harm'],
    ['overdose', 'harm'],
    ['porn', 'horny'],
    ['murder', 'pg13'],
    ['yolo', 'meme'],
    ['good morning everyone', 'none'],
    ['', 'none'],
  ])('classifies %j as %s', async (text, expected) => {
    expect(await bigBrother(text)).toBe(expected);
  });

  it('catches spacing, punctuation and leetspeak evasion', async () => {
    expect(await bigBrother('s.u.i.c.i.d.e')).toBe('harm');
    expect(await bigBrother('p o r n')).toBe('horny');
    expect(await bigBrother('Y0L0')).toBe('meme');
  });

  it('matches inside longer sentences', async () => {
    expect(await bigBrother('he was talking about suicide yesterday')).toBe('harm');
  });

  it('prefers the most severe category when several match', async () => {
    expect(await bigBrother('nazi porn yolo')).toBe('offensive');
    expect(await bigBrother('suicide porn')).toBe('harm');
    expect(await bigBrother('porn murder yolo')).toBe('horny');
    expect(await bigBrother('murder yolo')).toBe('pg13');
  });
});
