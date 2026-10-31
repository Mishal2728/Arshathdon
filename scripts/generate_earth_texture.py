"""Generate the local realistic world and Earth/Russia sphere textures.

Sources:
- Earth: NASA Blue Marble-derived native 4096×2048 texture from the three-globe examples
- Russia boundary: Natural Earth 10m public-domain geography via nvkelso/natural-earth-vector

Optional asset regeneration requires Python 3 and Pillow. It is not a runtime dependency.
"""
from pathlib import Path
import json
from urllib.request import urlretrieve
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT / 'qa' / 'earth'
OUTPUT = ROOT / 'public' / 'images' / 'earth-russia.webp'
WORLD_OUTPUT = ROOT / 'public' / 'images' / 'earth-world.webp'
WIDTH, HEIGHT = 4096, 2048
SCALE = WIDTH / 2048
EARTH_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
RUSSIA_URL = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson'
WORK.mkdir(parents=True, exist_ok=True)
for filename, url in [('earth-blue-marble-4096.jpg', EARTH_URL), ('ne_10m_admin_0_countries.geojson', RUSSIA_URL)]:
    source = WORK / filename
    if not source.exists():
        print(f'Downloading {filename}…')
        urlretrieve(url, source)


def project(point):
    longitude, latitude = point
    return ((longitude + 180) / 360 * WIDTH, (90 - latitude) / 180 * HEIGHT)


base = Image.open(WORK / 'earth-blue-marble-4096.jpg').convert('RGBA').resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)
base.convert('RGB').save(WORLD_OUTPUT, 'WEBP', quality=91, method=6)
print(f'Created {WORLD_OUTPUT} ({WORLD_OUTPUT.stat().st_size:,} bytes)')
data = json.loads((WORK / 'ne_10m_admin_0_countries.geojson').read_text())
russia = next(feature for feature in data['features'] if feature['properties'].get('ISO_A3') == 'RUS')
geometry = russia['geometry']
polygons = geometry['coordinates'] if geometry['type'] == 'MultiPolygon' else [geometry['coordinates']]

# A restrained warm tint keeps the actual terrain visible beneath the highlight.
overlay = Image.new('RGBA', base.size, (0, 0, 0, 0))
draw = ImageDraw.Draw(overlay)
for polygon in polygons:
    if polygon:
        outer = [project(point) for point in polygon[0]]
        draw.polygon(outer, fill=(232, 201, 139, 38))
    for ring in polygon:
        points = [project(point) for point in ring]
        draw.line(points, fill=(255, 253, 248, 215), width=1, joint='curve')

result = Image.alpha_composite(base, overlay).convert('RGB')
result.save(OUTPUT, 'WEBP', quality=91, method=6)
print(f'Created {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)')
