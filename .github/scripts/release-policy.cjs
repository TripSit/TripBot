'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const SHA = /^[a-f0-9]{40}$/;
const WRITE = new Set(['admin', 'maintain', 'write']);
function requireThat(condition, message) {
  if (!condition) throw new Error(message);
}
function candidate(pr, repository, uat, reviewed) {
  requireThat(pr.state === 'open' && !pr.draft, 'Promotion PR must be open and ready.');
  requireThat(pr.base.ref === 'main' && pr.head.ref === 'uat', 'Only uat -> main can be promoted.');
  requireThat(pr.head.repo?.full_name === repository && pr.base.repo.full_name === repository,
    'Promotion must use the canonical repository.');
  requireThat(SHA.test(uat) && pr.head.sha === uat && reviewed === uat,
    'Approval, PR head, and current UAT must identify the same commit.');
  return uat;
}
function successfulRun(runs, sha) {
  const run = runs.filter(r => r.head_sha === sha && r.event === 'push' && r.head_branch === 'uat')
    .sort((a, b) => b.id - a.id)[0];
  requireThat(run?.status === 'completed' && run.conclusion === 'success',
    'The latest UAT push validation must have succeeded for this exact commit.');
  return run;
}
function droneStatus(statuses, repository, actorId) {
  const expected = new RegExp(`^https://drone\\.tripsit\\.io/${repository}/[0-9]+/?$`, 'i');
  return statuses.filter(s => ['continuous-integration/drone/push', 'continuous-integration/drone/custom'].includes(s.context) &&
    s.creator?.id === actorId && expected.test(s.target_url || ''))
    .sort((a, b) => b.id - a.id)[0];
}
function evidence(deployment, status, sha, run, drone) {
  requireThat(deployment?.sha === sha && deployment.environment === 'uat' &&
    deployment.creator?.login === 'github-actions[bot]', 'Missing trusted UAT deployment evidence.');
  const payload = typeof deployment.payload === 'string' ? JSON.parse(deployment.payload) : deployment.payload;
  requireThat(payload?.schema === 'tripsit-uat-v1' && payload.validation_run === run.id &&
    payload.validation_attempt === run.run_attempt && payload.drone_status === drone?.id &&
    drone?.state === 'success', 'Deployment evidence is stale or belongs to a different validation/build.');
  requireThat(status?.state === 'success' && status.creator?.login === 'github-actions[bot]',
    'UAT deployment has not succeeded.');
}
function latestReviews(reviews) {
  const latest = new Map();
  for (const review of [...reviews].sort((a, b) => a.id - b.id)) {
    // A comment is not a replacement for an approval or a request for changes.
    if (review.state !== 'COMMENTED' && review.state !== 'PENDING') latest.set(review.user.login, review);
  }
  return [...latest.values()];
}
async function trustedApprovals(reviews, sha, author, permission) {
  const trusted = [];
  for (const review of latestReviews(reviews)) {
    if (review.user?.type !== 'User') continue;
    if (!WRITE.has(await permission(review.user.login))) continue;
    requireThat(review.state !== 'CHANGES_REQUESTED', 'An authorized reviewer has requested changes.');
    if (review.state === 'APPROVED' && review.commit_id === sha && review.user.login !== author) trusted.push(review);
  }
  requireThat(trusted.length > 0, 'A current approval from an independent repository writer is required.');
  return trusted;
}

