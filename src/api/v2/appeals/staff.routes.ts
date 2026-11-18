import express, { Response, NextFunction } from 'express';
import { PermissionFlagsBits } from 'discord.js';
import RateLimit from 'express-rate-limit';
import keycloakAuth, { AuthenticatedRequest } from '../../middlewares/keycloakAuth';
import { decideStaffAppeal, listStaffAppeals, StaffAppealError } from './staff.queries';

const router = express.Router();
router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
});
router.use(keycloakAuth);

// Authentication alone never grants staff access. Fetch current guild membership on every request.
async function requireAppealStaff(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const discordId = req.user?.discord_id;
  if (!discordId) {
    res.status(403).json({ error: 'A linked Discord staff account is required' });
    return;
  }
  try {
    const guild = await discordClient.guilds.fetch(process.env.DISCORD_GUILD_ID);
    const member = await guild.members.fetch({ user: discordId, force: true });
    if (!member.permissions.has(PermissionFlagsBits.BanMembers)) {
      res.status(403).json({ error: 'Ban Members permission is required to review appeals' });
      return;
    }
    res.locals.staffGuild = guild;
    res.locals.staffMember = member;
    next();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 10007) {
      res.status(403).json({ error: 'Staff guild membership is required' });
      return;
    }
    res.status(503).json({ error: 'Unable to verify current staff permissions' });
  }
}
router.use(requireAppealStaff);
router.use(RateLimit({
  windowMs: 60_000,
  limit: 120,
  keyGenerator: req => (req as AuthenticatedRequest).user?.discord_id ?? 'unknown',
}));

router.get('/session', (_req, res) => res.json({
  canManageAppeals: true,
  displayName: res.locals.staffMember.displayName,
}));

router.get('/', async (req, res, next) => {
  const { status = 'RECEIVED', page = '0' } = req.query;
  if (typeof status !== 'string' || !['RECEIVED', 'ACCEPTED', 'DENIED'].includes(status)
      || typeof page !== 'string' || !/^\d{1,5}$/.test(page)) {
    res.status(400).json({ error: 'Invalid queue filter' });
    return;
  }
  try {
    const result = await listStaffAppeals(res.locals.staffGuild.id, status as 'RECEIVED' | 'ACCEPTED' | 'DENIED', Number(page));
    res.json(result);
  } catch (error) { next(error); }
});

const decisionLimiter = RateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: req => (req as AuthenticatedRequest).user?.discord_id ?? 'unknown',
});

router.post('/:appealId', decisionLimiter, async (req: AuthenticatedRequest, res, next) => {
  const { decision, responseMessage } = req.body ?? {};
  const { appealId } = req.params;
  if (typeof appealId !== 'string'
      || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(appealId)
      || !['ACCEPTED', 'DENIED'].includes(decision)
      || typeof responseMessage !== 'string' || !responseMessage.trim() || responseMessage.length > 2000) {
    res.status(400).json({ error: 'A valid appeal ID, decision and response (1–2000 characters) are required' });
    return;
  }
  try {
    // The actor comes exclusively from verified Keycloak identity, never from the request body.
    const result = await decideStaffAppeal(res.locals.staffGuild, appealId, decision, responseMessage.trim(), res.locals.staffMember.id);
    res.json(result);
  } catch (error) {
    if (error instanceof StaffAppealError) {
      res.status(error.status).json({ error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
