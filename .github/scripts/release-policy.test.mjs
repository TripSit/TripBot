import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { test } = await import(process.env.VITEST ? 'vitest' : 'node:test');
const assert = require('node:assert/strict');
const policy = require('./release-policy.cjs');
const sha = 'a'.repeat(40);
const old = 'b'.repeat(40);
const repository = 'TripSit/website';
const pr = () => ({ state: 'open', draft: false, number: 1, node_id: 'PR_1',
  user: { login: 'author', type: 'User' },
  head: { ref: 'uat', sha, repo: { full_name: repository } },
  base: { ref: 'main', repo: { full_name: repository } } });
const run = () => ({ id: 1, head_sha: sha, head_branch: 'uat', event: 'push',
  status: 'completed', conclusion: 'success', run_attempt: 1 });
const drone = () => ({ id: 2, context: 'continuous-integration/drone/push', state: 'success',
  creator: { id: 1836049 }, target_url: `https://drone.tripsit.io/${repository}/123` });
const deployment = () => ({ id: 3, sha, environment: 'uat', creator: { login: 'github-actions[bot]' },
  payload: { schema: 'tripsit-uat-v1', validation_run: 1, validation_attempt: 1, drone_status: 2 } });
const status = () => ({ id: 4, state: 'success', creator: { login: 'github-actions[bot]' } });
const approval = () => ({ id: 5, state: 'APPROVED', commit_id: sha, user: { login: 'tester', type: 'User' } });

test('only an open canonical current-commit promotion is accepted', () => {
  assert.equal(policy.candidate(pr(), repository, sha, sha), sha);
  for (const change of [p => { p.draft = true; }, p => { p.state = 'closed'; },
    p => { p.head.repo.full_name = 'someone/website'; }, p => { p.head.ref = 'feature'; },
    p => { p.base.ref = 'uat'; }, p => { p.head.sha = old; }]) {
    const p = pr(); change(p);
    assert.throws(() => policy.candidate(p, repository, sha, sha));
  }
  assert.throws(() => policy.candidate(pr(), repository, old, sha));
  assert.throws(() => policy.candidate(pr(), repository, sha, old));
});

test('an old green run cannot hide a newer failed, cancelled, or pending run', () => {
  for (const conclusion of ['failure', 'cancelled', 'skipped', null]) {
    assert.throws(() => policy.successfulRun([run(), { ...run(), id: 9, conclusion }], sha));
  }
  assert.throws(() => policy.successfulRun([{ ...run(), status: 'in_progress' }], sha));
  assert.throws(() => policy.successfulRun([{ ...run(), event: 'pull_request' }], sha));
  assert.throws(() => policy.successfulRun([{ ...run(), head_sha: old }], sha));
});

test('Drone evidence authenticates the actor, repository, UAT host and latest attempt', () => {
  const good = drone();
  const bad = [{ ...good, id: 8, target_url: 'https://drone.tripsit.me/TripSit/website/10' },
    { ...good, id: 9, creator: { id: 7 } },
    { ...good, id: 10, target_url: 'https://drone.tripsit.io/other/website/11' },
    { ...good, id: 11, target_url: 'https://drone.tripsit.io.evil.test/TripSit/website/11' }];
  assert.equal(policy.droneStatus([good, ...bad], repository, 1836049), good);
  const pending = { ...good, id: 12, state: 'pending' };
  assert.equal(policy.droneStatus([good, pending], repository, 1836049), pending);
  const custom = { ...good, id: 13, state: 'failure', context: 'continuous-integration/drone/custom' };
  assert.equal(policy.droneStatus([good, custom], repository, 1836049), custom);
});

test('deployment evidence rejects missing, forged, stale and failed records', () => {
  assert.doesNotThrow(() => policy.evidence(deployment(), status(), sha, run(), drone()));
  for (const change of [d => { d.sha = old; }, d => { d.environment = 'production'; },
    d => { d.creator.login = 'author'; }, d => { d.payload.validation_run = 9; },
    d => { d.payload.validation_attempt = 2; }, d => { d.payload.drone_status = 99; }]) {
    const d = deployment(); change(d);
    assert.throws(() => policy.evidence(d, status(), sha, run(), drone()));
  }
  for (const state of ['pending', 'failure', 'inactive', 'error']) {
    assert.throws(() => policy.evidence(deployment(), { ...status(), state }, sha, run(), drone()));
  }
  assert.throws(() => policy.evidence(deployment(), status(), sha, run(), { ...drone(), state: 'failure' }));
});

