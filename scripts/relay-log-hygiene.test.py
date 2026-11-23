"""Relay scripts must not write request bodies (credentials, phone numbers) to hosting logs."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
RELAYS = ['public/sms-relay.php', 'public/hoppa-relay.php']
SECRET_TOKENS = ['$raw', '$input', '$body', '$payload', '$password', '$secret', 'PHP_AUTH_PW']


class RelayLogHygiene(unittest.TestCase):
    def log_calls(self, source):
        return re.findall(r'error_log\s*\(([^;]*)\);', source)

    def test_no_relay_logs_a_request_body_or_credential(self):
        for rel in RELAYS:
            with self.subTest(relay=rel):
                source = (ROOT / rel).read_text()
                for call in self.log_calls(source):
                    for token in SECRET_TOKENS:
                        self.assertNotIn(
                            token, call,
                            f'{rel} logs {token} to the hosting error log: {call.strip()}')

    def test_sms_relay_still_forwards_the_body_to_verimor(self):
        source = (ROOT / 'public/sms-relay.php').read_text()
        self.assertIn("curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));", source)
        self.assertIn("sms.verimor.com.tr/v2/send.json", source)
        self.assertIn('$response', source)

    def test_hoppa_relay_still_forwards_and_keeps_ip_diagnostics(self):
        source = (ROOT / 'public/hoppa-relay.php').read_text()
        self.assertIn('CURLOPT_POST', source)
        self.assertIn('CURL_IPRESOLVE_V4', source)


if __name__ == '__main__':
    unittest.main()
