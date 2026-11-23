import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('ci_apt', Path(__file__).with_name('prepare-ci-apt.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class AptPreparation(unittest.TestCase):
    def test_screenshot_ec2_mirror_is_replaced(self):
        self.assertEqual(
            module.normalize_mirrors('URIs: http://us-east-2.ec2.archive.ubuntu.com/ubuntu/\n'),
            'URIs: https://archive.ubuntu.com/ubuntu/\n',
        )

    def test_other_sources_and_signing_keys_are_unchanged(self):
        text = ('URIs: https://packages.microsoft.com/ubuntu/24.04/prod\n'
                'URIs: http://security.ubuntu.com/ubuntu\n'
                'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg\n')
        self.assertEqual(module.normalize_mirrors(text), text)

    def test_real_source_files_and_bounded_network_config(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'sources.list.d').mkdir()
            (root / 'apt.conf.d').mkdir()
            for filename in ['sources.list', 'sources.list.d/ubuntu.sources', 'sources.list.d/ubuntu.list']:
                (root / filename).write_text('http://us-east-2.ec2.archive.ubuntu.com/ubuntu noble main\n')
            module.prepare(root)
            for filename in ['sources.list', 'sources.list.d/ubuntu.sources', 'sources.list.d/ubuntu.list']:
                self.assertEqual((root / filename).read_text(), 'https://archive.ubuntu.com/ubuntu noble main\n')
            config = (root / 'apt.conf.d/99-dko-ci-network').read_text()
            self.assertIn('Acquire::https::Timeout "20";', config)
            self.assertIn('Acquire::Retries "2";', config)
            self.assertNotIn('AllowUnauthenticated', config)


if __name__ == '__main__':
    unittest.main()