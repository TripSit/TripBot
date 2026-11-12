# UAT-first release policy (target configuration)

This document describes the target policy. Adding these files does not activate repository
rules, configure Drone, or make approval alone safe to release. Follow the rollout in the audit.

1. Branch all work, including dependency updates, hotfixes and workflow changes, from `uat`.
   Open feature PRs into `uat`. Include the current UAT base before merging; branch creation
   intent cannot be proved from Git history, but ancestry and protected PRs can be enforced.
2. Require Lint, Build, Test, Docker Build, CodeQL and `Require current uat base` on UAT PRs,
   with fresh independent approval and resolved conversations. Configure exact observed check
   names and their trusted producer after a successful trial run. Use strict up-to-date checks.
3. Deploy only accepted UAT commits to the UAT runner. CI success and a successful UAT deploy
   with health checks must be recorded against the exact candidate SHA before promotion.
4. Open a canonical same-repository `uat` -> `main` release PR. Review an exact commit.
   Never use GitHub Merge, Squash, Rebase, auto-merge, or a merge queue for this release PR.
   These paths do not preserve UAT commit identity. Approval is authorization only after
   the trusted promotion service has revalidated the complete release policy.
5. Only a dedicated promotion GitHub App may update `main`. Its trusted controller must
   re-read the open non-draft PR, both refs, current reviews, required CI results and UAT
   deployment evidence immediately before updating. Fail closed on missing, stale, skipped,
   neutral, cancelled, unsuccessful or ambiguous evidence. Reject fork heads and divergence.
   Serialize promotions; do not cancel a promotion after it starts mutating state.
6. Update `main` to the verified SHA with a non-forced fast-forward only. The controller must
   retain the observed old SHA and reject ref changes; GitHub's REST ref PATCH has no expected
   old SHA parameter. For atomic old-ref protection, a normal Git push can use an explicit
   old-SHA lease after ancestry verification, while an independent non-fast-forward ruleset
   that the App cannot bypass remains enforced. Freeze UAT merges for the final release
   window if current-tip equality is required: GitHub cannot atomically lock both refs and
   approval/check state. Otherwise promote only the reviewed, tested ancestor SHA and record
   any newer UAT commits as a later release, never silently promote the new tip.
7. Main's push deploys that exact SHA on the production runner. The deployer rechecks its
   authority and SHA, locks the target service, checks health, and records the deployed
   revision/image digest. GitHub CI concurrency does not serialize Drone or host commands.

## Rules and credentials

Use explicit `refs/heads/uat` and `refs/heads/main` rules. Make `uat` the default branch.
Keep force pushes and deletion forbidden in a separate ruleset with no promotion-App bypass.
Put main's update restriction and PR requirement in a separate ruleset with only the dedicated
App allowed to bypass, since direct FF updates cannot use GitHub's normal PR merge operation.
Do not grant broad administrator bypass for routine releases. Preserve existing code-scanning
requirements; protect workflows/policy/deployment files with CODEOWNERS and independent review.
Do not enable main linear-history enforcement if UAT contains legitimate merge commits.

Keep the App credential in a protected promotion environment or external controller, never
in feature-PR jobs or code checked out from an untrusted PR. Prefer short-lived installation
tokens to a personal admin PAT. The controller itself must enforce approvals and checks since
its PR-rule bypass removes that server-side safety net. Pin controller dependencies by SHA.
Use read-only default workflow permissions and grant write access only to the specific job.
Keep UAT and production runtime secrets separate and restrict Drone secrets to trusted events.

## Recovery

Before releasing, retain the previous healthy image digest and configuration revision and
verify a backup/restore drill. Revert code through a new UAT PR and promote forward; never
force-reset either protected branch. For an outage, a separately authorized deployment rollback
may redeploy the previous known-good image without changing main; record the temporary deployed
revision mismatch and reconcile through UAT. TripBot runs Prisma migrations at production
startup: reverting the image does not revert the database. Use expand/contract migrations,
check older-image compatibility, and use a separately reviewed database recovery procedure.

## Cutover acceptance

In a disposable repository and UAT deployment, verify normal approval, failed/pending checks,
stale approval, new UAT commits, fork branch named uat, main movement/divergence, duplicate events,
missing credentials, API failure, deploy failure and rollback. Demonstrate that a manual main
merge/push is rejected, FF preserves SHA, the push reaches Drone exactly once, and health/evidence
match the candidate SHA. Activate production promotion only after these checks succeed.
