# UAT-first release policy

The delivery contract and phased rollout are defined in [.github/CICD-ROLLOUT.md](.github/CICD-ROLLOUT.md).

- Trusted same-repository non-draft human PRs target `uat` and enter its native merge queue.
- Ordinary application PRs need successful required checks, not human approval. Sensitive paths
  in `.github/CODEOWNERS` require independent code-owner approval. Resolve review conversations.
- Org admins can bypass the UAT rules, because the code-owner team can be one person who can't
  approve their own PRs. Nobody can bypass the branch invariants (no deletion or force-push).
- Every required check must run on both PRs and merge groups. Failed, missing, cancelled, and
  skipped validation cannot satisfy the CI Passed gate. CodeQL errors and high/critical alerts block merging.
- Record authenticated UAT deployment evidence for the exact source SHA and CI run/attempt.
- A team member tests the deployed candidate and approves the canonical `uat` -> `main` PR at
  that exact SHA. New commits invalidate release sign-off. Do not click Merge on a promotion PR.
- Only the dedicated promotion App updates main. Its trusted controller revalidates current
  approval, checks, security results, deployment evidence, resolved threads, and ancestry before
  a fast-forward with an expected-old-main lease. Branch invariants have no bypass.
- Keep production credentials in the UAT-only `production-promotion` environment; PR code cannot
  access them. Use a short-lived, single-repository installation token, not the old admin PAT.
- Main deployment remains subject to runtime readiness, recovery procedures, and database
  compatibility. Never force-reset protected branches or treat image rollback as database rollback.

Do not activate live rules before the reviewed workflows have landed, all required checks pass,
UAT evidence is recorded, and the promotion App has been configured. Automatic queue entry is
activated only after a real successful merge-group trial. The rollout script defaults to a plan
and checks prerequisites before applying either phase. Keep website and TripBot aligned.