test('approval must be current, independent, authorized and not dismissed', async () => {
  const permission = async user => user === 'outsider' ? 'read' : 'write';
  await policy.trustedApprovals([approval()], sha, 'author', permission);
  for (const review of [{ ...approval(), commit_id: old }, { ...approval(), state: 'DISMISSED' },
    { ...approval(), user: { login: 'outsider' } }, { ...approval(), user: { login: 'author' } }]) {
    await assert.rejects(policy.trustedApprovals([review], sha, 'author', permission));
  }
  await assert.rejects(policy.trustedApprovals([approval(), { ...approval(), id: 6, state: 'CHANGES_REQUESTED' }],
    sha, 'author', permission));
  await assert.rejects(policy.trustedApprovals([approval(), { ...approval(), id: 6, state: 'DISMISSED' }],
    sha, 'author', permission));
  assert.equal(policy.latestReviews([approval(), { ...approval(), id: 6, state: 'COMMENTED' }])[0].state, 'APPROVED');
});

function mockClient(overrides = {}) {
  const data = { pr: pr(), run: run(), drone: drone(), deployment: deployment(), status: status(),
    reviews: [approval()], comparison: 'ahead', resolved: true, ...overrides };
  const reviewsMethod = () => {};
  const c = {
    repo: { owner: 'TripSit', repo: 'website' }, repository,
    github: {
      rest: { pulls: { get: async () => ({ data: data.pr }), listReviews: reviewsMethod },
        repos: { compareCommitsWithBasehead: async () => ({ data: { status: data.comparison } }) } },
      graphql: async () => ({ repository: { pullRequest: { reviewThreads: {
        nodes: [{ isResolved: data.resolved }], pageInfo: { hasNextPage: false } } } } }),
    },
    ref: async branch => branch === 'main' ? old : sha,
    checks: async () => data.run,
    security: async () => {},
    drone: async () => data.drone,
    deployment: async () => ({ deployment: data.deployment, status: data.status }),
    pages: async method => { assert.equal(method, reviewsMethod); return data.reviews; },
    permission: async () => 'write',
  };
  return c;
}

test('promotion verification composes all gates and rejects unresolved threads and divergence', async () => {
  assert.equal((await policy.verify(mockClient(), 1, sha)).sha, sha);
  for (const comparison of ['behind', 'diverged', 'identical']) {
    await assert.rejects(policy.verify(mockClient({ comparison }), 1, sha));
  }
  await assert.rejects(policy.verify(mockClient({ resolved: false }), 1, sha));
  await assert.rejects(policy.verify(mockClient({ reviews: [] }), 1, sha));
  await assert.rejects(policy.verify(mockClient({ drone: { ...drone(), state: 'pending' } }), 1, sha));
  const c = mockClient(); let reads = 0;
  c.ref = async branch => branch === 'main' ? old : ++reads === 1 ? sha : old;
  await assert.rejects(policy.verify(c, 1, sha), /Branches changed/);
});

test('verification fails closed on API failures and never needs the promotion credential', async () => {
  const c = mockClient();
  c.checks = async () => { throw new Error('API unavailable'); };
  await assert.rejects(policy.verify(c, 1, sha), /API unavailable/);
});

function mockAPI(options = {}) {
  const config = require('../cicd.json');
  const writes = [];
  const notice = [];
  const currentPR = { ...pr(), base: { ref: 'uat', repo: { full_name: repository } },
    head: { sha, ref: 'feature', repo: { full_name: repository } }, ...options.pr };
  const method = data => async () => ({ data });
  const github = {
    rest: {
      git: { getRef: method({ object: { sha: options.uat || sha } }) },
      actions: {
        listWorkflowRuns: method({ workflow_runs: options.runs || [run()] }),
        listJobsForWorkflowRun: method({ jobs: config.uat_checks.map(name =>
          ({ name, conclusion: name === options.failedJob ? 'failure' : 'success' })) }),
      },
      repos: {
        getCollaboratorPermissionLevel: method({ permission: options.permission || 'write' }),
        getBranchRules: method(options.rules || [{ type: 'merge_queue' }, { type: 'required_status_checks',
          parameters: { required_status_checks: config.uat_checks.map(context => ({ context })) } }]),
        listCommitStatusesForRef: method(options.statuses || [drone()]),
        listDeployments: method(options.deployments || []),
        createDeployment: async input => { writes.push(input); return { data: { id: 10, sha } }; },
        createDeploymentStatus: async input => { writes.push(input); return { data: {} }; },
      },
      pulls: { get: method(currentPR) },
    },
    paginate: async (fn, params) => {
      if (typeof fn === 'string') {
        return fn.endsWith('/analyses') ? (options.analyses || [{ id: 1, commit_sha: sha, error: '' }]) :
          (options.alerts || []);
      }
      const { data } = await fn(params);
      return data.workflow_runs || data.jobs || data;
    },
    graphql: async (...args) => {
      if (args[0].startsWith('query')) return { node: {
        mergeStateStatus: options.mergeState || 'BLOCKED', mergeQueueEntry: options.inQueue ? { id: 'Q_1' } : null } };
      writes.push(args); return {};
    },
  };
  return { github, context: { repo: { owner: 'TripSit', repo: 'website' }, payload: {
    sha, pull_request: { number: 1 } } }, core: { notice: s => notice.push(s), info: () => {} }, writes, notice };
}

