# Verified UAT delivery and promotion

The shared control files in website and TripBot must match. The application build/test commands,
Node versions, Docker targets, runtime configuration, and repository-specific integrations differ.
The `AGENTS.md` rule requires applying shared changes to both repositories in the same task.

## Delivery contract

1. A human with repository write access opens a non-draft same-repository PR to `uat`.
   `Queue trusted UAT PR` enables merge-when-ready only if a native merge queue and every required
   check are installed. Fork and bot PRs are not automatically opted in.
2. GitHub requires Lint, Build, Test, Docker Build, CodeQL (javascript), SonarScan,
   Release policy tests, and CI Passed. Every dependency of CI Passed must succeed; a skipped job
   does not count. CodeQL errors and high/critical security findings also block merging.
3. Ordinary application changes need no approval. Changes owned by `.github/CODEOWNERS`, including
   workflows, dependency manifests, scanner/test settings, and deployment controls, still need
   an independent code-owner review. Review conversations must be resolved.
4. The native queue tests combined code with `merge_group` and squash-merges only successful
   candidates. It replaces automatic merging of UAT into every feature branch.
5. A push to UAT starts its normal validation and Drone deployment. The evidence observer does not
   start deployments. It records a GitHub `uat` deployment only after exact-SHA push validation
   passes and an authenticated UAT Drone status is available. It binds the record to the CI run,
   rerun attempt, and latest Drone status ID. Pending and failed deployment attempts are recorded
   as such, not silently replaced by an older success.
6. A team member tests UAT and approves the bot-authored `uat` -> `main` PR at its current commit.
   The controller retries after evidence arrives if approval preceded deployment completion.
   New UAT commits invalidate the sign-off. If UAT advances during testing, test and approve the
   new candidate. A busy team may instead need a frozen release-candidate environment.
7. The trusted controller checks the current canonical PR, exact reviewed SHA, current UAT/main
   refs, the latest successful push validation and all its checks, CodeQL findings, latest UAT
   deployment evidence, current authorized independent approval, and resolved review threads.
   It rechecks before pushing, verifies ancestry, and uses an expected-old-main lease.
   A separate ruleset with no bypass forbids deletion and non-fast-forward updates.
8. The promotion App alone can update main. Its token is short-lived and repository-scoped.
   The controller serializes promotions without cancelling an in-progress mutation. Main's
   existing push deployment remains responsible for production readiness and recovery.

## Prepare the dedicated promotion App

Use an organization-owned GitHub App named **TripSit Release Promotion**:

- Homepage: `https://github.com/TripSit`
- Webhooks: inactive; no callback or webhook service is needed.
- Repository permissions: Contents read/write, Workflows read/write, Metadata read.
  Workflows permission is necessary to promote commits that change workflow files.
- Install only on `TripSit/website` and `TripSit/TripBot`.

The equivalent registration manifest is [promotion-app-manifest.json](promotion-app-manifest.json).
Register it through the organization's [GitHub App settings](https://github.com/organizations/TripSit/settings/apps).
Record the numeric **App ID**, not its installation ID, and generate a private key.

Both repositories need a `production-promotion` environment with a custom branch policy allowing
only the `uat` branch. Do not allow PR merge refs, feature branches, tags, or wildcard branches.
The trusted controller runs on the default branch via workflow dispatch or workflow completion.
PR review events only dispatch that controller and never receive the App credential.

Store the private key directly from its downloaded file, never in chat, repository files, or logs:

```sh
gh secret set PROMOTION_APP_PRIVATE_KEY --repo TripSit/website --env production-promotion < /secure/path/private-key.pem
gh secret set PROMOTION_APP_PRIVATE_KEY --repo TripSit/TripBot --env production-promotion < /secure/path/private-key.pem
```

The rollout script sets the `PROMOTION_APP_ID` repository variable during promotion activation.
The old `PROMOTION_BOT_TOKEN` is not used by the new controller. Remove that repository secret after
the new App path has been exercised successfully; do not copy its value into another workflow.

## Publish and validate before changing rules

Reconcile these changes onto the latest UAT in both repositories without including unrelated work.
Publish through reviewed PRs under the existing protections. The added delivery-control files
are themselves sensitive and need independent review.

Before activating either phase, run:

```sh
node --test .github/scripts/release-policy.test.mjs
python3 .github/scripts/configure-cicd.test.py
actionlint .github/workflows/*.yml
```

The delivery-control unit tests are also required by CI. Workflow linting should be run with a
current actionlint release. No npm install or production access is needed by the unit tests.

The evidence recorder is active once published. The App-based promotion and automatic queue
entry are separately disabled unless their repository variables are explicitly `true`.
Existing deployments continue while rollout prerequisites are prepared.

