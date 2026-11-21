"""Approved host installer. Run on the stopped PBX as root, never in the app.
Standalone delivery embeds only collector/service source, never credentials.
"""
import base64
import fcntl
import json
import os
from pathlib import Path
import re
import secrets
import socket
import subprocess
import sys
import time

EMBEDDED = None  # Standalone packaging replaces this line with source payloads.
USER = 'doktorumol_ivr_observer'
BEGIN = '; BEGIN DOKTORUMOL IVR OBSERVER'
END = '; END DOKTORUMOL IVR OBSERVER'
SERVICE = 'doktorumol-ivr-observer.service'


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=20)
    if result.returncode:
        # Never echo command output: it can contain channel tokens or secrets.
        raise RuntimeError('Komut tamamlanamadı: ' + args[0] + ' ' + args[1])
    return result.stdout


def ensure_idle(channels, pending):
    if any(x in channels.lower() for x in ('unable to connect', 'permission denied')):
        raise RuntimeError('Santral durumu doğrulanamadı; hiçbir ayar değiştirilmedi.')
    if pending or re.search(r'^Local/(80|81)5\d{9}@from-internal-', channels, re.M) or 'doktorumol-ivr' in channels:
        raise RuntimeError('Devam eden veya bekleyen arama var. Durdurun ve aramaların bitmesini bekleyin.')


def patch_php(text):
    if '@from-internal/n' not in text:
        raise RuntimeError('Arama dosyası beklenen sürümde değil; değiştirilmedi.')
    for name in ('IVR_AREA', 'IVR_CALL', 'IVR_URL'):
        pattern = r'Setvar: (_*)' + name + '='
        if len(re.findall(pattern, text)) != 1:
            raise RuntimeError('Arama değişkeni beklenen biçimde değil; değiştirilmedi.')
        text = re.sub(pattern, 'Setvar: __' + name + '=', text)
    return text


def manager_text(original, password):
    if not re.fullmatch(r'[0-9a-f]{64}', password):
        raise RuntimeError('Parola biçimi geçersiz.')
    if BEGIN in original or END in original or re.search(r'^\s*\[' + USER + r'\]\s*$', original, re.M):
        raise RuntimeError('Yardımcı hesabı zaten var; mevcut kurulumun üzerine yazılmadı.')
    return original.rstrip() + '\n\n' + '\n'.join([
        BEGIN, '[' + USER + ']', 'secret=' + password,
        'deny=0.0.0.0/0.0.0.0', 'permit=127.0.0.1/255.255.255.255',
        'read=call,dialplan', 'write=', 'displayconnects=no', END, ''
    ])


def write_private(path, data, mode=0o600, owner=None):
    path = Path(path)
    if path.is_symlink():
        raise RuntimeError('Beklenmeyen dosya bağlantısı; işlem durduruldu.')
    temp = path.with_name(path.name + '.observer-tmp')
    fd = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    try:
        with os.fdopen(fd, 'wb') as file:
            file.write(data)
            file.flush()
            os.fsync(file.fileno())
        os.chmod(temp, mode)
        if owner:
            os.chown(temp, *owner)
        os.replace(temp, path)
    finally:
        if temp.exists():
            temp.unlink()


def verify_login(password):
    with socket.create_connection(('127.0.0.1', 5038), timeout=5) as connection:
        connection.sendall(('Action: Login\r\nUsername: ' + USER + '\r\nSecret: ' + password + '\r\nEvents: off\r\n\r\n').encode())
        data = b''
        while len(data) < 16384:
            chunk = connection.recv(4096)
            if not chunk:
                break
            data += chunk
            if b'Authentication accepted' in data:
                return
            if b'Response: Error' in data:
                break
    raise RuntimeError('Yardımcı hesabının yerel bağlantısı doğrulanamadı.')


def payloads():
    if EMBEDDED is not None:
        return {name: base64.b64decode(value) for name, value in EMBEDDED.items()}
    base = Path(__file__).parent
    return {name: (base / name).read_bytes() for name in ('collector.py', 'observer.service')}


def rollback(backup):
    manifest = json.loads((backup / 'manifest.json').read_text())
    for action in ('stop', 'disable'):
        # A partial installation may fail before the unit exists; still restore files.
        subprocess.run(['systemctl', action, SERVICE], capture_output=True, timeout=20)
    for entry in reversed(manifest):
        target = Path(entry['path'])
        if entry['existed']:
            write_private(target, (backup / entry['saved']).read_bytes(), entry['mode'], (entry['uid'], entry['gid']))
        elif target.exists():
            target.unlink()
    run('/usr/sbin/asterisk', '-rx', 'manager reload')
    run('systemctl', 'daemon-reload')
    app = Path('/opt/doktorumol-ivr-observer')
    if app.is_dir() and not any(app.iterdir()):
        app.rmdir()
    outbox = Path('/var/lib/doktorumol-ivr-observer')
    if outbox.is_dir() and not any(outbox.iterdir()):
        outbox.rmdir()
    print('Yardımcı kaldırıldı; önceki ayarlar geri yüklendi. Arama başlatılmadı.')


