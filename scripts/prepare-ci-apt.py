"""Use official Ubuntu mirrors for CI browser setup without changing trust keys."""
from pathlib import Path
import re


def normalize_mirrors(text):
    return re.sub(
        r'https?://(?:[a-z0-9-]+\.)+ec2\.archive\.ubuntu\.com/ubuntu(?=[/\s]|$)',
        'https://archive.ubuntu.com/ubuntu',
        text,
    )


def prepare(apt_root):
    sources = [apt_root / 'sources.list']
    sources.extend(sorted((apt_root / 'sources.list.d').glob('*.list')))
    sources.extend(sorted((apt_root / 'sources.list.d').glob('*.sources')))
    for source in sources:
        if not source.is_file():
            continue
        original = source.read_text()
        updated = normalize_mirrors(original)
        if updated != original:
            source.write_text(updated)
            print(f'Updated Ubuntu mirror in {source.name}')
    # Bound individual network stalls; keep signature verification enabled.
    (apt_root / 'apt.conf.d' / '99-dko-ci-network').write_text(
        'Acquire::http::Timeout "20";\n'
        'Acquire::https::Timeout "20";\n'
        'Acquire::Retries "2";\n'
        'Acquire::ForceIPv4 "true";\n'
    )


if __name__ == '__main__':
    prepare(Path('/etc/apt'))