Optional repository variable: `UAT_URL`, the actual service URL shown on the deployment record.
The evidence log always links to the authenticated UAT Drone build. The expected Drone GitHub
actor ID is in `.github/cicd.json`; change it only after verifying an integration migration.
The production Drone host and other repositories' statuses cannot satisfy UAT evidence.

## Phase one: verified promotion

First obtain a successful UAT push validation and recorded successful UAT deployment for the
current UAT commit. Resolve failing quality gates rather than omitting checks.

Preview the exact rules before applying them:

```sh
python3 .github/scripts/configure-cicd.py --repository TripSit/website --phase promotion --promotion-app-id APP_ID
python3 .github/scripts/configure-cicd.py --repository TripSit/TripBot --phase promotion --promotion-app-id APP_ID
```

Run the corresponding command with `--apply` only after reviewing the plan. It verifies that the
reviewed control files have landed on UAT, required checks have succeeded, current deployment
evidence exists, and the protected environment contains the App key. No live rule is changed
when a prerequisite fails. Configuration snapshots are written outside the repo under
`/tmp/tripsit-cicd-rollout` before mutations.

This phase installs independent branch invariants and App-only main updates, replaces superseded
classic main protection with the native Main ruleset, keeps human release approval, and enables
`CICD_PROMOTION_ENABLED`. The App bypasses the Main gate to perform the fast-forward, so the
controller explicitly revalidates every release requirement. It cannot bypass branch invariants.

Exercise a normal release and verify stale approvals, changed refs, failed checks, unresolved
threads, pending/failed UAT deployments, and concurrent promotions are rejected. Successful
promotion must trigger the production deployment for the exact approved source revision.

## Phase two: required checks and trusted automatic queue entry

After phase one works, preview and apply queue settings separately:

```sh
python3 .github/scripts/configure-cicd.py --repository TripSit/website --phase queue
python3 .github/scripts/configure-cicd.py --repository TripSit/TripBot --phase queue
# Repeat each reviewed command with --apply to activate it.
```

The script refuses this phase unless verified promotion is enabled. It installs the native UAT
merge queue, required checks and CodeQL thresholds, sensitive-path code-owner review, and no
UAT bypass. It removes only superseded classic UAT status-check requirements, enables repository
auto-merge, changes default workflow permissions to read, retains GitHub Actions PR creation, and finally
leaves `CICD_QUEUE_ENABLED=false` for the manual trial. Build concurrency and merge group size start at one.

Trial a trusted ordinary PR and a sensitive-file PR. Verify that draft/fork/bot PRs are not
automatically queued, a sensitive PR waits for a code owner, failed/skipped checks block the
queue, every required check runs on `merge_group`, and an accepted merge triggers both UAT push
validation and Drone deployment. Do not consider rollout accepted until this real event chain works. Then rerun the queue command
with `--apply --activate-queue`; it requires a successful real merge-group run with every required
check before setting `CICD_QUEUE_ENABLED=true`.

## Disable and recover

Set `CICD_QUEUE_ENABLED=false` to stop automatic opt-in and `CICD_PROMOTION_ENABLED=false` to stop
automatic production promotion. These flags do not remove queued PRs or cancel a mutation already
in flight; remove queued entries explicitly when needed. Never weaken a required check to make
a failed release pass. A failed configuration API call stops the rollout; inspect the snapshot
and current rules before restoring settings. Keep the independent non-fast-forward/deletion
protection in place.

The existing Drone deployer is still the build/deploy system. Evidence proves authenticated
build success for a source revision and successful CI; it does not claim a signed image digest.
Building once and promoting the identical image, runtime configuration for website public
settings, production health evidence, and a rehearsed database-aware rollback remain separate
delivery improvements. TripBot startup can apply database migrations, so an image rollback alone
does not undo a migration. Continuous UAT advances can still race human testing; exact-SHA
approval and final ref checks reject observed movement, but do not atomically lock UAT and main.

GitHub couples Actions PR creation and approval in one repository setting. It remains enabled
for the promotion-PR updater; production verification rejects bot and unidentified reviews
even if an automation identity has write permission. Default workflow access is still read-only.

Automatic queue enrollment runs on successful `PullRequestOpen` completion using only trusted
UAT control files. It re-fetches the run, all required jobs, current PR head and human-author
permission. Reads use the read-only workflow token; only the expected-head enrollment mutation
uses a repository-scoped App token from the protected `production-promotion` environment.
The existing release App is reused, so its private key stays within the same trusted UAT
execution boundary; this queue controller is security-sensitive release infrastructure too.
It never checks out or executes PR code. UAT rules grant no App bypass.
Using `GITHUB_TOKEN` for enrollment suppresses downstream workflow events: a queued PR can
otherwise wait forever without merge-group checks. The App preserves both merge-group and
post-merge deployment events. Verify automatic enrollment through deployment, not just a
successful enrollment job.
