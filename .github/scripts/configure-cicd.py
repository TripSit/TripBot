#!/usr/bin/env python3
"""Plan/apply the two-phase rollout. Uses gh authentication; never reads secret values."""
import argparse
import base64
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[2]
CHECKS = json.loads((ROOT / '.github/cicd.json').read_text())['uat_checks']


def gh(method, endpoint, body=None):
    args = ['gh', 'api', '--method', method, endpoint]
    if body is not None:
        args += ['--input', '-']
    result = subprocess.run(args, input=json.dumps(body) if body is not None else None,
                            capture_output=True, text=True, check=True)
    return json.loads(result.stdout) if result.stdout.strip() else None


def desired(phase, app_id):
    conditions = lambda branch: {'ref_name': {'include': [f'refs/heads/{branch}'], 'exclude': []}}
    invariants = {'name': 'CI branch invariants', 'target': 'branch', 'enforcement': 'active',
                  'bypass_actors': [], 'conditions': {'ref_name': {
                      'include': ['refs/heads/main', 'refs/heads/uat'], 'exclude': []}},
                  'rules': [{'type': 'deletion'}, {'type': 'non_fast_forward'}]}
    reviews = {'type': 'pull_request', 'parameters': {
        'required_approving_review_count': 1 if phase == 'promotion' else 0,
        'dismiss_stale_reviews_on_push': True, 'require_code_owner_review': True,
        'require_last_push_approval': False, 'required_review_thread_resolution': True,
        'allowed_merge_methods': ['merge'] if phase == 'promotion' else ['squash']}}
    security = {'type': 'code_scanning', 'parameters': {'code_scanning_tools': [{
        'tool': 'CodeQL', 'security_alerts_threshold': 'high_or_higher', 'alerts_threshold': 'errors'}]}}
    if phase == 'promotion':
        rules = [reviews, security, {'type': 'update', 'parameters': {'update_allows_fetch_and_merge': False}},
                 {'type': 'required_deployments', 'parameters': {'required_deployment_environments': ['uat']}}]
        bypass = [{'actor_type': 'Integration', 'actor_id': app_id, 'bypass_mode': 'always'}]
        name, branch = 'Main', 'main'
    else:
        rules = [reviews, security, {'type': 'required_status_checks', 'parameters': {
            'strict_required_status_checks_policy': False, 'do_not_enforce_on_create': False,
            'required_status_checks': [{'context': name, 'integration_id': 15368} for name in CHECKS]}},
            {'type': 'merge_queue', 'parameters': {'check_response_timeout_minutes': 60,
             'grouping_strategy': 'ALLGREEN', 'max_entries_to_build': 1, 'max_entries_to_merge': 1,
             'merge_method': 'SQUASH', 'min_entries_to_merge': 1, 'min_entries_to_merge_wait_minutes': 0}}]
        # The code-owner team can be a single person, who can't approve their own PRs, so org
        # admins may bypass these rules. The invariants ruleset (no deletion or force-push) still
        # has no bypass. This matches the live setting; --apply must not quietly remove it.
        bypass = [{'actor_type': 'OrganizationAdmin', 'actor_id': None, 'bypass_mode': 'always'}]
        name, branch = 'UAT', 'uat'
    return [invariants, {'name': name, 'target': 'branch', 'enforcement': 'active',
                        'conditions': conditions(branch), 'bypass_actors': bypass, 'rules': rules}]