function client(github, context) {
  const repo = context.repo;
  const repository = `${repo.owner}/${repo.repo}`;
  const config = JSON.parse(fs.readFileSync('.github/cicd.json', 'utf8'));
  const pages = (method, params = {}) => github.paginate(method, { ...repo, per_page: 100, ...params });
  const permission = async username => {
    const { data } = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username });
    return data.permission;
  };
  const ref = async branch => (await github.rest.git.getRef({ ...repo, ref: `heads/${branch}` })).data.object.sha;
  const checks = async sha => {
    const run = successfulRun(await pages(github.rest.actions.listWorkflowRuns,
      { workflow_id: 'PushToUat.yml', branch: 'uat', event: 'push', head_sha: sha }), sha);
    const jobs = await pages(github.rest.actions.listJobsForWorkflowRun, { run_id: run.id, filter: 'latest' });
    for (const name of config.uat_checks) {
      const matches = jobs.filter(j => j.name === name);
      requireThat(matches.length === 1 && matches[0].conclusion === 'success', `Missing or failed UAT check: ${name}`);
    }
    return run;
  };
  const drone = async sha => droneStatus(await pages(github.rest.repos.listCommitStatusesForRef, { ref: sha }),
    repository, config.drone_actor_id);
  const security = async sha => {
    const analyses = await pages('GET /repos/{owner}/{repo}/code-scanning/analyses',
      { ref: 'refs/heads/uat', tool_name: 'CodeQL' });
    const latest = analyses.sort((a, b) => b.id - a.id)[0];
    requireThat(latest?.commit_sha === sha && !latest.error,
      'A successful CodeQL branch analysis is required for the candidate.');
    const alerts = await pages('GET /repos/{owner}/{repo}/code-scanning/alerts',
      { ref: 'refs/heads/uat', state: 'open', tool_name: 'CodeQL' });
    requireThat(!alerts.some(a => a.rule?.severity === 'error' ||
      ['high', 'critical'].includes(a.rule?.security_severity_level)),
      'CodeQL reports blocking errors or high/critical security findings.');
  };
  const deployment = async sha => {
    // Use the latest environment attempt, not any older successful attempt for this SHA.
    const deployments = await pages(github.rest.repos.listDeployments, { environment: 'uat' });
    const latest = deployments.sort((a, b) => b.id - a.id)[0];
    requireThat(latest?.sha === sha, 'The latest recorded UAT deployment is not this candidate.');
    const statuses = await pages(github.rest.repos.listDeploymentStatuses, { deployment_id: latest.id });
    return { deployment: latest, status: statuses.sort((a, b) => b.id - a.id)[0] };
  };
  return { github, context, config, repo, repository, pages, permission, ref, checks, drone, security, deployment };
}

async function verify(c, prNumber, reviewed) {
  const pr = (await c.github.rest.pulls.get({ ...c.repo, pull_number: prNumber })).data;
  const sha = candidate(pr, c.repository, await c.ref('uat'), reviewed);
  const main = await c.ref('main');
  const comparison = (await c.github.rest.repos.compareCommitsWithBasehead({ ...c.repo,
    basehead: `${main}...${sha}` })).data;
  requireThat(comparison.status === 'ahead', 'Promotion must advance main by fast-forward.');
  const run = await c.checks(sha);
  await c.security(sha);
  const drone = await c.drone(sha);
  const deployed = await c.deployment(sha);
  evidence(deployed.deployment, deployed.status, sha, run, drone);
  const reviews = await c.pages(c.github.rest.pulls.listReviews, { pull_number: prNumber });
  await trustedApprovals(reviews, sha, pr.user.login, c.permission);
  let after = null;
  do {
    const data = await c.github.graphql(`query($owner:String!,$repo:String!,$number:Int!,$after:String) {
      repository(owner:$owner,name:$repo) { pullRequest(number:$number) {
        reviewThreads(first:100,after:$after) { nodes { isResolved } pageInfo { hasNextPage endCursor } }
      } } }`, { ...c.repo, number: prNumber, after });
    const threads = data.repository.pullRequest.reviewThreads;
    requireThat(threads.nodes.every(t => t.isResolved), 'Resolve all review conversations before promotion.');
    after = threads.pageInfo.hasNextPage ? threads.pageInfo.endCursor : null;
  } while (after);
  requireThat(await c.ref('uat') === sha && await c.ref('main') === main, 'Branches changed during verification.');
  return { sha, main, pr };
}

