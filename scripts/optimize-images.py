"""Build lightweight, non-destructive WebP copies (requires Pillow)."""
from pathlib import Path
import json
import re
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'images' / 'optimized'
OUT.mkdir(parents=True, exist_ok=True)
html = (ROOT / 'menu/index.html').read_text() + (ROOT / 'index.html').read_text()
files = sorted(set(re.findall(r'garibaldi-[a-zA-Z0-9-]+\.(?:jpg|png)', html)))
exclude = {'garibaldi-favicon.png', 'garibaldi-apple-touch-icon.png', 'garibaldi-qr.png'}
report = []
missing = []
for name in files:
    if name in exclude:
        continue
    source = ROOT / name
    if not source.is_file():
        missing.append(name)
        continue
    image = ImageOps.exif_transpose(Image.open(source))
    is_logo = name == 'garibaldi-logo-transparente.png'
    is_map = name == 'garibaldi-mapa.png'
    widths = (600, 1000) if is_logo else (480, 800)
    entry = {'source': name, 'original_bytes': source.stat().st_size, 'variants': []}
    for width in widths:
        resized = image.copy()
        resized.thumbnail((width, round(image.height * width / image.width)), Image.Resampling.LANCZOS)
        target = OUT / f'{source.stem}-{width}.webp'
        resized.save(target, 'WEBP', quality=90 if is_logo else 78, method=6, lossless=is_map)
        entry['variants'].append({'file': str(target.relative_to(ROOT)), 'bytes': target.stat().st_size, 'width': resized.width, 'height': resized.height})
    report.append(entry)
(ROOT / 'images/optimized/manifest.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'missing_sources': missing, 'images': len(report), 'original_bytes': sum(r['original_bytes'] for r in report), 'mobile_bytes': sum(r['variants'][0]['bytes'] for r in report), 'desktop_bytes': sum(r['variants'][1]['bytes'] for r in report)}, indent=2))