def preflight(repository, phase, app_id, activate_queue=False):
    """All prerequisites are checked before any live setting is changed."""
    remote = gh('GET', f'repos/{repository}')
    if remote['default_branch'] != 'uat':
        raise RuntimeError('uat must be the default branch for trusted metadata workflows.')
    # Require the reviewed delivery controls to have actually landed, not just local files.
    paths = ['.github/scripts/release-policy.cjs', '.github/cicd.json',
             '.github/workflows/PromoteUatToMain.yml', '.github/workflows/RecordUatDeployment.yml',
             '.github/workflows/QueueTrustedUatPR.yml', '.github/workflows/PullRequestOpenAll.yml',
             '.github/workflows/PushToUat.yml', '.github/workflows/RequestPromotion.yml',
             '.github/workflows/OpenUatToMainPR.yml', '.github/CODEOWNERS']
    for path in paths:
        content = gh('GET', f'repos/{repository}/contents/{path}?ref=uat')
        if base64.b64decode(content['content']) != (ROOT / path).read_bytes():
            raise RuntimeError(f'Reviewed delivery file has not landed on uat: {path}')
    sha = gh('GET', f'repos/{repository}/git/ref/heads/uat')['object']['sha']
    runs = gh('GET', f'repos/{repository}/actions/workflows/PushToUat.yml/runs?event=push&head_sha={sha}&per_page=100')['workflow_runs']
    if not runs or runs[0]['conclusion'] != 'success':
        raise RuntimeError('The latest UAT push validation must be green before rollout.')
    jobs = gh('GET', f'repos/{repository}/actions/runs/{runs[0]["id"]}/jobs?filter=latest&per_page=100')['jobs']
    if any(not any(j['name'] == name and j['conclusion'] == 'success' for j in jobs) for name in CHECKS):
        raise RuntimeError('Not all required checks have been observed succeeding.')
    environments = gh('GET', f'repos/{repository}/deployments?environment=uat&per_page=1')
    if not environments or environments[0]['sha'] != sha:
        raise RuntimeError('The current UAT commit needs recorded deployment evidence before rollout.')
    latest = gh('GET', f'repos/{repository}/deployments/{environments[0]["id"]}/statuses?per_page=1')
    if not latest or latest[0]['state'] != 'success':
        raise RuntimeError('The latest UAT deployment attempt must be successful.')
    if phase == 'promotion':
        secrets = {s['name'] for s in gh('GET',
            f'repos/{repository}/environments/production-promotion/secrets')['secrets']}
        if not app_id or 'PROMOTION_APP_PRIVATE_KEY' not in secrets:
            raise RuntimeError('Configure a dedicated installed promotion App and PROMOTION_APP_PRIVATE_KEY first.')
        environment = gh('GET', f'repos/{repository}/environments/production-promotion')
        if not (environment.get('deployment_branch_policy') or {}).get('custom_branch_policies'):
            raise RuntimeError('Restrict the promotion environment to the canonical uat branch before activation.')
        policies = gh('GET', f'repos/{repository}/environments/production-promotion/deployment-branch-policies')
        if [(p['name'], p.get('type', 'branch')) for p in policies['branch_policies']] != [('uat', 'branch')]:
            raise RuntimeError('The promotion environment must allow only the uat branch.')
    else:
        if gh('GET', f'repos/{repository}/actions/variables/CICD_PROMOTION_ENABLED')['value'] != 'true':
            raise RuntimeError('Complete the verified-promotion rollout before enabling the UAT queue.')
        main = gh('GET', f'repos/{repository}/rules/branches/main')
        if not any(rule['type'] == 'update' for rule in main):
            raise RuntimeError('App-only main updates must be enforced before queue rollout.')
        if activate_queue:
            rules = gh('GET', f'repos/{repository}/rules/branches/uat')
            if not any(rule['type'] == 'merge_queue' for rule in rules):
                raise RuntimeError('Install the native queue and perform a manual trial first.')
            trials = gh('GET', f'repos/{repository}/actions/workflows/PullRequestOpenAll.yml/runs?event=merge_group&per_page=100')['workflow_runs']
            trial = next((r for r in trials if r['conclusion'] == 'success'), None)
            if not trial:
                raise RuntimeError('A successful real merge_group trial is required before automatic queue entry.')
            jobs = gh('GET', f'repos/{repository}/actions/runs/{trial["id"]}/jobs?filter=latest&per_page=100')['jobs']
            if any(not any(j['name'] == name and j['conclusion'] == 'success' for j in jobs) for name in CHECKS):
                raise RuntimeError('The merge_group trial did not run all required checks successfully.')