async function promote({ github, context, core }) {
  const c = client(github, context);
  const review = context.payload.review;
  requireThat(review?.state?.toLowerCase() === 'approved' && review.user?.type === 'User',
    'Promotion requires a human approval event.');
  requireThat(WRITE.has(await c.permission(review.user.login)), 'Review author must have repository write access.');
  const number = context.payload.pull_request.number;
  const before = await verify(c, number, review.commit_id);
  requireThat(process.env.PROMOTION_TOKEN, 'PROMOTION_BOT_TOKEN is not configured.');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tripsit-promotion-'));
  try {
    const askpass = path.join(directory, 'askpass.sh');
    fs.writeFileSync(askpass, '#!/bin/sh\ncase "$1" in *Username*) printf "%s" x-access-token;; *) printf "%s" "$PROMOTION_TOKEN";; esac\n', { mode: 0o700 });
    const git = args => execFileSync('git', args, { cwd: directory, encoding: 'utf8',
      env: { ...process.env, GIT_ASKPASS: askpass, GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    git(['init', '--quiet']);
    git(['remote', 'add', 'origin', `https://github.com/${c.repository}.git`]);
    git(['fetch', '--quiet', '--no-tags', 'origin', 'refs/heads/main:refs/remotes/origin/main',
      'refs/heads/uat:refs/remotes/origin/uat']);
    requireThat(git(['rev-parse', 'refs/remotes/origin/main']) === before.main &&
      git(['rev-parse', 'refs/remotes/origin/uat']) === before.sha, 'Branches changed before promotion.');
    git(['merge-base', '--is-ancestor', before.main, before.sha]);
    // Recheck reviews, reruns, deployment attempts, and both refs after acquiring objects.
    const current = await verify(c, number, review.commit_id);
    requireThat(current.main === before.main && current.sha === before.sha, 'Candidate changed.');
    git(['push', '--porcelain', `--force-with-lease=refs/heads/main:${before.main}`, 'origin',
      `${before.sha}:refs/heads/main`]);
    core.info(`Promoted verified UAT commit ${before.sha}.`);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

async function recordDeployment({ github, context, core }) {
  const c = client(github, context);
  const sha = context.payload.workflow_run?.head_sha || context.payload.sha;
  if (!SHA.test(sha || '') || await c.ref('uat') !== sha) return;
  let run;
  try { run = await c.checks(sha); } catch (error) { core.notice(error.message); return; }
  const drone = await c.drone(sha);
  if (!drone) { core.notice('Waiting for an authenticated UAT Drone deployment status.'); return; }
  const payload = { schema: 'tripsit-uat-v1', validation_run: run.id, validation_attempt: run.run_attempt,
    drone_status: drone.id, drone_url: drone.target_url };
  const existing = await c.pages(github.rest.repos.listDeployments, { sha, environment: 'uat' });
  const duplicate = existing.find(d => d.creator?.login === 'github-actions[bot]' &&
    JSON.stringify(d.payload) === JSON.stringify(payload));
  if (duplicate) return;
  const { data } = await github.rest.repos.createDeployment({ ...c.repo, ref: sha, environment: 'uat',
    auto_merge: false, required_contexts: [], production_environment: false, transient_environment: false,
    description: 'UAT Drone build and GitHub validation for an exact commit', payload });
  requireThat(data.id && data.sha === sha, 'GitHub did not create the requested deployment record.');
  const state = drone.state === 'success' ? 'success' : drone.state === 'pending' ? 'in_progress' : 'failure';
  await github.rest.repos.createDeploymentStatus({ ...c.repo, deployment_id: data.id, state,
    log_url: drone.target_url, ...(process.env.UAT_URL ? { environment_url: process.env.UAT_URL } : {}),
    auto_inactive: true, description: `Drone ${drone.state}; GitHub validation run ${run.id} passed` });
  core.info(`Recorded ${state} UAT evidence for ${sha}.`);
}

async function queueTrustedPR({ github, context, core, queueGraphql, expectedHead }) {
  const c = client(github, context);
  const pr = (await github.rest.pulls.get({ ...c.repo, pull_number: context.payload.pull_request.number })).data;
  if (pr.state !== 'open' || pr.draft || pr.base.ref !== 'uat' || pr.head.repo?.full_name !== c.repository) return;
  if (expectedHead && pr.head.sha !== expectedHead) return;
  if (pr.user.type !== 'User' || !WRITE.has(await c.permission(pr.user.login))) {
    core.notice('Automatic queue entry is limited to human authors with repository write access.'); return;
  }
  // Fail closed if rollout has not installed the native queue and required checks.
  const rules = await c.pages(github.rest.repos.getBranchRules, { branch: 'uat' });
  requireThat(rules.some(r => r.type === 'merge_queue'), 'UAT merge queue is not configured.');
  const required = rules.filter(r => r.type === 'required_status_checks').flatMap(r =>
    r.parameters.required_status_checks.map(s => s.context));
  requireThat(c.config.uat_checks.every(name => required.includes(name)), 'Required UAT checks are incomplete.');
  if (pr.auto_merge) return;
  const current = await github.graphql(`query($id:ID!) { node(id:$id) { ... on PullRequest {
    mergeStateStatus mergeQueueEntry { id } } } }`, { id: pr.node_id });
  if (current.node?.mergeQueueEntry) return;
  requireThat(typeof queueGraphql === 'function', 'Queue enrollment requires a scoped App token.');
  if (current.node?.mergeStateStatus === 'CLEAN') {
    await queueGraphql(`mutation($id:ID!,$sha:GitObjectID!) {
      enqueuePullRequest(input:{pullRequestId:$id,expectedHeadOid:$sha}) { mergeQueueEntry { id } }
    }`, { id: pr.node_id, sha: pr.head.sha });
  } else {
    await queueGraphql(`mutation($id:ID!,$sha:GitObjectID!) {
      enablePullRequestAutoMerge(input:{pullRequestId:$id,expectedHeadOid:$sha,mergeMethod:SQUASH}) {
        pullRequest { number } } }`, { id: pr.node_id, sha: pr.head.sha });
  }
  core.info(`Enabled merge-when-ready for trusted UAT PR #${pr.number}; GitHub enforces reviews and queue checks.`);
}

async function queueValidatedPRs({ github, context, core, queueGraphql }) {
  const c = client(github, context);
  const event = context.payload.workflow_run;
  requireThat(event?.id, 'A validation workflow run is required.');
  const run = (await github.rest.actions.getWorkflowRun({ ...c.repo, run_id: event.id })).data;
  requireThat(run.path === '.github/workflows/PullRequestOpenAll.yml' &&
    run.event === 'pull_request' && run.status === 'completed' && run.conclusion === 'success' &&
    run.head_repository?.full_name === c.repository && run.run_attempt === event.run_attempt &&
    SHA.test(run.head_sha), 'Only a completed canonical PR validation can enroll a queue entry.');
  const jobs = await c.pages(github.rest.actions.listJobsForWorkflowRun,
    { run_id: run.id, filter: 'latest' });
  requireThat(c.config.uat_checks.every(name => {
    const found = jobs.filter(job => job.name === name);
    return found.length === 1 && found[0].conclusion === 'success';
  }), 'All required PR validation jobs must succeed before queue enrollment.');
  const prs = await c.pages(github.rest.repos.listPullRequestsAssociatedWithCommit,
    { commit_sha: run.head_sha });
  for (const pr of prs) {
    await queueTrustedPR({ github, core, queueGraphql, expectedHead: run.head_sha,
      context: { ...context, payload: { ...context.payload, pull_request: { number: pr.number } } } });
  }
}

module.exports = { candidate, successfulRun, droneStatus, evidence, latestReviews, trustedApprovals,
  client, verify, promote, recordDeployment, queueTrustedPR, queueValidatedPRs };
