"""Execute the actual workflow retention shell against local, fake FTP only."""
from pathlib import Path
import os
import subprocess
import tempfile
import unittest

WORKFLOW = Path(__file__).resolve().parents[1] / '.github/workflows/deploy.yml'


class RetainedRelease(unittest.TestCase):
    def run_retention(self, mode):
        workflow = WORKFLOW.read_text()
        block = workflow.split("      - name: Keep older releases' assets for RETAIN_DAYS\n")[1].split('\n      - name:')[0]
        shell = '\n'.join(line[10:] for line in block.split('        run: |\n')[1].splitlines())
        with tempfile.TemporaryDirectory(prefix='retention-', dir='/tmp') as folder:
            root = Path(folder)
            for name in ['dist/assets', 'bin', 'tmp']:
                (root / name).mkdir(parents=True)
            (root / 'dist/assets/new.js').write_text('new')
            curl = root / 'bin/curl'
            curl.write_text('''#!/bin/bash
set -eu
out="${@: -1}"
url="${@: -3:1}"
if [[ "$MODE" == "list-fail" ]]; then exit 7; fi
if [[ "$url" == */.release-files.txt ]]; then printf 'old.js\\n' > "$out"; exit 0; fi
if [[ "$url" == */old.js && "$MODE" == "success" ]]; then printf 'old' > "$out"; exit 0; fi
exit 7
''')
            curl.chmod(0o700)
            env = {**os.environ, 'PATH': str(root / 'bin') + ':' + os.environ['PATH'],
                   'FTP_SERVER': 'ftp.invalid', 'FTP_USERNAME': 'fixture', 'FTP_PASSWORD': 'fixture',
                   'RETAIN_DAYS': '14', 'MODE': mode}
            result = subprocess.run(['bash', '-c', shell.replace('/tmp/', str(root / 'tmp') + '/')],
                                    cwd=root, env=env, capture_output=True, text=True, timeout=10)
            manifest = root / 'dist/assets/.release-files.txt'
            return result.returncode, manifest.read_text() if manifest.exists() else None

    def test_unreadable_live_list_stops_before_publish(self):
        code, manifest = self.run_retention('list-fail')
        self.assertNotEqual(code, 0)
        self.assertIsNone(manifest)

    def test_failed_live_asset_stops_before_publish(self):
        code, manifest = self.run_retention('asset-fail')
        self.assertNotEqual(code, 0)
        self.assertIsNone(manifest)

    def test_success_keeps_current_and_previous_assets(self):
        code, manifest = self.run_retention('success')
        self.assertEqual(code, 0)
        self.assertEqual(set(manifest.splitlines()), {'new.js', 'old.js'})


if __name__ == '__main__':
    unittest.main()