def apply(repository, phase, app_id, rulesets, snapshot_dir, activate_queue=False):
    existing = gh('GET', f'repos/{repository}/rulesets?includes_parents=true')
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    snapshot = {'repository': gh('GET', f'repos/{repository}'), 'rulesets': [
        gh('GET', f'repos/{repository}/rulesets/{r["id"]}') for r in existing if r['source_type'] == 'Repository'],
        'workflow_permissions': gh('GET', f'repos/{repository}/actions/permissions/workflow')}
    classic_main = subprocess.run(['gh', 'api', f'repos/{repository}/branches/main/protection'],
                                  capture_output=True, text=True)
    if classic_main.returncode == 0:
        snapshot['classic_main'] = json.loads(classic_main.stdout)
    elif '404' not in classic_main.stderr:
        raise RuntimeError(classic_main.stderr)
    # The snapshot contains configuration only, never credentials. Keep it outside the repository.
    (snapshot_dir / f'{repository.split("/")[1]}-{phase}.json').write_text(json.dumps(snapshot, indent=2) + '\n')
    for proposed in rulesets:
        found = next((r for r in existing if r['name'] == proposed['name'] and r['source_type'] == 'Repository'), None)
        endpoint = f'repos/{repository}/rulesets' + (f'/{found["id"]}' if found else '')
        gh('PUT' if found else 'POST', endpoint, proposed)
    if phase == 'promotion':
        # The native Main rules now replace classic main protection, whose PR requirements
        # otherwise block the App's direct fast-forward even when the ruleset allows it.
        if 'classic_main' in snapshot:
            gh('DELETE', f'repos/{repository}/branches/main/protection')
        variables = {'PROMOTION_APP_ID': str(app_id), 'CICD_PROMOTION_ENABLED': 'true'}
    else:
        # Remove only superseded classic UAT status checks; retain all other classic protections.
        classic = subprocess.run(['gh', 'api', f'repos/{repository}/branches/uat/protection/required_status_checks'],
                                 capture_output=True, text=True)
        if classic.returncode == 0:
            gh('DELETE', f'repos/{repository}/branches/uat/protection/required_status_checks')
        elif '404' not in classic.stderr:
            raise RuntimeError(classic.stderr)
        gh('PATCH', f'repos/{repository}', {'allow_auto_merge': True})
        variables = {'CICD_QUEUE_ENABLED': 'true' if activate_queue else 'false'}
    gh('PUT', f'repos/{repository}/actions/permissions/workflow',
       # GitHub couples PR creation and approval in this switch. The controller
       # independently requires a human sign-off; promotion PR creation must remain allowed.
       {'default_workflow_permissions': 'read', 'can_approve_pull_request_reviews': True})
    current = {v['name'] for v in gh('GET', f'repos/{repository}/actions/variables')['variables']}
    for name, value in variables.items():
        gh('PATCH' if name in current else 'POST', f'repos/{repository}/actions/variables' +
           (f'/{name}' if name in current else ''), {'name': name, 'value': value})


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', required=True, choices=['TripSit/website', 'TripSit/TripBot'])
    parser.add_argument('--phase', required=True, choices=['promotion', 'queue'])
    parser.add_argument('--promotion-app-id', type=int)
    parser.add_argument('--apply', action='store_true', help='Apply only after all rollout prerequisites pass.')
    parser.add_argument('--activate-queue', action='store_true',
                        help='Enable automatic queue entry only after a successful native merge-group trial.')
    parser.add_argument('--snapshot-dir', type=Path, default=Path('/tmp/tripsit-cicd-rollout'))
    args = parser.parse_args()
    rulesets = desired(args.phase, args.promotion_app_id)
    if not args.apply:
        print(json.dumps({'repository': args.repository, 'phase': args.phase,
                          'automatic_queue_entry': args.activate_queue, 'rulesets': rulesets}, indent=2))
        return
    preflight(args.repository, args.phase, args.promotion_app_id, args.activate_queue)
    apply(args.repository, args.phase, args.promotion_app_id, rulesets, args.snapshot_dir, args.activate_queue)
    print(f'Applied {args.phase} settings to {args.repository}.')


if __name__ == '__main__':
    main()
