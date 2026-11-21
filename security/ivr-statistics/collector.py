"""Candidate read-only AMI observer. No call origination, no audio, no transcript.
Config is root-owned /etc/doktorumol-ivr-observer.json (0600).
Send only to the exact configured Supabase project; redirects are rejected.
"""
import datetime
import hashlib
import json
import os
import re
import socket
import sqlite3
import time
import urllib.request
import urllib.error

PROJECT_HOST = "irnfwewabogveofwemvg.supabase.co"
UUID = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")
URL = re.compile(r"^https://" + re.escape(PROJECT_HOST) + r"/functions/v1/lead-ivr-webhook\\?\?t=([0-9a-f]{64})$")  # AMI escapes ? as \?

def iso(timestamp):
    return datetime.datetime.fromtimestamp(timestamp, datetime.timezone.utc).isoformat()

class Observer:
    def __init__(self, emit, clock=time.time):
        self.emit, self.clock = emit, clock
        self.channels, self.groups, self.vars = {}, {}, {}

    def handle(self, event):
        kind, uid = event.get("Event"), event.get("Uniqueid")
        channel = event.get("Channel", "")
        if not uid:
            return
        linked = event.get("Linkedid") or uid
        if kind == "Newchannel":
            self.channels[uid] = {"linked": linked, "channel": channel, "alive": True}
            self.groups.setdefault(linked, {"channels": set(), "ringing": None, "answered": None, "call": None, "token": None, "line": None, "heartbeat": 0})["channels"].add(uid)
        record = self.channels.get(uid)
        if not record:
            return  # reconnect/missing Newchannel: never invent closure evidence
        group = self.groups[record["linked"]]
        if kind == "VarSet":
            variable = event.get("Variable", "").lstrip("_")
            value = event.get("Value", "")
            if variable not in ("IVR_CALL", "IVR_URL", "DIGIT"):
                return
            values = self.vars.setdefault(uid, {})
            values[variable] = value
            if UUID.fullmatch(values.get("IVR_CALL", "")):
                group["call"] = values["IVR_CALL"]
            match = URL.fullmatch(values.get("IVR_URL", ""))
            if match:
                group["token"] = match.group(1)
            line = re.match(r"^Local/(80|81)5\d{9}@from-internal-", record["channel"])
            if line:
                group["line"] = line.group(1)
            if variable == "DIGIT" and value in ("1", "2"):
                self.send(group, "digit_" + value, self.clock())
            self.flush(group)
        elif kind == "Newstate":
            state = event.get("ChannelStateDesc", "")
            # Only the retained Local ;1 leg determines outbound answer.
            if record["channel"].startswith("Local/") and record["channel"].endswith(";1"):
                if state in ("Ring", "Ringing") and not group["ringing"]:
                    group["ringing"] = self.clock()
                if state == "Up" and not group["answered"]:
                    group["answered"] = self.clock()
                self.flush(group)
        elif kind == "Hangup":
            record["alive"] = False
            group.setdefault("causes", []).append(event.get("Cause", ""))
            if any(self.channels[channel_id]["alive"] for channel_id in group["channels"]):
                return
            causes = group.get("causes", [])
            reason = "normal" if group["answered"] else "busy" if "17" in causes else "no_answer" if any(c in ("18", "19") for c in causes) else "failed" if any(c in ("34", "38", "41", "42", "44", "47", "58", "88") for c in causes) else "unknown"
            self.send(group, "ended", self.clock(), reason)
            for channel_id in group["channels"]:
                self.channels.pop(channel_id, None)
                self.vars.pop(channel_id, None)
            self.groups.pop(record["linked"], None)

    def flush(self, group):
        for kind in ("ringing", "answered"):
            if group[kind] and not group.get(kind + "_sent"):
                if self.send(group, kind, group[kind]):
                    group[kind + "_sent"] = True

    def heartbeat(self):
        now = self.clock()
        for group in self.groups.values():
            if now - group["heartbeat"] >= 5:
                if self.send(group, "heartbeat", now):
                    group["heartbeat"] = now

    def send(self, group, kind, timestamp, reason=None):
        if not all(group.get(field) for field in ("call", "token", "line")):
            return False
        key = hashlib.sha256(f'{group["call"]}:{kind}:{timestamp:.3f}'.encode()).hexdigest()
        self.emit({"call_id": group["call"], "token": group["token"], "line": group["line"], "kind": kind, "occurred_at": iso(timestamp), "event_key": key, "reason": reason})
        return True

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise urllib.error.URLError("redirect refused")

