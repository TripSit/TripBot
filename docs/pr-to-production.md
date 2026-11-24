# From a PR to production

This walkthrough applies to both TripSit's website and TripBot. Team members open a ready PR to
`uat`; automation validates, queues, merges, and deploys it to UAT. A human then tests the deployed
candidate and approves the bot-managed `uat` -> `main` PR to authorize production promotion.

**A production approval covers every change in UAT since the last production release, not just
one feature PR. Approval can start promotion immediately.**

## 1. Open a ready PR to UAT

- Create a feature or fix branch from the latest `uat` inside the TripSit repository and push your changes.
- Open a PR with **base: `uat`** and your branch as the compare branch.
- Describe what changed, how to test it, and the expected result.
- Mark the PR **Ready for review** when it is ready to enter the delivery flow.

Automatic enrollment requires a human author with repository write, maintain, or admin access.
Organization membership alone is insufficient. Drafts, fork PRs, and bot-authored PRs are not
automatically enrolled.

## 2. Let checks and required reviews finish

All eight required checks must pass:

| Check | What it validates |
| --- | --- |
| Lint | Application and delivery-control lint rules |
| Build | The application's build/type checks |
| Test | Automated tests and coverage requirements |
| Docker Build | The application container build and configured smoke tests |
| CodeQL (javascript) | Code scanning |
| SonarScan | Source analysis using the test coverage artifact |
| Release policy tests | Release-policy and rollout-control tests |
| CI Passed | Every required validation job succeeded |

Ordinary application changes can proceed without a review. Protected paths, including CI/CD,
dependencies, Docker files, and test configuration, require independent code-owner approval.
See [CODEOWNERS](../.github/CODEOWNERS) for the exact paths and reviewers. Shared CI/CD changes
must be applied to both repositories while preserving application-specific commands and settings.

Resolve review conversations and merge conflicts. If a check fails, fix the problem and push an
update to the same branch. New commits run validation again.

**You do not need to enable auto-merge or click Merge.**

## 3. Let the native merge queue merge to UAT

After PR validation succeeds, the trusted controller checks the current PR head and author permissions
and requests merge-when-ready automatically. GitHub waits for any required review and conversation
resolution before the PR can advance through the queue.

The queue creates a temporary commit combining the change with current UAT. All eight required
checks run again on that merge-group commit. GitHub also enforces the configured code-scanning
thresholds. Once the requirements pass, GitHub squash-merges the PR into `uat`.

The queue checks the combined result against current UAT; routine manual branch syncing is not
needed for each UAT advance. Resolve conflicts if GitHub reports them. Failed queue checks leave
the PR unmerged; fix the failure instead of bypassing a check.

## 4. Wait for the deployed UAT candidate

The UAT merge starts `PushToUat` validation and the Drone UAT deployment. A merged PR is not
confirmation that the new version is already running.

1. Wait for `PushToUat` validation to succeed in GitHub Actions.
2. Open the repository's **Deployments** view and select **uat**.
3. Confirm the latest UAT deployment is successful. The deployment record links to the Drone build.
4. Compare its full commit SHA with the current candidate on the `uat` -> `main` promotion PR.
   The candidate description, PR head, and successful deployment must identify the same commit.

`Record UAT deployment` records evidence tied to the exact UAT commit, validation run/attempt,
and authenticated Drone result. An old successful deployment does not cover a newer commit.
If deployment is pending or failed, wait for a successful deployment of the candidate before sign-off.

## 5. Test UAT and the complete release candidate

| Application | UAT testing target |
| --- | --- |
| Website | [tripsit.io](https://tripsit.io) |
| TripBot | The team's UAT Discord bot/server; for API changes, [the UAT API](https://tripbot.tripsit.io/api) |

Test the changed behavior, relevant regressions, and the other changes included in the release.
Record the candidate SHA, environment, and what you tested.

**UAT remains open while you test.** Another merged PR can advance the candidate. Recheck the SHA
before approving. If it changed, wait for the new deployment and test the updated candidate.
A previous approval cannot authorize a newer UAT commit.

If testing fails, withhold approval or submit **Request changes** on the promotion PR to block
release. Describe the failure and send the fix through another PR to `uat`. Repeat deployment
verification and testing for the updated candidate. Outstanding changes-requested reviews and
unresolved review threads must be addressed before promotion.

## 6. Approve the UAT-to-main promotion PR

The bot opens or refreshes a PR titled **Promote uat to main** when UAT contains unreleased changes.
Use these searches to find the current open PR; its number changes between releases:

| Repository | Find the current promotion PR |
| --- | --- |
| Website | [Open website UAT-to-main PR](https://github.com/TripSit/website/pulls?q=is%3Apr+is%3Aopen+base%3Amain+head%3Auat) |
| TripBot | [Open TripBot UAT-to-main PR](https://github.com/TripSit/TripBot/pulls?q=is%3Apr+is%3Aopen+base%3Amain+head%3Auat) |

Check that it uses `uat` from the same TripSit repository as its head and `main` as its base.
Read its **Included changes** list and confirm the **Candidate** SHA matches the successfully
deployed revision you tested. Resolve outstanding review conversations.

The approver must be a human with repository write, maintain, or admin access and cannot be the
promotion PR's author. These PRs are bot-authored, so the person who opened the feature PR may
also test and approve the promotion. Bot approvals do not count.

In GitHub, select **Files changed -> Review changes -> Approve -> Submit review**. Include a
summary such as:

> Tested UAT candidate `<full commit SHA>` on `<UAT environment>`.
> Verified: `<changed behavior and relevant regressions>`.

**A comment alone does not authorize release. Submit an approving review only after QA is complete.
Do not click Merge on the promotion PR.** Approval is production release authorization and may
start promotion immediately.

## 7. Watch automatic production promotion and deployment

The approval requests `PromoteUatToMain`. The promotion App rechecks:

- The canonical open promotion PR and approval for the current UAT commit.
- Human reviewer permissions, outstanding changes requests, and resolved review conversations.
- Successful validation, CodeQL results, and matching successful UAT deployment evidence.
- Branch ancestry and unchanged branch references, so main can advance by fast-forward.

If a requirement fails, production promotion stops. A newer UAT commit requires a fresh approval
for that deployed and tested candidate. Do not bypass a failed release requirement.

When verification succeeds, the App advances `main` to the exact approved UAT commit. That push
starts `PushToMain` validation and the production Drone deployment automatically. Watch
`PromoteUatToMain`, production validation, and the production Drone build for success, then
smoke-test the production website or bot. Updating main alone is not confirmation of a successful
production deployment.

## Policy and maintenance references

- [CI/CD policy](../CICD-POLICY.md)
- [CI/CD rollout and recovery controls](../.github/CICD-ROLLOUT.md)
- [Protected paths and code owners](../.github/CODEOWNERS)
