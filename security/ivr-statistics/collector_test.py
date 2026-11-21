import unittest
import tempfile
from collector import Observer, DurableOutbox

class ObserverTests(unittest.TestCase):
    def setUp(self):
        self.events, self.now = [], 1000
        self.observer = Observer(self.events.append, lambda: self.now)
        self.channel = "Local/815550000001@from-internal-00001;1"
        self.event("Newchannel")
        self.event("VarSet", Variable="IVR_CALL", Value="00000000-0000-0000-0000-000000000001")
        self.event("VarSet", Variable="IVR_URL", Value="https://irnfwewabogveofwemvg.supabase.co/functions/v1/lead-ivr-webhook?t=" + "a" * 64)
    def event(self, kind, uid="1", **kwargs):
        self.observer.handle({"Event": kind, "Uniqueid": uid, "Linkedid": "1", "Channel": self.channel if uid == "1" else self.channel.replace(";1", ";2"), **kwargs})
    def test_answer_and_digit(self):
        self.event("Newstate", ChannelStateDesc="Ringing")
        self.now += 10
        self.event("Newstate", ChannelStateDesc="Up")
        self.event("VarSet", Variable="DIGIT", Value="2")
        self.assertEqual([e["kind"] for e in self.events], ["ringing", "answered", "digit_2"])
    def test_first_local_hangup_does_not_end_call(self):
        self.event("Newchannel", uid="2")
        self.event("Hangup", Cause="16")
        self.assertFalse(any(e["kind"] == "ended" for e in self.events))
        self.event("Hangup", uid="2", Cause="16")
        self.assertEqual(self.events[-1]["kind"], "ended")
    def test_busy_is_not_answered(self):
        self.event("Hangup", Cause="17")
        self.assertEqual(self.events[-1]["reason"], "busy")
    def test_no_answer(self):
        self.event("Hangup", Cause="19")
        self.assertEqual(self.events[-1]["reason"], "no_answer")
    def test_untracked_hangup_ignored(self):
        self.event("Hangup", uid="missing", Cause="16")
        self.assertEqual(self.events, [])
    def test_untrusted_url_never_sends(self):
        observer = Observer(self.events.append)
        observer.handle({"Event": "Newchannel", "Uniqueid": "x", "Channel": self.channel})
        observer.handle({"Event": "VarSet", "Uniqueid": "x", "Variable": "IVR_CALL", "Value": "00000000-0000-0000-0000-000000000001"})
        observer.handle({"Event": "VarSet", "Uniqueid": "x", "Variable": "IVR_URL", "Value": "https://evil.invalid?t=" + "a" * 64})
        observer.heartbeat()
        self.assertEqual(self.events, [])
    def test_ami_escaped_question_mark_url_is_accepted(self):
        observer = Observer(self.events.append)
        observer.handle({"Event": "Newchannel", "Uniqueid": "y", "Channel": self.channel})
        observer.handle({"Event": "VarSet", "Uniqueid": "y", "Variable": "__IVR_CALL", "Value": "00000000-0000-0000-0000-000000000002"})
        observer.handle({"Event": "VarSet", "Uniqueid": "y", "Variable": "__IVR_URL", "Value": "https://irnfwewabogveofwemvg.supabase.co/functions/v1/lead-ivr-webhook\\?t=" + "b" * 64})
        observer.handle({"Event": "Hangup", "Uniqueid": "y", "Cause": "17"})
        self.assertEqual(self.events[-1]["token"], "b" * 64)
        self.assertEqual(self.events[-1]["reason"], "busy")
    def test_outbox_survives_restart_and_deduplicates(self):
        import time
        import datetime
        with tempfile.TemporaryDirectory() as directory:
            path = directory + "/outbox.sqlite3"
            queue = DurableOutbox(path)
            event = {"call_id": "x", "event_key": "one", "occurred_at": datetime.datetime.fromtimestamp(time.time(), datetime.timezone.utc).isoformat()}
            queue.append(event)
            queue.append(event)
            queue.db.close()
            restarted = DurableOutbox(path)
            self.assertEqual(len(restarted.batch()), 1)
            key, saved = restarted.batch()[0]
            self.assertEqual(saved, event)
            restarted.remove(key)
            self.assertEqual(restarted.batch(), [])

if __name__ == "__main__":
    unittest.main()