class DurableOutbox:
    def __init__(self, path):
        directory = os.path.dirname(path)
        os.makedirs(directory, mode=0o700, exist_ok=True)
        if os.stat(directory).st_mode & 0o077:
            raise RuntimeError("Outbox directory must be private")
        old = os.umask(0o077)
        try:
            self.db = sqlite3.connect(path)
        finally:
            os.umask(old)
        os.chmod(path, 0o600)
        self.db.execute("CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, payload TEXT NOT NULL, expires REAL NOT NULL)")
        self.db.commit()
    def append(self, event):
        self.db.execute("INSERT OR IGNORE INTO events VALUES (?,?,?)", (event["call_id"] + ":" + event["event_key"], json.dumps(event), datetime.datetime.fromisoformat(event["occurred_at"]).timestamp() + 86400))
        self.db.commit()
    def batch(self):
        self.db.execute("DELETE FROM events WHERE expires < ?", (time.time(),))
        self.db.commit()
        return [(key, json.loads(payload)) for key, payload in self.db.execute("SELECT id,payload FROM events ORDER BY rowid LIMIT 10")]
    def remove(self, key):
        self.db.execute("DELETE FROM events WHERE id=?", (key,))
        self.db.commit()

def main():
    path = "/etc/doktorumol-ivr-observer.json"
    stat = os.stat(path)
    if stat.st_uid != 0 or stat.st_mode & 0o077:
        raise RuntimeError("Config must be owned by root with mode 0600")
    with open(path) as file:
        config = json.load(file)
    if config.get("ami_host") != "127.0.0.1" or config.get("project_host") != PROJECT_HOST:
        raise RuntimeError("Only local AMI and the explicit project target are allowed")
    opener = urllib.request.build_opener(NoRedirect)
    pending = DurableOutbox("/var/lib/doktorumol-ivr-observer/outbox.sqlite3")
    def enqueue(event):
        # Stable keys make retry idempotent. Persist only metadata while delivery is pending.
        pending.append(event)
    observer = Observer(enqueue)
    with socket.create_connection(("127.0.0.1", int(config.get("ami_port", 5038))), timeout=5) as connection:
        connection.sendall(("Action: Login\r\nUsername: " + config["ami_username"] + "\r\nSecret: " + config["ami_secret"] + "\r\nEvents: on\r\n\r\n").encode())
        connection.settimeout(1)
        buffer, authenticated = "", False
        while True:
            try:
                chunk = connection.recv(65536)
                if not chunk:
                    raise RuntimeError("AMI disconnected; no closure inference")
                buffer += chunk.decode(errors="replace")
                while "\r\n\r\n" in buffer:
                    frame, buffer = buffer.split("\r\n\r\n", 1)
                    event = dict(line.split(": ", 1) for line in frame.split("\r\n") if ": " in line)
                    if event.get("Response") == "Success" and event.get("Message") == "Authentication accepted":
                        authenticated = True
                    if event.get("Response") == "Error":
                        raise RuntimeError("AMI login rejected")
                    if authenticated:
                        observer.handle(event)
            except socket.timeout:
                pass
            observer.heartbeat()
            for key, event in pending.batch():
                try:
                    request = urllib.request.Request("https://" + PROJECT_HOST + "/functions/v1/lead-ivr-telemetry", data=json.dumps(event).encode(), headers={"Content-Type": "application/json"}, method="POST")
                    with opener.open(request, timeout=3) as response:
                        response.read()
                        if response.status == 200:
                            pending.remove(key)
                except (urllib.error.URLError, TimeoutError):
                    break

if __name__ == "__main__":
    main()