test('only trusted non-draft canonical human PRs can be automatically queued', async () => {
  const good = mockAPI();
  await policy.queueTrustedPR(good);
  assert.equal(good.writes.length, 1);
  for (const options of [{ permission: 'read' }, { pr: { draft: true } },
    { pr: { state: 'closed' } }, { pr: { user: { login: 'bot', type: 'Bot' } } },
    { pr: { head: { repo: { full_name: 'outsider/website' } } } },
    { pr: { base: { ref: 'main' } } }]) {
    const api = mockAPI(options);
    await policy.queueTrustedPR(api);
    assert.equal(api.writes.length, 0);
  }
});

test('queue entry fails closed when native queue or required checks are missing', async () => {
  for (const rules of [[], [{ type: 'merge_queue' }]]) {
    const api = mockAPI({ rules });
    await assert.rejects(policy.queueTrustedPR(api));
    assert.equal(api.writes.length, 0);
  }
});

test('ready PRs enter the native queue with a head-SHA lease and queued PRs are left alone', async () => {
  const ready = mockAPI({ mergeState: 'CLEAN' });
  await policy.queueTrustedPR(ready);
  assert.match(ready.writes[0][0], /enqueuePullRequest/);
  assert.equal(ready.writes[0][1].sha, sha);
  const waiting = mockAPI();
  await policy.queueTrustedPR(waiting);
  assert.match(waiting.writes[0][0], /enablePullRequestAutoMerge/);
  assert.equal(waiting.writes[0][1].sha, sha);
  const queued = mockAPI({ inQueue: true });
  await policy.queueTrustedPR(queued);
  assert.equal(queued.writes.length, 0);
});

test('deployment recorder binds authenticated Drone status to the exact CI run and SHA', async () => {
  const api = mockAPI();
  await policy.recordDeployment(api);
  assert.equal(api.writes.length, 2);
  assert.equal(api.writes[0].ref, sha);
  assert.equal(api.writes[0].payload.drone_status, 2);
  assert.equal(api.writes[0].payload.validation_run, 1);
  assert.equal(api.writes[1].state, 'success');
  for (const options of [{ uat: old }, { failedJob: 'SonarScan' },
    { statuses: [{ ...drone(), creator: { id: 7 } }] },
    { runs: [{ ...run(), conclusion: 'failure' }] }]) {
    const blocked = mockAPI(options);
    await policy.recordDeployment(blocked);
    assert.equal(blocked.writes.length, 0);
  }
});

test('new pending and failed Drone attempts cannot reuse previous successful evidence', async () => {
  for (const state of ['pending', 'failure']) {
    const api = mockAPI({ statuses: [drone(), { ...drone(), id: 20, state }] });
    await policy.recordDeployment(api);
    assert.equal(api.writes[0].payload.drone_status, 20);
    assert.equal(api.writes[1].state, state === 'pending' ? 'in_progress' : 'failure');
  }
});

test('CodeQL upload success is insufficient when the analysis or its security findings fail', async () => {
  const good = mockAPI();
  await policy.client(good.github, good.context).security(sha);
  for (const options of [{ analyses: [] }, { analyses: [{ id: 1, commit_sha: old }] },
    { analyses: [{ id: 1, commit_sha: sha, error: 'analysis failed' }] },
    { alerts: [{ rule: { severity: 'error' } }] },
    ...['high', 'critical'].map(severity => ({ alerts: [{ rule: { security_severity_level: severity } }] }))]) {
    const blocked = mockAPI(options);
    await assert.rejects(policy.client(blocked.github, blocked.context).security(sha));
    assert.equal(blocked.writes.length, 0);
  }
});

test('bot and unidentified reviews cannot authorize production, even with write permission', async () => {
  for (const type of ['Bot', undefined]) {
    const bot = { ...approval(), user: { login: 'automation', type } };
    await assert.rejects(policy.trustedApprovals([bot], sha, 'author', async () => 'write'));
    const valid = await policy.trustedApprovals([bot, approval()], sha, 'author', async () => 'write');
    assert.equal(valid.length, 1);
    assert.equal(valid[0].user.login, 'tester');
  }
});
