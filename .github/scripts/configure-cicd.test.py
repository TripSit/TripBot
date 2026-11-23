#!/usr/bin/env python3
"""Offline tests for rollout safety and the exact proposed GitHub rules."""
import base64
import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('rollout', Path(__file__).with_name('configure-cicd.py'))
rollout = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rollout)


class RolloutTests(unittest.TestCase):
    def test_invariants_have_no_bypass_even_for_the_promotion_app(self):
        invariants, main = rollout.desired('promotion', 42)
        self.assertEqual(invariants['bypass_actors'], [])
        self.assertEqual({r['type'] for r in invariants['rules']}, {'deletion', 'non_fast_forward'})
        self.assertEqual(main['bypass_actors'], [
            {'actor_type': 'Integration', 'actor_id': 42, 'bypass_mode': 'always'}])
        self.assertIn('update', {r['type'] for r in main['rules']})
        deployment = next(r for r in main['rules'] if r['type'] == 'required_deployments')
        self.assertEqual(deployment['parameters']['required_deployment_environments'], ['uat'])

    def test_queue_requires_every_named_check_from_github_and_no_bypass(self):
        _, queue = rollout.desired('queue', None)
        self.assertEqual(queue['bypass_actors'], [])
        checks = next(r for r in queue['rules'] if r['type'] == 'required_status_checks')['parameters']
        self.assertEqual({c['context'] for c in checks['required_status_checks']}, set(rollout.CHECKS))
        self.assertTrue(all(c['integration_id'] == 15368 for c in checks['required_status_checks']))
        self.assertNotIn('Require current uat base', {c['context'] for c in checks['required_status_checks']})
        reviews = next(r for r in queue['rules'] if r['type'] == 'pull_request')['parameters']
        self.assertEqual(reviews['required_approving_review_count'], 0)
        self.assertTrue(reviews['require_code_owner_review'])
        native = next(r for r in queue['rules'] if r['type'] == 'merge_queue')['parameters']
        self.assertEqual(native['grouping_strategy'], 'ALLGREEN')
        self.assertEqual(native['max_entries_to_merge'], 1)

    def test_unpublished_controls_cannot_change_live_settings(self):
        calls = []

        def api(method, endpoint, body=None):
            calls.append((method, endpoint))
            if endpoint == 'repos/TripSit/website':
                return {'default_branch': 'uat'}
            return {'content': base64.b64encode(b'old workflow').decode()}

        with patch.object(rollout, 'gh', side_effect=api):
            with self.assertRaisesRegex(RuntimeError, 'has not landed'):
                rollout.preflight('TripSit/website', 'promotion', 42)
        self.assertTrue(calls)
        self.assertTrue(all(method == 'GET' for method, _ in calls))

    def test_wrong_default_branch_cannot_change_live_settings(self):
        with patch.object(rollout, 'gh', return_value={'default_branch': 'main'}) as api:
            with self.assertRaisesRegex(RuntimeError, 'default branch'):
                rollout.preflight('TripSit/website', 'queue', None)
        api.assert_called_once()


if __name__ == '__main__':
    unittest.main()
