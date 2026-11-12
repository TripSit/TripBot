import About from '../../commands/g.about';

describe('About', () => {
  it('exposes identity and links', () => {
    expect(About.name).toBe('TripSit');
    expect(About.discord).toMatch(/^https:\/\/discord\.gg\//);
    expect(About.inviteUrl).toContain('oauth2/authorize');
  });

  it('interpolates links into descriptive text', () => {
    expect(About.description).toContain(About.discord);
    expect(About.feedback).toContain(About.github);
    expect(About.support).toContain(About.patreon);
    expect(About.support).toContain(About.kofi);
    expect(About.support).toContain(About.learnUrl);
    expect(About.tripsitSessionsDesc).toContain(About.tripsitSessionsDoc);
    expect(About.experienceDesc).toContain(About.levelingCalculator);
    expect(About.credits).toContain(About.github);
  });

  it('keeps the harm-reduction disclaimer and emergency guidance', () => {
    expect(About.disclaimer).toContain('not medical professionals');
    expect(About.disclaimer).toContain('medical emergency');
  });

  it('has setup guides for each guild system', () => {
    [About.applicationsDesc, About.techhelpDesc, About.ticketboothDesc, About.tripsitSessionsDesc].forEach(desc => {
      expect(desc).toContain('How do I set it up?');
    });
    expect(About.botInfo).toContain('TripBot');
    expect(About.inviteInfo).toContain('TripBot');
    expect(About.privacy).toContain('/privacy');
  });
});