def main():
    if os.geteuid() != 0:
        raise RuntimeError('Bu dosya santralde root olarak çalıştırılmalı.')
    os.umask(0o077)
    if len(sys.argv) == 3 and sys.argv[1] == '--rollback':
        backup = Path(sys.argv[2])
        if not re.fullmatch(r'/root/doktorumol-ivr-observer-backup-\d+', str(backup)):
            raise RuntimeError('Yedek yolu geçersiz.')
        ensure_idle(run('/usr/sbin/asterisk', '-rx', 'core show channels concise'), list(Path('/var/spool/asterisk/outgoing').glob('doktorumol-*.call')))
        rollback(backup)
        return
    if len(sys.argv) != 1:
        raise RuntimeError('Beklenmeyen parametre.')
    manager = Path('/etc/asterisk/manager_custom.conf')
    php = Path('/var/www/html/freepbx-ivr.php')
    config = Path('/etc/doktorumol-ivr-observer.json')
    unit = Path('/etc/systemd/system') / SERVICE
    app = Path('/opt/doktorumol-ivr-observer')
    outbox = Path('/var/lib/doktorumol-ivr-observer')
    if config.exists() or unit.exists() or app.exists() or outbox.exists():
        raise RuntimeError('Önceki yardımcı kurulumu bulundu; üzerine yazılmadı.')
    for path in (manager, php, config, unit, app, outbox):
        if path.is_symlink():
            raise RuntimeError('Beklenmeyen dosya bağlantısı; işlem durduruldu.')
    if not re.search(r'^\s*#(?:try)?include\s+["<]?manager_custom\.conf[">]?\s*$', Path('/etc/asterisk/manager.conf').read_text(), re.M):
        raise RuntimeError('Santral ek ayar dosyasını okumuyor; değiştirilmedi.')
    code = payloads()
    compile(code['collector.py'], 'collector.py', 'exec')
    old_php = php.read_bytes()
    updated_php = patch_php(old_php.decode()).encode()
    password = secrets.token_hex(32)
    new_manager = manager_text(manager.read_text() if manager.exists() else '', password).encode()
    # Shared with the existing PHP dispatcher; no new IVR dispatch during installation.
    lock_path = Path('/var/spool/asterisk/tmp/doktorumol-lines.lock')
    if not lock_path.is_file() or lock_path.is_symlink():
        raise RuntimeError('Mevcut hat kilidi doğrulanamadı; hiçbir ayar değiştirilmedi.')
    with open('/var/spool/asterisk/tmp/doktorumol-lines.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        ensure_idle(run('/usr/sbin/asterisk', '-rx', 'core show channels concise'), list(Path('/var/spool/asterisk/outgoing').glob('doktorumol-*.call')))
        with socket.create_connection(('127.0.0.1', 5038), timeout=5):
            pass
        backup = Path('/root/doktorumol-ivr-observer-backup-' + str(time.time_ns()))
        backup.mkdir(mode=0o700)
        targets = [manager, php, config, unit, app / 'collector.py']
        manifest = []
        for i, target in enumerate(targets):
            entry = {'path': str(target), 'saved': str(i), 'existed': target.exists()}
            if target.exists():
                st = target.stat()
                entry.update(mode=st.st_mode & 0o777, uid=st.st_uid, gid=st.st_gid)
                write_private(backup / str(i), target.read_bytes())
            manifest.append(entry)
        write_private(backup / 'manifest.json', json.dumps(manifest).encode())
        print('Geri dönüş yedeği: ' + str(backup))
        # Backups are private because the existing PHP file contains a secret.
        app.mkdir(mode=0o700)
        outbox.mkdir(mode=0o700)
        try:
            for target, data, mode in [(manager, new_manager, 0o640), (php, updated_php, php.stat().st_mode & 0o777)]:
                st = target.stat() if target.exists() else php.stat()
                write_private(target, data, mode, (st.st_uid, st.st_gid))
            run('/usr/bin/php', '-l', str(php))
            write_private(app / 'collector.py', code['collector.py'])
            write_private(config, json.dumps({'ami_host': '127.0.0.1', 'ami_port': 5038, 'ami_username': USER, 'ami_secret': password, 'project_host': 'irnfwewabogveofwemvg.supabase.co'}).encode())
            write_private(unit, code['observer.service'], 0o644)
            run('/usr/sbin/asterisk', '-rx', 'manager reload')
            verify_login(password)
            run('systemctl', 'daemon-reload')
            run('systemctl', 'enable', '--now', SERVICE)
            time.sleep(2)
            if run('systemctl', 'is-active', SERVICE).strip() != 'active':
                raise RuntimeError('Yardımcı çalışır durumda değil.')
        except Exception:
            try:
                rollback(backup)
            except Exception:
                print('Otomatik geri dönüş tamamlanamadı; yedek yolu ile geri dönüş çalıştırılmalı.')
            raise RuntimeError('Kurulum doğrulanamadı. Çıktıyı paylaşın; parolalar gösterilmedi.') from None
    print('Yardımcı kuruldu, yerel bağlantısı doğrulandı ve hizmet aktif. Arama başlatılmadı.')
    print('Gerçek açılma/kapanma bilgileri henüz doğrulanmadı; yalnız yeni aramalarda kontrol edilecek.')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Keep unexpected exceptions generic: never print raw AMI traffic/config.
        print(str(error) if isinstance(error, RuntimeError) else 'İşlem durduruldu; beklenmeyen sistem hatası.')
        sys.exit(1)