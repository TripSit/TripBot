# UAT queue verification

This ordinary documentation path exercises trusted PR delivery without a CI configuration change.

For a same-repository, non-draft PR from a human with repository write access:

1. All eight required PR checks must succeed, including tests, coverage-backed SonarScan, and release policy tests.
2. The trusted UAT controller enrolls the current PR head using the scoped GitHub App.
3. GitHub runs all eight checks again on the native merge-group commit before merging to UAT.
4. The merged UAT revision must pass push validation and have successful authenticated deployment evidence.
5. Production remains pending independent human QA approval of the current UAT-to-main promotion PR.

A successful enrollment job alone is insufficient: verify the merge-group run, UAT merge, and deployment record.
Sensitive files continue to require code-owner review, and UAT has no bypass actors.
