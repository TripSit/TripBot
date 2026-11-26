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
    expect(About.support).toContain('/rpg Perks');
    expect(About.tripsitSessionsDesc).toContain(About.tripsitSessionsDoc);
    expect(About.experienceDesc).toContain(About.levelingCalculator);
    expect(About.credits).toContain(About.github);
  });

  it('keeps the harm-reduction disclaimer and emergency guidance', () => {
    expect(About.disclaimer).toContain('not medical professionals');
    expect(About.disclaimer).toContain('medical emergency');
  });

  it('discloses external storage, sharing, privacy controls and deletion limits', () => {
    expect(About.privacy).toContain('outside Discord');
    expect(About.privacy).toContain('only while the author has the IRC Bridge role');
    expect(About.privacy).toContain('Channels & Roles');
    expect(About.privacy).toContain('including queued messages');
    expect(About.privacy).not.toContain('/privacy bridge');
    expect(About.privacy).toContain('Nothing you write is sent to an AI provider');
    expect(About.privacy).toContain('RPG flair is reviewed locally');
    expect(About.privacy).toContain('month and day only, never a year');
    expect(About.privacy).toContain('purged automatically');
    expect(About.privacy).toContain('never your Discord identity');
    expect(About.privacy).toContain('We do not send promotional DMs');
    expect(About.privacy).toContain('or delete ordinary Discord messages');
    expect(About.privacy).toContain('TripBot has no AI features');
    expect(About.privacy).toContain('never used to train AI models');
    expect(About.privacy).not.toContain('/ai');
    expect(About.privacy).not.toContain('consent');
    expect(About.privacy).toContain('removes the IRC Bridge role');
    expect(About.privacy).toContain('moderation history');
    expect(About.privacy).toContain('messages containing your Discord ID in TripBot');
    expect(About.privacy).toContain(About.botEmail);
    expect(About.privacy).not.toContain('never sell or share');
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
