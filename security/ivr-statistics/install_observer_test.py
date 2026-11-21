import tempfile
from pathlib import Path
import unittest
import json
import os
import builtins
from unittest.mock import patch
from install_observer import ensure_idle, manager_text, patch_php, write_private, payloads, rollback, main


class InstallerTests(unittest.TestCase):
    def test_active_line_80_blocks_install(self):
        with self.assertRaises(RuntimeError):
            ensure_idle('Local/805550000001@from-internal-000001;1!Up', [])

    def test_active_line_81_blocks_install(self):
        with self.assertRaises(RuntimeError):
            ensure_idle('Local/815550000001@from-internal-000001;1!Ringing', [])

    def test_pending_blocks_install(self):
        with self.assertRaises(RuntimeError):
            ensure_idle('', ['synthetic.call'])

    def test_unknown_status_blocks_install(self):
        with self.assertRaises(RuntimeError):
            ensure_idle('Unable to connect to remote asterisk', [])

    def test_manager_account_read_only_local_and_preserves_existing(self):
        text = manager_text('[existing]\nread=call\n', 'a' * 64)
        self.assertTrue(text.startswith('[existing]\nread=call\n'))
        self.assertIn('permit=127.0.0.1/255.255.255.255\n', text)
        self.assertIn('deny=0.0.0.0/0.0.0.0\n', text)
        self.assertIn('read=call,dialplan\nwrite=\n', text)

    def test_existing_account_not_overwritten(self):
        with self.assertRaises(RuntimeError):
            manager_text('[doktorumol_ivr_observer]\n', 'a' * 64)

    def test_only_inheritance_changes_and_repeat_is_safe(self):
        original = 'secret=unchanged; @from-internal/n\n' + '\n'.join('Setvar: ' + name + '=value' for name in ('IVR_AREA', 'IVR_CALL', 'IVR_URL'))
        updated = patch_php(original)
        self.assertEqual(updated.replace('Setvar: __', 'Setvar: '), original)
        self.assertEqual(patch_php(updated), updated)

    def test_unrecognized_php_rejected(self):
        with self.assertRaises(RuntimeError):
            patch_php('unrecognized source')

    def test_private_atomic_write(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'private'
            write_private(path, b'synthetic')
            self.assertEqual(path.stat().st_mode & 0o777, 0o600)
            self.assertEqual(path.read_bytes(), b'synthetic')

    def test_payload_is_existing_observer(self):
        self.assertEqual(payloads()['collector.py'], (Path(__file__).parent / 'collector.py').read_bytes())

    def test_partial_install_restores_without_existing_service(self):
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            target = base / 'config'
            target.write_bytes(b'changed')
            (base / '0').write_bytes(b'original')
            (base / 'manifest.json').write_text(json.dumps([{'path': str(target), 'existed': True, 'saved': '0', 'mode': 0o600, 'uid': target.stat().st_uid, 'gid': target.stat().st_gid}]))
            with patch('install_observer.subprocess.run') as service, patch('install_observer.run'):
                service.return_value.returncode = 5
                rollback(base)
            self.assertEqual(target.read_bytes(), b'original')

    def test_synthetic_full_install_preserves_routing_and_secret(self):
        source = payloads()
        with tempfile.TemporaryDirectory() as directory:
            base = Path(directory)
            def mapped(path):
                value = str(path)
                if value == str(base) or value.startswith(str(base) + '/'):
                    return Path(path)
                return base / value.lstrip('/') if value.startswith('/') else Path(path)
            for folder in ('/etc/asterisk', '/etc/systemd/system', '/var/www/html', '/var/spool/asterisk/outgoing', '/var/spool/asterisk/tmp', '/opt', '/var/lib', '/root'):
                mapped(folder).mkdir(parents=True, exist_ok=True)
            mapped('/etc/asterisk/manager.conf').write_text('#include manager_custom.conf\n')
            mapped('/var/spool/asterisk/tmp/doktorumol-lines.lock').touch()
            mapped('/etc/asterisk/manager_custom.conf').write_text('[existing]\nread=call\n')
            original = 'secret=synthetic-preserved; @from-internal/n\n' + '\n'.join('Setvar: ' + name + '=value' for name in ('IVR_AREA', 'IVR_CALL', 'IVR_URL'))
            mapped('/var/www/html/freepbx-ivr.php').write_text(original)
            real_open = builtins.open
            def safe_open(path, *args, **kwargs):
                if str(path) == '/var/spool/asterisk/tmp/doktorumol-lines.lock':
                    path = mapped(path)
                return real_open(path, *args, **kwargs)
            commands = []
            def fake_run(*args):
                commands.append(args)
                return 'active\n' if args[:2] == ('systemctl', 'is-active') else ''
            old_umask = os.umask(0o077)
            try:
                with patch('install_observer.Path', side_effect=mapped), patch('install_observer.EMBEDDED', {k: __import__('base64').b64encode(v).decode() for k, v in source.items()}), patch('install_observer.run', side_effect=fake_run), patch('install_observer.verify_login') as login, patch('install_observer.socket.create_connection'), patch('install_observer.time.sleep'), patch('install_observer.sys.argv', ['installer']), patch('builtins.open', side_effect=safe_open):
                    main()
                login.assert_called_once()
                self.assertEqual(mapped('/var/www/html/freepbx-ivr.php').read_text().replace('Setvar: __', 'Setvar: '), original)
                config = mapped('/etc/doktorumol-ivr-observer.json')
                self.assertEqual(config.stat().st_mode & 0o777, 0o600)
                self.assertEqual(json.loads(config.read_text())['ami_host'], '127.0.0.1')
                self.assertIn(('/usr/sbin/asterisk', '-rx', 'manager reload'), commands)
                self.assertFalse(any('originate' in ' '.join(c) or 'restart' in c for c in commands))
                self.assertEqual(len(list(mapped('/root').glob('*/manifest.json'))), 1)
            finally:
                os.umask(old_umask)


if __name__ == '__main__':
    unittest.main()