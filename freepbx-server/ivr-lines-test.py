"""Synthetic PHP line-occupancy checks; never contacts a real PBX."""
import pathlib
import subprocess
import tempfile

source = pathlib.Path(__file__).with_name('freepbx-ivr.php').read_text()
start = source.index('function ivr_line_busy(')
end = source.index("\nif ($action === 'setup')", start)
checks = r'''
function check($actual, $expected) {
  if ($actual !== $expected) throw new Exception('line occupancy mismatch');
}
// Both lines empty: one call may be placed on each.
check(ivr_line_busy('80', '', [], 0, 100), false);
check(ivr_line_busy('81', '', [], 0, 100), false);
// Pending 81 never occupies 80, but prevents a second 81 call.
$pending = ['Channel: Local/815313453014@from-internal/n'];
check(ivr_line_busy('81', '', $pending, 0, 100), true);
check(ivr_line_busy('80', '', $pending, 0, 100), false);
// Ringing and answered Local channels both hold their original line.
$channels = "Local/805313453014@from-internal-0000001;1!from-internal!s!1!Ring\nLocal/815313453014@from-internal-0000002;2!doktorumol-ivr!s!1!Up";
check(ivr_line_busy('80', $channels, [], 0, 100), true);
check(ivr_line_busy('81', $channels, [], 0, 100), true);
// Handoff reservation blocks until expiry.
check(ivr_line_busy('80', '', [], 110, 100), true);
check(ivr_line_busy('80', '', [], 100, 100), false);
echo "8 synthetic PHP line checks passed\n";
'''
with tempfile.TemporaryDirectory() as directory:
    path = pathlib.Path(directory) / 'line-checks.php'
    path.write_text('<?php\n' + source[start:end] + checks)
    subprocess.run(['php', str(path)], check=True)